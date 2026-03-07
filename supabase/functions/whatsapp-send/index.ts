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

    const { data: claims, error: authErr } = await supabase.auth.getUser();
    if (authErr || !claims?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { phone_number_id, to, type, message, template_name, template_language, template_components } = await req.json();

    if (!phone_number_id || !to) {
      return new Response(JSON.stringify({ error: "phone_number_id and to are required" }), { status: 400, headers: corsHeaders });
    }

    // Get WABA config for this phone number
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: phoneNum } = await adminClient
      .from("whatsapp_phone_numbers")
      .select("company_id, waba_id")
      .eq("phone_number_id", phone_number_id)
      .single();

    if (!phoneNum) {
      return new Response(JSON.stringify({ error: "Phone number not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: wabaConfig } = await adminClient
      .from("whatsapp_waba_config")
      .select("access_token_encrypted")
      .eq("company_id", phoneNum.company_id)
      .eq("waba_id", phoneNum.waba_id)
      .single();

    if (!wabaConfig?.access_token_encrypted) {
      return new Response(JSON.stringify({ error: "WABA not configured" }), { status: 400, headers: corsHeaders });
    }

    // Build Meta API payload
    let metaPayload: any = {
      messaging_product: "whatsapp",
      to,
    };

    if (type === "template" && template_name) {
      metaPayload.type = "template";
      metaPayload.template = {
        name: template_name,
        language: { code: template_language || "it" },
        components: template_components || [],
      };
    } else {
      metaPayload.type = "text";
      metaPayload.text = { body: message || "" };
    }

    // Call Meta Graph API
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${phone_number_id}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${wabaConfig.access_token_encrypted}`,
        },
        body: JSON.stringify(metaPayload),
      }
    );

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      return new Response(JSON.stringify({ error: "Meta API error", details: metaData }), {
        status: metaRes.status,
        headers: corsHeaders,
      });
    }

    // Save outbound message
    const metaMessageId = metaData.messages?.[0]?.id;
    await adminClient.from("whatsapp_messages").insert({
      company_id: phoneNum.company_id,
      phone_number_id,
      meta_message_id: metaMessageId,
      direction: "outbound",
      type: type === "template" ? "template" : "text",
      content: type === "template" ? { template: template_name } : { body: message },
      status: "sent",
      sent_at: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true, meta_message_id: metaMessageId }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("whatsapp-send error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
