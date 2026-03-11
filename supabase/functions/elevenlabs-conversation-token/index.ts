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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }

    const { agent_id } = await req.json();
    if (!agent_id) {
      return jsonError("agent_id required", "validation_error", 400, rid);
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
