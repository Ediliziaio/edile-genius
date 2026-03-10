import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const azienda = (instance as any)?.companies?.name || "";
    const reportDate = dataOggi || new Date().toLocaleDateString("it-IT");

    // Try AI structuring with OpenAI
    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let extracted: any = {
      operai_presenti: [],
      lavori_eseguiti: [],
      materiali_usati: [],
      materiali_da_ordinare: [],
      problemi: [],
      avanzamento_percentuale: null,
      previsione_domani: "",
      condizioni_meteo: "",
      report_completo: transcript.length > 0,
    };

    if (openaiKey && transcriptText) {
      try {
        const prompt = `Sei un assistente per la reportistica di cantieri edili italiani.
Analizza questa trascrizione e struttura le informazioni.

TRASCRIZIONE: "${transcriptText}"

Rispondi SOLO con JSON valido:
{
  "operai_presenti": [{"nome": "string", "ruolo": "string", "ore": number}],
  "lavori_eseguiti": ["descrizione"],
  "materiali_usati": ["materiale con quantità"],
  "materiali_da_ordinare": ["materiale"],
  "problemi": ["problema"],
  "avanzamento_percentuale": number_or_null,
  "previsione_domani": "string",
  "condizioni_meteo": "string"
}`;

        const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { "Authorization": `Bearer ${openaiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            response_format: { type: "json_object" },
          }),
        });
        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        extracted = { ...extracted, ...parsed, report_completo: true };
      } catch (e) {
        console.error("AI structuring failed, falling back to basic:", e);
        // Fallback to basic parsing
        for (const msg of transcript) {
          const text = (msg.message || "").toLowerCase();
          const numMatch = text.match(/(\d+)\s*(operai|persone|uomini)/);
          if (numMatch) extracted.operai_presenti = [{ nome: "—", ore: 0 }];
        }
      }
    } else {
      // Fallback to basic parsing
      for (const msg of transcript) {
        const text = (msg.message || "").toLowerCase();
        const numMatch = text.match(/(\d+)\s*(operai|persone|uomini)/);
        if (numMatch) extracted.operai_presenti = [{ nome: "—", ore: 0 }];
      }
    }

    const reportHtml = `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;border-top:4px solid #10b981;padding:24px;">
      <h1 style="font-size:20px;">📋 Report Giornaliero</h1>
      <p style="color:#666;font-size:14px;">${cantiere || "Cantiere"} · ${reportDate} · ${operaio || "Operaio"}</p>
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      ${extracted.operai_presenti?.length ? `<p><strong>👷 Operai:</strong> ${extracted.operai_presenti.map((o: any) => `${o.nome} ${o.ore ? o.ore + "h" : ""}`).join(", ")}</p>` : ""}
      ${extracted.lavori_eseguiti?.length ? `<p><strong>🔨 Lavori:</strong></p><ul>${extracted.lavori_eseguiti.map((l: string) => `<li>${l}</li>`).join("")}</ul>` : ""}
      ${extracted.problemi?.length ? `<p><strong>⚠️ Problemi:</strong></p><ul>${extracted.problemi.map((p: string) => `<li>${p}</li>`).join("")}</ul>` : ""}
      ${extracted.avanzamento_percentuale ? `<p><strong>📊 Avanzamento:</strong> ${extracted.avanzamento_percentuale}%</p>` : ""}
      <hr style="border:none;border-top:1px solid #eee;margin:16px 0;">
      <p style="font-size:12px;color:#999;">Generato da edilizia.io · ${azienda}</p>
    </div>`;

    const reportSummary = `📋 Report ${cantiere || "Cantiere"} — ${reportDate}\n👷 Operai: ${extracted.operai_presenti?.length || "—"}\n📊 Avanzamento: ${extracted.avanzamento_percentuale || "—"}%\n${extracted.problemi?.length ? "⚠️ " + extracted.problemi.length + " problemi" : "✅ Nessun problema"}`;

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
