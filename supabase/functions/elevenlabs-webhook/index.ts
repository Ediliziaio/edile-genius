import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateRequestId, log } from "../_shared/utils.ts";
import { generateCallAnalysis } from "./summary.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FN = "elevenlabs-webhook";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Read body as text for HMAC verification
    const bodyText = await req.text();

    // Verify HMAC signature if configured
    const signature = req.headers.get("ElevenLabs-Signature");
    const webhookSecret = Deno.env.get("ELEVENLABS_WEBHOOK_SECRET");
    if (signature && webhookSecret) {
      const parts = signature.split(",");
      const timestamp = parts.find((p: string) => p.startsWith("t="))?.replace("t=", "") || "";
      const hash = parts.find((p: string) => p.startsWith("v0="))?.replace("v0=", "") || "";
      const payload = `${timestamp}.${bodyText}`;
      const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(webhookSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
      const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
      const expectedHash = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
      if (hash !== expectedHash) {
        log("error", "Invalid webhook signature", { request_id: rid });
        return new Response("Invalid signature", { status: 401 });
      }
    }

    const event = JSON.parse(bodyText);
    log("info", "Webhook received", { request_id: rid, type: event.type });

    // Handle conversation.started
    if (event.type === "conversation.started") {
      const convData = event.data || event;
      const elAgentId = convData.agent_id;
      if (elAgentId) {
        const { data: agent } = await sb.from("agents").select("id, company_id").eq("el_agent_id", elAgentId).single();
        if (agent) {
          await sb.from("conversations").upsert({
            el_conv_id: convData.conversation_id,
            agent_id: agent.id,
            company_id: agent.company_id,
            status: "in_progress",
            direction: convData.direction || "inbound",
            caller_number: convData.caller_number || null,
            started_at: new Date().toISOString(),
          }, { onConflict: "el_conv_id" });
          log("info", "Conversation started", { request_id: rid, conversation_id: convData.conversation_id });
        } else {
          log("warn", "Agent not found for conversation.started", { request_id: rid, el_agent_id: elAgentId });
        }
      }
      return new Response("ok", { status: 200 });
    }

    // Only process post-call events
    if (event.type !== "post_call_transcription" && event.type !== "conversation.ended") {
      log("info", "Event ignored", { request_id: rid, type: event.type });
      return new Response("ignored", { status: 200 });
    }

    const data = event.data || event;
    const { conversation_id, agent_id: elAgentId, duration_seconds, transcript } = data;

    if (!elAgentId || !duration_seconds) {
      log("warn", "Missing data in webhook", { request_id: rid, has_agent_id: !!elAgentId, has_duration: !!duration_seconds });
      return new Response("missing data", { status: 400 });
    }

    // 1. Find agent
    const { data: agent } = await sb.from("agents").select("id, company_id, llm_model, tts_model").eq("el_agent_id", elAgentId).single();
    if (!agent) {
      log("error", "Agent not found", { request_id: rid, el_agent_id: elAgentId });
      return new Response("agent not found", { status: 404 });
    }

    // 2. Calculate duration
    const durationMin = Math.max(0.0167, duration_seconds / 60);

    // 3. Get pricing
    const { data: pricing } = await sb.from("platform_pricing").select("cost_real_per_min, cost_billed_per_min")
      .eq("llm_model", agent.llm_model || "gemini-2.5-flash")
      .eq("tts_model", agent.tts_model || "eleven_multilingual_v2")
      .single();

    const costRealPerMin = Number(pricing?.cost_real_per_min || 0.0200);
    const costBilledPerMin = Number(pricing?.cost_billed_per_min || 0.0400);
    const costRealTotal = Number((durationMin * costRealPerMin).toFixed(4));
    const costBilledTotal = Number((durationMin * costBilledPerMin).toFixed(4));
    const marginTotal = Number((costBilledTotal - costRealTotal).toFixed(4));

    // 4. Get current balance
    const { data: credits } = await sb.from("ai_credits")
      .select("balance_eur, auto_recharge_enabled, auto_recharge_threshold, auto_recharge_amount, alert_threshold_eur, total_spent_eur, total_recharged_eur, auto_recharge_method")
      .eq("company_id", agent.company_id).single();

    const balanceBefore = Number(credits?.balance_eur || 0);
    const balanceAfter = Number((balanceBefore - costBilledTotal).toFixed(4));

    // 5. Update balance
    await sb.from("ai_credits").update({
      balance_eur: balanceAfter,
      total_spent_eur: Number((Number(credits?.total_spent_eur || 0) + costBilledTotal).toFixed(4)),
      updated_at: new Date().toISOString(),
    }).eq("company_id", agent.company_id);

    // 6. Record usage
    const { data: convRecord } = await sb.from("conversations").select("id").eq("el_conv_id", conversation_id).maybeSingle();

    await sb.from("ai_credit_usage").insert({
      company_id: agent.company_id,
      conversation_id: convRecord?.id || null,
      agent_id: agent.id,
      duration_sec: duration_seconds,
      duration_min: Number(durationMin.toFixed(4)),
      llm_model: agent.llm_model || "gemini-2.5-flash",
      tts_model: agent.tts_model || "eleven_multilingual_v2",
      cost_real_per_min: costRealPerMin,
      cost_billed_per_min: costBilledPerMin,
      cost_real_total: costRealTotal,
      cost_billed_total: costBilledTotal,
      margin_total: marginTotal,
      balance_before: balanceBefore,
      balance_after: balanceAfter,
    });

    // 7. Extract collected data and eval
    const collectedData = data.collected_data || data.data_collection || null;
    const evalScore = data.analysis?.evaluation_criteria_results?.[0]?.result === "success" ? 100 :
                      data.analysis?.evaluation_criteria_results?.[0]?.result === "failure" ? 0 : null;
    const evalNotes = data.analysis?.transcript_summary || null;

    // 7b. Generate AI summary (non-blocking — returns null if OPENAI_API_KEY not set)
    const summary = await generateCallSummary(transcript || [], rid);

    // 8. Update conversation
    if (conversation_id) {
      const convUpdate: Record<string, any> = {
        duration_sec: duration_seconds,
        minutes_billed: Number(durationMin.toFixed(4)),
        cost_billed_eur: costBilledTotal,
        status: "completed",
        transcript: transcript || [],
        collected_data: collectedData,
        eval_score: evalScore,
        eval_notes: evalNotes,
        ended_at: new Date().toISOString(),
      };
      if (summary) {
        convUpdate.summary = summary;
      }
      await sb.from("conversations").update(convUpdate).eq("el_conv_id", conversation_id);
    }

    // 9. Update agent stats
    const { data: agentStats } = await sb.from("agents").select("calls_total, calls_month, avg_duration_sec").eq("id", agent.id).single();
    const prevTotal = agentStats?.calls_total || 0;
    const prevAvg = agentStats?.avg_duration_sec || 0;
    const newAvg = prevTotal > 0 ? Math.round((prevAvg * prevTotal + duration_seconds) / (prevTotal + 1)) : duration_seconds;

    await sb.from("agents").update({
      calls_total: prevTotal + 1,
      calls_month: (agentStats?.calls_month || 0) + 1,
      avg_duration_sec: newAvg,
      last_call_at: new Date().toISOString(),
    }).eq("id", agent.id);

    // 10. Handle low/zero balance
    if (balanceAfter <= 0) {
      await sb.from("ai_credits").update({
        calls_blocked: true, blocked_at: new Date().toISOString(), blocked_reason: "balance_zero",
      }).eq("company_id", agent.company_id);
      log("warn", "Balance zero — calls blocked", { request_id: rid, company_id: agent.company_id });
    } else if (credits?.auto_recharge_enabled && balanceAfter <= Number(credits?.auto_recharge_threshold || 5)) {
      const rechargeAmount = Number(credits?.auto_recharge_amount || 20);
      await sb.from("ai_credits").update({
        balance_eur: Number((balanceAfter + rechargeAmount).toFixed(4)),
        total_recharged_eur: Number((Number(credits?.total_recharged_eur || 0) + rechargeAmount).toFixed(4)),
      }).eq("company_id", agent.company_id);
      await sb.from("ai_credit_topups").insert({
        company_id: agent.company_id, amount_eur: rechargeAmount, type: "auto", status: "completed",
        payment_method: credits?.auto_recharge_method || "card",
        notes: `Ricarica automatica — saldo era €${balanceAfter.toFixed(2)}`,
        processed_at: new Date().toISOString(),
      });
      log("info", "Auto-recharge triggered", { request_id: rid, company_id: agent.company_id, amount: rechargeAmount });
    } else if (balanceAfter <= Number(credits?.alert_threshold_eur || 5)) {
      await sb.from("ai_credits").update({ alert_email_sent_at: new Date().toISOString() }).eq("company_id", agent.company_id);
    }

    log("info", "Webhook processed", {
      request_id: rid,
      conversation_id,
      agent_id: agent.id,
      duration_sec: duration_seconds,
      cost_billed: costBilledTotal,
      balance_after: balanceAfter,
    });

    return new Response("ok", { status: 200 });
  } catch (err) {
    log("error", "Webhook unhandled error", { request_id: rid, error: (err as Error).message });
    return new Response(JSON.stringify({ error: "Internal server error" }), { status: 500, headers: corsHeaders });
  }
});
