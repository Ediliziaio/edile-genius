import { log } from "../_shared/utils.ts";

/**
 * Generate a 2-3 sentence Italian summary of a conversation transcript
 * using OpenAI gpt-4o-mini. Returns null if OPENAI_API_KEY is not set
 * or if generation fails (non-blocking).
 */
export async function generateCallSummary(
  transcript: any[],
  requestId: string,
): Promise<string | null> {
  const apiKey = Deno.env.get("OPENAI_API_KEY");
  if (!apiKey) {
    log("info", "OPENAI_API_KEY not set — skipping summary", { request_id: requestId });
    return null;
  }

  if (!transcript || transcript.length === 0) {
    return null;
  }

  // Build a simple text from transcript entries
  const text = transcript
    .map((t: any) => {
      const role = t.role === "agent" ? "Agente" : "Cliente";
      return `${role}: ${t.message || t.text || ""}`;
    })
    .join("\n")
    .slice(0, 6000); // cap to ~6k chars to keep cost low

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
        max_tokens: 200,
        messages: [
          {
            role: "system",
            content:
              "Sei un assistente che riassume conversazioni telefoniche commerciali per aziende edili italiane. Rispondi SOLO con il riassunto, senza premesse.",
          },
          {
            role: "user",
            content: `Riassumi questa conversazione telefonica in 2-3 frasi in italiano.\nIndica: argomento principale, esito, e prossimo passo se menzionato.\n\n${text}`,
          },
        ],
      }),
    });

    if (!res.ok) {
      log("warn", "OpenAI API error for summary", {
        request_id: requestId,
        status: res.status,
      });
      return null;
    }

    const json = await res.json();
    const summary = json.choices?.[0]?.message?.content?.trim() || null;
    log("info", "Summary generated", { request_id: requestId, length: summary?.length });
    return summary;
  } catch (err) {
    log("warn", "Summary generation failed", {
      request_id: requestId,
      error: (err as Error).message,
    });
    return null;
  }
}
