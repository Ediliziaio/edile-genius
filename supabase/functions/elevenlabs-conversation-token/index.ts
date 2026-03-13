import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse,
  fetchWithRetry,
} from "../_shared/utils.ts";

const FN = "elevenlabs-conversation-token";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }

    const { agent_id } = await req.json();
    if (!agent_id) {
      return jsonError("agent_id required", "validation_error", 400, rid);
    }

    // Tenant verification: ensure the agent belongs to the user's company
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await sb
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return jsonError("Utente senza azienda", "auth_error", 403, rid);
    }

    // Verify the ElevenLabs agent_id belongs to an agent of the user's company
    const { data: agentRecord } = await sb
      .from("agents")
      .select("id")
      .eq("el_agent_id", agent_id)
      .eq("company_id", profile.company_id)
      .maybeSingle();

    if (!agentRecord) {
      log("warn", "Agent not found or not owned by company", { request_id: rid, agent_id, company_id: profile.company_id });
      return jsonError("Agente non trovato o non autorizzato", "auth_error", 403, rid);
    }

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      log("error", "ELEVENLABS_API_KEY not configured", { request_id: rid });
      return jsonError("Configurazione API mancante", "system_error", 500, rid);
    }

    log("info", "Requesting conversation token", { request_id: rid, agent_id });

    const elResponse = await fetchWithRetry(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agent_id}`,
      { headers: { "xi-api-key": apiKey } },
      10_000,
      { maxRetries: 1 }
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      log("error", "ElevenLabs token error", { request_id: rid, status: elResponse.status, detail: errText.slice(0, 500) });
      return jsonError("Errore generazione token conversazione", "provider_error", 502, rid);
    }

    const { token: convToken } = await elResponse.json();
    log("info", "Conversation token generated", { request_id: rid });

    // Return token at top level for backward compatibility
    return new Response(JSON.stringify({ ok: true, token: convToken, request_id: rid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
