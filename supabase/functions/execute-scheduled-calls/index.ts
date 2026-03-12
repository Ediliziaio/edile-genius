import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse,
} from "../_shared/utils.ts";

const FN = "execute-scheduled-calls";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();
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
      .limit(5);

    if (!pending?.length) {
      return jsonOk({ executed: 0 }, rid);
    }

    let executed = 0;

    for (const scheduled of pending) {
      // Optimistic lock: mark as 'calling' only if still 'pending'
      const { error: lockErr } = await sb
        .from("scheduled_calls")
        .update({ status: "calling" })
        .eq("id", scheduled.id)
        .eq("status", "pending");

      if (lockErr) {
        log("warn", "Scheduled call already picked up", { request_id: rid, id: scheduled.id });
        continue;
      }

      try {
        // Check DNC
        const { data: contact } = await sb
          .from("contacts")
          .select("phone, do_not_call, full_name")
          .eq("id", scheduled.contact_id)
          .single();

        if (contact?.do_not_call) {
          await sb.from("scheduled_calls").update({
            status: "cancelled",
            executed_at: new Date().toISOString(),
          }).eq("id", scheduled.id);
          log("info", "Scheduled call cancelled: DNC", { request_id: rid, id: scheduled.id });
          continue;
        }

        if (!contact?.phone) {
          await sb.from("scheduled_calls").update({ status: "failed", executed_at: new Date().toISOString() }).eq("id", scheduled.id);
          continue;
        }

        // Check agent still enabled
        const { data: agent } = await sb
          .from("agents")
          .select("outbound_enabled, el_phone_number_id")
          .eq("id", scheduled.agent_id)
          .single();

        if (!agent?.outbound_enabled || !agent?.el_phone_number_id) {
          await sb.from("scheduled_calls").update({ status: "failed", executed_at: new Date().toISOString() }).eq("id", scheduled.id);
          continue;
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

        if (callRes.ok && callData.ok) executed++;
      } catch (err) {
        await sb.from("scheduled_calls").update({
          status: "failed",
          executed_at: new Date().toISOString(),
        }).eq("id", scheduled.id);
        log("error", "Scheduled call execution failed", {
          request_id: rid,
          id: scheduled.id,
          err: (err as Error).message,
        });
      }
    }

    log("info", "Scheduled calls executed", { request_id: rid, executed, total: pending.length });
    return jsonOk({ executed, total: pending.length }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
