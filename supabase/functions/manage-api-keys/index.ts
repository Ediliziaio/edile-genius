import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encryptToken, decryptToken, getEncryptionKey } from "../_shared/crypto.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function maskKey(value: string): string {
  if (!value || value.length < 8) return "••••••••";
  return value.slice(0, 6) + "••••••••" + value.slice(-4);
}

async function testOpenAI(key: string) {
  const r = await fetch("https://api.openai.com/v1/models", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return `OK — ${(d.data || []).length} modelli disponibili`;
}

async function testGemini(key: string) {
  const r = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return `OK — ${(d.models || []).length} modelli disponibili`;
}

async function testElevenLabs(key: string) {
  const r = await fetch("https://api.elevenlabs.io/v1/voices", {
    headers: { "xi-api-key": key },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return `OK — ${(d.voices || []).length} voci disponibili`;
}

async function testStripe(key: string) {
  const r = await fetch("https://api.stripe.com/v1/balance", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return "OK — account Stripe attivo";
}

async function testResend(key: string) {
  const r = await fetch("https://api.resend.com/domains", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const d = await r.json();
  return `OK — ${(d.data || []).length} domini configurati`;
}

async function testFirecrawl(key: string) {
  const r = await fetch("https://api.firecrawl.dev/v1/team", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return "OK — account Firecrawl attivo";
}

async function testKey(keyName: string, value: string): Promise<string> {
  switch (keyName) {
    case "OPENAI_API_KEY":     return await testOpenAI(value);
    case "GEMINI_API_KEY":     return await testGemini(value);
    case "ELEVENLABS_API_KEY": return await testElevenLabs(value);
    case "STRIPE_SECRET_KEY":  return await testStripe(value);
    case "RESEND_API_KEY":     return await testResend(value);
    case "FIRECRAWL_API_KEY":  return await testFirecrawl(value);
    default: throw new Error("Key test non supportato");
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const token = authHeader.replace("Bearer ", "");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: roleCheck } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["superadmin", "superadmin_user"])
      .limit(1);

    if (!roleCheck || roleCheck.length === 0) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json();
    const { action, key_name, key_value } = body;

    // ── LIST ──────────────────────────────────────────────
    if (action === "list") {
      const { data } = await serviceClient
        .from("platform_api_keys")
        .select("key_name, masked_value, is_configured, last_tested_at, last_test_status, last_test_message, description");
      return new Response(JSON.stringify({ keys: data || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── SAVE ──────────────────────────────────────────────
    if (action === "save") {
      if (!key_name || !key_value) {
        return new Response(JSON.stringify({ error: "key_name e key_value richiesti" }), { status: 400, headers: corsHeaders });
      }
      const encKey = getEncryptionKey();
      const encrypted = await encryptToken(key_value, encKey);
      const masked = maskKey(key_value);
      await serviceClient
        .from("platform_api_keys")
        .upsert({
          key_name,
          encrypted_value: encrypted,
          masked_value: masked,
          is_configured: true,
          updated_at: new Date().toISOString(),
        }, { onConflict: "key_name" });

      return new Response(JSON.stringify({ success: true, masked_value: masked }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── TEST ──────────────────────────────────────────────
    if (action === "test") {
      if (!key_name) {
        return new Response(JSON.stringify({ error: "key_name richiesto" }), { status: 400, headers: corsHeaders });
      }

      // Recupera chiave decifrata dal DB, oppure usa quella passata direttamente
      let valueToTest = key_value || "";
      if (!valueToTest) {
        const { data: row } = await serviceClient
          .from("platform_api_keys")
          .select("encrypted_value, is_configured")
          .eq("key_name", key_name)
          .single();

        if (!row?.is_configured || !row.encrypted_value) {
          return new Response(JSON.stringify({ error: "Chiave non configurata" }), { status: 400, headers: corsHeaders });
        }
        const encKey = getEncryptionKey();
        valueToTest = await decryptToken(row.encrypted_value, encKey);
      }

      let testStatus: "ok" | "error" = "ok";
      let testMessage = "";
      try {
        testMessage = await testKey(key_name, valueToTest);
      } catch (err: any) {
        testStatus = "error";
        testMessage = err.message || "Errore di connessione";
      }

      await serviceClient
        .from("platform_api_keys")
        .update({
          last_tested_at: new Date().toISOString(),
          last_test_status: testStatus,
          last_test_message: testMessage,
        })
        .eq("key_name", key_name);

      return new Response(JSON.stringify({ success: testStatus === "ok", status: testStatus, message: testMessage }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── DELETE ──────────────────────────────────────────────
    if (action === "delete") {
      if (!key_name) {
        return new Response(JSON.stringify({ error: "key_name richiesto" }), { status: 400, headers: corsHeaders });
      }
      await serviceClient
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
        .eq("key_name", key_name);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Azione non valida" }), { status: 400, headers: corsHeaders });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
