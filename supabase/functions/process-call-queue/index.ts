import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  generateRequestId,
  log,
  jsonOk,
  jsonError,
  errorResponse,
} from "../_shared/utils.ts";

const FN = "process-call-queue";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();

  try {
    // Auth: cron secret oppure service role
    const cronSecret = req.headers.get("x-cron-secret");
    const authHeader = req.headers.get("Authorization");
    const expectedSecret = Deno.env.get("INTERNAL_CRON_SECRET");

    const isCron = expectedSecret && cronSecret === expectedSecret;
    const isServiceRole =
      authHeader === `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;

    if (!isCron && !isServiceRole) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return jsonError("ELEVENLABS_API_KEY not configured", "system_error", 500, rid);

    const now = new Date().toISOString();
    let callsInitiated = 0;
    const errors: string[] = [];

    // ── 1. Processa coda principale (B5) ─────────────────────
    // Prima recupera le campagne attive (queued/running)
    const { data: activeCampaignIds } = await sb
      .from("internal_outbound_campaigns")
      .select("id")
      .in("status", ["queued", "running"]);

    const activeCids = (activeCampaignIds || []).map((c: any) => c.id);

    if (activeCids.length === 0) {
      log("info", "Nessuna campagna attiva", { request_id: rid });
    }

    // Legge N record pending da campagne in stato queued/running
    const { data: queueItems } = activeCids.length > 0 ? await sb
      .from("campaign_call_queue")
      .select(`
        id,
        campaign_id,
        contact_id,
        attempt_number,
        campaign:internal_outbound_campaigns(
          id, company_id, agent_id, name, status, calls_per_minute,
          calls_answered, calls_failed, total_calls
        )
      `)
      .eq("status", "pending")
      .lte("scheduled_for", now)
      .in("campaign_id", activeCids)
      .order("created_at", { ascending: true })
      .limit(10) : { data: [] };

    if (queueItems && queueItems.length > 0) {
      for (const item of queueItems) {
        const campaign = item.campaign as any;
        if (!campaign) continue;

        // Marca come 'calling' (atomic — evita doppia elaborazione)
        const { count: updated } = await sb
          .from("campaign_call_queue")
          .update({ status: "calling", called_at: now })
          .eq("id", item.id)
          .eq("status", "pending")
          .select("id", { count: "exact", head: true });

        if (!updated || updated === 0) continue; // Già preso da altro processo

        // Imposta campagna 'running' se era 'queued'
        if (campaign.status === "queued") {
          await sb
            .from("internal_outbound_campaigns")
            .update({ status: "running" })
            .eq("id", campaign.id)
            .eq("status", "queued");
        }

        try {
          const result = await makeCall(sb, apiKey, campaign, item.contact_id, item.id, rid);

          await sb
            .from("campaign_call_queue")
            .update({ status: "done", result })
            .eq("id", item.id);

          // Aggiorna contatori campagna
          await sb.rpc("increment_campaign_calls_answered", { p_campaign_id: campaign.id })
            .catch(() => null); // fallback silenzioso se RPC non esiste

          callsInitiated++;
        } catch (err: any) {
          const errMsg = err.message?.slice(0, 300) || "Errore chiamata";

          // Crea retry log se ci sono ancora tentativi
          if ((item.attempt_number || 1) < 3) {
            await sb.from("campaign_retry_log").insert({
              company_id: campaign.company_id,
              campaign_id: campaign.id,
              contact_id: item.contact_id,
              attempt_number: (item.attempt_number || 1),
              retry_max_attempts: 3,
              result: "retry_due",
              next_retry_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
              error_message: errMsg,
            });
          }

          await sb
            .from("campaign_call_queue")
            .update({ status: "failed", result: errMsg })
            .eq("id", item.id);

          await sb.rpc("increment_campaign_calls_failed", { p_campaign_id: campaign.id })
            .catch(() => null);

          errors.push(errMsg);
        }

        // Pausa breve tra chiamate (rate limit ElevenLabs)
        await new Promise((r) => setTimeout(r, 500));
      }

      // Controlla se le campagne sono completate
      await checkCampaignCompletion(sb, rid);
    }

    // ── 2. Processa retry log (B9) ────────────────────────────
    const { data: retryItems } = await sb
      .from("campaign_retry_log")
      .select(`
        id,
        campaign_id,
        contact_id,
        attempt_number,
        retry_max_attempts,
        campaign:internal_outbound_campaigns(
          id, company_id, agent_id, name, status
        )
      `)
      .eq("result", "retry_due")
      .lte("next_retry_at", now)
      .limit(5);

    if (retryItems && retryItems.length > 0) {
      for (const retry of retryItems) {
        const campaign = retry.campaign as any;
        if (!campaign || campaign.status === "cancelled" || campaign.status === "paused") {
          await sb
            .from("campaign_retry_log")
            .update({ result: "failed_final" })
            .eq("id", retry.id);
          continue;
        }

        // Atomic lock
        const { count: lockedCount } = await sb
          .from("campaign_retry_log")
          .update({ result: "calling" })
          .eq("id", retry.id)
          .eq("result", "retry_due")
          .select("id", { count: "exact", head: true });

        if (!lockedCount || lockedCount === 0) continue;

        try {
          await makeCall(sb, apiKey, campaign, retry.contact_id, null, rid);

          await sb
            .from("campaign_retry_log")
            .update({ result: "done" })
            .eq("id", retry.id);

          callsInitiated++;
        } catch (err: any) {
          const newAttempt = (retry.attempt_number || 1) + 1;
          const maxAttempts = retry.retry_max_attempts || 3;

          if (newAttempt >= maxAttempts) {
            await sb
              .from("campaign_retry_log")
              .update({
                result: "failed_final",
                attempt_number: newAttempt,
                error_message: err.message?.slice(0, 300),
              })
              .eq("id", retry.id);
          } else {
            await sb
              .from("campaign_retry_log")
              .update({
                result: "retry_due",
                attempt_number: newAttempt,
                next_retry_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
                error_message: err.message?.slice(0, 300),
              })
              .eq("id", retry.id);
          }

          errors.push(`Retry ${retry.id}: ${err.message}`);
        }
      }
    }

    log("info", "process-call-queue completato", {
      request_id: rid,
      calls_initiated: callsInitiated,
      queue_items: queueItems?.length || 0,
      retry_items: retryItems?.length || 0,
      errors: errors.length,
    });

    return jsonOk({ calls_initiated: callsInitiated, errors }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});

async function makeCall(
  sb: any,
  apiKey: string,
  campaign: any,
  contactId: string,
  queueItemId: string | null,
  rid: string
): Promise<string> {
  // Verifica crediti
  const { data: credits } = await sb
    .from("ai_credits")
    .select("balance_eur, calls_blocked")
    .eq("company_id", campaign.company_id)
    .single();

  if (credits?.calls_blocked || (Number(credits?.balance_eur) || 0) < 0.04) {
    throw new Error("Credito insufficiente");
  }

  // Carica contatto
  const { data: contact } = await sb
    .from("contacts")
    .select("id, phone, full_name, do_not_call")
    .eq("id", contactId)
    .single();

  if (!contact?.phone) throw new Error("Contatto senza numero di telefono");
  if (contact.do_not_call) throw new Error("Contatto in lista DNC");

  // Carica agente
  const { data: agent } = await sb
    .from("agents")
    .select("el_agent_id, el_phone_number_id, outbound_enabled")
    .eq("id", campaign.agent_id)
    .single();

  if (!agent?.el_agent_id || !agent?.outbound_enabled || !agent?.el_phone_number_id) {
    throw new Error("Agente non configurato per outbound");
  }

  // Chiamata ElevenLabs
  const callBody: Record<string, unknown> = {
    agent_id: agent.el_agent_id,
    agent_phone_number_id: agent.el_phone_number_id,
    to_number: contact.phone.replace(/\s/g, ""),
  };

  if (contact.full_name || campaign.name) {
    callBody.conversation_initiation_client_data = {
      dynamic_variables: {
        nome_contatto: contact.full_name || "",
        campagna: campaign.name || "",
      },
    };
  }

  const elRes = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(callBody),
  });

  if (!elRes.ok) {
    const errText = await elRes.text();
    throw new Error(`ElevenLabs ${elRes.status}: ${errText.slice(0, 200)}`);
  }

  const elData = await elRes.json();

  // Registra call log
  const { data: callLog } = await sb
    .from("internal_call_logs")
    .insert({
      company_id: campaign.company_id,
      campaign_id: campaign.id,
      contact_id: contactId,
      agent_id: campaign.agent_id,
      phone_number: contact.phone,
      direction: "outbound",
      status: "initiated",
      elevenlabs_conversation_id: elData.call_sid || elData.conversation_id || null,
    })
    .select("id")
    .single();

  log("info", "Chiamata avviata", {
    request_id: rid,
    campaign_id: campaign.id,
    contact_id: contactId,
    call_log_id: callLog?.id,
    el_sid: elData.call_sid,
  });

  return callLog?.id || "ok";
}

async function checkCampaignCompletion(sb: any, rid: string) {
  // Trova campagne running/queued con tutta la coda completata
  const { data: activeCampaigns } = await sb
    .from("internal_outbound_campaigns")
    .select("id")
    .in("status", ["running", "queued"]);

  for (const campaign of activeCampaigns || []) {
    const { count: pendingCount } = await sb
      .from("campaign_call_queue")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign.id)
      .in("status", ["pending", "calling"]);

    if (pendingCount === 0) {
      // Conta risultati finali
      const [answeredRes, failedRes] = await Promise.all([
        sb
          .from("campaign_call_queue")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaign.id)
          .eq("status", "done"),
        sb
          .from("campaign_call_queue")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaign.id)
          .eq("status", "failed"),
      ]);

      await sb
        .from("internal_outbound_campaigns")
        .update({
          status: "completed",
          completed_at: new Date().toISOString(),
          calls_answered: answeredRes.count || 0,
          calls_failed: failedRes.count || 0,
        })
        .eq("id", campaign.id)
        .in("status", ["running", "queued"]);

      log("info", "Campagna completata automaticamente", {
        request_id: rid,
        campaign_id: campaign.id,
      });
    }
  }
}
