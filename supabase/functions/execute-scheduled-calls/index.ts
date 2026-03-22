import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse,
  fetchWithTimeout,
} from "../_shared/utils.ts";

const FN = "execute-scheduled-calls";
const BATCH_SIZE = 10;
const PARALLEL = 5;
const MAX_RETRIES = 3; // Max attempts before permanently failing a scheduled call

// Errors that are permanent (no retry makes sense)
const PERMANENT_ERRORS = ["DNC", "no_phone", "agent_disabled"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  // Auth: require secret header (for pg_cron / internal invocation only)
  const cronSecret = Deno.env.get("CRON_SECRET");
  const providedSecret = req.headers.get("x-cron-secret");
  if (cronSecret && providedSecret !== cronSecret) {
    log("warn", "Unauthorized execute-scheduled-calls attempt", { request_id: rid });
    return jsonError("Unauthorized", "auth_error", 401, rid);
  }

  const sb = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // Get pending scheduled calls ready to execute (including retryable failed ones)
    const { data: pending } = await sb
      .from("scheduled_calls")
      .select("id, company_id, contact_id, agent_id, dynamic_variables, notes, retry_count")
      .or("status.eq.pending,and(status.eq.failed,retry_count.lt." + MAX_RETRIES + ")")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (!pending?.length) {
      return jsonOk({ executed: 0 }, rid);
    }

    // Optimistic lock: mark as 'calling' only if still 'pending' or 'failed' (retryable)
    const { data: locked } = await sb
      .from("scheduled_calls")
      .update({ status: "calling" })
      .in("id", pending.map((c: any) => c.id))
      .in("status", ["pending", "failed"])
      .select("id, company_id, contact_id, agent_id, dynamic_variables, notes, retry_count");

    if (!locked?.length) {
      return jsonOk({ executed: 0, skipped: "all_locked" }, rid);
    }

    let successCount = 0;
    let failCount = 0;
    let retryCount = 0;

    // Process in parallel chunks
    for (let i = 0; i < locked.length; i += PARALLEL) {
      const chunk = locked.slice(i, i + PARALLEL);

      await Promise.allSettled(
        chunk.map(async (scheduled: any) => {
          const currentRetry = scheduled.retry_count ?? 0;

          try {
            // Check DNC & phone
            const { data: contact } = await sb
              .from("contacts")
              .select("phone, do_not_call, full_name")
              .eq("id", scheduled.contact_id)
              .single();

            if (contact?.do_not_call) {
              await sb.from("scheduled_calls").update({
                status: "cancelled",
                cancelled_reason: "DNC",
                executed_at: new Date().toISOString(),
              }).eq("id", scheduled.id);
              log("info", "Scheduled call cancelled: DNC", { request_id: rid, id: scheduled.id });
              return;
            }

            if (!contact?.phone) {
              await sb.from("scheduled_calls").update({
                status: "failed",
                cancelled_reason: "no_phone",
                last_error: "Contact has no phone number",
                executed_at: new Date().toISOString(),
              }).eq("id", scheduled.id);
              return;
            }

            // Check agent still enabled
            const { data: agent } = await sb
              .from("agents")
              .select("outbound_enabled, el_phone_number_id")
              .eq("id", scheduled.agent_id)
              .single();

            if (!agent?.outbound_enabled || !agent?.el_phone_number_id) {
              await sb.from("scheduled_calls").update({
                status: "failed",
                cancelled_reason: "agent_disabled",
                last_error: "Agent outbound disabled or missing phone number",
                executed_at: new Date().toISOString(),
              }).eq("id", scheduled.id);
              return;
            }

            // Invoke outbound call — 20s timeout to prevent batch hang
            const callRes = await fetchWithTimeout(
              `${Deno.env.get("SUPABASE_URL")}/functions/v1/elevenlabs-outbound-call`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
                },
                body: JSON.stringify({
                  agent_id: scheduled.agent_id,
                  to_number: contact.phone,
                  contact_id: scheduled.contact_id,
                  dynamic_variables: scheduled.dynamic_variables || {},
                }),
              },
              20_000,
            );

            const callData = await callRes.json();
            const succeeded = callRes.ok && callData.ok;

            if (succeeded) {
              await sb.from("scheduled_calls").update({
                status: "completed",
                executed_at: new Date().toISOString(),
                call_log_id: callData.call_log_id || null,
                retry_count: currentRetry,
              }).eq("id", scheduled.id);
              successCount++;
            } else {
              // Transient failure: reschedule for retry in 5 minutes if under limit
              const nextRetry = currentRetry + 1;
              const canRetry = nextRetry < MAX_RETRIES;
              await sb.from("scheduled_calls").update({
                status: canRetry ? "failed" : "failed",
                cancelled_reason: canRetry ? null : "max_retries_exceeded",
                last_error: callData.error || `HTTP ${callRes.status}`,
                executed_at: new Date().toISOString(),
                call_log_id: callData.call_log_id || null,
                retry_count: nextRetry,
                // Reschedule 5 minutes out so the next cron run can pick it up
                scheduled_at: canRetry
                  ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
                  : undefined,
              }).eq("id", scheduled.id);
              if (canRetry) {
                retryCount++;
                log("warn", "Scheduled call failed, will retry", {
                  request_id: rid, id: scheduled.id, attempt: nextRetry, max: MAX_RETRIES,
                });
              }
              failCount++;
            }
          } catch (err) {
            const nextRetry = (scheduled.retry_count ?? 0) + 1;
            const canRetry = nextRetry < MAX_RETRIES;
            const errMsg = (err as Error).message?.slice(0, 200);
            await sb.from("scheduled_calls").update({
              status: "failed",
              cancelled_reason: canRetry ? null : "max_retries_exceeded",
              last_error: errMsg,
              executed_at: new Date().toISOString(),
              retry_count: nextRetry,
              scheduled_at: canRetry
                ? new Date(Date.now() + 5 * 60 * 1000).toISOString()
                : undefined,
            }).eq("id", scheduled.id);
            log("error", "Scheduled call execution failed", {
              request_id: rid, id: scheduled.id, err: errMsg, attempt: nextRetry,
            });
            if (canRetry) retryCount++;
            failCount++;
          }
        })
      );

      // Pause between chunks to avoid overloading
      if (i + PARALLEL < locked.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    log("info", "Scheduled calls executed", {
      request_id: rid, success: successCount, failed: failCount, retried: retryCount, total: locked.length,
    });
    return jsonOk({ executed: successCount + failCount, success: successCount, failed: failCount, retried: retryCount }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
