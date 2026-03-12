import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";
import { decryptToken, getEncryptionKey } from "../_shared/crypto.ts";

const WINDOW_24H_MS = 24 * 60 * 60 * 1000;

async function fetchWithRetry(url: string, opts: RequestInit, timeoutMs: number, maxRetries = 2): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetchWithTimeout(url, opts, timeoutMs);
    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = parseInt(res.headers.get("retry-after") || "5", 10);
      await new Promise(r => setTimeout(r, Math.min(retryAfter, 30) * 1000));
      continue;
    }
    return res;
  }
  throw new Error("Max retries exceeded");
}

function buildMetaPayload(params: {
  to: string; type: string; message?: string;
  template_name?: string; template_language?: string; template_components?: any[];
  image_url?: string; document_url?: string; document_filename?: string;
  audio_url?: string; caption?: string;
  latitude?: number; longitude?: number; location_name?: string; location_address?: string;
  reaction_emoji?: string; reaction_message_id?: string;
  interactive?: any;
}): any {
  const payload: any = { messaging_product: "whatsapp", to: params.to };

  switch (params.type) {
    case "template":
      payload.type = "template";
      payload.template = {
        name: params.template_name,
        language: { code: params.template_language || "it" },
        components: params.template_components || [],
      };
      break;
    case "image":
      payload.type = "image";
      payload.image = { link: params.image_url, ...(params.caption ? { caption: params.caption } : {}) };
      break;
    case "document":
      payload.type = "document";
      payload.document = { link: params.document_url, ...(params.document_filename ? { filename: params.document_filename } : {}), ...(params.caption ? { caption: params.caption } : {}) };
      break;
    case "audio":
      payload.type = "audio";
      payload.audio = { link: params.audio_url };
      break;
    case "location":
      payload.type = "location";
      payload.location = { latitude: params.latitude, longitude: params.longitude, name: params.location_name || "", address: params.location_address || "" };
      break;
    case "reaction":
      payload.type = "reaction";
      payload.reaction = { message_id: params.reaction_message_id, emoji: params.reaction_emoji };
      break;
    case "interactive":
      payload.type = "interactive";
      payload.interactive = params.interactive;
      break;
    default: // text
      payload.type = "text";
      payload.text = { body: params.message || "" };
      break;
  }
  return payload;
}

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

    const body = await req.json();
    const { phone_number_id, to, type = "text" } = body;
    if (!phone_number_id || !to) return jsonError("phone_number_id and to are required", "validation_error", 400, rid);

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: phoneNum } = await adminClient.from("whatsapp_phone_numbers").select("company_id, waba_id").eq("phone_number_id", phone_number_id).single();
    if (!phoneNum) return jsonError("Phone number not found", "not_found", 404, rid);

    // ── 24h Window Check (only for non-template messages) ──
    if (type !== "template") {
      const { data: waContact } = await adminClient
        .from("whatsapp_contacts")
        .select("last_inbound_at")
        .eq("company_id", phoneNum.company_id)
        .eq("phone_number", to)
        .single();

      if (!waContact?.last_inbound_at) {
        return jsonError(
          "Nessun messaggio inbound da questo contatto. Usa un template per iniziare la conversazione.",
          "window_closed", 422, rid
        );
      }

      const lastInbound = new Date(waContact.last_inbound_at).getTime();
      if (Date.now() - lastInbound > WINDOW_24H_MS) {
        return jsonError(
          "Finestra 24h scaduta. Usa un template per riaprire la conversazione.",
          "window_closed", 422, rid
        );
      }
    }

    const { data: wabaConfig } = await adminClient.from("whatsapp_waba_config").select("access_token_encrypted").eq("company_id", phoneNum.company_id).eq("waba_id", phoneNum.waba_id).single();
    if (!wabaConfig?.access_token_encrypted) return jsonError("WABA not configured", "validation_error", 400, rid);

    const encryptionKey = getEncryptionKey();
    const accessToken = await decryptToken(wabaConfig.access_token_encrypted, encryptionKey);

    const metaPayload = buildMetaPayload({ to, type, ...body });

    const metaRes = await fetchWithRetry(
      `https://graph.facebook.com/v21.0/${phone_number_id}/messages`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify(metaPayload),
      },
      15_000
    );

    const metaData = await metaRes.json();
    if (!metaRes.ok) {
      log("error", "Meta API send error", { request_id: rid, fn: FN, status: metaRes.status, meta_error: metaData?.error?.message });
      return jsonError(metaData?.error?.message || "Meta API error", "provider_error", metaRes.status, rid);
    }

    const metaMessageId = metaData.messages?.[0]?.id;

    // Determine content and media fields for DB
    let dbContent: any = {};
    let mediaUrl: string | null = null;
    let mediaType: string | null = null;

    switch (type) {
      case "template": dbContent = { template: body.template_name }; break;
      case "image": dbContent = { caption: body.caption }; mediaUrl = body.image_url; mediaType = "image"; break;
      case "document": dbContent = { filename: body.document_filename }; mediaUrl = body.document_url; mediaType = "document"; break;
      case "audio": mediaUrl = body.audio_url; mediaType = "audio"; break;
      case "location": dbContent = { latitude: body.latitude, longitude: body.longitude, name: body.location_name }; break;
      case "reaction": dbContent = { emoji: body.reaction_emoji, message_id: body.reaction_message_id }; break;
      case "interactive": dbContent = body.interactive; break;
      default: dbContent = { body: body.message }; break;
    }

    await adminClient.from("whatsapp_messages").insert({
      company_id: phoneNum.company_id, phone_number_id, meta_message_id: metaMessageId,
      direction: "outbound", type: type === "template" ? "template" : type,
      content: dbContent, media_url: mediaUrl, media_type: mediaType,
      status: "sent", sent_at: new Date().toISOString(),
    });

    // Update last_message_at on whatsapp_contacts
    await adminClient.from("whatsapp_contacts").upsert({
      company_id: phoneNum.company_id, phone_number: to,
      last_message_at: new Date().toISOString(),
    }, { onConflict: "company_id,phone_number", ignoreDuplicates: false });

    log("info", "WhatsApp message sent", { request_id: rid, fn: FN, type, meta_message_id: metaMessageId });
    return jsonOk({ success: true, meta_message_id: metaMessageId }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
