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

    const { id, ...updates } = await req.json();
    if (!id) {
      return new Response(JSON.stringify({ error: "Agent id required" }), { status: 400, headers: corsHeaders });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get current agent
    const { data: currentAgent } = await serviceClient
      .from("agents")
      .select("el_agent_id, company_id")
      .eq("id", id)
      .single();

    // Update DB
    const allowedFields = [
      "name", "description", "sector", "language", "system_prompt",
      "first_message", "status", "el_voice_id", "config", "use_case"
    ];
    const dbUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) dbUpdates[key] = updates[key];
    }

    const { data: agent, error: dbError } = await serviceClient
      .from("agents")
      .update(dbUpdates)
      .eq("id", id)
      .select()
      .single();

    if (dbError) {
      return new Response(JSON.stringify({ error: dbError.message }), { status: 500, headers: corsHeaders });
    }

    // Sync to ElevenLabs if agent has el_agent_id
    if (currentAgent?.el_agent_id) {
      const { data: company } = await serviceClient
        .from("companies")
        .select("el_api_key")
        .eq("id", currentAgent.company_id)
        .single();

      const apiKey = company?.el_api_key || Deno.env.get("ELEVENLABS_API_KEY");
      if (apiKey) {
        const cfg = (updates.config && typeof updates.config === "object") ? updates.config : {};
        const agentCfg = (agent.config && typeof agent.config === "object") ? agent.config as Record<string, unknown> : {};

        const elBody: Record<string, unknown> = {
          conversation_config: {
            agent: {
              prompt: {
                prompt: updates.system_prompt || agent.system_prompt || "",
                ...(cfg.llm_model ? { llm: cfg.llm_model } : agentCfg.llm_model ? { llm: agentCfg.llm_model } : {}),
                ...(cfg.temperature !== undefined ? { temperature: cfg.temperature } : {}),
              },
              first_message: updates.first_message || agent.first_message || "",
              language: updates.language || agent.language || "it",
              ...(cfg.max_duration_sec ? { max_duration_seconds: cfg.max_duration_sec } : {}),
            },
            tts: {
              voice_id: updates.el_voice_id || agent.el_voice_id,
              voice_settings: {
                stability: cfg.voice_stability ?? agentCfg.voice_stability ?? 0.5,
                similarity_boost: cfg.voice_similarity ?? agentCfg.voice_similarity ?? 0.75,
                speed: cfg.voice_speed ?? agentCfg.voice_speed ?? 1.0,
              },
            },
          },
        };

        // Turn settings
        const turnTimeout = cfg.turn_timeout_sec ?? agentCfg.turn_timeout_sec;
        const turnEagerness = cfg.turn_eagerness ?? agentCfg.turn_eagerness;
        if (turnTimeout || turnEagerness) {
          (elBody.conversation_config as Record<string, unknown>).turn = {
            ...(turnTimeout ? { timeout: turnTimeout } : {}),
            ...(turnEagerness ? { mode: turnEagerness } : {}),
          };
        }

        await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${currentAgent.el_agent_id}`,
          {
            method: "PATCH",
            headers: {
              "xi-api-key": apiKey,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(elBody),
          }
        );
      }
    }

    return new Response(JSON.stringify({ agent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
