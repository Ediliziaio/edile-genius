import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const today = new Date().toISOString().split("T")[0];

    // Get active cantieri with alert config
    const { data: cantieri, error } = await adminClient
      .from("cantieri")
      .select("id, nome, company_id, telegram_chat_ids, email_report, alert_mancato_report_ore, fine_turno_ora")
      .eq("stato", "attivo");

    if (error) throw error;
    if (!cantieri?.length) {
      return new Response(JSON.stringify({ message: "Nessun cantiere" }), { headers: corsHeaders });
    }

    let alertsSent = 0;

    for (const cantiere of cantieri) {
      const alertOre = cantiere.alert_mancato_report_ore || 3;
      const fineTurno = cantiere.fine_turno_ora || "17:00";

      // Check if enough time passed after shift end
      const now = new Date();
      const [h, m] = fineTurno.split(":").map(Number);
      const shiftEnd = new Date();
      shiftEnd.setHours(h, m, 0, 0);
      const hoursSinceShift = (now.getTime() - shiftEnd.getTime()) / (1000 * 60 * 60);

      if (hoursSinceShift < alertOre) continue;

      // Check if report exists
      const { data: reports } = await adminClient
        .from("agent_reports")
        .select("id")
        .eq("cantiere_id", cantiere.id)
        .eq("date", today)
        .limit(1);

      if (reports && reports.length > 0) continue;

      // Check if alert already sent
      const { data: existingAlert } = await adminClient
        .from("alert_mancato_report")
        .select("id")
        .eq("cantiere_id", cantiere.id)
        .eq("data_mancanza", today)
        .limit(1);

      if (existingAlert && existingAlert.length > 0) continue;

      // Send alerts
      const alertTargets: string[] = [];

      // Telegram alert
      if (TELEGRAM_BOT_TOKEN && cantiere.telegram_chat_ids?.length) {
        for (const chatId of cantiere.telegram_chat_ids) {
          const text = `🚨 *ALERT: Report Mancante*\n\n📍 Cantiere: *${cantiere.nome}*\n⏰ Sono passate ${alertOre}+ ore dalla fine turno\n\n⚠️ Nessun report ricevuto per oggi. Contattare il responsabile.`;
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
          });
          alertTargets.push(`telegram:${chatId}`);
        }
      }

      // Email alert
      if (RESEND_API_KEY && cantiere.email_report?.length) {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Edilizia.io <noreply@edilizia.io>",
            to: cantiere.email_report,
            subject: `🚨 Report mancante — ${cantiere.nome}`,
            html: `<div style="font-family:sans-serif"><h2>⚠️ Report Mancante</h2><p>Il cantiere <strong>${cantiere.nome}</strong> non ha inviato il report giornaliero.</p><p>Sono trascorse più di ${alertOre} ore dalla fine turno (${fineTurno}).</p></div>`,
          }),
        });
        alertTargets.push(...cantiere.email_report.map((e: string) => `email:${e}`));
      }

      // Record alert
      await adminClient.from("alert_mancato_report").insert({
        company_id: cantiere.company_id,
        cantiere_id: cantiere.id,
        data_mancanza: today,
        tipo_alert: "telegram+email",
        inviato_a: alertTargets,
      });

      alertsSent++;
    }

    return new Response(JSON.stringify({ alerts_sent: alertsSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("check-mancati-report error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
