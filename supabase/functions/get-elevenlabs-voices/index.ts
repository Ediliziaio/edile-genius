import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, generateRequestId, log, jsonOk, jsonError, errorResponse,
  fetchWithRetry,
} from "../_shared/utils.ts";

const FN = "get-elevenlabs-voices";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return jsonError("Unauthorized", "auth_error", 401, rid);

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      log("error", "ELEVENLABS_API_KEY not configured", { request_id: rid });
      return jsonError("Configurazione API mancante", "system_error", 500, rid);
    }

    log("info", "Fetching voices", { request_id: rid });

    const response = await fetchWithRetry(
      "https://api.elevenlabs.io/v1/voices",
      { headers: { "xi-api-key": apiKey } },
      10_000,
      { maxRetries: 1 }
    );

    if (!response.ok) {
      const errText = await response.text();
      log("error", "ElevenLabs voices error", { request_id: rid, status: response.status, detail: errText.slice(0, 500) });
      return jsonError("Errore recupero voci", "provider_error", response.status >= 500 ? 502 : response.status, rid);
    }

    const data = await response.json();
    const voices = (data.voices || []).map((v: any) => ({
      voice_id: v.voice_id,
      name: v.name,
      preview_url: v.preview_url,
      labels: v.labels || {},
      category: v.category || "generated",
      description: v.description || null,
      gender: v.labels?.gender || null,
      accent: v.labels?.accent || null,
      age: v.labels?.age || null,
      use_case: v.labels?.use_case || null,
      supported_languages: v.labels?.language ? [v.labels.language] : [],
    }));

    log("info", "Voices fetched", { request_id: rid, count: voices.length });

    // Return voices at top level for backward compatibility
    return new Response(JSON.stringify({ ok: true, voices, request_id: rid }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
