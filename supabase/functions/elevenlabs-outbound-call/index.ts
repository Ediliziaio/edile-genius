import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData } = await supabase.auth.getClaims(token);
    if (!claimsData?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { agent_id, to_number, dynamic_variables } = await req.json();

    if (!agent_id || !to_number) return new Response(JSON.stringify({ error: "agent_id e to_number richiesti" }), { status: 400, headers: corsHeaders });

    const { data: agent } = await sb.from("agents").select("el_agent_id, company_id, el_phone_number_id, outbound_enabled").eq("id", agent_id).single();
    if (!agent?.el_agent_id) return new Response(JSON.stringify({ error: "Agente non ha ID ElevenLabs" }), { status: 400, headers: corsHeaders });
    if (!agent.outbound_enabled) return new Response(JSON.stringify({ error: "Chiamate outbound non abilitate" }), { status: 403, headers: corsHeaders });
    if (!agent.el_phone_number_id) return new Response(JSON.stringify({ error: "Nessun numero ElevenLabs associato" }), { status: 400, headers: corsHeaders });

    const { data: credits } = await sb.from("ai_credits").select("balance_eur, calls_blocked").eq("company_id", agent.company_id).single();
    if (credits?.calls_blocked || (Number(credits?.balance_eur) || 0) < 0.04) {
      return new Response(JSON.stringify({ error: "Crediti insufficienti", balance_eur: credits?.balance_eur }), { status: 402, headers: corsHeaders });
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    const callBody: Record<string, unknown> = {
      agent_id: agent.el_agent_id,
      agent_phone_number_id: agent.el_phone_number_id,
      to_number: to_number.replace(/\s/g, ""),
    };
    if (dynamic_variables && Object.keys(dynamic_variables).length) {
      callBody.conversation_initiation_client_data = { dynamic_variables };
    }

    const elRes = await fetch("https://api.elevenlabs.io/v1/convai/twilio/outbound-call", {
      method: "POST",
      headers: { "xi-api-key": apiKey!, "Content-Type": "application/json" },
      body: JSON.stringify(callBody),
    });

    if (!elRes.ok) {
      const errText = await elRes.text();
      console.error("EL outbound call error:", errText);
      return new Response(JSON.stringify({ error: "Errore avvio chiamata", details: errText }), { status: 500, headers: corsHeaders });
    }

    const elData = await elRes.json();

    await sb.from("outbound_call_log").insert({
      company_id: agent.company_id,
      agent_id,
      to_number: to_number.replace(/\s/g, ""),
      el_call_id: elData.call_sid || null,
      status: "initiated",
      started_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, call_sid: elData.call_sid }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
