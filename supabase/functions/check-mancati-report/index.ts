import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "check-mancati-report";

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const adminClient = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const today = new Date().toISOString().split("T")[0];

    const { data: cantieri, error } = await adminClient
      .from("cantieri")
      .select("id, nome, company_id, telegram_chat_ids, email_report, alert_mancato_report_ore, fine_turno_ora")
      .eq("stato", "attivo");

    if (error) throw error;
    if (!cantieri?.length) return jsonOk({ message: "Nessun cantiere" }, rid);

    let alertsSent = 0;

    for (const cantiere of cantieri) {
      const alertOre = cantiere.alert_mancato_report_ore || 3;
      const fineTurno = cantiere.fine_turno_ora || "17:00";
      const now = new Date();
      const [h, m] = fineTurno.split(":").map(Number);
      const shiftEnd = new Date();
      shiftEnd.setHours(h, m, 0, 0);
      const hoursSinceShift = (now.getTime() - shiftEnd.getTime()) / (1000 * 60 * 60);
      if (hoursSinceShift < alertOre) continue;

      const { data: reports } = await adminClient.from("agent_reports").select("id").eq("cantiere_id", cantiere.id).eq("date", today).limit(1);
      if (reports && reports.length > 0) continue;

      const { data: existingAlert } = await adminClient.from("alert_mancato_report").select("id").eq("cantiere_id", cantiere.id).eq("data_mancanza", today).limit(1);
      if (existingAlert && existingAlert.length > 0) continue;

      const alertTargets: string[] = [];

      if (TELEGRAM_BOT_TOKEN && cantiere.telegram_chat_ids?.length) {
        for (const chatId of cantiere.telegram_chat_ids) {
          const text = `🚨 *ALERT: Report Mancante*\n\n📍 Cantiere: *${cantiere.nome}*\n⏰ Sono passate ${alertOre}+ ore dalla fine turno\n\n⚠️ Nessun report ricevuto per oggi. Contattare il responsabile.`;
          try {
            await fetchWithTimeout(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
            }, 10_000);
            alertTargets.push(`telegram:${chatId}`);
          } catch (e) {
            log("warn", "Telegram alert failed", { request_id: rid, fn: FN, chat_id: chatId, error: e instanceof Error ? e.message : "unknown" });
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
              subject: `🚨 Report mancante — ${cantiere.nome}`,
              html: `<div style="font-family:sans-serif"><h2>⚠️ Report Mancante</h2><p>Il cantiere <strong>${cantiere.nome}</strong> non ha inviato il report giornaliero.</p><p>Sono trascorse più di ${alertOre} ore dalla fine turno (${fineTurno}).</p></div>`,
            }),
          }, 10_000);
          alertTargets.push(...cantiere.email_report.map((e: string) => `email:${e}`));
        } catch (e) {
          log("warn", "Resend alert failed", { request_id: rid, fn: FN, error: e instanceof Error ? e.message : "unknown" });
        }
      }

      await adminClient.from("alert_mancato_report").insert({
        company_id: cantiere.company_id,
        cantiere_id: cantiere.id,
        data_mancanza: today,
        tipo_alert: "telegram+email",
        inviato_a: alertTargets,
      });

      alertsSent++;
    }

    log("info", "Mancati report check done", { request_id: rid, fn: FN, alerts_sent: alertsSent });
    return jsonOk({ alerts_sent: alertsSent }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
