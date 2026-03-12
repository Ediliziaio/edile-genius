import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";
import { encryptToken, decryptToken, getEncryptionKey } from "../_shared/crypto.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "whatsapp-refresh-tokens";

  try {
    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const encryptionKey = getEncryptionKey();

    const { data: saConfig } = await adminClient.from("superadmin_whatsapp_config").select("meta_app_id, meta_app_secret_encrypted").limit(1).single();
    if (!saConfig?.meta_app_id || !saConfig?.meta_app_secret_encrypted) {
      return jsonError("Meta App not configured by SuperAdmin", "system_error", 500, rid);
    }

    const { data: wabaConfigs } = await adminClient.from("whatsapp_waba_config").select("id, waba_id, access_token_encrypted, company_id").not("access_token_encrypted", "is", null);
    if (!wabaConfigs || wabaConfigs.length === 0) {
      return jsonOk({ message: "No tokens to refresh", results: [] }, rid);
    }

    const results: { waba_id: string; success: boolean; error?: string }[] = [];

    for (const waba of wabaConfigs) {
      try {
        const currentToken = await decryptToken(waba.access_token_encrypted!, encryptionKey);

        // POST with secret in body, not URL query params
        const res = await fetchWithTimeout(
          "https://graph.facebook.com/v21.0/oauth/access_token",
          {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "fb_exchange_token",
              client_id: saConfig.meta_app_id,
              client_secret: saConfig.meta_app_secret_encrypted,
              fb_exchange_token: currentToken,
            }).toString(),
          },
          15_000
        );
        const data = await res.json();

        if (!res.ok || !data.access_token) {
          const errMsg = data.error?.message || JSON.stringify(data);
          log("warn", "Token refresh failed for WABA", { request_id: rid, fn: FN, waba_id: waba.waba_id, status: res.status });
          await adminClient.from("whatsapp_waba_config").update({ token_refresh_error: errMsg, updated_at: new Date().toISOString() }).eq("id", waba.id);
          results.push({ waba_id: waba.waba_id, success: false, error: errMsg });
          continue;
        }

        const newEncrypted = await encryptToken(data.access_token, encryptionKey);
        await adminClient.from("whatsapp_waba_config").update({
          access_token_encrypted: newEncrypted, token_refreshed_at: new Date().toISOString(),
          token_refresh_error: null, updated_at: new Date().toISOString(),
        }).eq("id", waba.id);

        results.push({ waba_id: waba.waba_id, success: true });
        log("info", "Token refreshed", { request_id: rid, fn: FN, waba_id: waba.waba_id });
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        log("error", "Error refreshing WABA token", { request_id: rid, fn: FN, waba_id: waba.waba_id, error: errMsg });
        await adminClient.from("whatsapp_waba_config").update({ token_refresh_error: errMsg, updated_at: new Date().toISOString() }).eq("id", waba.id);
        results.push({ waba_id: waba.waba_id, success: false, error: errMsg });
      }
    }

    log("info", "Token refresh completed", { request_id: rid, fn: FN, total: results.length, refreshed: results.filter(r => r.success).length });
    return jsonOk({ message: `Processed ${results.length} tokens`, refreshed: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, results }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
