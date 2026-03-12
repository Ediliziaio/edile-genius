import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";
import { encryptToken, decryptToken, getEncryptionKey } from "../_shared/crypto.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "whatsapp-connect-number";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: authErr } = await supabase.auth.getUser();
    if (authErr || !claims?.user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const { company_id, user_access_token, waba_id, phone_number_id, display_phone_number, display_name } = await req.json();
    if (!company_id || !user_access_token || !waba_id || !phone_number_id) {
      return jsonError("Missing required fields: company_id, user_access_token, waba_id, phone_number_id", "validation_error", 400, rid);
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // 1. Get Meta app config
    const { data: saConfig } = await adminClient.from("superadmin_whatsapp_config").select("meta_app_id, meta_app_secret_encrypted").limit(1).single();
    if (!saConfig?.meta_app_id || !saConfig?.meta_app_secret_encrypted) {
      return jsonError("Meta App not configured by SuperAdmin", "system_error", 500, rid);
    }

    // 2. Decrypt app secret before sending to Meta
    const encryptionKey = getEncryptionKey();
    let appSecret: string;
    try {
      appSecret = await decryptToken(saConfig.meta_app_secret_encrypted, encryptionKey);
    } catch (decryptErr) {
      log("error", "Failed to decrypt app secret", { request_id: rid, fn: FN, error: decryptErr instanceof Error ? decryptErr.message : String(decryptErr) });
      return jsonError("Impossibile decriptare app secret. Riconfigura la connessione WhatsApp.", "system_error", 500, rid);
    }

    // 3. Exchange for long-lived token via POST (secret in body, not URL)
    const tokenExchangeRes = await fetchWithTimeout(
      "https://graph.facebook.com/v21.0/oauth/access_token",
      {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "fb_exchange_token",
          client_id: saConfig.meta_app_id,
          client_secret: appSecret,
          fb_exchange_token: user_access_token,
        }).toString(),
      },
      15_000
    );
    const tokenData = await tokenExchangeRes.json();
    if (!tokenExchangeRes.ok || !tokenData.access_token) {
      log("error", "Token exchange failed", { request_id: rid, fn: FN, status: tokenExchangeRes.status });
      return jsonError("Token exchange failed", "provider_error", 400, rid);
    }

    const longLivedToken = tokenData.access_token;

    // 3. Encrypt token
    const encryptionKey = getEncryptionKey();
    const storedToken = await encryptToken(longLivedToken, encryptionKey);

    // 4. Fetch phone number details
    let phoneDetails: any = {};
    try {
      const phoneRes = await fetchWithTimeout(
        `https://graph.facebook.com/v21.0/${phone_number_id}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier,name_status,certificate`,
        { headers: { Authorization: `Bearer ${longLivedToken}` } }, 15_000
      );
      if (phoneRes.ok) phoneDetails = await phoneRes.json();
    } catch (e) {
      log("warn", "Failed to fetch phone details (non-blocking)", { request_id: rid, fn: FN, error: e instanceof Error ? e.message : "unknown" });
    }

    // 5. Fetch WABA business info
    let wabaDetails: any = {};
    try {
      const wabaRes = await fetchWithTimeout(
        `https://graph.facebook.com/v21.0/${waba_id}?fields=name,owner_business_info`,
        { headers: { Authorization: `Bearer ${longLivedToken}` } }, 15_000
      );
      if (wabaRes.ok) wabaDetails = await wabaRes.json();
    } catch (e) {
      log("warn", "Failed to fetch WABA details (non-blocking)", { request_id: rid, fn: FN, error: e instanceof Error ? e.message : "unknown" });
    }

    // 6. Upsert WABA config
    const { error: wabaErr } = await adminClient.from("whatsapp_waba_config").upsert({
      company_id, waba_id, business_name: wabaDetails.name || display_name || null,
      business_id: wabaDetails.owner_business_info?.id || null,
      access_token_encrypted: storedToken, meta_verified: true, meta_verification_status: "verified",
    }, { onConflict: "waba_id" });

    if (wabaErr) {
      log("error", "WABA config upsert error", { request_id: rid, fn: FN, error: wabaErr.message });
      return jsonError("Failed to save WABA config", "system_error", 500, rid);
    }

    // 7. Insert phone number
    const { error: phoneErr } = await adminClient.from("whatsapp_phone_numbers").upsert({
      company_id, waba_id, phone_number_id,
      display_phone_number: phoneDetails.display_phone_number || display_phone_number || phone_number_id,
      display_name: phoneDetails.verified_name || display_name || "WhatsApp Number",
      verified_name: phoneDetails.verified_name || null,
      quality_rating: phoneDetails.quality_rating || "UNKNOWN",
      messaging_limit_tier: phoneDetails.messaging_limit_tier || null,
      name_status: phoneDetails.name_status || "PENDING",
      certificate: phoneDetails.certificate || null,
      status: "CONNECTED", webhook_verified: false,
    }, { onConflict: "phone_number_id" });

    if (phoneErr) {
      log("error", "Phone number insert error", { request_id: rid, fn: FN, error: phoneErr.message });
      return jsonError("Failed to save phone number", "system_error", 500, rid);
    }

    // 8. Register webhook (optional, non-blocking)
    try {
      const { data: saFullConfig } = await adminClient.from("superadmin_whatsapp_config").select("webhook_url, webhook_verify_token").limit(1).single();
      if (saFullConfig?.webhook_url) {
        const webhookRes = await fetchWithTimeout(`https://graph.facebook.com/v21.0/${waba_id}/subscribed_apps`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${longLivedToken}` },
        }, 15_000);
        const webhookData = await webhookRes.json();
        if (webhookRes.ok && webhookData.success) {
          await adminClient.from("whatsapp_phone_numbers").update({ webhook_verified: true }).eq("phone_number_id", phone_number_id);
        }
      }
    } catch (e) {
      log("warn", "Webhook subscription failed (non-blocking)", { request_id: rid, fn: FN, error: e instanceof Error ? e.message : "unknown" });
    }

    log("info", "WhatsApp number connected", { request_id: rid, fn: FN, phone_number_id, waba_id });
    return jsonOk({ success: true, phone_number_id, waba_id, display_phone_number: phoneDetails.display_phone_number || display_phone_number }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
