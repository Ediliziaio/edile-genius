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
    const {
      company_id, name, description, use_case, sector, language,
      additional_languages, voice_id, system_prompt, first_message,
      status: agentStatus, config
    } = body;

    if (!company_id || !name) {
      return new Response(JSON.stringify({ error: "company_id and name required" }), { status: 400, headers: corsHeaders });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use centralized platform API key
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");

    let el_agent_id = null;

    // Create ElevenLabs agent if API key exists
    if (apiKey && voice_id) {
      try {
        const agentConfig: Record<string, unknown> = {
          prompt: {
            prompt: system_prompt || "",
            ...(config?.llm_model ? { llm: config.llm_model } : {}),
            ...(config?.temperature !== undefined ? { temperature: config.temperature } : {}),
          },
          first_message: first_message || "",
          language: language || "it",
          ...(config?.max_duration_sec ? { max_duration_seconds: config.max_duration_sec } : {}),
        };

        if (additional_languages?.length > 0) {
          agentConfig.supported_languages = additional_languages;
        }

        const conversationConfig: Record<string, unknown> = {
          agent: agentConfig,
          tts: {
            voice_id,
            ...(config?.voice_stability !== undefined || config?.voice_similarity !== undefined || config?.voice_speed !== undefined ? {
              voice_settings: {
                stability: config?.voice_stability ?? 0.5,
                similarity_boost: config?.voice_similarity ?? 0.75,
                speed: config?.voice_speed ?? 1.0,
              },
            } : {}),
          },
        };

        if (config?.turn_timeout_sec || config?.turn_eagerness) {
          conversationConfig.turn = {
            ...(config.turn_timeout_sec ? { timeout: config.turn_timeout_sec } : {}),
            ...(config.turn_eagerness ? { mode: config.turn_eagerness } : {}),
          };
        }

        const customTools = config?.custom_tools || [];
        if (customTools.length > 0) {
          conversationConfig.tools = customTools.map((tool: any) => ({
            type: "webhook",
            name: tool.name,
            description: tool.description,
            api: {
              url: tool.url,
              method: tool.method || "GET",
            },
          }));
        }

        const safety: Record<string, unknown> = {};
        if (config?.pii_redaction) {
          safety.pii_redaction = { enabled: true };
        }
        if (config?.blocked_topics) {
          const topics = config.blocked_topics
            .split(/[,\n]/)
            .map((t: string) => t.trim())
            .filter(Boolean);
          if (topics.length > 0) {
            safety.blocked_topics = topics;
          }
        }
        if (Object.keys(safety).length > 0) {
          conversationConfig.safety = safety;
        }

        const elResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
          method: "POST",
          headers: {
            "xi-api-key": apiKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            conversation_config: conversationConfig,
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
        config: {
          ...(config || {}),
          additional_languages: additional_languages || [],
        },
        created_by: userId,
      })
      .select()
      .single();

    if (insertError) {
      return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ agent, el_agent_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
  }
});
