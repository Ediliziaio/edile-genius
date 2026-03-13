import { corsHeaders, generateRequestId, jsonOk, jsonError, errorResponse, log, fetchWithTimeout } from "../_shared/utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANALYSIS_PROMPT = `Analyze this interior room photograph in detail and return a JSON analysis.

Return ONLY valid JSON with this exact structure:
{
  "tipo_stanza": "cucina|soggiorno|camera_da_letto|bagno|studio|ingresso|taverna|sala_da_pranzo|corridoio|altro",
  "stile_attuale": "moderno|scandinavo|industriale|classico|rustico|minimalista|mediterraneo|art_deco|giapponese|provenzale|eclettico|misto|non_definito",
  "condizione_generale": "nuovo|buono|da_rinnovare|da_ristrutturare",
  "pareti": {
    "colore_principale": "descrizione colore pareti dominante",
    "colore_hex": "#RRGGBB",
    "finitura": "liscia|stucco_veneziano|boiserie|mattone|cemento|carta_da_parati|piastrelle|altro",
    "numero_pareti_visibili": 1,
    "presenza_carta_da_parati": false,
    "presenza_rivestimento": false
  },
  "pavimento": {
    "tipo": "parquet|laminato|ceramica|gres_porcellanato|marmo|pietra|vinile|cotto|cemento|moquette|nudo|altro",
    "colore": "descrizione colore pavimento",
    "colore_hex": "#RRGGBB",
    "pattern": "a_correre|spina_di_pesce|rettilineo|diagonale|opus_incertum|altro",
    "condizione": "nuovo|buono|usurato|da_cambiare"
  },
  "soffitto": {
    "colore": "bianco|avorio|colorato|altro",
    "altezza_stimata": "basso_240|medio_270|alto_300|altissimo_350",
    "tipo": "piano|controsoffitto|travi_a_vista|volta|altro",
    "presenza_cornici": false
  },
  "arredo": {
    "stile": "moderno|classico|rustico|industriale|scandinavo|misto|assente",
    "colore_dominante": "descrizione colore mobili principali",
    "materiale_dominante": "legno|metallo|laminato|vetro|vimini|misto",
    "densita": "vuota|minima|media|piena|sovraffollata",
    "elementi_principali": ["divano", "tavolo", "libreria"]
  },
  "illuminazione": {
    "tipo_principale": "naturale|artificiale|mista",
    "temperatura_stimata": "calda|neutra|fredda",
    "sorgenti_visibili": ["lampadario_centrale", "lampade_terra"],
    "luminosita_ambiente": "molto_luminoso|luminoso|medio|scarso|buio"
  },
  "caratteristiche_speciali": {
    "presenza_finestre": true,
    "numero_finestre_visibili": 1,
    "presenza_camino": false,
    "presenza_travi": false,
    "presenza_colonne": false,
    "presenza_nicchie": false,
    "presenza_arco": false
  },
  "colore_dominante_generale": "#RRGGBB",
  "palette_principale": ["#RRGGBB", "#RRGGBB", "#RRGGBB"],
  "interventi_suggeriti": ["verniciatura_pareti", "nuovo_pavimento", "cambio_arredo"],
  "note_speciali": "osservazioni rilevanti o null"
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "analyze-room-photo";

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const { image_base64, mime_type, session_id } = await req.json();
    if (!image_base64 || !mime_type) return jsonError("image_base64 and mime_type required", "validation_error", 400, rid);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY not configured", "system_error", 500, rid);

    log("info", "Analyzing room photo", { request_id: rid, fn: FN, session_id });

    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: ANALYSIS_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Analizza questa stanza in dettaglio. Fornisci un'analisi strutturata completa." },
              { type: "image_url", image_url: { url: `data:${mime_type};base64,${image_base64}` } },
            ],
          },
        ],
      }),
    }, 60_000);

    if (!response.ok) {
      if (response.status === 429) return jsonError("Rate limit exceeded", "rate_limited", 429, rid);
      if (response.status === 402) return jsonError("Payment required", "payment_required", 402, rid);
      log("error", "AI Gateway error", { request_id: rid, fn: FN, status: response.status });
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    let analisi;
    try {
      analisi = JSON.parse(text);
    } catch {
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (match) {
        analisi = JSON.parse(match[1]);
      } else {
        const objMatch = text.match(/\{[\s\S]*\}/);
        analisi = objMatch ? JSON.parse(objMatch[0]) : { raw: text };
      }
    }

    // Update session if provided
    if (session_id) {
      const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
      await supa.from("render_stanza_sessions")
        .update({ analisi_json: analisi, tipo_stanza: analisi?.tipo_stanza ?? null, status: "analyzing" })
        .eq("id", session_id);
    }

    log("info", "Room photo analyzed", { request_id: rid, fn: FN });
    return jsonOk({ analisi }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
