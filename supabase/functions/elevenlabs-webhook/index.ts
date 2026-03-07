import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // TODO: verify ElevenLabs webhook signature (HMAC-SHA256) for production
    const event = await req.json();

    // Only process post-call events
    if (event.type !== "post_call_transcription" && event.type !== "conversation.ended") {
      return new Response("ignored", { status: 200 });
    }

    const data = event.data || event;
    const {
      conversation_id,
      agent_id: elAgentId,
      duration_seconds,
      transcript,
    } = data;

    if (!elAgentId || !duration_seconds) {
      return new Response("missing data", { status: 400 });
    }

    // 1. Find agent
    const { data: agent } = await sb
      .from("agents")
      .select("id, company_id, llm_model, tts_model")
      .eq("el_agent_id", elAgentId)
      .single();

    if (!agent) {
      console.error("Agent not found for el_agent_id:", elAgentId);
      return new Response("agent not found", { status: 404 });
    }

    // 2. Calculate duration
    const durationMin = Math.max(0.0167, duration_seconds / 60);

    // 3. Get pricing
    const { data: pricing } = await sb
      .from("platform_pricing")
      .select("cost_real_per_min, cost_billed_per_min")
      .eq("llm_model", agent.llm_model || "gemini-2.5-flash")
      .eq("tts_model", agent.tts_model || "eleven_multilingual_v2")
      .single();

    const costRealPerMin = Number(pricing?.cost_real_per_min || 0.0200);
    const costBilledPerMin = Number(pricing?.cost_billed_per_min || 0.0400);

    const costRealTotal = Number((durationMin * costRealPerMin).toFixed(4));
    const costBilledTotal = Number((durationMin * costBilledPerMin).toFixed(4));
    const marginTotal = Number((costBilledTotal - costRealTotal).toFixed(4));

    // 4. Get current balance
    const { data: credits } = await sb
      .from("ai_credits")
      .select("balance_eur, auto_recharge_enabled, auto_recharge_threshold, auto_recharge_amount, alert_threshold_eur")
      .eq("company_id", agent.company_id)
      .single();

    const balanceBefore = Number(credits?.balance_eur || 0);
    const balanceAfter = Number((balanceBefore - costBilledTotal).toFixed(4));

    // 5. Update balance
    await sb.from("ai_credits").update({
      balance_eur: balanceAfter,
      total_spent_eur: Number(((credits as any)?.total_spent_eur || 0) + costBilledTotal).toFixed(4),
      updated_at: new Date().toISOString(),
    }).eq("company_id", agent.company_id);

    // 6. Record usage
    const { data: convRecord } = await sb
      .from("conversations")
      .select("id")
      .eq("el_conv_id", conversation_id)
      .maybeSingle();

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

    // 7. Update conversation
    if (conversation_id) {
      await sb.from("conversations").update({
        duration_sec: duration_seconds,
        minutes_billed: Number(durationMin.toFixed(4)),
        status: "completed",
        transcript: transcript || [],
      }).eq("el_conv_id", conversation_id);
    }

    // 8. Update agent stats
    const { data: agentStats } = await sb
      .from("agents")
      .select("calls_total, calls_month, avg_duration_sec")
      .eq("id", agent.id)
      .single();

    const prevTotal = agentStats?.calls_total || 0;
    const prevAvg = agentStats?.avg_duration_sec || 0;
    const newAvg = prevTotal > 0
      ? Math.round((prevAvg * prevTotal + duration_seconds) / (prevTotal + 1))
      : duration_seconds;

    await sb.from("agents").update({
      calls_total: prevTotal + 1,
      calls_month: (agentStats?.calls_month || 0) + 1,
      avg_duration_sec: newAvg,
      last_call_at: new Date().toISOString(),
    }).eq("id", agent.id);

    // 9. Handle low/zero balance
    if (balanceAfter <= 0) {
      await sb.from("ai_credits").update({
        calls_blocked: true,
        blocked_at: new Date().toISOString(),
        blocked_reason: "balance_zero",
      }).eq("company_id", agent.company_id);

      console.log(`[CREDITS] BLOCKED company ${agent.company_id} — balance: €${balanceAfter}`);

    } else if (credits?.auto_recharge_enabled && balanceAfter <= Number(credits?.auto_recharge_threshold || 5)) {
      const rechargeAmount = Number(credits?.auto_recharge_amount || 20);

      // Auto-recharge (placeholder — in production integrate Stripe)
      await sb.from("ai_credits").update({
        balance_eur: Number((balanceAfter + rechargeAmount).toFixed(4)),
        total_recharged_eur: Number((Number((credits as any)?.total_recharged_eur || 0) + rechargeAmount).toFixed(4)),
      }).eq("company_id", agent.company_id);

      await sb.from("ai_credit_topups").insert({
        company_id: agent.company_id,
        amount_eur: rechargeAmount,
        type: "auto",
        status: "completed",
        payment_method: (credits as any)?.auto_recharge_method || "card",
        notes: `Ricarica automatica — saldo era €${balanceAfter.toFixed(2)}`,
        processed_at: new Date().toISOString(),
      });

      console.log(`[CREDITS] Auto-recharge €${rechargeAmount} for company ${agent.company_id}`);

    } else if (balanceAfter <= Number(credits?.alert_threshold_eur || 5)) {
      await sb.from("ai_credits").update({
        alert_email_sent_at: new Date().toISOString(),
      }).eq("company_id", agent.company_id);

      console.log(`[CREDITS] Low balance alert for company ${agent.company_id} — €${balanceAfter}`);
    }

    return new Response("ok", { status: 200 });

  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
