import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders,
  generateRequestId,
  log,
  jsonOk,
  jsonError,
  errorResponse,
} from "../_shared/utils.ts";

const FN = "process-scheduled-voice-campaigns";

// B6 fix: EF dedicata per campagne voce programmate
// Legge internal_outbound_campaigns con status='scheduled' E scheduled_at <= now()
// Guard anti-race: UPDATE atomico status='queued' WHERE status='scheduled'

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();

  try {
    // Auth: cron secret
    const cronSecret = req.headers.get("x-cron-secret");
    const expectedSecret = Deno.env.get("INTERNAL_CRON_SECRET");

    if (!expectedSecret || cronSecret !== expectedSecret) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const now = new Date().toISOString();

    // Trova campagne programmate da avviare
    const { data: scheduledCampaigns, error } = await sb
      .from("internal_outbound_campaigns")
      .select("id, company_id, name, agent_id, target_type, contact_ids, filter_tags, filter_source")
      .eq("status", "scheduled")
      .lte("scheduled_at", now)
      .limit(10);

    if (error) throw error;
    if (!scheduledCampaigns || scheduledCampaigns.length === 0) {
      return jsonOk({ triggered: 0 }, rid);
    }

    let triggered = 0;
    const errors: string[] = [];

    for (const campaign of scheduledCampaigns) {
      // B6 fix: Guard anti-race condition — UPDATE atomico
      // Solo la prima invocazione che ottiene questo UPDATE procederà
      const { count: updated } = await sb
        .from("internal_outbound_campaigns")
        .update({ status: "queued" })
        .eq("id", campaign.id)
        .eq("status", "scheduled") // WHERE guard
        .select("id", { count: "exact", head: true });

      if (!updated || updated === 0) {
        // Già processata da un'altra invocazione
        log("info", "Campagna già processata da altra invocazione", {
          request_id: rid,
          campaign_id: campaign.id,
        });
        continue;
      }

      // Popola campaign_call_queue
      try {
        let contactIds: string[] = [];

        if (
          ["manual", "contact_list"].includes(campaign.target_type) &&
          campaign.contact_ids?.length > 0
        ) {
          contactIds = campaign.contact_ids;
        } else if (campaign.target_type === "filter") {
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
          await sb
            .from("internal_outbound_campaigns")
            .update({
              status: "failed",
              error_message: "Nessun contatto trovato al momento dello scheduling",
            })
            .eq("id", campaign.id);
          errors.push(`${campaign.id}: nessun contatto`);
          continue;
        }

        // Insert batch in campaign_call_queue
        const batchSize = 200;
        for (let i = 0; i < contactIds.length; i += batchSize) {
          const batch = contactIds.slice(i, i + batchSize).map((contactId: string) => ({
            company_id: campaign.company_id,
            campaign_id: campaign.id,
            contact_id: contactId,
            status: "pending",
            attempt_number: 1,
            scheduled_for: new Date().toISOString(),
          }));
          await sb.from("campaign_call_queue").insert(batch);
        }

        // Aggiorna total_calls e started_at
        await sb
          .from("internal_outbound_campaigns")
          .update({
            started_at: new Date().toISOString(),
            total_calls: contactIds.length,
          })
          .eq("id", campaign.id);

        triggered++;

        log("info", "Campagna programmata avviata", {
          request_id: rid,
          campaign_id: campaign.id,
          name: campaign.name,
          contacts: contactIds.length,
        });
      } catch (err: any) {
        const errMsg = err.message?.slice(0, 300) || "Errore sconosciuto";

        await sb
          .from("internal_outbound_campaigns")
          .update({ status: "failed", error_message: errMsg })
          .eq("id", campaign.id);

        errors.push(`${campaign.id}: ${errMsg}`);
        log("error", "Errore avvio campagna programmata", {
          request_id: rid,
          campaign_id: campaign.id,
          error: errMsg,
        });
      }
    }

    log("info", "process-scheduled-voice-campaigns completato", {
      request_id: rid,
      triggered,
      errors: errors.length,
    });

    return jsonOk({ triggered, errors }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
