import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  generateRequestId,
  log,
  jsonOk,
  jsonError,
  errorResponse,
} from "../_shared/utils.ts";

const FN = "internal-campaign-manager";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json();
    const { campaign_id, action } = body;
    if (!campaign_id) return jsonError("campaign_id required", "validation_error", 400, rid);

    // Load campaign
    const { data: campaign, error: campErr } = await sb
      .from("internal_outbound_campaigns")
      .select("*")
      .eq("id", campaign_id)
      .single();
    if (campErr || !campaign) return jsonError("Campagna non trovata", "not_found", 404, rid);

    // Tenant check
    const { data: profile } = await sb
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();
    if (profile?.company_id !== campaign.company_id) {
      return jsonError("Forbidden", "forbidden", 403, rid);
    }

    // ACTION: start campaign
    if (action === "start" || !action) {
      return await handleStart(sb, campaign, campaign_id, rid);
    }

    // ACTION: pause
    if (action === "pause") {
      await sb
        .from("internal_outbound_campaigns")
        .update({ status: "paused" })
        .eq("id", campaign_id);
      // Pause all pending items in queue
      await sb
        .from("campaign_call_queue")
        .update({ status: "paused" })
        .eq("campaign_id", campaign_id)
        .eq("status", "pending");
      return jsonOk({ paused: true }, rid);
    }

    // ACTION: resume
    if (action === "resume") {
      await sb
        .from("internal_outbound_campaigns")
        .update({ status: "queued" })
        .eq("id", campaign_id);
      await sb
        .from("campaign_call_queue")
        .update({ status: "pending" })
        .eq("campaign_id", campaign_id)
        .eq("status", "paused");
      return jsonOk({ resumed: true }, rid);
    }

    return jsonError("Azione non valida. Usa: start, pause, resume", "validation_error", 400, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});

async function handleStart(sb: any, campaign: any, campaign_id: string, rid: string) {
  // B4 fix: L'EF imposta status='running' INTERNAMENTE, con rollback su errore
  // Il client React NON deve mai scrivere lo status

  try {
    // Guard: se già in esecuzione o in coda non riavviare
    if (["running", "queued", "completed"].includes(campaign.status)) {
      return jsonError(
        `La campagna è già ${campaign.status}`,
        "validation_error",
        400,
        rid
      );
    }

    // Verifica agente
    if (!campaign.agent_id) {
      return jsonError("Nessun agente assegnato alla campagna", "validation_error", 400, rid);
    }

    const { data: agent } = await sb
      .from("agents")
      .select("el_agent_id, el_phone_number_id, outbound_enabled")
      .eq("id", campaign.agent_id)
      .single();

    if (!agent?.el_agent_id || !agent?.outbound_enabled || !agent?.el_phone_number_id) {
      return jsonError("Agente non configurato per chiamate outbound", "validation_error", 400, rid);
    }

    // Verifica crediti
    const { data: credits } = await sb
      .from("ai_credits")
      .select("balance_eur, calls_blocked")
      .eq("company_id", campaign.company_id)
      .single();

    if (credits?.calls_blocked) {
      return jsonError("Chiamate bloccate — credito insufficiente", "insufficient_credits", 402, rid);
    }
    if ((Number(credits?.balance_eur) || 0) < 0.1) {
      return jsonError("Credito insufficiente per avviare la campagna", "insufficient_credits", 402, rid);
    }

    // Recupera contatti
    // B7 fix: gestisce sia 'manual' che eventuale 'contact_list' per retrocompatibilità
    let contactIds: string[] = [];

    if (
      ["manual", "contact_list"].includes(campaign.target_type) &&
      campaign.contact_ids?.length > 0
    ) {
      contactIds = campaign.contact_ids;
    } else if (campaign.target_type === "filter") {
      // Filtro per tags/source — query contacts
      let query = sb
        .from("contacts")
        .select("id")
        .eq("company_id", campaign.company_id)
        .not("phone", "is", null);

      if (campaign.filter_source?.trim()) {
        query = query.ilike("source", `%${campaign.filter_source.trim()}%`);
      }
      if (campaign.filter_tags?.trim()) {
        const tags = campaign.filter_tags.split(",").map((t: string) => t.trim()).filter(Boolean);
        if (tags.length > 0) {
          query = query.overlaps("tags", tags);
        }
      }

      const { data: filteredContacts } = await query.limit(1000);
      contactIds = (filteredContacts || []).map((c: any) => c.id);
    }

    if (contactIds.length === 0) {
      // B4 fix: imposta failed (non lascia 'running' a vita)
      await sb
        .from("internal_outbound_campaigns")
        .update({ status: "failed", error_message: "Nessun contatto trovato per questa campagna" })
        .eq("id", campaign_id);
      return jsonError("Nessun contatto trovato per questa campagna", "validation_error", 400, rid);
    }

    // B5 fix: invece del loop sincrono, inserisce nella campaign_call_queue
    // L'EF termina in < 5 secondi (no timeout 150s)
    const queueRows = contactIds.map((contactId: string) => ({
      company_id: campaign.company_id,
      campaign_id,
      contact_id: contactId,
      status: "pending",
      attempt_number: 1,
      scheduled_for: new Date().toISOString(),
    }));

    // Insert batch — ignora duplicati
    const batchSize = 200;
    for (let i = 0; i < queueRows.length; i += batchSize) {
      const batch = queueRows.slice(i, i + batchSize);
      await sb.from("campaign_call_queue").insert(batch);
    }

    // B4 fix: imposta status='queued' DOPO aver popolato la coda con successo
    await sb
      .from("internal_outbound_campaigns")
      .update({
        status: "queued",
        started_at: new Date().toISOString(),
        total_calls: contactIds.length,
        error_message: null,
      })
      .eq("id", campaign_id);

    log("info", "Campagna avviata — coda popolata", {
      request_id: rid,
      campaign_id,
      contacts: contactIds.length,
    });

    return jsonOk({
      queued: true,
      total_contacts: contactIds.length,
      message: `${contactIds.length} contatti aggiunti alla coda. Le chiamate partiranno entro 1 minuto.`,
    }, rid);
  } catch (err: any) {
    // B4 fix: rollback status su errore — la campagna non resta 'running' a vita
    await sb
      .from("internal_outbound_campaigns")
      .update({ status: "failed", error_message: err.message?.slice(0, 500) || "Errore interno" })
      .eq("id", campaign_id)
      .eq("status", "running"); // Solo se era già running (no-op altrimenti)

    throw err;
  }
}
