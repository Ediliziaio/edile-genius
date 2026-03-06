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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { text, voice_id, company_id, voice_settings } = await req.json();
    if (!text || !voice_id) {
      return new Response(JSON.stringify({ error: "text and voice_id required" }), { status: 400, headers: corsHeaders });
    }

    // Get company API key
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (company_id) {
      const { data: company } = await serviceClient
        .from("companies")
        .select("el_api_key")
        .eq("id", company_id)
        .single();
      if (company?.el_api_key) apiKey = company.el_api_key;
    }

    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No ElevenLabs API key configured" }), { status: 400, headers: corsHeaders });
    }

    // Build voice_settings for the TTS call
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

    const elResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voice_id}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(ttsBody),
      }
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      return new Response(JSON.stringify({ error: "TTS error", details: errText }), { status: 500, headers: corsHeaders });
    }

    const audioBuffer = await elResponse.arrayBuffer();
    return new Response(audioBuffer, {
      headers: { ...corsHeaders, "Content-Type": "audio/mpeg" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
