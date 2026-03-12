import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { decryptToken, getEncryptionKey } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

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

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { workflow_id, trigger_data, execution_id_external } = await req.json();

    if (!workflow_id) {
      return new Response(JSON.stringify({ error: "workflow_id è obbligatorio" }), { status: 400, headers: corsHeaders });
    }

    // Get company_id from profile
    const { data: profile } = await sb.from("profiles").select("company_id").eq("id", user.id).single();
    const companyId = profile?.company_id;
    if (!companyId) {
      return new Response(JSON.stringify({ error: "Nessuna azienda associata" }), { status: 403, headers: corsHeaders });
    }

    // Get n8n config — try company-level first, then platform-level
    const { data: platformConfig } = await sb
      .from("platform_config")
      .select("n8n_base_url, n8n_api_key_encrypted, n8n_configured")
      .limit(1)
      .single();

    if (!platformConfig?.n8n_configured || !platformConfig.n8n_base_url) {
      return new Response(JSON.stringify({ error: "n8n non configurato" }), { status: 404, headers: corsHeaders });
    }

    // Decrypt API key
    let apiKey = Deno.env.get("N8N_API_KEY");
    if (!apiKey && platformConfig.n8n_api_key_encrypted) {
      apiKey = await decryptToken(platformConfig.n8n_api_key_encrypted, getEncryptionKey());
    }
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "N8N API key non configurata" }), { status: 500, headers: corsHeaders });
    }

    // Idempotency key
    const idempotencyKey = execution_id_external || crypto.randomUUID();

    // Register execution in DB
    const { data: execution, error: insertErr } = await sb
      .from("n8n_executions")
      .insert({
        company_id: companyId,
        workflow_id,
        idempotency_key: idempotencyKey,
        trigger_data: trigger_data || {},
        status: "pending",
        triggered_by: user.id,
      })
      .select()
      .single();

    if (insertErr) {
      console.error("Insert execution error:", insertErr);
      return new Response(JSON.stringify({ error: "Errore salvataggio esecuzione" }), { status: 500, headers: corsHeaders });
    }

    // Trigger n8n webhook
    try {
      const webhookUrl = `${platformConfig.n8n_base_url}/webhook/${workflow_id}`;
      const n8nResponse = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-N8N-API-KEY": apiKey,
          "X-Idempotency-Key": idempotencyKey,
        },
        body: JSON.stringify({
          ...trigger_data,
          _edile_genius: {
            company_id: companyId,
            execution_db_id: execution.id,
            callback_url: `${Deno.env.get("SUPABASE_URL")}/functions/v1/n8n-execution-callback`,
            callback_token: Deno.env.get("N8N_CALLBACK_SECRET") || "",
          },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!n8nResponse.ok) {
        const errText = await n8nResponse.text();
        await sb.from("n8n_executions").update({
          status: "failed",
          error_message: `n8n HTTP ${n8nResponse.status}: ${errText.substring(0, 500)}`,
          completed_at: new Date().toISOString(),
        }).eq("id", execution.id);

        return new Response(JSON.stringify({ error: "Workflow trigger fallito", details: errText.substring(0, 200) }), { status: 502, headers: corsHeaders });
      }

      const n8nData = await n8nResponse.json().catch(() => ({}));

      // Update status to running
      await sb.from("n8n_executions").update({
        status: "running",
        n8n_execution_id: n8nData.executionId ?? null,
      }).eq("id", execution.id);

      return new Response(JSON.stringify({
        success: true,
        execution_id: execution.id,
        n8n_execution_id: n8nData.executionId ?? null,
        idempotency_key: idempotencyKey,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    } catch (err) {
      await sb.from("n8n_executions").update({
        status: "failed",
        error_message: (err as Error).message,
        completed_at: new Date().toISOString(),
      }).eq("id", execution.id);

      return new Response(JSON.stringify({ error: "Errore connessione n8n", details: (err as Error).message }), { status: 502, headers: corsHeaders });
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
