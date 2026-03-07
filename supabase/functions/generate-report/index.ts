import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { instanceId, conversationData, operaio, cantiere, dataOggi } = await req.json();

    if (!instanceId) {
      return new Response(JSON.stringify({ error: "instanceId required" }), { status: 400, headers: corsHeaders });
    }

    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: instance } = await sb
      .from("agent_template_instances")
      .select("*, companies:company_id(name)")
      .eq("id", instanceId)
      .single();

    const transcript = conversationData?.transcript || [];
    const transcriptText = transcript.map((m: any) => `${m.role}: ${m.message}`).join("\n");

    // Extract structured data (placeholder — uses simple parsing for now)
    const extracted = {
      operai_presenti: 0,
      lavorazioni: "",
      materiali: "",
      problemi: "",
      avanzamento: "pari",
      previsione_domani: "",
      note_titolare: "",
      report_completo: transcript.length > 0,
    };

    // Try to parse from transcript if available
    for (const msg of transcript) {
      const text = (msg.message || "").toLowerCase();
      const numMatch = text.match(/(\d+)\s*(operai|persone|uomini)/);
      if (numMatch) extracted.operai_presenti = parseInt(numMatch[1]);
    }

    const azienda = (instance as any)?.companies?.name || "";
    const reportDate = dataOggi || new Date().toLocaleDateString("it-IT");

    // Generate HTML report
    const reportHtml = `
    <div style="font-family:sans-serif;max-width:600px;margin:0 auto;border-top:4px solid #10b981;padding:24px;">
      <h1 style="font-size:20px;margin:0;">📋 Report Giornaliero</h1>
      <p style="color:#666;font-size:14px;">${cantiere || "Cantiere"} · ${reportDate} · ${operaio || "Operaio"}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <table style="width:100%;font-size:14px;">
        <tr><td style="color:#666;padding:4px 0;">Operai presenti</td><td style="font-weight:bold;">${extracted.operai_presenti || "—"}</td></tr>
        <tr><td style="color:#666;padding:4px 0;">Avanzamento</td><td style="font-weight:bold;">${extracted.avanzamento}</td></tr>
        <tr><td style="color:#666;padding:4px 0;">Lavorazioni</td><td>${extracted.lavorazioni || "—"}</td></tr>
        <tr><td style="color:#666;padding:4px 0;">Materiali</td><td>${extracted.materiali || "—"}</td></tr>
        <tr><td style="color:#666;padding:4px 0;">Problemi</td><td>${extracted.problemi || "Nessuno"}</td></tr>
        <tr><td style="color:#666;padding:4px 0;">Previsione domani</td><td>${extracted.previsione_domani || "—"}</td></tr>
      </table>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <p style="font-size:12px;color:#999;">Generato da edilizia.io · ${azienda}</p>
    </div>`;

    const reportSummary = `📋 Report ${cantiere || "Cantiere"} — ${reportDate}\n👷 Operai: ${extracted.operai_presenti || "—"}\n📊 Avanzamento: ${extracted.avanzamento}\n${extracted.problemi ? "⚠️ Problemi: " + extracted.problemi : "✅ Nessun problema"}`;

    return new Response(
      JSON.stringify({
        ...extracted,
        report_html: reportHtml,
        report_summary: reportSummary,
        operaio,
        cantiere,
        data: reportDate,
        instance_id: instanceId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: (error as Error).message }), { status: 500, headers: corsHeaders });
  }
});
