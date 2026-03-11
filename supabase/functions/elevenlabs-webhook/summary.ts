import { log } from "../_shared/utils.ts";

interface CallAnalysis {
  summary: string | null;
  main_reason: string | null;
}

/**
 * Generate a 2-3 sentence Italian summary + main_reason extraction
 * using OpenAI gpt-4o-mini. Returns nulls if OPENAI_API_KEY is not set.
 */
export async function generateCallAnalysis(
  transcript: any[],
  requestId: string,
): Promise<CallAnalysis> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    log("info", "OPENAI_API_KEY not set — skipping analysis", { request_id: requestId });
    return { summary: null, main_reason: null };
  }

  if (!transcript || transcript.length === 0) {
    return { summary: null, main_reason: null };
  }

  const text = transcript
    .map((t: any) => {
      const role = t.role === "agent" ? "Agente" : "Cliente";
      return `${role}: ${t.message || t.text || ""}`;
    })
    .join("\n")
    .slice(0, 6000);

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.3,
        max_tokens: 300,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `Sei un assistente che analizza conversazioni telefoniche commerciali per aziende edili italiane. Rispondi SOLO con un JSON valido con due campi:
- "summary": riassunto in 2-3 frasi (argomento, esito, prossimo passo)
- "main_reason": il motivo principale di interesse O di rifiuto del cliente, in una frase breve e chiara (es. "Interessato a ristrutturazione bagno", "Non interessato: ha già un fornitore", "Vuole preventivo per cappotto termico"). Se non è chiaro, scrivi null.`,
          },
          {
            role: "user",
            content: `Analizza questa conversazione:\n\n${text}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      log("warn", "OpenAI API error for analysis", { request_id: requestId, status: res.status });
      return { summary: null, main_reason: null };
    }

    const json = await res.json();
    const content = json.choices?.[0]?.message?.content?.trim();
    if (!content) return { summary: null, main_reason: null };

    try {
      const parsed = JSON.parse(content);
      const summary = parsed.summary || null;
      const main_reason = parsed.main_reason || null;
      log("info", "Analysis generated", { request_id: requestId, has_summary: !!summary, has_reason: !!main_reason });
      return { summary, main_reason };
    } catch {
      // Fallback: treat entire content as summary
      log("warn", "Failed to parse analysis JSON, using as summary", { request_id: requestId });
      return { summary: content, main_reason: null };
    }
  } catch (err) {
    log("warn", "Analysis generation failed", { request_id: requestId, error: (err as Error).message });
    return { summary: null, main_reason: null };
  }
}

// Backward compat alias
export async function generateCallSummary(transcript: any[], requestId: string): Promise<string | null> {
  const result = await generateCallAnalysis(transcript, requestId);
  return result.summary;
}
