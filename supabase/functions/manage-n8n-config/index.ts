import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, getEncryptionKey } from "../_shared/crypto.ts";

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

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Check superadmin role
    const userId = user.id;
    const { data: roleCheck } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["superadmin", "superadmin_user"])
      .limit(1);

    if (!roleCheck || roleCheck.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { action } = body;

    // GET STATUS
    if (action === "get_status") {
      const { data: config } = await serviceClient
        .from("platform_config")
        .select("n8n_configured, n8n_base_url, n8n_api_key_set, n8n_tested_at, n8n_workflows_count")
        .limit(1)
        .single();

      return new Response(JSON.stringify({ config }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // SAVE CONFIG
    if (action === "save_config") {
      const { base_url, api_key } = body;

      if (!base_url || typeof base_url !== "string") {
        return new Response(JSON.stringify({ error: "base_url is required" }), { status: 400, headers: corsHeaders });
      }

      // Validate URL format
      try {
        new URL(base_url);
      } catch {
        return new Response(JSON.stringify({ error: "Invalid base_url format" }), { status: 400, headers: corsHeaders });
      }

      const cleanUrl = base_url.replace(/\/+$/, "");

      // If API key provided, validate connection first
      if (api_key && typeof api_key === "string" && api_key.trim().length > 0) {
        try {
          const testResponse = await fetch(`${cleanUrl}/api/v1/workflows?limit=1`, {
            headers: { "X-N8N-API-KEY": api_key, "Accept": "application/json" },
            signal: AbortSignal.timeout(5000),
          });
          if (!testResponse.ok) {
            return new Response(JSON.stringify({
              error: "Impossibile raggiungere n8n. Verifica URL e API key.",
              details: `n8n returned ${testResponse.status}`,
            }), { status: 422, headers: corsHeaders });
          }
        } catch (err) {
          return new Response(JSON.stringify({
            error: "Impossibile raggiungere n8n. Verifica URL e API key.",
            details: (err as Error).message,
          }), { status: 422, headers: corsHeaders });
        }

        // Encrypt the API key before saving
        const encryptionKey = getEncryptionKey();
        const encryptedKey = await encryptToken(api_key.trim(), encryptionKey);

        await serviceClient
          .from("platform_config")
          .update({
            n8n_base_url: cleanUrl,
            n8n_configured: true,
            n8n_api_key_set: true,
            n8n_api_key_encrypted: encryptedKey,
            updated_by: userId,
          })
          .neq("id", "00000000-0000-0000-0000-000000000000");
      } else {
        // Only update URL, keep existing key
        await serviceClient
          .from("platform_config")
          .update({
            n8n_base_url: cleanUrl,
            n8n_configured: true,
            updated_by: userId,
          })
          .neq("id", "00000000-0000-0000-0000-000000000000");
      }

      return new Response(JSON.stringify({ success: true, message: "Configurazione n8n salvata" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // TEST CONNECTION
    if (action === "test_connection") {
      const { base_url, api_key } = body;

      if (!base_url) {
        return new Response(JSON.stringify({ error: "base_url is required" }), { status: 400, headers: corsHeaders });
      }

      // Use provided api_key or fall back to Supabase secret
      const effectiveKey = api_key || Deno.env.get("N8N_API_KEY");
      if (!effectiveKey) {
        return new Response(JSON.stringify({ error: "API key not provided and N8N_API_KEY secret not set" }), { status: 400, headers: corsHeaders });
      }

      const cleanUrl = base_url.replace(/\/+$/, "");

      try {
        const response = await fetch(`${cleanUrl}/api/v1/workflows?limit=100`, {
          headers: { "X-N8N-API-KEY": effectiveKey, "Accept": "application/json" },
          signal: AbortSignal.timeout(5000),
        });

        if (!response.ok) {
          const errText = await response.text();
          await serviceClient
            .from("platform_config")
            .update({ n8n_configured: false, n8n_tested_at: new Date().toISOString(), updated_by: userId })
            .neq("id", "00000000-0000-0000-0000-000000000000");

          return new Response(JSON.stringify({
            error: `N8N API returned ${response.status}`,
            details: errText.substring(0, 200),
          }), { status: 400, headers: corsHeaders });
        }

        const data = await response.json();
        const workflowsCount = data?.data?.length ?? 0;

        await serviceClient
          .from("platform_config")
          .update({
            n8n_configured: true,
            n8n_base_url: cleanUrl,
            n8n_api_key_set: true,
            n8n_tested_at: new Date().toISOString(),
            n8n_workflows_count: workflowsCount,
            updated_by: userId,
          })
          .neq("id", "00000000-0000-0000-0000-000000000000");

        return new Response(JSON.stringify({ success: true, workflows_count: workflowsCount }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (fetchErr) {
        return new Response(JSON.stringify({
          error: "Connection failed",
          details: (fetchErr as Error).message,
        }), { status: 400, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
