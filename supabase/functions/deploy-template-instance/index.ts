import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;

    const { instanceId } = await req.json();
    if (!instanceId) {
      return new Response(JSON.stringify({ error: "instanceId required" }), { status: 400, headers: corsHeaders });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Load instance + template
    const { data: instance, error: instErr } = await serviceClient
      .from("agent_template_instances")
      .select("*")
      .eq("id", instanceId)
      .single();

    if (instErr || !instance) {
      return new Response(JSON.stringify({ error: "Instance not found" }), { status: 404, headers: corsHeaders });
    }

    // Tenant verification
    const { data: profile } = await serviceClient.from("profiles").select("company_id").eq("id", userId).single();
    const { data: roles } = await serviceClient.from("user_roles").select("role").eq("user_id", userId);
    const isSA = (roles || []).some((r: any) => r.role === "superadmin" || r.role === "superadmin_user");
    if (!isSA && profile?.company_id !== instance.company_id) {
      return new Response(JSON.stringify({ error: "Forbidden: cross-tenant access" }), { status: 403, headers: corsHeaders });
    }

    const { data: template, error: tplErr } = await serviceClient
      .from("agent_templates")
      .select("*")
      .eq("id", instance.template_id)
      .single();

    if (tplErr || !template) {
      return new Response(JSON.stringify({ error: "Template not found" }), { status: 404, headers: corsHeaders });
    }

    const cfg = (instance.config_values || {}) as Record<string, any>;

    // Derive agent type from template channel
    const VALID_AGENT_TYPES = ["vocal", "render", "whatsapp", "operative"];
    const channels = (template.channel || []) as string[];
    const derivedType = channels.includes("whatsapp") ? "whatsapp"
      : channels.includes("render") ? "render"
      : channels.includes("operative") ? "operative"
      : "vocal";
    const agentType = VALID_AGENT_TYPES.includes(cfg.agent_type) ? cfg.agent_type : derivedType;

    // 2. Resolve prompt variables
    let resolvedPrompt = (template.prompt_template || "")
      .replace(/\{\{NOME_AZIENDA\}\}/g, cfg.nome_azienda || "")
      .replace(/\{\{SETTORE\}\}/g, cfg.settore || "")
      .replace(/\{\{CANALE\}\}/g, cfg.canale_operai || "WhatsApp")
      .replace(/\{\{NOME_RESPONSABILE\}\}/g, ((instance.recipients as any[]) || [])[0]?.name || "il titolare");

    let firstMsg = (template.first_message_template || "")
      .replace(/\{\{NOME_AZIENDA\}\}/g, cfg.nome_azienda || "")
      .replace(/\{\{NOME_CANTIERE\}\}/g, "")
      .replace(/\{\{NOME_CAPOCANTIERE\}\}/g, "");

    // 3. Create ElevenLabs agent
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    let el_agent_id: string | null = null;

    if (apiKey) {
      try {
        const elResponse = await fetch("https://api.elevenlabs.io/v1/convai/agents/create", {
          method: "POST",
          headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: instance.name,
            conversation_config: {
              agent: {
                prompt: { prompt: resolvedPrompt, llm: "gemini-2.0-flash", temperature: 0.7 },
                first_message: firstMsg,
                language: cfg.lingua_report === "English" ? "en" : "it",
              },
              tts: { voice_id: "pNInz6obpgDQGcFmaJgB" },
            },
          }),
        });

        if (elResponse.ok) {
          const elData = await elResponse.json();
          el_agent_id = elData.agent_id;
        } else {
          console.error("ElevenLabs error:", await elResponse.text());
        }
      } catch (e) {
        console.error("ElevenLabs API failed:", e);
      }
    }

    // 4. Insert agent
    const { data: agent, error: agentErr } = await serviceClient
      .from("agents")
      .insert({
        company_id: instance.company_id,
        el_agent_id,
        name: instance.name,
        system_prompt: resolvedPrompt,
        first_message: firstMsg,
        status: "active",
        llm_model: "gemini-2.0-flash",
        use_case: template.slug,
        type: agentType,
        created_by: userId,
      })
      .select()
      .single();

    if (agentErr) {
      return new Response(JSON.stringify({ error: agentErr.message }), { status: 500, headers: corsHeaders });
    }

    // 5. n8n workflow (optional)
    let n8nWorkflowId: string | null = null;
    const n8nUrl = Deno.env.get("N8N_BASE_URL");
    const n8nApiKey = Deno.env.get("N8N_API_KEY");

    if (n8nUrl && n8nApiKey && template.n8n_workflow_json) {
      try {
        const wfRes = await fetch(`${n8nUrl}/api/v1/workflows`, {
          method: "POST",
          headers: { "X-N8N-API-KEY": n8nApiKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            name: `[edilizia.io] ${cfg.nome_azienda || ""} — ${template.name}`,
            active: false,
            ...(template.n8n_workflow_json as object),
          }),
        });

        if (wfRes.ok) {
          const wfData = await wfRes.json();
          n8nWorkflowId = wfData.id;

          // Activate
          await fetch(`${n8nUrl}/api/v1/workflows/${n8nWorkflowId}/activate`, {
            method: "POST",
            headers: { "X-N8N-API-KEY": n8nApiKey },
          });
        } else {
          console.error("n8n workflow creation failed:", await wfRes.text());
        }
      } catch (e) {
        console.error("n8n API failed:", e);
      }
    } else {
      console.log("n8n not configured, skipping workflow creation");
    }

    // 6. Update instance
    await serviceClient
      .from("agent_template_instances")
      .update({
        agent_id: agent.id,
        status: "active",
        n8n_workflow_id: n8nWorkflowId,
        n8n_workflow_active: !!n8nWorkflowId,
      })
      .eq("id", instanceId);

    // 7. Increment installs_count
    await serviceClient.rpc("increment_installs_count" as any, { tpl_id: template.id } as any).catch(async () => {
      // Fallback: direct update
      await serviceClient
        .from("agent_templates")
        .update({ installs_count: (template.installs_count || 0) + 1 })
        .eq("id", template.id);
    });

    // 8. Audit log
    await serviceClient.from("ai_audit_log").insert({
      company_id: instance.company_id,
      user_id: user.id,
      action: "template_deployed",
      entity_type: "agent",
      entity_id: agent.id,
      details: { template_slug: template.slug, n8n_workflow_id: n8nWorkflowId },
    });

    return new Response(
      JSON.stringify({ success: true, agentId: agent.id, el_agent_id, n8nWorkflowId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: corsHeaders });
  }
});
