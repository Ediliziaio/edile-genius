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
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const { company_id, name, description, use_case, sector, language, voice_id, system_prompt, first_message, status: agentStatus, config } = body;

    if (!company_id || !name) {
      return new Response(JSON.stringify({ error: "company_id and name required" }), { status: 400, headers: corsHeaders });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get company API key
    const { data: company } = await serviceClient
      .from("companies")
      .select("el_api_key")
      .eq("id", company_id)
      .single();

    const apiKey = company?.el_api_key || Deno.env.get("ELEVENLABS_API_KEY");

    let el_agent_id = null;

    // Create ElevenLabs agent if API key exists
    if (apiKey && voice_id) {
      try {
        const elResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_config: {
              agent: {
                prompt: { prompt: system_prompt || "" },
                first_message: first_message || "",
                language: language || "it",
              },
              tts: { voice_id },
            },
            name,
          }),
        });

        if (elResponse.ok) {
          const elData = await elResponse.json();
          el_agent_id = elData.agent_id;
        } else {
          console.error("ElevenLabs error:", await elResponse.text());
        }
      } catch (e) {
        console.error("ElevenLabs API call failed:", e);
      }
    }

    // Insert agent in DB
    const { data: agent, error: insertError } = await serviceClient
      .from("agents")
      .insert({
        company_id,
        name,
        description: description || null,
        use_case: use_case || null,
        sector: sector || null,
        language: language || "it",
        el_voice_id: voice_id || null,
        el_agent_id,
        system_prompt: system_prompt || null,
        first_message: first_message || null,
        status: agentStatus || "draft",
        type: "vocal",
        config: config || {},
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ agent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
