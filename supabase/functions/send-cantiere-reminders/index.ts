import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "send-cantiere-reminders";

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!TELEGRAM_BOT_TOKEN) {
      log("error", "TELEGRAM_BOT_TOKEN non configurato", { request_id: rid, fn: FN });
      return jsonOk({ error: "TELEGRAM_BOT_TOKEN non configurato" }, rid);
    }

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().split("T")[0];

    const { data: cantieri, error } = await adminClient
      .from("cantieri")
      .select("id, nome, telegram_chat_ids, company_id")
      .eq("stato", "attivo")
      .not("telegram_chat_ids", "is", null);

    if (error) throw error;
    if (!cantieri?.length) {
      log("info", "Nessun cantiere attivo con Telegram", { request_id: rid, fn: FN });
      return jsonOk({ message: "Nessun cantiere attivo con Telegram" }, rid);
    }

    let remindersSent = 0;
    let errors = 0;

    for (const cantiere of cantieri) {
      if (!cantiere.telegram_chat_ids?.length) continue;

      const { data: reports } = await adminClient
        .from("agent_reports")
        .select("id")
        .eq("cantiere_id", cantiere.id)
        .eq("date", today)
        .limit(1);

      if (reports && reports.length > 0) continue;

      for (const chatId of cantiere.telegram_chat_ids) {
        const text = `⏰ *Reminder Report Giornaliero*\n\n📍 Cantiere: *${cantiere.nome}*\n\nNon è stato ancora inviato il report di oggi. Invia un vocale o le foto del cantiere per completare il report.`;
        try {
          await fetchWithTimeout(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
          }, 10_000);
          remindersSent++;
        } catch (e) {
          errors++;
          log("warn", "Telegram send failed", { request_id: rid, fn: FN, chat_id: chatId, error: e instanceof Error ? e.message : "unknown" });
        }
      }
    }

    log("info", "Reminders completed", { request_id: rid, fn: FN, sent: remindersSent, errors });
    return jsonOk({ reminders_sent: remindersSent, errors }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
