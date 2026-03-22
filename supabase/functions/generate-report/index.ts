import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "generate-report";

  try {
    const { instanceId, conversationData, operaio, cantiere, dataOggi } = await req.json();
    if (!instanceId) return jsonError("instanceId required", "validation_error", 400, rid);

    const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: instance } = await sb.from("agent_template_instances").select("*, companies:company_id(name)").eq("id", instanceId).single();
    const transcript = conversationData?.transcript || [];
    const transcriptText = transcript.map((m: any) => `${m.role}: ${m.message}`).join("\n");
    const azienda = (instance as any)?.companies?.name || "";
    const reportDate = dataOggi || new Date().toLocaleDateString("it-IT");

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    let extracted: any = {
      operai_presenti: [], lavori_eseguiti: [], materiali_usati: [], materiali_da_ordinare: [],
      problemi: [], avanzamento_percentuale: null, previsione_domani: "", condizioni_meteo: "",
      report_completo: transcript.length > 0,
    };

    if (openaiKey && transcriptText) {
      try {
        const prompt = `Sei un assistente per la reportistica di cantieri edili italiani.\nAnalizza questa trascrizione e struttura le informazioni.\n\nTRASCRIZIONE: "${transcriptText}"\n\nRispondi SOLO con JSON valido:\n{\n  "operai_presenti": [{"nome": "string", "ruolo": "string", "ore": number}],\n  "lavori_eseguiti": ["descrizione"],\n  "materiali_usati": ["materiale con quantità"],\n  "materiali_da_ordinare": ["materiale"],\n  "problemi": ["problema"],\n  "avanzamento_percentuale": number_or_null,\n  "previsione_domani": "string",\n  "condizioni_meteo": "string"\n}`;

        // 60s timeout — no retry (AI generation)
        const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            temperature: 0,
            response_format: { type: "json_object" },
          }),
        }, 60_000);

        if (!res.ok) {
          log("warn", "OpenAI structuring failed", { request_id: rid, fn: FN, status: res.status });
          throw new Error(`OpenAI error: ${res.status}`);
        }

        const data = await res.json();
        const parsed = JSON.parse(data.choices[0].message.content);
        extracted = { ...extracted, ...parsed, report_completo: true };
      } catch (e) {
        log("warn", "AI structuring failed, using basic parsing", { request_id: rid, fn: FN, error: e instanceof Error ? e.message : "unknown" });
        for (const msg of transcript) {
          const text = (msg.message || "").toLowerCase();
          const numMatch = text.match(/(\d+)\s*(operai|persone|uomini)/);
          if (numMatch) extracted.operai_presenti = [{ nome: "—", ore: 0 }];
        }
      }
    } else {
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
      <p style="font-size:12px;color:#999;">Generato da edilizia.io · ${azienda}</p></div>`;

    const reportSummary = `📋 Report ${cantiere || "Cantiere"} — ${reportDate}\n👷 Operai: ${extracted.operai_presenti?.length || "—"}\n📊 Avanzamento: ${extracted.avanzamento_percentuale || "—"}%\n${extracted.problemi?.length ? "⚠️ " + extracted.problemi.length + " problemi" : "✅ Nessun problema"}`;

    // Deduct AI credits if a real AI call was made (GPT-4o-mini)
    const instanceCompanyId = (instance as any)?.company_id;
    if (openaiKey && transcriptText && extracted.report_completo && instanceCompanyId) {
      await sb.rpc("deduct_call_credits", {
        _company_id: instanceCompanyId,
        _cost_billed: 0.02,
        _cost_real: 0.008,
      });
    }

    log("info", "Report generated", { request_id: rid, fn: FN, instance_id: instanceId });
    return jsonOk({
      ...extracted, report_html: reportHtml, report_summary: reportSummary,
      operaio, cantiere, data: reportDate, instance_id: instanceId,
    }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
