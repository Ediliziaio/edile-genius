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

    const { agent_id, company_id } = await req.json();
    if (!agent_id || !company_id) {
      return new Response(JSON.stringify({ error: "agent_id and company_id required" }), { status: 400, headers: corsHeaders });
    }

    // Get company API key
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: company } = await serviceClient
      .from("companies")
      .select("elevenlabs_api_key")
      .eq("id", company_id)
      .single();

    const apiKey = company?.elevenlabs_api_key || Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "No ElevenLabs API key configured" }), { status: 400, headers: corsHeaders });
    }

    const elResponse = await fetch(
      `https://api.elevenlabs.io/v1/convai/conversation/token?agent_id=${agent_id}`,
      { headers: { "xi-api-key": apiKey } }
    );

    if (!elResponse.ok) {
      const errText = await elResponse.text();
      return new Response(JSON.stringify({ error: "ElevenLabs token error", details: errText }), { status: 500, headers: corsHeaders });
    }

    const { token: convToken } = await elResponse.json();
    return new Response(JSON.stringify({ token: convToken }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
