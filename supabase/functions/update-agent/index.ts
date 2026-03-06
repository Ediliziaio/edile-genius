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

    // Get current agent to check for elevenlabs_agent_id
    const { data: currentAgent } = await serviceClient
      .from("agents")
      .select("elevenlabs_agent_id, company_id")
      .eq("id", id)
      .single();

    // Update DB
    const allowedFields = [
      "name", "description", "sector", "language", "system_prompt",
      "first_message", "status", "elevenlabs_voice_id", "config", "use_case"
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

    // Sync to ElevenLabs if agent has elevenlabs_agent_id
    if (currentAgent?.elevenlabs_agent_id) {
      const { data: company } = await serviceClient
        .from("companies")
        .select("elevenlabs_api_key")
        .eq("id", currentAgent.company_id)
        .single();

      const apiKey = company?.elevenlabs_api_key || Deno.env.get("ELEVENLABS_API_KEY");
      if (apiKey) {
        const elBody: Record<string, unknown> = {
          conversation_config: {
            agent: {
              prompt: {
                prompt: updates.system_prompt || agent.system_prompt,
              },
              first_message: updates.first_message || agent.first_message,
              language: updates.language || agent.language,
            },
          },
        };

        if (updates.elevenlabs_voice_id) {
          elBody.conversation_config = {
            ...(elBody.conversation_config as Record<string, unknown>),
            tts: { voice_id: updates.elevenlabs_voice_id },
          };
        }

        if (updates.config?.temperature !== undefined) {
          const agentConfig = (elBody.conversation_config as Record<string, unknown>).agent as Record<string, unknown>;
          agentConfig.prompt = {
            ...(agentConfig.prompt as Record<string, unknown>),
            temperature: updates.config.temperature,
          };
        }

        await fetch(
          `https://api.elevenlabs.io/v1/convai/agents/${currentAgent.elevenlabs_agent_id}`,
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
