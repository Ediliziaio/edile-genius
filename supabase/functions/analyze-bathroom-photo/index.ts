import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "analyze-bathroom-photo";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const { image_url } = await req.json();
    if (!image_url) return jsonError("image_url required", "validation_error", 400, rid);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY not configured", "system_error", 500, rid);

    const analysisPrompt = `Analizza questa foto di un bagno e rispondi SOLO con JSON valido (nessun testo aggiuntivo, nessun markdown).

Estrai i seguenti campi:

{
  "dimensione_stimata": "piccolo|medio|grande",
  "forma_bagno": "rettangolare|quadrato|irregolare|lungo_stretto",
  "altezza_soffitto": "standard|alto|basso",
  "presenza_vasca": true|false,
  "tipo_vasca_attuale": "incassata|freestanding|angolare|assente",
  "presenza_doccia": true|false,
  "tipo_doccia_attuale": "nicchia_box|walk_in|angolare|vasca_doccia_combo|assente",
  "presenza_box_doccia": true|false,
  "colore_box_attuale": "trasparente|satinato|fume|assente",
  "piastrelle_parete_effetto": "marmo|cemento|ceramica_unita|legno|pietra|mosaico|nessuno",
  "piastrelle_parete_colore_dominante": "bianco|grigio|nero|beige|verde|blu|marrone|altro",
  "piastrelle_parete_formato_stimato": "piccolo_<20cm|medio_20-40cm|grande_>40cm|lastra",
  "pavimento_effetto": "marmo|cemento|ceramica_unita|legno|pietra|mosaico|parquet|nessuno",
  "pavimento_colore_dominante": "bianco|grigio|nero|beige|verde|blu|marrone|altro",
  "presenza_mobile_bagno": true|false,
  "stile_mobile": "moderno|classico|industrial|rustico|assente",
  "colore_mobile_dominante": "bianco|grigio|legno|nero|colorato|assente",
  "presenza_wc": true|false,
  "wc_tipo": "a_terra|sospeso|assente",
  "presenza_bidet": true|false,
  "rubinetteria_finitura": "cromo|nero|oro|bronzo|inox|non_visibile",
  "illuminazione_tipo": "faretti|plafoniera|specchio_led|naturale|mista",
  "finestre_presenti": true|false,
  "stile_generale": "moderno|classico|rustico|industrial|minimal|datato",
  "stato_generale": "buono|discreto|da_rinnovare",
  "note_critiche": "stringa con osservazioni importanti per il render (max 100 parole)"
}

Sii preciso. Se non riesci a determinare un campo con sicurezza, usa null.
Return ONLY valid JSON, no markdown code blocks, no additional text.`;

    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert bathroom analyst for an architectural visualization system. Analyze the photo and return ONLY valid JSON. No explanation, no markdown.",
          },
          {
            role: "user",
            content: [
              { type: "text", text: analysisPrompt },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
      }),
    }, 60_000);

    if (!response.ok) {
      if (response.status === 429) return jsonError("Rate limit exceeded", "rate_limited", 429, rid);
      log("error", "AI Gateway error", { request_id: rid, fn: FN, status: response.status });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      analysis = match ? JSON.parse(match[1]) : { raw: text };
    }

    log("info", "Bathroom photo analyzed", { request_id: rid, fn: FN });
    return jsonOk({ analysis }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
