import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // ── Auth ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // ── Tenant check ──
    const { data: profile } = await sb.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "No company" }), { status: 400, headers: corsHeaders });
    }

    const { bot_token } = await req.json();
    if (!bot_token) {
      return new Response(JSON.stringify({ error: "bot_token required" }), { status: 400, headers: corsHeaders });
    }

    const company_id = profile.company_id;

    const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/telegram-cantiere-webhook?company=${company_id}`;

    const res = await fetch(`https://api.telegram.org/bot${bot_token}/setWebhook`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        url: webhookUrl,
        allowed_updates: ["message", "callback_query"],
        drop_pending_updates: true,
      }),
    });
    const data = await res.json();

    // Get bot info
    let botUsername = "";
    try {
      const meRes = await fetch(`https://api.telegram.org/bot${bot_token}/getMe`);
      const meData = await meRes.json();
      botUsername = meData.result?.username || "";
    } catch { /* ignore */ }

    // Save config to DB
    await sb.from("telegram_config").upsert({
      company_id,
      bot_token,
      bot_username: botUsername,
      attivo: data.ok === true,
    }, { onConflict: "company_id" });

    return new Response(JSON.stringify({
      success: data.ok,
      webhook_url: webhookUrl,
      bot_username: botUsername,
      telegram_response: data,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: corsHeaders });
  }
});
