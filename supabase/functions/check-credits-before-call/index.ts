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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userId = user.id;

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get user's company
    const { data: profile } = await sb
      .from("profiles")
      .select("company_id")
      .eq("id", userId)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "No company" }), { status: 400, headers: corsHeaders });
    }

    const { agentId } = await req.json();

    // Get agent config — scoped to user's company
    const { data: agent } = await sb
      .from("agents")
      .select("llm_model, tts_model")
      .eq("id", agentId)
      .eq("company_id", profile.company_id)
      .single();

    // Get pricing for this agent's model combo
    const { data: pricing } = await sb
      .from("platform_pricing")
      .select("cost_billed_per_min")
      .eq("llm_model", agent?.llm_model || "gemini-2.5-flash")
      .eq("tts_model", agent?.tts_model || "eleven_multilingual_v2")
      .eq("is_active", true)
      .single();

    if (!pricing) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: "pricing_unavailable",
        message: "Impossibile determinare il costo per questa configurazione agente. Contatta il supporto.",
      }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const minCostPerCall = pricing.cost_billed_per_min;

    // Get credits
    const { data: credits } = await sb
      .from("ai_credits")
      .select("balance_eur, calls_blocked, blocked_reason")
      .eq("company_id", profile.company_id)
      .single();

    if (credits?.calls_blocked || (credits?.balance_eur || 0) < minCostPerCall) {
      return new Response(JSON.stringify({
        allowed: false,
        reason: credits?.calls_blocked ? credits.blocked_reason || "blocked" : "insufficient_balance",
        balance_eur: credits?.balance_eur || 0,
        min_required_eur: minCostPerCall,
      }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      allowed: true,
      balance_eur: credits?.balance_eur || 0,
      cost_per_min: pricing?.cost_billed_per_min || minCostPerCall,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500, headers: corsHeaders,
    });
  }
});
