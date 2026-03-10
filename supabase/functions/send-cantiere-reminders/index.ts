import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) {
      return new Response(JSON.stringify({ error: "TELEGRAM_BOT_TOKEN non configurato" }), { status: 500, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Get all active cantieri with telegram_chat_ids
    const { data: cantieri, error } = await adminClient
      .from("cantieri")
      .select("id, nome, telegram_chat_ids, company_id")
      .eq("stato", "attivo")
      .not("telegram_chat_ids", "is", null);

    if (error) throw error;
    if (!cantieri?.length) {
      return new Response(JSON.stringify({ message: "Nessun cantiere attivo con Telegram" }), { headers: corsHeaders });
    }

    let remindersSent = 0;

    for (const cantiere of cantieri) {
      if (!cantiere.telegram_chat_ids?.length) continue;

      // Check if a report exists for today
      const { data: reports } = await adminClient
        .from("agent_reports")
        .select("id")
        .eq("cantiere_id", cantiere.id)
        .eq("date", today)
        .limit(1);

      if (reports && reports.length > 0) continue; // Report exists, skip

      // Send reminder to all chat IDs
      for (const chatId of cantiere.telegram_chat_ids) {
        const text = `⏰ *Reminder Report Giornaliero*\n\n📍 Cantiere: *${cantiere.nome}*\n\nNon è stato ancora inviato il report di oggi. Invia un vocale o le foto del cantiere per completare il report.`;

        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            parse_mode: "Markdown",
          }),
        });
        remindersSent++;
      }
    }

    return new Response(JSON.stringify({ reminders_sent: remindersSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("send-cantiere-reminders error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
