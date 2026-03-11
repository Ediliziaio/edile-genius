import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log } from "../_shared/utils.ts";

// ── HMAC SHA-256 verification for Meta webhooks ──
async function verifySignature(
  rawBody: string,
  signatureHeader: string | null,
  appSecret: string
): Promise<boolean> {
  if (!signatureHeader || !signatureHeader.startsWith("sha256=")) return false;
  const expectedSig = signatureHeader.slice(7); // remove "sha256=" prefix

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(appSecret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const computedHex = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // Timing-safe comparison
  if (computedHex.length !== expectedSig.length) return false;
  const a = encoder.encode(computedHex);
  const b = encoder.encode(expectedSig);
  return crypto.subtle.timingSafeEqual(a, b);
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
      // Read raw body for signature verification
      const rawBody = await req.text();

      // Verify X-Hub-Signature-256
      const appSecret = Deno.env.get("WHATSAPP_APP_SECRET");
      if (appSecret) {
        const sigHeader = req.headers.get("x-hub-signature-256");
        const valid = await verifySignature(rawBody, sigHeader, appSecret);
        if (!valid) {
          log("warn", "HMAC signature verification failed", { request_id: rid, fn: FN });
          return new Response("Forbidden", { status: 403, headers: corsHeaders });
        }
      } else {
        log("warn", "WHATSAPP_APP_SECRET not set — skipping signature verification", { request_id: rid, fn: FN });
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

              const { data: phoneNum } = await supabase.from("whatsapp_phone_numbers").select("company_id").eq("phone_number_id", phoneNumberId).single();
              if (!phoneNum) {
                log("warn", "Unknown phone number in webhook", { request_id: rid, fn: FN, phone_number_id: phoneNumberId });
                continue;
              }

              const contactPhone = msg.from;
              const { data: conv } = await supabase.from("whatsapp_conversations").upsert({
                company_id: phoneNum.company_id, phone_number_id: phoneNumberId,
                contact_phone: contactPhone, status: "open",
                last_message_at: new Date().toISOString(), unread_count: 1,
              }, { onConflict: "company_id,phone_number_id,contact_phone", ignoreDuplicates: false }).select("id").single();

              await supabase.from("whatsapp_messages").insert({
                company_id: phoneNum.company_id, phone_number_id: phoneNumberId,
                conversation_id: conv?.id, meta_message_id: msg.id,
                direction: "inbound", type: msg.type || "text",
                content: msg.text ? { body: msg.text.body } : msg,
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
    // Always 200 to Meta to avoid retries
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
