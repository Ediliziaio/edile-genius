import { log } from "../_shared/utils.ts";

interface CallAnalysis {
  summary: string | null;
  main_reason: string | null;
  outcome_ai: string | null;
  next_step: string | null;
}

const VALID_OUTCOMES = [
  "appointment", "qualified", "callback", "not_interested",
  "voicemail", "no_answer", "wrong_number", "do_not_call",
];

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

/**
 * Generate call analysis: summary, main_reason, outcome classification, next_step.
 * Uses Lovable AI Gateway with google/gemini-2.5-flash.
 */
export async function generateCallAnalysis(
  transcript: any[],
  requestId: string,
): Promise<CallAnalysis> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) {
    log("info", "LOVABLE_API_KEY not set — skipping analysis", { request_id: requestId });
    return { summary: null, main_reason: null, outcome_ai: null, next_step: null };
  }

  if (!transcript || transcript.length === 0) {
    return { summary: null, main_reason: null, outcome_ai: null, next_step: null };
  }

  const text = transcript
    .map((t: any) => {
      const role = t.role === "agent" ? "Agente" : "Cliente";
      return `${role}: ${t.message || t.text || ""}`;
    })
    .join("\n")
    .slice(0, 6000);

  try {
    const res = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.3,
        max_tokens: 400,
        messages: [
          {
            role: "system",
            content: `Sei un assistente che analizza conversazioni telefoniche commerciali per aziende edili italiane. Rispondi SOLO con un JSON valido con quattro campi:
- "summary": riassunto in 2-3 frasi (argomento, esito, prossimo passo)
- "main_reason": il motivo principale di interesse O di rifiuto del cliente, in una frase breve (es. "Interessato a ristrutturazione bagno", "Non interessato: ha già un fornitore"). Se non è chiaro, null.
- "outcome": classifica la conversazione in UNA di queste categorie ESATTE: "appointment" (appuntamento fissato), "qualified" (interessato, da ricontattare), "callback" (chiede di essere richiamato), "not_interested" (non interessato), "voicemail" (segreteria/nessuna risposta umana), "no_answer" (non ha risposto), "wrong_number" (numero sbagliato), "do_not_call" (chiede di non essere più contattato). Se non riesci a classificare, scrivi null.
- "next_step": una frase breve con l'azione suggerita per il commerciale (es. "Richiamare lunedì per confermare appuntamento", "Inviare preventivo via email", "Rimuovere dal database"). Se non applicabile, null.`,
          },
          {
            role: "user",
            content: `Analizza questa conversazione:\n\n${text}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      log("warn", "AI Gateway error for analysis", { request_id: requestId, status: res.status });
      return { summary: null, main_reason: null, outcome_ai: null, next_step: null };
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) return { summary: null, main_reason: null, outcome_ai: null, next_step: null };

    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      const parsed = JSON.parse(cleaned);
      const summary = parsed.summary || null;
      const main_reason = parsed.main_reason || null;
      const outcome_ai = VALID_OUTCOMES.includes(parsed.outcome) ? parsed.outcome : null;
      const next_step = parsed.next_step || null;
      log("info", "Analysis generated", {
        request_id: requestId,
        has_summary: !!summary,
        has_reason: !!main_reason,
        outcome_ai,
        has_next_step: !!next_step,
      });
      return { summary, main_reason, outcome_ai, next_step };
    } catch {
      log("warn", "Failed to parse analysis JSON, using as summary", { request_id: requestId });
      return { summary: content, main_reason: null, outcome_ai: null, next_step: null };
    }
  } catch (err) {
    log("warn", "Analysis generation failed", { request_id: requestId, error: (err as Error).message });
    return { summary: null, main_reason: null, outcome_ai: null, next_step: null };
  }
}

// Backward compat alias
export async function generateCallSummary(transcript: any[], requestId: string): Promise<string | null> {
  const result = await generateCallAnalysis(transcript, requestId);
  return result.summary;
}

/**
 * Generate a CRM-oriented Italian summary for a call.
 * Shorter and action-focused compared to generateCallAnalysis.
 */
export async function generateItalianCallSummary(
  transcript: Array<{ role: string; message?: string; text?: string }>,
  contactName: string,
  outcome: string,
): Promise<string> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey || transcript.length === 0) return "";

  const transcriptText = transcript
    .map((t) => `${t.role === "agent" ? "AI" : contactName}: ${t.message || t.text || ""}`)
    .join("\n")
    .slice(0, 4000);

  const outcomeLabel: Record<string, string> = {
    answered: "risposto",
    no_answer: "non risposto",
    busy: "occupato",
    voicemail: "segreteria",
    failed: "fallita",
  };

  try {
    const response = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        max_tokens: 200,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "Sei un assistente CRM. Riassumi le chiamate in italiano in modo conciso (max 3 frasi). Indica: esito principale, interesse del cliente, e azione successiva suggerita.",
          },
          {
            role: "user",
            content: `Chiamata ${outcomeLabel[outcome] || outcome} con ${contactName}:\n\n${transcriptText}\n\nRiassumi in 2-3 frasi.`,
          },
        ],
      }),
    });

    if (!response.ok) return "";
    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? "";
  } catch {
    return "";
  }
}
