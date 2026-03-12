import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse,
} from "../_shared/utils.ts";

const FN = "execute-scheduled-calls";
const BATCH_SIZE = 10;
const PARALLEL = 5;

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
    // Get pending scheduled calls ready to execute
    const { data: pending } = await sb
      .from("scheduled_calls")
      .select("id, company_id, contact_id, agent_id, dynamic_variables, notes")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (!pending?.length) {
      return jsonOk({ executed: 0 }, rid);
    }

    // Optimistic lock: mark as 'calling' only if still 'pending'
    const { data: locked } = await sb
      .from("scheduled_calls")
      .update({ status: "calling" })
      .in("id", pending.map((c: any) => c.id))
      .eq("status", "pending")
      .select("id, company_id, contact_id, agent_id, dynamic_variables, notes");

    if (!locked?.length) {
      return jsonOk({ executed: 0, skipped: "all_locked" }, rid);
    }

    let successCount = 0;
    let failCount = 0;

    // Process in parallel chunks
    for (let i = 0; i < locked.length; i += PARALLEL) {
      const chunk = locked.slice(i, i + PARALLEL);

      await Promise.allSettled(
        chunk.map(async (scheduled: any) => {
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
                executed_at: new Date().toISOString(),
              }).eq("id", scheduled.id);
              return;
            }

            // Invoke outbound call
            const callRes = await fetch(
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
            );

            const callData = await callRes.json();

            await sb.from("scheduled_calls").update({
              status: callRes.ok && callData.ok ? "completed" : "failed",
              executed_at: new Date().toISOString(),
              call_log_id: callData.call_log_id || null,
            }).eq("id", scheduled.id);

            if (callRes.ok && callData.ok) successCount++;
            else failCount++;
          } catch (err) {
            await sb.from("scheduled_calls").update({
              status: "failed",
              executed_at: new Date().toISOString(),
              cancelled_reason: (err as Error).message?.slice(0, 200),
            }).eq("id", scheduled.id);
            log("error", "Scheduled call execution failed", {
              request_id: rid,
              id: scheduled.id,
              err: (err as Error).message,
            });
            failCount++;
          }
        })
      );

      // Pause between chunks to avoid overloading
      if (i + PARALLEL < locked.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    log("info", "Scheduled calls executed", { request_id: rid, success: successCount, failed: failCount, total: locked.length });
    return jsonOk({ executed: successCount + failCount, success: successCount, failed: failCount }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
