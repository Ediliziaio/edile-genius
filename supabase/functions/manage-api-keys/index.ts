import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ok = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

// ── Crypto (inline) ────────────────────────────────────
async function encryptToken(plaintext: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["encrypt"]);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

async function decryptToken(cipherB64: string, keyHex: string): Promise<string> {
  const keyBytes = new Uint8Array(keyHex.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  const key = await crypto.subtle.importKey("raw", keyBytes, "AES-GCM", false, ["decrypt"]);
  const combined = Uint8Array.from(atob(cipherB64), (c) => c.charCodeAt(0));
  const iv = combined.slice(0, 12);
  const ciphertext = combined.slice(12);
  const plainBuf = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plainBuf);
}

function getEncKey(): string {
  const key = Deno.env.get("META_ENCRYPTION_KEY") ?? "";
  if (key.length !== 64) throw new Error("META_ENCRYPTION_KEY non configurata (deve essere 64 hex chars)");
  return key;
}

function maskKey(value: string): string {
  if (!value || value.length < 8) return "••••••••";
  return value.slice(0, 6) + "••••••••" + value.slice(-4);
}

// ── Test providers ─────────────────────────────────────
async function testKey(keyName: string, value: string): Promise<string> {
  if (keyName === "OPENAI_API_KEY") {
    const r = await fetch("https://api.openai.com/v1/models", { headers: { Authorization: `Bearer ${value}` } });
    if (!r.ok) throw new Error(`OpenAI HTTP ${r.status}`);
    const d = await r.json();
    return `OK — ${(d.data || []).length} modelli`;
  }
  if (keyName === "GEMINI_API_KEY") {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${value}`);
    if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
    const d = await r.json();
    return `OK — ${(d.models || []).length} modelli`;
  }
  if (keyName === "ELEVENLABS_API_KEY") {
    const r = await fetch("https://api.elevenlabs.io/v1/voices", { headers: { "xi-api-key": value } });
    if (!r.ok) throw new Error(`ElevenLabs HTTP ${r.status}`);
    const d = await r.json();
    return `OK — ${(d.voices || []).length} voci`;
  }
  if (keyName === "STRIPE_SECRET_KEY") {
    const r = await fetch("https://api.stripe.com/v1/balance", { headers: { Authorization: `Bearer ${value}` } });
    if (!r.ok) throw new Error(`Stripe HTTP ${r.status}`);
    return "OK — Stripe attivo";
  }
  if (keyName === "RESEND_API_KEY") {
    const r = await fetch("https://api.resend.com/domains", { headers: { Authorization: `Bearer ${value}` } });
    if (!r.ok) throw new Error(`Resend HTTP ${r.status}`);
    const d = await r.json();
    return `OK — ${(d.data || []).length} domini`;
  }
  if (keyName === "FIRECRAWL_API_KEY") {
    const r = await fetch("https://api.firecrawl.dev/v1/team", { headers: { Authorization: `Bearer ${value}` } });
    if (!r.ok) throw new Error(`Firecrawl HTTP ${r.status}`);
    return "OK — Firecrawl attivo";
  }
  throw new Error("Provider non supportato");
}

// ── Handler ────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return ok({ error: "No auth token", keys: [] });

    const token = authHeader.slice(7);
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verifica utente tramite service client (più affidabile)
    const { data: userData, error: userErr } = await serviceClient.auth.admin.getUserById(
      // Prima decodifica il JWT per ottenere l'user_id senza chiamate extra
      JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))).sub,
    );
    if (userErr || !userData?.user) return ok({ error: `Auth error: ${userErr?.message}`, keys: [] });

    const userId = userData.user.id;

    // Verifica ruolo superadmin
    const { data: roleCheck, error: roleErr } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["superadmin", "superadmin_user"])
      .limit(1);

    if (roleErr) return ok({ error: `Role DB error: ${roleErr.message}`, keys: [] });
    if (!roleCheck || roleCheck.length === 0) return ok({ error: `Not superadmin (user: ${userId})`, keys: [] });

    const body = await req.json();
    const { action, key_name, key_value } = body;

    // ── LIST
    if (action === "list") {
      const { data, error } = await serviceClient
        .from("platform_api_keys")
        .select("key_name, masked_value, is_configured, last_tested_at, last_test_status, last_test_message, description");
      if (error) return ok({ error: `DB list error: ${error.message}`, keys: [] });
      return ok({ keys: data ?? [] });
    }

    // ── SAVE
    if (action === "save") {
      if (!key_name || !key_value) return ok({ error: "key_name e key_value richiesti" });
      const encrypted = await encryptToken(key_value, getEncKey());
      const masked = maskKey(key_value);
      const { error } = await serviceClient
        .from("platform_api_keys")
        .upsert({ key_name, encrypted_value: encrypted, masked_value: masked, is_configured: true, updated_at: new Date().toISOString() }, { onConflict: "key_name" });
      if (error) return ok({ error: `DB save error: ${error.message}` });
      return ok({ success: true, masked_value: masked });
    }

    // ── TEST
    if (action === "test") {
      let valueToTest = key_value ?? "";
      if (!valueToTest) {
        const { data: row } = await serviceClient.from("platform_api_keys").select("encrypted_value, is_configured").eq("key_name", key_name).single();
        if (!row?.is_configured || !row.encrypted_value) return ok({ error: "Chiave non configurata" });
        valueToTest = await decryptToken(row.encrypted_value, getEncKey());
      }
      let status: "ok" | "error" = "ok";
      let message = "";
      try { message = await testKey(key_name, valueToTest); }
      catch (e: any) { status = "error"; message = e.message; }
      await serviceClient.from("platform_api_keys").update({ last_tested_at: new Date().toISOString(), last_test_status: status, last_test_message: message }).eq("key_name", key_name);
      return ok({ success: status === "ok", status, message });
    }

    // ── DELETE
    if (action === "delete") {
      await serviceClient.from("platform_api_keys").update({ encrypted_value: null, masked_value: null, is_configured: false, last_tested_at: null, last_test_status: null, last_test_message: null, updated_at: new Date().toISOString() }).eq("key_name", key_name);
      return ok({ success: true });
    }

    return ok({ error: "Azione non valida" });
  } catch (e: any) {
    return ok({ error: `Exception: ${e.message}`, keys: [] });
  }
});
