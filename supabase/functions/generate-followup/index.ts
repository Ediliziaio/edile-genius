import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

/**
 * Generate a follow-up message suggestion for a contact or preventivo.
 * Uses OpenAI gpt-4o-mini to draft a WhatsApp/email message.
 */
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "generate-followup";

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return jsonError("Unauthorized", "auth_error", 401, rid);

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) return jsonError("OPENAI_API_KEY non configurata", "system_error", 500, rid);

    const { context_type, context } = await req.json();
    // context_type: "contact" | "preventivo"
    // context: { name, last_conversation_summary, preventivo_titolo, preventivo_importo, days_since, ... }

    if (!context_type || !context) {
      return jsonError("context_type and context required", "validation_error", 400, rid);
    }

    let systemPrompt: string;
    let userPrompt: string;

    if (context_type === "contact") {
      systemPrompt = "Sei un assistente commerciale per un'azienda edile italiana. Scrivi messaggi di follow-up brevi, professionali e cordiali in italiano. Il messaggio deve essere pronto per essere inviato via WhatsApp o email. Non usare oggetto o intestazioni.";
      userPrompt = `Genera un messaggio di follow-up per il contatto "${context.name}".
${context.last_conversation_summary ? `Ultima conversazione: ${context.last_conversation_summary}` : ""}
${context.days_since ? `Ultimo contatto: ${context.days_since} giorni fa` : ""}
${context.outcome ? `Esito ultima chiamata: ${context.outcome}` : ""}
${context.notes ? `Note: ${context.notes}` : ""}

Il messaggio deve essere breve (3-5 frasi), cordiale e orientato a riprendere il contatto.`;
    } else if (context_type === "preventivo") {
      systemPrompt = "Sei un assistente commerciale per un'azienda edile italiana. Scrivi messaggi di follow-up brevi per preventivi inviati. Il messaggio deve essere pronto per essere inviato via WhatsApp. Non usare oggetto o intestazioni.";
      userPrompt = `Genera un messaggio di follow-up per il preventivo "${context.preventivo_titolo || "senza titolo"}".
Cliente: ${context.cliente_nome || "cliente"}
Importo: €${context.importo || "N/D"}
Inviato: ${context.days_since || "?"} giorni fa
${context.notes ? `Note: ${context.notes}` : ""}

Il messaggio deve essere breve (3-4 frasi), professionale e orientato a ottenere una risposta.`;
    } else {
      return jsonError("context_type must be 'contact' or 'preventivo'", "validation_error", 400, rid);
    }

    const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${openaiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        max_tokens: 300,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    }, 15_000);

    if (!res.ok) {
      log("error", "OpenAI error", { request_id: rid, fn: FN, status: res.status });
      return jsonError("Errore generazione messaggio", "provider_error", 502, rid);
    }

    const json = await res.json();
    const message = json.choices?.[0]?.message?.content?.trim() || "";

    log("info", "Follow-up generated", { request_id: rid, fn: FN, context_type, length: message.length });
    return jsonOk({ message }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
