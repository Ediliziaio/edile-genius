import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REQUIRED_SECRETS = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "META_ENCRYPTION_KEY",
  "ELEVENLABS_API_KEY",
  "OPENAI_API_KEY",
  "RESEND_API_KEY",
];

const OPTIONAL_SECRETS = [
  "TELEGRAM_BOT_TOKEN",
  "WHATSAPP_APP_SECRET",
  "N8N_CALLBACK_SECRET",
  "HEALTH_CHECK_TOKEN",
  "STRIPE_SECRET_KEY",
];

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  // Protect with service role key
  const authHeader = req.headers.get("Authorization");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!authHeader || authHeader !== `Bearer ${serviceKey}`) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const results: Record<string, { status: string; details?: string }> = {};

  // Check required secrets
  for (const secret of REQUIRED_SECRETS) {
    const value = Deno.env.get(secret);
    results[secret] = value ? { status: "ok" } : { status: "missing" };
  }

  // Check optional secrets
  for (const secret of OPTIONAL_SECRETS) {
    const value = Deno.env.get(secret);
    results[secret] = value ? { status: "ok" } : { status: "missing" };
  }

  // Validate META_ENCRYPTION_KEY format (must be 64 hex chars = 32 bytes)
  const encKey = Deno.env.get("META_ENCRYPTION_KEY");
  if (encKey) {
    if (!/^[0-9a-fA-F]{64}$/.test(encKey)) {
      results["META_ENCRYPTION_KEY"] = {
        status: "invalid",
        details: "Deve essere 64 caratteri esadecimali. Genera con: openssl rand -hex 32",
      };
    }
  }

  // Crypto roundtrip test
  if (encKey && results["META_ENCRYPTION_KEY"]?.status === "ok") {
    try {
      const { encryptToken, decryptToken } = await import("../_shared/crypto.ts");
      const testPlain = "health-check-test-string";
      const encrypted = await encryptToken(testPlain, encKey);
      const decrypted = await decryptToken(encrypted, encKey);
      results["CRYPTO_ROUNDTRIP"] = testPlain === decrypted
        ? { status: "ok" }
        : { status: "invalid", details: "encrypt/decrypt roundtrip fallito" };
    } catch (e) {
      results["CRYPTO_ROUNDTRIP"] = { status: "invalid", details: (e as Error).message };
    }
  }

  // Test DB connection
  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey!);
    const { error } = await supabase.from("companies").select("id").limit(1);
    results["DB_CONNECTION"] = error ? { status: "invalid", details: error.message } : { status: "ok" };
  } catch (e) {
    results["DB_CONNECTION"] = { status: "invalid", details: (e as Error).message };
  }

  const missingRequired = REQUIRED_SECRETS.filter((s) => results[s]?.status !== "ok");
  const allOk = missingRequired.length === 0 && results["DB_CONNECTION"]?.status === "ok";

  return new Response(
    JSON.stringify({
      status: allOk ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      checks: results,
      missing_required: missingRequired,
      summary: allOk ? "✅ All required secrets configured" : `❌ Missing: ${missingRequired.join(", ")}`,
    }, null, 2),
    { status: allOk ? 200 : 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
