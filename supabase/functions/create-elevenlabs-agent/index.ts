import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const userId = claimsData.claims.sub;

    const body = await req.json();
    const VALID_AGENT_TYPES = ["vocal", "render", "whatsapp", "operative"] as const;
    const {
      company_id, name, description, use_case, sector, language, voice_id,
      system_prompt, first_message, status: agentStatus, type: rawType, config = {}
    } = body;
    const agentType = VALID_AGENT_TYPES.includes(rawType) ? rawType : "vocal";

    if (!company_id || !name) return new Response(JSON.stringify({ error: "company_id and name required" }), { status: 400, headers: corsHeaders });

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");

    let el_agent_id = null;

    if (apiKey) {
      try {
        const conversationConfig: Record<string, unknown> = {
          agent: {
            first_message: first_message || "",
            language: language || "it",
            prompt: {
              prompt: system_prompt || "",
              llm: config.llm_model || "gemini-2.5-flash",
              temperature: config.temperature ?? 0,
              max_tokens: config.max_tokens ?? -1,
              ...(config.llm_backup_model ? { backup_llm_config: { llm: config.llm_backup_model } } : {}),
              built_in_tools: {
                end_call: { description: "Termina la chiamata quando la conversazione è completata" },
                ...(config.transfer_number ? {
                  transfer_to_number: { phone_number: config.transfer_number, description: "Trasferisci a un operatore umano" }
                } : {}),
                ...(config.built_in_tools?.voicemail ? {
                  voicemail_detection: { description: "Rileva la segreteria telefonica e lascia un messaggio" }
                } : {}),
              },
            },
            ...(config.dynamic_variables?.length ? {
              dynamic_variables: {
                dynamic_variable_placeholders: config.dynamic_variables.reduce((acc: Record<string, unknown>, v: { name: string; type: string; description?: string }) => {
                  acc[v.name] = { type: v.type || "string", description: v.description || "" };
                  return acc;
                }, {})
              }
            } : {}),
          },
          tts: {
            model_id: config.tts_model || "eleven_turbo_v2_5",
            voice_id: voice_id || "cjVigY5qzO86Huf0OWal",
            stability: config.voice_stability ?? 0.5,
            similarity_boost: config.voice_similarity ?? 0.75,
            speed: config.voice_speed ?? 1.0,
          },
          turn: {
            turn_timeout: config.turn_timeout_sec ?? 7,
            mode: config.turn_eagerness || "normal",
            silence_end_call_timeout: config.silence_end_call_timeout ?? 20,
          },
          asr: {
            quality: config.asr_quality || "high",
            ...(config.asr_keywords?.length ? { keywords: config.asr_keywords } : {}),
          },
          conversation: {
            max_duration_seconds: config.max_duration_sec ?? 600,
          },
        };

        // Safety
        const safety: Record<string, unknown> = {};
        if (config.pii_redaction) safety.pii_redaction = { enabled: true };
        if (config.blocked_topics) {
          const topics = config.blocked_topics.split(/[,\n]/).map((t: string) => t.trim()).filter(Boolean);
          if (topics.length) safety.blocked_topics = topics;
        }
        if (Object.keys(safety).length) conversationConfig.safety = safety;

        // Evaluation
        if (config.evaluation_criteria) {
          conversationConfig.evaluation = {
            criteria: config.evaluation_criteria,
            ...(config.evaluation_prompt ? { evaluation_prompt: config.evaluation_prompt } : {}),
          };
        }

        // Custom tools
        const customTools = config.custom_tools || [];
        if (customTools.length > 0) {
          conversationConfig.tools = customTools.map((tool: { name: string; description: string; url: string; method?: string }) => ({
            type: "webhook",
            name: tool.name,
            description: tool.description,
            api: { url: tool.url, method: tool.method || "GET" },
          }));
        }

        // Post-call webhook
        const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/elevenlabs-webhook`;
        conversationConfig.post_call = { webhook: { url: webhookUrl } };

        const elResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({ name, conversation_config: conversationConfig }),
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

    const { data: agent, error: insertError } = await serviceClient.from("agents").insert({
      company_id, name,
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
      llm_model: config.llm_model || "gemini-2.5-flash",
      tts_model: config.tts_model || "eleven_turbo_v2_5",
      llm_backup_model: config.llm_backup_model || null,
      asr_quality: config.asr_quality || "high",
      asr_keywords: config.asr_keywords || [],
      silence_end_call_timeout: config.silence_end_call_timeout ?? 20,
      speculative_turn: config.speculative_turn ?? false,
      evaluation_criteria: config.evaluation_criteria || null,
      evaluation_prompt: config.evaluation_prompt || null,
      dynamic_variables: config.dynamic_variables || [],
      built_in_tools: config.built_in_tools || {},
      transfer_number: config.transfer_number || null,
      monitoring_enabled: config.monitoring_enabled ?? false,
      pii_redaction: config.pii_redaction ?? false,
      blocked_topics: config.blocked_topics || null,
      outbound_enabled: config.outbound_enabled ?? false,
      config: { ...config },
      created_by: userId,
    }).select().single();

    if (insertError) return new Response(JSON.stringify({ error: insertError.message }), { status: 500, headers: corsHeaders });

    return new Response(JSON.stringify({ agent, el_agent_id }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error) {
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: corsHeaders });
  }
});
