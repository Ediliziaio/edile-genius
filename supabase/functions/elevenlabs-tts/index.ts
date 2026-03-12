import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  corsHeaders, generateRequestId, log, jsonError, errorResponse,
  fetchWithTimeout,
} from "../_shared/utils.ts";

const FN = "elevenlabs-tts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const rid = generateRequestId();

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const { text, voice_id, voice_settings } = await req.json();
    if (!text || !voice_id) return jsonError("text and voice_id required", "validation_error", 400, rid);

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      log("error", "ELEVENLABS_API_KEY not configured", { request_id: rid });
      return jsonError("Configurazione API mancante", "system_error", 500, rid);
    }

    const ttsBody: Record<string, unknown> = {
      text,
      model_id: "eleven_multilingual_v2",
    };
    if (voice_settings) {
      ttsBody.voice_settings = {
        stability: voice_settings.stability ?? 0.5,
        similarity_boost: voice_settings.similarity_boost ?? 0.75,
        speed: voice_settings.speed ?? 1.0,
      };
    }

    log("info", "TTS request", { request_id: rid, voice_id, text_length: text.length });

    // 30s timeout, no retry (large binary response)
    const elResponse = await fetchWithTimeout(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify(ttsBody),
      },
      30_000
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      log("error", "TTS provider error", { request_id: rid, status: elResponse.status, detail: errText.slice(0, 500) });
      return jsonError("Errore generazione audio", "provider_error", 502, rid);
    }

    const audioBuffer = await elResponse.arrayBuffer();
    log("info", "TTS completed", { request_id: rid, bytes: audioBuffer.byteLength });

    return new Response(audioBuffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
