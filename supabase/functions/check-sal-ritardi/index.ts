import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "check-sal-ritardi";

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().split("T")[0];

    const { data: milestones, error } = await adminClient
      .from("sal_milestones")
      .select("*, cantieri(nome, company_id, telegram_chat_ids, email_report)")
      .eq("stato", "in_corso")
      .eq("alert_ritardo_inviato", false)
      .lt("data_prevista", today);

    if (error) throw error;
    if (!milestones?.length) return jsonOk({ message: "Nessun ritardo SAL" }, rid);

    let alertsSent = 0;

    for (const ms of milestones) {
      const cantiere = (ms as any).cantieri;
      if (!cantiere) continue;

      const diffDays = Math.ceil((new Date().getTime() - new Date(ms.data_prevista!).getTime()) / (1000 * 60 * 60 * 24));

      if (TELEGRAM_BOT_TOKEN && cantiere.telegram_chat_ids?.length) {
        for (const chatId of cantiere.telegram_chat_ids) {
          const text = `📊 *Alert Ritardo SAL*\n\n📍 Cantiere: *${cantiere.nome}*\n🎯 Milestone: *${ms.nome}*\n📅 Scadenza prevista: ${ms.data_prevista}\n⏰ Ritardo: ${diffDays} giorni\n📈 Avanzamento: ${ms.percentuale_attuale}% / ${ms.target_percentuale}%`;
          try {
            await fetchWithTimeout(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
            }, 10_000);
          } catch (e) {
            log("warn", "Telegram SAL alert failed", { request_id: rid, fn: FN, chat_id: chatId, error: e instanceof Error ? e.message : "unknown" });
          }
        }
      }

      if (RESEND_API_KEY && cantiere.email_report?.length) {
        try {
          await fetchWithTimeout("https://api.resend.com/emails", {
            method: "POST",
            headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
            body: JSON.stringify({
              from: "Edilizia.io <noreply@edilizia.io>",
              to: cantiere.email_report,
              subject: `📊 Ritardo SAL — ${cantiere.nome}: ${ms.nome}`,
              html: `<div style="font-family:sans-serif"><h2>📊 Alert Ritardo SAL</h2><p><strong>Cantiere:</strong> ${cantiere.nome}</p><p><strong>Milestone:</strong> ${ms.nome}</p><p><strong>Scadenza prevista:</strong> ${ms.data_prevista}</p><p><strong>Ritardo:</strong> ${diffDays} giorni</p><p><strong>Avanzamento:</strong> ${ms.percentuale_attuale}% / ${ms.target_percentuale}%</p></div>`,
            }),
          }, 10_000);
        } catch (e) {
          log("warn", "Resend SAL alert failed", { request_id: rid, fn: FN, error: e instanceof Error ? e.message : "unknown" });
        }
      }

      await adminClient.from("sal_milestones").update({ alert_ritardo_inviato: true }).eq("id", ms.id);
      alertsSent++;
    }

    log("info", "SAL ritardi check done", { request_id: rid, fn: FN, alerts_sent: alertsSent });
    return jsonOk({ alerts_sent: alertsSent }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
