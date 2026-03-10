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

    // Find overdue milestones
    const { data: milestones, error } = await adminClient
      .from("sal_milestones")
      .select("*, cantieri(nome, company_id, telegram_chat_ids, email_report)")
      .eq("stato", "in_corso")
      .eq("alert_ritardo_inviato", false)
      .lt("data_prevista", today);

    if (error) throw error;
    if (!milestones?.length) {
      return new Response(JSON.stringify({ message: "Nessun ritardo SAL" }), { headers: corsHeaders });
    }

    let alertsSent = 0;

    for (const ms of milestones) {
      const cantiere = (ms as any).cantieri;
      if (!cantiere) continue;

      const diffDays = Math.ceil(
        (new Date().getTime() - new Date(ms.data_prevista!).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Telegram
      if (TELEGRAM_BOT_TOKEN && cantiere.telegram_chat_ids?.length) {
        for (const chatId of cantiere.telegram_chat_ids) {
          const text = `📊 *Alert Ritardo SAL*\n\n📍 Cantiere: *${cantiere.nome}*\n🎯 Milestone: *${ms.nome}*\n📅 Scadenza prevista: ${ms.data_prevista}\n⏰ Ritardo: ${diffDays} giorni\n📈 Avanzamento: ${ms.percentuale_attuale}% / ${ms.target_percentuale}%`;
          await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
          });
        }
      }

      // Email
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
            subject: `📊 Ritardo SAL — ${cantiere.nome}: ${ms.nome}`,
            html: `<div style="font-family:sans-serif"><h2>📊 Alert Ritardo SAL</h2><p><strong>Cantiere:</strong> ${cantiere.nome}</p><p><strong>Milestone:</strong> ${ms.nome}</p><p><strong>Scadenza prevista:</strong> ${ms.data_prevista}</p><p><strong>Ritardo:</strong> ${diffDays} giorni</p><p><strong>Avanzamento:</strong> ${ms.percentuale_attuale}% / ${ms.target_percentuale}%</p></div>`,
          }),
        });
      }

      await adminClient.from("sal_milestones").update({ alert_ritardo_inviato: true }).eq("id", ms.id);
      alertsSent++;
    }

    return new Response(JSON.stringify({ alerts_sent: alertsSent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("check-sal-ritardi error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
