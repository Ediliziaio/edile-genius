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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) return new Response(JSON.stringify({ error: "No ElevenLabs API key configured" }), { status: 400, headers: corsHeaders });

    const response = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": apiKey } });
    if (!response.ok) return new Response(JSON.stringify({ error: "ElevenLabs API error" }), { status: response.status, headers: corsHeaders });

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

    return new Response(JSON.stringify({ voices }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: corsHeaders });
  }
});
