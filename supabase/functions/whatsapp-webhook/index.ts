import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const url = new URL(req.url);

    // GET — Meta webhook verification
    if (req.method === "GET") {
      const mode = url.searchParams.get("hub.mode");
      const token = url.searchParams.get("hub.verify_token");
      const challenge = url.searchParams.get("hub.challenge");

      const { data: config } = await supabase
        .from("superadmin_whatsapp_config")
        .select("webhook_verify_token")
        .limit(1)
        .single();

      if (mode === "subscribe" && token === config?.webhook_verify_token) {
        return new Response(challenge, { status: 200, headers: corsHeaders });
      }
      return new Response("Forbidden", { status: 403, headers: corsHeaders });
    }

    // POST — Process Meta webhook events
    if (req.method === "POST") {
      const payload = await req.json();

      for (const entry of payload.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value;

          // Inbound messages
          if (value?.messages) {
            for (const msg of value.messages) {
              const phoneNumberId = value.metadata?.phone_number_id;
              if (!phoneNumberId) continue;

              // Find the company that owns this phone number
              const { data: phoneNum } = await supabase
                .from("whatsapp_phone_numbers")
                .select("company_id")
                .eq("phone_number_id", phoneNumberId)
                .single();

              if (!phoneNum) continue;

              // Upsert conversation
              const contactPhone = msg.from;
              const { data: conv } = await supabase
                .from("whatsapp_conversations")
                .upsert({
                  company_id: phoneNum.company_id,
                  phone_number_id: phoneNumberId,
                  contact_phone: contactPhone,
                  status: "open",
                  last_message_at: new Date().toISOString(),
                  unread_count: 1,
                }, { onConflict: "company_id,phone_number_id,contact_phone", ignoreDuplicates: false })
                .select("id")
                .single();

              // Save message
              await supabase.from("whatsapp_messages").insert({
                company_id: phoneNum.company_id,
                phone_number_id: phoneNumberId,
                conversation_id: conv?.id,
                meta_message_id: msg.id,
                direction: "inbound",
                type: msg.type || "text",
                content: msg.text ? { body: msg.text.body } : msg,
                status: "delivered",
                sent_at: new Date(parseInt(msg.timestamp) * 1000).toISOString(),
              });
            }
          }

          // Status updates (sent/delivered/read/failed)
          if (value?.statuses) {
            for (const status of value.statuses) {
              const updateData: Record<string, any> = { status: status.status };
              if (status.status === "delivered") updateData.delivered_at = new Date().toISOString();
              if (status.status === "read") updateData.read_at = new Date().toISOString();
              if (status.errors?.length) {
                updateData.error_code = status.errors[0].code;
                updateData.error_message = status.errors[0].title;
              }

              await supabase
                .from("whatsapp_messages")
                .update(updateData)
                .eq("meta_message_id", status.id);
            }
          }
        }
      }

      // Always return 200 to Meta
      return new Response("OK", { status: 200, headers: corsHeaders });
    }

    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  } catch (err) {
    console.error("Webhook error:", err);
    // Always 200 to Meta to avoid retries
    return new Response("OK", { status: 200, headers: corsHeaders });
  }
});
