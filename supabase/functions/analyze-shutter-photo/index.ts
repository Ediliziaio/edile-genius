import { corsHeaders, generateRequestId, jsonOk, jsonError, errorResponse, log, fetchWithTimeout } from "../_shared/utils.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ANALYSIS_PROMPT = `Analizza questa foto di una facciata con finestre (con o senza persiane) e restituisci un JSON con questa struttura esatta:
{
  "presenza_persiane": boolean,
  "tipo_persiana_attuale": "veneziana_classica" | "scuro_pieno" | "gelosia" | "avvolgibile_esterno" | "fiorentina" | "nessuna",
  "materiale_attuale": "legno" | "alluminio" | "pvc" | "ferro" | "sconosciuto",
  "colore_persiana": "descrizione colore in italiano",
  "stato_apertura": "aperto" | "chiuso" | "socchiuso",
  "numero_finestre_totali": number,
  "numero_finestre_con_persiane": number,
  "larghezza_lamella_stimata_mm": number,
  "profondita_rivelazione_cm": number,
  "presenza_cassonetto": boolean,
  "stile_architettonico": "descrizione stile edificio",
  "colore_infissi": "descrizione colore finestre",
  "note_speciali": "eventuali note su elementi particolari" | null
}
Rispondi SOLO con il JSON valido, senza markdown o testo aggiuntivo.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "analyze-shutter-photo";

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
    if (!image_base64) return jsonError("image_base64 is required", "validation_error", 400, rid);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY not configured", "system_error", 500, rid);

    log("info", "Analyzing shutter photo", { request_id: rid, fn: FN, session_id });

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
              { type: "text", text: "Analizza questa facciata e le sue persiane/finestre in dettaglio." },
              { type: "image_url", image_url: { url: `data:${mime_type || "image/jpeg"};base64,${image_base64}` } },
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
      await supa.from("render_persiane_sessions")
        .update({ analisi_json: analisi, status: "analyzed" } as any)
        .eq("id", session_id);
    }

    log("info", "Shutter photo analyzed", { request_id: rid, fn: FN });
    return jsonOk({ analisi }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
