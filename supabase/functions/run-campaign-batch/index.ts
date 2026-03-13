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
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonError("Unauthorized", "auth_error", 401, rid);
    const userId = user.id;

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

    // ACTION: populate
    if (action === "populate") {
      return await handlePopulate(sb, campaign, campaign_id, rid);
    }

    // ACTION: run_batch — with advisory lock to prevent concurrent execution
    if (action === "run_batch") {
      // Deterministic lock ID from campaign UUID
      const lockId = parseInt(campaign_id.replace(/-/g, "").slice(0, 12), 16);

      const { data: lockAcquired } = await sb.rpc("try_acquire_campaign_lock", { p_lock_id: lockId });

      if (!lockAcquired) {
        log("info", "Campaign batch already running — skipping", { request_id: rid, campaign_id });
        return jsonOk({ status: "already_running", calls_initiated: 0 }, rid);
      }

      try {
        return await handleRunBatch(sb, campaign, campaign_id, rid);
      } finally {
        await sb.rpc("release_campaign_lock", { p_lock_id: lockId });
      }
    }

    return jsonError("Unknown action. Use 'populate' or 'run_batch'", "validation_error", 400, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});

async function handlePopulate(sb: any, campaign: any, campaign_id: string, rid: string) {
  if (!campaign.contact_list_id) return jsonError("No contact list assigned", "validation_error", 400, rid);

  const { data: members } = await sb
    .from("contact_list_members")
    .select("contact_id")
    .eq("list_id", campaign.contact_list_id);

  if (!members || members.length === 0) return jsonError("Contact list is empty", "validation_error", 400, rid);

  const contactIds = members.map((m: any) => m.contact_id);
  const { data: contacts } = await sb
    .from("contacts")
    .select("id, phone")
    .in("id", contactIds)
    .not("phone", "is", null);

  if (!contacts || contacts.length === 0) return jsonError("No contacts with phone numbers", "validation_error", 400, rid);

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

  await sb.from("campaigns").update({
    contacts_total: contacts.length,
    status: campaign.status === "draft" ? "scheduled" : campaign.status,
  }).eq("id", campaign_id);

  log("info", "Campaign populated", { request_id: rid, campaign_id, contacts: contacts.length });
  return jsonOk({ populated: contacts.length }, rid);
}

async function handleRunBatch(sb: any, campaign: any, campaign_id: string, rid: string) {
  if (!campaign.agent_id) return jsonError("No agent assigned", "validation_error", 400, rid);

  const batchSize = Math.min(campaign.call_hour_limit || 10, 10);
  const now = new Date().toISOString();

  const { data: batch } = await sb
    .from("campaign_contacts")
    .select("id, contact_id, attempts, max_attempts")
    .eq("campaign_id", campaign_id)
    .or(`status.eq.pending,and(status.eq.retry,next_retry_at.lte.${now})`)
    .order("created_at", { ascending: true })
    .limit(batchSize);

  if (!batch || batch.length === 0) {
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

  // Mark campaign as running
  await sb.from("campaigns").update({
    status: "active",
    updated_at: new Date().toISOString(),
  }).eq("id", campaign_id);

  const contactIds = batch.map((b: any) => b.contact_id);
  const { data: contacts } = await sb.from("contacts").select("id, phone, full_name, do_not_call").in("id", contactIds);
  const contactMap = Object.fromEntries((contacts || []).map((c: any) => [c.id, c]));

  const { data: agent } = await sb.from("agents")
    .select("el_agent_id, el_phone_number_id, outbound_enabled")
    .eq("id", campaign.agent_id)
    .single();

  if (!agent?.el_agent_id || !agent?.outbound_enabled || !agent?.el_phone_number_id) {
    return jsonError("Agent not configured for outbound calls", "validation_error", 400, rid);
  }

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
      const callBody: Record<string, unknown> = {
        agent_id: agent.el_agent_id,
        agent_phone_number_id: agent.el_phone_number_id,
        to_number: contact.phone.replace(/\s/g, ""),
      };

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
  const [calledRes, reachedRes, appointmentsRes] = await Promise.all([
    sb.from("campaign_contacts").select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign_id).not("status", "eq", "pending"),
    sb.from("campaign_contacts").select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign_id).in("status", ["completed", "calling"]),
    sb.from("campaign_contacts").select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign_id).eq("outcome", "appointment"),
  ]);

  const reachedCount = reachedRes.count || 0;
  const appointmentsCount = appointmentsRes.count || 0;

  await sb.from("campaigns").update({
    contacts_called: calledRes.count || 0,
    contacts_reached: reachedCount,
    appointments_set: appointmentsCount,
    status: "active",
    updated_at: new Date().toISOString(),
  }).eq("id", campaign_id);

  // ── AUTO-PILOT ──
  if (campaign.auto_pilot) {
    const minSampleSize = 30;
    const minConversionRate = 0.03;

    if (reachedCount >= minSampleSize) {
      const conversionRate = reachedCount > 0 ? appointmentsCount / reachedCount : 0;
      if (conversionRate < minConversionRate) {
        await sb.from("campaigns").update({
          status: "paused",
          updated_at: new Date().toISOString(),
        }).eq("id", campaign_id);

        log("warn", "Auto-pilot: campaign paused due to low conversion", {
          request_id: rid, campaign_id, conversion_rate: conversionRate,
          reached: reachedCount, appointments: appointmentsCount,
        });

        return jsonOk({
          calls_initiated: callsInitiated,
          batch_size: batch.length,
          auto_pilot_paused: true,
          conversion_rate: Number((conversionRate * 100).toFixed(1)),
          reason: `Tasso conversione ${(conversionRate * 100).toFixed(1)}% sotto la soglia del 3% dopo ${reachedCount} contatti raggiunti.`,
        }, rid);
      }
    }

    const { count: pendingCount } = await sb.from("campaign_contacts")
      .select("id", { count: "exact", head: true })
      .eq("campaign_id", campaign_id)
      .in("status", ["pending", "retry"]);

    if (!pendingCount || pendingCount === 0) {
      await sb.from("campaigns").update({
        status: "completed",
        completed_at: new Date().toISOString(),
      }).eq("id", campaign_id);

      log("info", "Auto-pilot: campaign auto-completed", { request_id: rid, campaign_id });
      return jsonOk({
        calls_initiated: callsInitiated,
        batch_size: batch.length,
        campaign_completed: true,
      }, rid);
    }
  }

  log("info", "Campaign batch executed", { request_id: rid, campaign_id, calls_initiated: callsInitiated });
  return jsonOk({ calls_initiated: callsInitiated, batch_size: batch.length }, rid);
}
