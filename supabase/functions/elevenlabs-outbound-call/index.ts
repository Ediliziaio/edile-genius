import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse,
  fetchWithTimeout,
} from "../_shared/utils.ts";

const FN = "elevenlabs-outbound-call";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    // Auth — use getUser() instead of getClaims()
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: userData, error: authErr } = await supabase.auth.getUser();
    if (authErr || !userData?.user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { agent_id, to_number, dynamic_variables } = await req.json();

    if (!agent_id || !to_number) return jsonError("agent_id e to_number richiesti", "validation_error", 400, rid);

    log("info", "Outbound call requested", { request_id: rid, agent_id, to_number: to_number.replace(/\d(?=\d{4})/g, "*") });

    const { data: agent } = await sb.from("agents").select("el_agent_id, company_id, el_phone_number_id, outbound_enabled").eq("id", agent_id).single();
    if (!agent?.el_agent_id) return jsonError("Agente non ha ID ElevenLabs", "validation_error", 400, rid);
    if (!agent.outbound_enabled) return jsonError("Chiamate outbound non abilitate", "forbidden", 403, rid);
    if (!agent.el_phone_number_id) return jsonError("Nessun numero ElevenLabs associato", "validation_error", 400, rid);

    const { data: credits } = await sb.from("ai_credits").select("balance_eur, calls_blocked").eq("company_id", agent.company_id).single();
    if (credits?.calls_blocked || (Number(credits?.balance_eur) || 0) < 0.04) {
      log("warn", "Insufficient credits for outbound call", { request_id: rid, company_id: agent.company_id, balance: credits?.balance_eur });
      return jsonError("Crediti insufficienti", "insufficient_credits", 402, rid);
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return jsonError("Configurazione API mancante", "system_error", 500, rid);

    const callBody: Record<string, unknown> = {
      agent_id: agent.el_agent_id,
      agent_phone_number_id: agent.el_phone_number_id,
      to_number: to_number.replace(/\s/g, ""),
    };
    if (dynamic_variables && Object.keys(dynamic_variables).length) {
      callBody.conversation_initiation_client_data = { dynamic_variables };
    }

    // 15s timeout, NO retry (not idempotent — initiates real phone call)
    const elRes = await fetchWithTimeout(
      "https://api.elevenlabs.io/v1/convai/twilio/outbound-call",
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(callBody),
      },
      15_000
    );

    if (!elRes.ok) {
      const errText = await elRes.text();
      log("error", "EL outbound call error", { request_id: rid, status: elRes.status, detail: errText.slice(0, 500) });
      return jsonError("Errore avvio chiamata", "provider_error", 502, rid);
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

    log("info", "Outbound call initiated", { request_id: rid, call_sid: elData.call_sid });

    // Backward compatible: keep success + call_sid at top level
    return new Response(
      JSON.stringify({ ok: true, success: true, call_sid: elData.call_sid, request_id: rid }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
