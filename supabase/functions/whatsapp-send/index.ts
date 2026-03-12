import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";
import { decryptToken, getEncryptionKey } from "../_shared/crypto.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "whatsapp-send";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claims, error: authErr } = await supabase.auth.getUser();
    if (authErr || !claims?.user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const { phone_number_id, to, type, message, template_name, template_language, template_components } = await req.json();
    if (!phone_number_id || !to) return jsonError("phone_number_id and to are required", "validation_error", 400, rid);

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: phoneNum } = await adminClient.from("whatsapp_phone_numbers").select("company_id, waba_id").eq("phone_number_id", phone_number_id).single();
    if (!phoneNum) return jsonError("Phone number not found", "not_found", 404, rid);

    const { data: wabaConfig } = await adminClient.from("whatsapp_waba_config").select("access_token_encrypted").eq("company_id", phoneNum.company_id).eq("waba_id", phoneNum.waba_id).single();
    if (!wabaConfig?.access_token_encrypted) return jsonError("WABA not configured", "validation_error", 400, rid);

    // Decrypt the token before using it
    const encryptionKey = getEncryptionKey();
    const accessToken = await decryptToken(wabaConfig.access_token_encrypted, encryptionKey);

    let metaPayload: any = { messaging_product: "whatsapp", to };
    if (type === "template" && template_name) {
      metaPayload.type = "template";
      metaPayload.template = { name: template_name, language: { code: template_language || "it" }, components: template_components || [] };
    } else {
      metaPayload.type = "text";
      metaPayload.text = { body: message || "" };
    }

    const metaRes = await fetchWithTimeout(`https://graph.facebook.com/v21.0/${phone_number_id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(metaPayload),
    }, 15_000);

    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      log("error", "Meta API send error", { request_id: rid, fn: FN, status: metaRes.status, meta_error: metaData?.error?.message });
      return jsonError("Meta API error", "provider_error", metaRes.status, rid);
    }

    const metaMessageId = metaData.messages?.[0]?.id;
    await adminClient.from("whatsapp_messages").insert({
      company_id: phoneNum.company_id, phone_number_id, meta_message_id: metaMessageId,
      direction: "outbound", type: type === "template" ? "template" : "text",
      content: type === "template" ? { template: template_name } : { body: message },
      status: "sent", sent_at: new Date().toISOString(),
    });

    log("info", "WhatsApp message sent", { request_id: rid, fn: FN, meta_message_id: metaMessageId });
    return jsonOk({ success: true, meta_message_id: metaMessageId }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
