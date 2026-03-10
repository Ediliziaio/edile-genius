import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok");

  try {
    const { report_id, destinatari, company_id } = await req.json();
    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: report } = await sb.from("agent_reports")
      .select("*")
      .eq("id", report_id).single();

    if (!report) throw new Error("Report non trovato");

    const { data: company } = await sb.from("companies").select("name").eq("id", company_id).single();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY non configurata");

    // Get cantiere name
    let cantiereNome = "Cantiere";
    if ((report as any).cantiere_id) {
      const { data: cantiere } = await sb.from("cantieri").select("nome").eq("id", (report as any).cantiere_id).single();
      if (cantiere) cantiereNome = cantiere.nome;
    }

    for (const email of destinatari) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { "Authorization": `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: `${company?.name || "Edilizia.io"} <noreply@edilegenius.it>`,
          to: [email],
          subject: `📋 Report Cantiere ${cantiereNome} — ${report.date}`,
          html: report.report_html || "<p>Report non disponibile</p>",
          text: report.report_summary || "",
        }),
      });
    }

    return new Response(JSON.stringify({ success: true, inviata_a: destinatari }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Email error:", err);
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500 });
  }
});
