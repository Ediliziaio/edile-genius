import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function ok(body: unknown) {
  return new Response(JSON.stringify(body), {
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

function err(msg: string, status = 200) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}

/* ─── AES-256-GCM via Web Crypto (built-in Deno) ─── */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

async function importKey(keyHex: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    hexToBytes(keyHex),
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"],
  );
}

async function encrypt(text: string, keyHex: string): Promise<string> {
  const key = await importKey(keyHex);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(text);
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const result = new Uint8Array(12 + encrypted.byteLength);
  result.set(iv, 0);
  result.set(new Uint8Array(encrypted), 12);
  return btoa(String.fromCharCode(...result));
}

async function decrypt(b64: string, keyHex: string): Promise<string> {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const key = await importKey(keyHex);
  const iv = bytes.slice(0, 12);
  const data = bytes.slice(12);
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, data);
  return new TextDecoder().decode(decrypted);
}

function maskValue(value: string): string {
  if (value.length <= 8) return "••••••••";
  return value.slice(0, 6) + "••••••••" + value.slice(-4);
}

/* ─── Test connessione per ogni servizio ─── */
async function testKey(keyName: string, plainValue: string): Promise<{ status: "ok" | "error"; message: string }> {
  try {
    if (keyName === "OPENAI_API_KEY") {
      const r = await fetch("https://api.openai.com/v1/models", {
        headers: { Authorization: `Bearer ${plainValue}` },
      });
      if (r.ok) return { status: "ok", message: "OpenAI: connessione OK" };
      const j = await r.json().catch(() => ({}));
      return { status: "error", message: `OpenAI: ${j?.error?.message ?? r.statusText}` };
    }

    if (keyName === "GEMINI_API_KEY") {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${plainValue}`,
      );
      if (r.ok) return { status: "ok", message: "Gemini: connessione OK" };
      const j = await r.json().catch(() => ({}));
      return { status: "error", message: `Gemini: ${j?.error?.message ?? r.statusText}` };
    }

    if (keyName === "ELEVENLABS_API_KEY") {
      const r = await fetch("https://api.elevenlabs.io/v1/user/subscription", {
        headers: { "xi-api-key": plainValue },
      });
      if (r.ok) return { status: "ok", message: "ElevenLabs: connessione OK" };
      return { status: "error", message: `ElevenLabs: ${r.statusText}` };
    }

    if (keyName === "STRIPE_SECRET_KEY") {
      const r = await fetch("https://api.stripe.com/v1/balance", {
        headers: { Authorization: `Bearer ${plainValue}` },
      });
      if (r.ok) return { status: "ok", message: "Stripe: connessione OK" };
      const j = await r.json().catch(() => ({}));
      return { status: "error", message: `Stripe: ${j?.error?.message ?? r.statusText}` };
    }

    if (keyName === "RESEND_API_KEY") {
      const r = await fetch("https://api.resend.com/domains", {
        headers: { Authorization: `Bearer ${plainValue}` },
      });
      if (r.ok) return { status: "ok", message: "Resend: connessione OK" };
      const j = await r.json().catch(() => ({}));
      return { status: "error", message: `Resend: ${j?.message ?? r.statusText}` };
    }

    if (keyName === "FIRECRAWL_API_KEY") {
      const r = await fetch("https://api.firecrawl.dev/v1/team/usage", {
        headers: { Authorization: `Bearer ${plainValue}` },
      });
      if (r.ok) return { status: "ok", message: "Firecrawl: connessione OK" };
      return { status: "error", message: `Firecrawl: ${r.statusText}` };
    }

    return { status: "error", message: "Test non disponibile per questa chiave" };
  } catch (e: unknown) {
    return { status: "error", message: `Errore di rete: ${(e as Error).message}` };
  }
}

/* ─── Handler principale ─── */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });

  try {
    /* Auth */
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return err("Missing authorization header");
    const token = authHeader.slice(7);

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const anonClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: ue } = await anonClient.auth.getUser(token);
    if (!user || ue) return err("Unauthorized: " + (ue?.message ?? "no user"));

    /* Role check */
    const { data: roles } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const isSuperAdmin = (roles ?? []).some((r: { role: string }) =>
      r.role === "superadmin" || r.role === "superadmin_user"
    );
    if (!isSuperAdmin) return err("Forbidden: superadmin required");

    /* Encryption key */
    const ENC_KEY = Deno.env.get("META_ENCRYPTION_KEY") ?? "";
    const hasEncKey = ENC_KEY.length === 64; // 32 bytes hex

    /* Allowed key names */
    const ALLOWED_KEYS = [
      "OPENAI_API_KEY", "GEMINI_API_KEY", "ELEVENLABS_API_KEY",
      "STRIPE_SECRET_KEY", "RESEND_API_KEY", "FIRECRAWL_API_KEY",
    ];

    /* Body */
    const body = await req.json().catch(() => ({}));
    const action: string = body.action ?? "list";

    /* ── list ── */
    if (action === "list") {
      const { data, error: dbErr } = await serviceClient
        .from("platform_api_keys")
        .select("key_name, masked_value, is_configured, last_tested_at, last_test_status, last_test_message, description")
        .order("key_name");

      if (dbErr) return err("DB error: " + dbErr.message);
      return ok({ keys: data ?? [] });
    }

    /* ── save ── */
    if (action === "save") {
      const keyName: string = body.key_name;
      const keyValue: string = body.key_value;
      if (!keyName || !keyValue) return err("key_name e key_value sono richiesti");
      if (!ALLOWED_KEYS.includes(keyName)) return err("key_name non valido");
      if (!hasEncKey) return err("META_ENCRYPTION_KEY non configurata — impossibile cifrare");

      let encryptedValue: string;
      try {
        encryptedValue = await encrypt(keyValue, ENC_KEY);
      } catch (e: unknown) {
        return err("Errore cifratura: " + (e as Error).message);
      }

      const masked = maskValue(keyValue);

      const { error: dbErr } = await serviceClient
        .from("platform_api_keys")
        .update({
          encrypted_value: encryptedValue,
          masked_value: masked,
          is_configured: true,
          updated_at: new Date().toISOString(),
        })
        .eq("key_name", keyName);

      if (dbErr) return err("DB error: " + dbErr.message);
      return ok({ saved: true });
    }

    /* ── test ── */
    if (action === "test") {
      const keyName: string = body.key_name;
      if (!keyName) return err("key_name è richiesto");
      if (!ALLOWED_KEYS.includes(keyName)) return err("key_name non valido");

      const { data: row, error: dbErr } = await serviceClient
        .from("platform_api_keys")
        .select("encrypted_value, is_configured")
        .eq("key_name", keyName)
        .single();

      if (dbErr || !row) return err("Chiave non trovata");
      if (!row.is_configured || !row.encrypted_value) {
        return err("Chiave non configurata");
      }

      if (!hasEncKey) {
        return err("META_ENCRYPTION_KEY non configurata — impossibile decifrare");
      }

      let plainValue: string;
      try {
        plainValue = await decrypt(row.encrypted_value, ENC_KEY);
      } catch {
        return err("Errore decifrazione — chiave di cifratura errata");
      }

      const result = await testKey(keyName, plainValue);

      await serviceClient
        .from("platform_api_keys")
        .update({
          last_tested_at: new Date().toISOString(),
          last_test_status: result.status,
          last_test_message: result.message,
        })
        .eq("key_name", keyName);

      return ok(result);
    }

    /* ── delete ── */
    if (action === "delete") {
      const keyName: string = body.key_name;
      if (!keyName) return err("key_name è richiesto");
      if (!ALLOWED_KEYS.includes(keyName)) return err("key_name non valido");

      const { error: dbErr } = await serviceClient
        .from("platform_api_keys")
        .update({
          encrypted_value: null,
          masked_value: null,
          is_configured: false,
          last_tested_at: null,
          last_test_status: null,
          last_test_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq("key_name", keyName);

      if (dbErr) return err("DB error: " + dbErr.message);
      return ok({ deleted: true });
    }

    return err("Azione non riconosciuta: " + action);
  } catch (e: unknown) {
    return ok({ error: "Errore interno: " + (e as Error).message });
  }
});
