import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithRetry, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "whatsapp-templates-sync";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: authErr } = await supabase.auth.getUser();
    if (authErr || !claims?.user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const { company_id, waba_id } = await req.json();
    if (!company_id || !waba_id) return jsonError("company_id and waba_id required", "validation_error", 400, rid);

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: wabaConfig } = await adminClient.from("whatsapp_waba_config").select("access_token_encrypted").eq("company_id", company_id).eq("waba_id", waba_id).single();
    if (!wabaConfig?.access_token_encrypted) return jsonError("WABA not configured", "validation_error", 400, rid);

    // Read-only GET — safe to retry
    const metaRes = await fetchWithRetry(
      `https://graph.facebook.com/v21.0/${waba_id}/message_templates?limit=100`,
      { headers: { Authorization: `Bearer ${wabaConfig.access_token_encrypted}` } },
      15_000,
      { maxRetries: 1 }
    );

    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      log("error", "Meta templates API error", { request_id: rid, fn: FN, status: metaRes.status });
      return jsonError("Meta API error", "provider_error", metaRes.status, rid);
    }

    const templates = (metaData.data || []).map((t: any) => ({
      company_id, meta_template_id: t.id, name: t.name, category: t.category,
      language: t.language, status: t.status, components: t.components || [],
      rejection_reason: t.rejected_reason || null,
    }));

    if (templates.length > 0) {
      const { error } = await adminClient.from("whatsapp_templates").upsert(templates, { onConflict: "company_id,name,language" });
      if (error) return jsonError(error.message, "system_error", 500, rid);
    }

    log("info", "Templates synced", { request_id: rid, fn: FN, count: templates.length });
    return jsonOk({ success: true, synced: templates.length }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
