import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM encryption
async function encryptToken(plaintext: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  // Format: base64(iv + ciphertext)
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Auth check
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

    const {
      company_id,
      user_access_token,
      waba_id,
      phone_number_id,
      display_phone_number,
      display_name,
    } = await req.json();

    if (!company_id || !user_access_token || !waba_id || !phone_number_id) {
      return new Response(JSON.stringify({ error: "Missing required fields: company_id, user_access_token, waba_id, phone_number_id" }), {
        status: 400, headers: corsHeaders,
      });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 1. Exchange user token for long-lived system token
    const { data: saConfig } = await adminClient
      .from("superadmin_whatsapp_config")
      .select("meta_app_id, meta_app_secret_encrypted")
      .limit(1)
      .single();

    if (!saConfig?.meta_app_id || !saConfig?.meta_app_secret_encrypted) {
      return new Response(JSON.stringify({ error: "Meta App not configured by SuperAdmin" }), {
        status: 500, headers: corsHeaders,
      });
    }

    // Exchange for long-lived token
    const tokenExchangeRes = await fetch(
      `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${saConfig.meta_app_id}&client_secret=${saConfig.meta_app_secret_encrypted}&fb_exchange_token=${user_access_token}`
    );
    const tokenData = await tokenExchangeRes.json();

    if (!tokenExchangeRes.ok || !tokenData.access_token) {
      console.error("Token exchange failed:", tokenData);
      return new Response(JSON.stringify({ error: "Token exchange failed", details: tokenData }), {
        status: 400, headers: corsHeaders,
      });
    }

    const longLivedToken = tokenData.access_token;

    // 2. Encrypt token with AES-256-GCM
    const encryptionKey = Deno.env.get("META_ENCRYPTION_KEY");
    let storedToken: string;

    if (encryptionKey && encryptionKey.length === 64) {
      storedToken = await encryptToken(longLivedToken, encryptionKey);
    } else {
      // Fallback: store as-is (not recommended for production)
      console.warn("META_ENCRYPTION_KEY not set or invalid, storing token without encryption");
      storedToken = longLivedToken;
    }

    // 3. Fetch phone number details from Meta
    let phoneDetails: any = {};
    try {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v21.0/${phone_number_id}?fields=display_phone_number,verified_name,quality_rating,messaging_limit_tier,name_status,certificate`,
        { headers: { Authorization: `Bearer ${longLivedToken}` } }
      );
      if (phoneRes.ok) {
        phoneDetails = await phoneRes.json();
      }
    } catch (e) {
      console.warn("Failed to fetch phone details:", e);
    }

    // 4. Fetch WABA business info
    let wabaDetails: any = {};
    try {
      const wabaRes = await fetch(
        `https://graph.facebook.com/v21.0/${waba_id}?fields=name,owner_business_info`,
        { headers: { Authorization: `Bearer ${longLivedToken}` } }
      );
      if (wabaRes.ok) {
        wabaDetails = await wabaRes.json();
      }
    } catch (e) {
      console.warn("Failed to fetch WABA details:", e);
    }

    // 5. Upsert WABA config
    const { error: wabaErr } = await adminClient
      .from("whatsapp_waba_config")
      .upsert({
        company_id,
        waba_id,
        business_name: wabaDetails.name || display_name || null,
        business_id: wabaDetails.owner_business_info?.id || null,
        access_token_encrypted: storedToken,
        meta_verified: true,
        meta_verification_status: "verified",
      }, { onConflict: "waba_id" });

    if (wabaErr) {
      console.error("WABA config upsert error:", wabaErr);
      return new Response(JSON.stringify({ error: "Failed to save WABA config", details: wabaErr.message }), {
        status: 500, headers: corsHeaders,
      });
    }

    // 6. Insert phone number
    const { error: phoneErr } = await adminClient
      .from("whatsapp_phone_numbers")
      .upsert({
        company_id,
        waba_id,
        phone_number_id,
        display_phone_number: phoneDetails.display_phone_number || display_phone_number || phone_number_id,
        display_name: phoneDetails.verified_name || display_name || "WhatsApp Number",
        verified_name: phoneDetails.verified_name || null,
        quality_rating: phoneDetails.quality_rating || "UNKNOWN",
        messaging_limit_tier: phoneDetails.messaging_limit_tier || null,
        name_status: phoneDetails.name_status || "PENDING",
        certificate: phoneDetails.certificate || null,
        status: "CONNECTED",
        webhook_verified: false,
      }, { onConflict: "phone_number_id" });

    if (phoneErr) {
      console.error("Phone number insert error:", phoneErr);
      return new Response(JSON.stringify({ error: "Failed to save phone number", details: phoneErr.message }), {
        status: 500, headers: corsHeaders,
      });
    }

    // 7. Register webhook for this WABA (optional, may fail if already registered)
    try {
      const { data: saFullConfig } = await adminClient
        .from("superadmin_whatsapp_config")
        .select("webhook_url, webhook_verify_token")
        .limit(1)
        .single();

      if (saFullConfig?.webhook_url) {
        const webhookRes = await fetch(
          `https://graph.facebook.com/v21.0/${waba_id}/subscribed_apps`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${longLivedToken}`,
            },
          }
        );
        const webhookData = await webhookRes.json();
        if (webhookRes.ok && webhookData.success) {
          await adminClient
            .from("whatsapp_phone_numbers")
            .update({ webhook_verified: true })
            .eq("phone_number_id", phone_number_id);
        }
      }
    } catch (e) {
      console.warn("Webhook subscription attempt failed (non-blocking):", e);
    }

    return new Response(JSON.stringify({
      success: true,
      phone_number_id,
      waba_id,
      display_phone_number: phoneDetails.display_phone_number || display_phone_number,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("whatsapp-connect-number error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
