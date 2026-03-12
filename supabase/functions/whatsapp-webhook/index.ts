import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log } from "../_shared/utils.ts";
import { decryptToken, getEncryptionKey } from "../_shared/crypto.ts";

// ── HMAC SHA-256 verification for Meta webhooks ──
async function verifySignature(rawBody: string, signatureHeader: string | null, appSecret: string): Promise<boolean> {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expectedSig = signatureHeader.slice(7);
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", encoder.encode(appSecret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computedHex = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
  if (computedHex.length !== expectedSig.length) return false;
  const a = encoder.encode(computedHex);
  const b = encoder.encode(expectedSig);
  return crypto.subtle.timingSafeEqual(a, b);
}

// ── Download media from Meta and save to Supabase Storage ──
async function downloadAndStoreMedia(
  mediaId: string, accessToken: string, companyId: string, supabase: any
): Promise<{ url: string; mimeType: string } | null> {
  try {
    // 1. Get media URL from Meta
    const metaRes = await fetch(`https://graph.facebook.com/v21.0/${mediaId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!metaRes.ok) return null;
    const metaData = await metaRes.json();
    const mediaUrl = metaData.url;
    const mimeType = metaData.mime_type || "application/octet-stream";

    // 2. Download the actual media
    const mediaRes = await fetch(mediaUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!mediaRes.ok) return null;
    const mediaBlob = await mediaRes.arrayBuffer();

    // 3. Determine file extension
    const extMap: Record<string, string> = {
      "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp",
      "video/mp4": "mp4", "video/3gpp": "3gp",
      "audio/ogg": "ogg", "audio/mpeg": "mp3", "audio/aac": "aac",
      "application/pdf": "pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    };
    const ext = extMap[mimeType] || "bin";
    const filePath = `${companyId}/${mediaId}.${ext}`;

    // 4. Upload to Supabase Storage
    const { error: uploadErr } = await supabase.storage
      .from("whatsapp-media")
      .upload(filePath, new Uint8Array(mediaBlob), { contentType: mimeType, upsert: true });
    if (uploadErr) {
      log("error", "Failed to upload media", { mediaId, error: uploadErr.message });
      return null;
    }

    return { url: filePath, mimeType };
  } catch (err) {
    log("error", "Media download error", { mediaId, error: err instanceof Error ? err.message : "unknown" });
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "whatsapp-webhook";

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

  try {
    const url = new URL(req.url);

    // GET — Meta webhook verification
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");
      const { data: config } = await supabase.from("superadmin_whatsapp_config").select("webhook_verify_token").limit(1).single();
      if (mode === "subscribe" && token === config?.webhook_verify_token) {
        log("info", "Webhook verified", { request_id: rid, fn: FN });
        return new Response(challenge, { status: 200, headers: corsHeaders });
      }
      log("warn", "Webhook verification failed", { request_id: rid, fn: FN });
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // POST — Process Meta webhook events
    if (req.method === "POST") {
      const rawBody = await req.text();

      // HMAC signature verification is MANDATORY
      const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
      if (!appSecret) {
        log("error", "WHATSAPP_APP_SECRET not set — rejecting webhook", { request_id: rid, fn: FN });
        return new Response("Server misconfigured", { status: 500, headers: corsHeaders });
      }

      const sigHeader = req.headers.get("x-hub-signature-256");
      const valid = await verifySignature(rawBody, sigHeader, appSecret);
      if (!valid) {
        log("warn", "HMAC signature verification failed", { request_id: rid, fn: FN });
        return new Response("Forbidden", { status: 403, headers: corsHeaders });
      }

      const payload = JSON.parse(rawBody);
      let messagesProcessed = 0;
      let statusesProcessed = 0;

      for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value;

          if (value?.messages) {
            for (const msg of value.messages) {
              const phoneNumberId = value.metadata?.phone_number_id;
              if (!phoneNumberId) continue;

              // Idempotency check
              if (msg.id) {
                const { data: existing } = await supabase
                  .from("whatsapp_messages")
                  .select("id")
                  .eq("meta_message_id", msg.id)
                  .maybeSingle();
                if (existing) {
                  log("info", "Duplicate message skipped", { request_id: rid, fn: FN, meta_message_id: msg.id });
                  continue;
                }
              }

              const { data: phoneNum } = await supabase.from("whatsapp_phone_numbers").select("company_id, waba_id").eq("phone_number_id", phoneNumberId).single();
              if (!phoneNum) {
                log("warn", "Unknown phone number in webhook", { request_id: rid, fn: FN, phone_number_id: phoneNumberId });
                continue;
              }

              const contactPhone = msg.from;
              const now = new Date().toISOString();

              // Upsert whatsapp_contacts with last_inbound_at
              await supabase.from("whatsapp_contacts").upsert({
                company_id: phoneNum.company_id,
                phone_number: contactPhone,
                last_inbound_at: now,
                last_message_at: now,
                display_name: value.contacts?.[0]?.profile?.name || null,
              }, { onConflict: "company_id,phone_number", ignoreDuplicates: false });

              // Upsert conversation
              const windowExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
              const { data: conv } = await supabase.from("whatsapp_conversations").upsert({
                company_id: phoneNum.company_id, phone_number_id: phoneNumberId,
                contact_phone: contactPhone, status: "open",
                last_message_at: now, unread_count: 1,
                window_expires_at: windowExpiry,
              }, { onConflict: "company_id,phone_number_id,contact_phone", ignoreDuplicates: false }).select("id").single();

              // Handle media download
              let mediaUrl: string | null = null;
              let mediaType: string | null = null;
              let content: any = msg;

              const mediaTypes = ["image", "video", "audio", "document", "sticker"];
              if (mediaTypes.includes(msg.type) && msg[msg.type]?.id) {
                // Get access token for media download
                try {
                  const { data: wabaConfig } = await supabase
                    .from("whatsapp_waba_config")
                    .select("access_token_encrypted")
                    .eq("company_id", phoneNum.company_id)
                    .eq("waba_id", phoneNum.waba_id)
                    .single();

                  if (wabaConfig?.access_token_encrypted) {
                    const encKey = getEncryptionKey();
                    const token = await decryptToken(wabaConfig.access_token_encrypted, encKey);
                    const result = await downloadAndStoreMedia(msg[msg.type].id, token, phoneNum.company_id, supabase);
                    if (result) {
                      mediaUrl = result.url;
                      mediaType = msg.type;
                    }
                  }
                } catch (e) {
                  log("warn", "Media download failed, storing without media", { request_id: rid, fn: FN });
                }
                content = { caption: msg[msg.type]?.caption || null, mime_type: msg[msg.type]?.mime_type || null };
              } else if (msg.type === "text") {
                content = { body: msg.text?.body };
              } else if (msg.type === "location") {
                content = { latitude: msg.location?.latitude, longitude: msg.location?.longitude, name: msg.location?.name, address: msg.location?.address };
              } else if (msg.type === "reaction") {
                content = { emoji: msg.reaction?.emoji, message_id: msg.reaction?.message_id };
              } else if (msg.type === "interactive") {
                content = msg.interactive;
              } else if (msg.type === "button") {
                content = { text: msg.button?.text, payload: msg.button?.payload };
              }

              await supabase.from("whatsapp_messages").insert({
                company_id: phoneNum.company_id, phone_number_id: phoneNumberId,
                conversation_id: conv?.id, meta_message_id: msg.id,
                direction: "inbound", type: msg.type || "text",
                content, media_url: mediaUrl, media_type: mediaType,
                status: "delivered", sent_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
              });
              messagesProcessed++;
            }
          }

          if (value?.statuses) {
            for (const status of value.statuses) {
              const updateData: Record<string, any> = { status: status.status };
              if (status.status === "delivered") updateData.delivered_at = new Date().toISOString();
              if (status.status === "read") updateData.read_at = new Date().toISOString();
              if (status.errors?.length) {
                updateData.error_code = status.errors[0].code;
                updateData.error_message = status.errors[0].title;
              }
              await supabase.from("whatsapp_messages").update(updateData).eq("meta_message_id", status.id);
              statusesProcessed++;
            }
          }
        }
      }

      log("info", "Webhook processed", { request_id: rid, fn: FN, messages: messagesProcessed, statuses: statusesProcessed });
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (err) {
    log("error", "Webhook error", { request_id: rid, fn: FN, error: err instanceof Error ? err.message : "unknown" });
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
