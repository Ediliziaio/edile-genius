import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// AES-256-GCM decrypt
async function decryptToken(cipherB64: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const combined = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

// AES-256-GCM encrypt
async function encryptToken(plaintext: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const results: { waba_id: string; success: boolean; error?: string }[] = [];

  try {
    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const encryptionKey = Deno.env.get("META_ENCRYPTION_KEY");
    if (!encryptionKey || encryptionKey.length !== 64) {
      return new Response(JSON.stringify({ error: "META_ENCRYPTION_KEY not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get global Meta app credentials
    const { data: saConfig } = await adminClient
      .from("superadmin_whatsapp_config")
      .select("meta_app_id, meta_app_secret_encrypted")
      .limit(1)
      .single();

    if (!saConfig?.meta_app_id || !saConfig?.meta_app_secret_encrypted) {
      return new Response(JSON.stringify({ error: "Meta App not configured by SuperAdmin" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all WABA configs with tokens
    const { data: wabaConfigs } = await adminClient
      .from("whatsapp_waba_config")
      .select("id, waba_id, access_token_encrypted, company_id")
      .not("access_token_encrypted", "is", null);

    if (!wabaConfigs || wabaConfigs.length === 0) {
      return new Response(JSON.stringify({ message: "No tokens to refresh", results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const waba of wabaConfigs) {
      try {
        // 1. Decrypt current token
        const currentToken = await decryptToken(waba.access_token_encrypted!, encryptionKey);

        // 2. Exchange for new long-lived token
        const exchangeUrl = `https://graph.facebook.com/v21.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${saConfig.meta_app_id}&client_secret=${saConfig.meta_app_secret_encrypted}&fb_exchange_token=${currentToken}`;
        const res = await fetch(exchangeUrl);
        const data = await res.json();

        if (!res.ok || !data.access_token) {
          const errMsg = data.error?.message || JSON.stringify(data);
          console.error(`Token refresh failed for WABA ${waba.waba_id}:`, errMsg);
          await adminClient
            .from("whatsapp_waba_config")
            .update({ token_refresh_error: errMsg, updated_at: new Date().toISOString() })
            .eq("id", waba.id);
          results.push({ waba_id: waba.waba_id, success: false, error: errMsg });
          continue;
        }

        // 3. Encrypt new token
        const newEncrypted = await encryptToken(data.access_token, encryptionKey);

        // 4. Update record
        await adminClient
          .from("whatsapp_waba_config")
          .update({
            access_token_encrypted: newEncrypted,
            token_refreshed_at: new Date().toISOString(),
            token_refresh_error: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", waba.id);

        results.push({ waba_id: waba.waba_id, success: true });
        console.log(`Token refreshed for WABA ${waba.waba_id}`);
      } catch (err) {
        const errMsg = String(err);
        console.error(`Error refreshing WABA ${waba.waba_id}:`, errMsg);
        await adminClient
          .from("whatsapp_waba_config")
          .update({ token_refresh_error: errMsg, updated_at: new Date().toISOString() })
          .eq("id", waba.id);
        results.push({ waba_id: waba.waba_id, success: false, error: errMsg });
      }
    }

    return new Response(JSON.stringify({
      message: `Processed ${results.length} tokens`,
      refreshed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
