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

    const { id, ...updates } = await req.json();
    if (!id) return new Response(JSON.stringify({ error: "Agent id required" }), { status: 400, headers: corsHeaders });

    const serviceClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: currentAgent } = await serviceClient.from("agents").select("el_agent_id, company_id").eq("id", id).single();

    // Extended allowed fields
    const allowedFields = [
      "name", "description", "sector", "language", "system_prompt",
      "first_message", "status", "el_voice_id", "config", "use_case",
      "llm_model", "tts_model", "llm_backup_model", "asr_quality", "asr_keywords",
      "silence_end_call_timeout", "speculative_turn", "evaluation_criteria",
      "evaluation_prompt", "dynamic_variables", "built_in_tools", "transfer_number",
      "monitoring_enabled", "pii_redaction", "blocked_topics", "outbound_enabled",
      "post_call_webhook_url", "el_phone_number_id",
    ];
    const dbUpdates: Record<string, unknown> = {};
    for (const key of allowedFields) {
      if (key in updates) dbUpdates[key] = updates[key];
    }

    const { data: agent, error: dbError } = await serviceClient.from("agents").update(dbUpdates).eq("id", id).select().single();
    if (dbError) return new Response(JSON.stringify({ error: dbError.message }), { status: 500, headers: corsHeaders });

    // Sync to ElevenLabs
    if (currentAgent?.el_agent_id) {
      const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
      if (apiKey) {
        const cfg = (updates.config && typeof updates.config === "object") ? updates.config : {};
        const agentCfg = (agent.config && typeof agent.config === "object") ? agent.config as Record<string, unknown> : {};

        const getVal = (key: string) => updates[key] ?? (agent as any)[key] ?? cfg[key] ?? agentCfg[key];

        const elBody: Record<string, unknown> = {
          conversation_config: {
            agent: {
              prompt: {
                prompt: updates.system_prompt || agent.system_prompt || "",
                llm: getVal("llm_model") || "gemini-2.5-flash",
                ...(cfg.temperature !== undefined ? { temperature: cfg.temperature } : {}),
                built_in_tools: {
                  end_call: { description: "Termina la chiamata" },
                  ...(getVal("transfer_number") ? {
                    transfer_to_number: { phone_number: getVal("transfer_number"), description: "Trasferisci a operatore" }
                  } : {}),
                  ...((getVal("built_in_tools") as any)?.voicemail ? {
                    voicemail_detection: { description: "Rileva segreteria" }
                  } : {}),
                },
                ...(getVal("llm_backup_model") ? { backup_llm_config: { llm: getVal("llm_backup_model") } } : {}),
              },
              first_message: updates.first_message || agent.first_message || "",
              language: updates.language || agent.language || "it",
            },
            tts: {
              model_id: getVal("tts_model") || "eleven_turbo_v2_5",
              voice_id: updates.el_voice_id || agent.el_voice_id,
              stability: cfg.voice_stability ?? agentCfg.voice_stability ?? 0.5,
              similarity_boost: cfg.voice_similarity ?? agentCfg.voice_similarity ?? 0.75,
              speed: cfg.voice_speed ?? agentCfg.voice_speed ?? 1.0,
            },
            turn: {
              turn_timeout: cfg.turn_timeout_sec ?? agentCfg.turn_timeout_sec ?? 7,
              mode: cfg.turn_eagerness ?? agentCfg.turn_eagerness ?? "normal",
              silence_end_call_timeout: getVal("silence_end_call_timeout") ?? 20,
            },
            asr: {
              quality: getVal("asr_quality") || "high",
              ...(getVal("asr_keywords")?.length ? { keywords: getVal("asr_keywords") } : {}),
            },
            conversation: {
              max_duration_seconds: cfg.max_duration_sec ?? agentCfg.max_duration_sec ?? 600,
            },
          },
        };

        // Safety
        const safety: Record<string, unknown> = {};
        if (getVal("pii_redaction")) safety.pii_redaction = { enabled: true };
        const blockedTopics = getVal("blocked_topics");
        if (blockedTopics) {
          const topics = String(blockedTopics).split(/[,\n]/).map((t: string) => t.trim()).filter(Boolean);
          if (topics.length) safety.blocked_topics = topics;
        }
        if (Object.keys(safety).length) {
          (elBody.conversation_config as Record<string, unknown>).safety = safety;
        }

        // Evaluation
        const evalCriteria = getVal("evaluation_criteria");
        if (evalCriteria) {
          (elBody.conversation_config as Record<string, unknown>).evaluation = {
            criteria: evalCriteria,
            ...(getVal("evaluation_prompt") ? { evaluation_prompt: getVal("evaluation_prompt") } : {}),
          };
        }

        await fetch(`https://api.elevenlabs.io/v1/convai/agents/${currentAgent.el_agent_id}`, {
          method: "PATCH",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify(elBody),
        });
      }
    }

    return new Response(JSON.stringify({ agent }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
