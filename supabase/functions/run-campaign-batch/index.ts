import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

const FN = "run-campaign-batch";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return jsonError("Unauthorized", "auth_error", 401, rid);
    const userId = claimsData.claims.sub as string;

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { campaign_id, action } = await req.json();
    if (!campaign_id) return jsonError("campaign_id required", "validation_error", 400, rid);

    // Load campaign
    const { data: campaign, error: campErr } = await sb.from("campaigns").select("*").eq("id", campaign_id).single();
    if (campErr || !campaign) return jsonError("Campaign not found", "not_found", 404, rid);

    // Tenant check
    const { data: profile } = await sb.from("profiles").select("company_id").eq("id", userId).single();
    const { data: roles } = await sb.from("user_roles").select("role").eq("user_id", userId);
    const isSA = (roles || []).some((r: any) => r.role === "superadmin" || r.role === "superadmin_user");
    if (!isSA && profile?.company_id !== campaign.company_id) {
      return jsonError("Forbidden", "auth_error", 403, rid);
    }

    // ACTION: populate — load contacts from list into campaign_contacts
    if (action === "populate") {
      if (!campaign.contact_list_id) return jsonError("No contact list assigned", "validation_error", 400, rid);

      // Get list members
      const { data: members } = await sb
        .from("contact_list_members")
        .select("contact_id")
        .eq("list_id", campaign.contact_list_id);

      if (!members || members.length === 0) return jsonError("Contact list is empty", "validation_error", 400, rid);

      // Get contacts with phone numbers
      const contactIds = members.map((m: any) => m.contact_id);
      const { data: contacts } = await sb
        .from("contacts")
        .select("id, phone")
        .in("id", contactIds)
        .not("phone", "is", null);

      if (!contacts || contacts.length === 0) return jsonError("No contacts with phone numbers", "validation_error", 400, rid);

      // Upsert into campaign_contacts
      const rows = contacts.map((c: any) => ({
        campaign_id,
        contact_id: c.id,
        company_id: campaign.company_id,
        status: "pending",
        attempts: 0,
        max_attempts: (campaign.retry_attempts || 2) + 1,
      }));

      const { error: insertErr } = await sb.from("campaign_contacts").upsert(rows, { onConflict: "campaign_id,contact_id" });
      if (insertErr) throw insertErr;

      // Update campaign totals
      await sb.from("campaigns").update({
        contacts_total: contacts.length,
        status: campaign.status === "draft" ? "scheduled" : campaign.status,
      }).eq("id", campaign_id);

      log("info", "Campaign populated", { request_id: rid, campaign_id, contacts: contacts.length });
      return jsonOk({ populated: contacts.length }, rid);
    }

    // ACTION: run_batch — pick next batch of contacts and initiate calls
    if (action === "run_batch") {
      if (!campaign.agent_id) return jsonError("No agent assigned", "validation_error", 400, rid);

      const batchSize = Math.min(campaign.call_hour_limit || 10, 10); // max 10 per batch
      const now = new Date().toISOString();

      // Get pending contacts (or retryable ones past their next_retry_at)
      const { data: batch } = await sb
        .from("campaign_contacts")
        .select("id, contact_id, attempts, max_attempts")
        .eq("campaign_id", campaign_id)
        .or(`status.eq.pending,and(status.eq.retry,next_retry_at.lte.${now})`)
        .order("created_at", { ascending: true })
        .limit(batchSize);

      if (!batch || batch.length === 0) {
        // Check if campaign is complete
        const { count: remaining } = await sb
          .from("campaign_contacts")
          .select("id", { count: "exact", head: true })
          .eq("campaign_id", campaign_id)
          .in("status", ["pending", "retry"]);

        if (!remaining || remaining === 0) {
          await sb.from("campaigns").update({
            status: "completed",
            completed_at: new Date().toISOString(),
          }).eq("id", campaign_id);
          return jsonOk({ calls_initiated: 0, campaign_completed: true }, rid);
        }

        return jsonOk({ calls_initiated: 0, message: "No contacts ready for calling" }, rid);
      }

      // Get contact phone numbers
      const contactIds = batch.map((b: any) => b.contact_id);
      const { data: contacts } = await sb.from("contacts").select("id, phone, full_name").in("id", contactIds);
      const contactMap = Object.fromEntries((contacts || []).map((c: any) => [c.id, c]));

      // Get agent details
      const { data: agent } = await sb.from("agents")
        .select("el_agent_id, el_phone_number_id, outbound_enabled")
        .eq("id", campaign.agent_id)
        .single();

      if (!agent?.el_agent_id || !agent?.outbound_enabled || !agent?.el_phone_number_id) {
        return jsonError("Agent not configured for outbound calls", "validation_error", 400, rid);
      }

      // Check credits
      const { data: credits } = await sb.from("ai_credits")
        .select("balance_eur, calls_blocked")
        .eq("company_id", campaign.company_id)
        .single();

      if (credits?.calls_blocked || (Number(credits?.balance_eur) || 0) < 0.04 * batch.length) {
        return jsonError("Insufficient credits", "insufficient_credits", 402, rid);
      }

      const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
      if (!apiKey) return jsonError("ELEVENLABS_API_KEY not configured", "system_error", 500, rid);

      let callsInitiated = 0;
      const retryDelayMs = (campaign.retry_delay_min || 30) * 60 * 1000;

      for (const item of batch) {
        const contact = contactMap[item.contact_id];
        if (!contact?.phone) {
          await sb.from("campaign_contacts").update({
            status: "failed", error: "No phone number", updated_at: now,
          }).eq("id", item.id);
          continue;
        }

        try {
          // Build call body
          const callBody: Record<string, unknown> = {
            agent_id: agent.el_agent_id,
            agent_phone_number_id: agent.el_phone_number_id,
            to_number: contact.phone.replace(/\s/g, ""),
          };

          // Add dynamic variables if custom first message
          if (campaign.custom_first_msg || contact.full_name) {
            callBody.conversation_initiation_client_data = {
              dynamic_variables: {
                nome_contatto: contact.full_name || "",
                campagna: campaign.name || "",
                ...(campaign.custom_first_msg ? { messaggio_personalizzato: campaign.custom_first_msg } : {}),
              },
            };
          }

          const elRes = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
            method: "POST",
            headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
            body: JSON.stringify(callBody),
          });

          if (elRes.ok) {
            const elData = await elRes.json();
            const newAttempts = (item.attempts || 0) + 1;

            // Create conversation record
            const { data: conv } = await sb.from("conversations").insert({
              agent_id: campaign.agent_id,
              company_id: campaign.company_id,
              campaign_id: campaign_id,
              contact_id: item.contact_id,
              direction: "outbound",
              phone_number: contact.phone,
              status: "in_progress",
              started_at: new Date().toISOString(),
              el_conv_id: elData.call_sid || null,
            }).select("id").single();

            await sb.from("campaign_contacts").update({
              status: "calling",
              attempts: newAttempts,
              last_call_at: new Date().toISOString(),
              conversation_id: conv?.id || null,
              updated_at: new Date().toISOString(),
            }).eq("id", item.id);

            callsInitiated++;
          } else {
            const errText = await elRes.text();
            const newAttempts = (item.attempts || 0) + 1;
            const canRetry = newAttempts < (item.max_attempts || 3);
            const nextRetry = canRetry ? new Date(Date.now() + retryDelayMs).toISOString() : null;

            await sb.from("campaign_contacts").update({
              status: canRetry ? "retry" : "failed",
              attempts: newAttempts,
              next_retry_at: nextRetry,
              error: `EL ${elRes.status}: ${errText.slice(0, 200)}`,
              updated_at: new Date().toISOString(),
            }).eq("id", item.id);
          }

          // Small delay between calls to avoid rate limiting
          await new Promise(r => setTimeout(r, 1500));
        } catch (err) {
          const newAttempts = (item.attempts || 0) + 1;
          const canRetry = newAttempts < (item.max_attempts || 3);
          await sb.from("campaign_contacts").update({
            status: canRetry ? "retry" : "failed",
            attempts: newAttempts,
            next_retry_at: canRetry ? new Date(Date.now() + retryDelayMs).toISOString() : null,
            error: (err as Error).message.slice(0, 200),
            updated_at: new Date().toISOString(),
          }).eq("id", item.id);
        }
      }

      // Update campaign stats
      const { count: called } = await sb.from("campaign_contacts")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaign_id)
        .not("status", "eq", "pending");

      await sb.from("campaigns").update({
        contacts_called: called || 0,
        status: "active",
        updated_at: new Date().toISOString(),
      }).eq("id", campaign_id);

      log("info", "Campaign batch executed", { request_id: rid, campaign_id, calls_initiated: callsInitiated });
      return jsonOk({ calls_initiated: callsInitiated, batch_size: batch.length }, rid);
    }

    return jsonError("Unknown action. Use 'populate' or 'run_batch'", "validation_error", 400, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
