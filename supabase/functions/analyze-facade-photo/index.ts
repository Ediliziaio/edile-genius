import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "analyze-facade-photo";

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

    const analysisPrompt = `Analyze this photograph of an Italian building facade and extract the following information as JSON.
Be precise and conservative — only report what you can clearly see.

Return EXACTLY this JSON structure (no markdown, no explanation):
{
  "tipo_edificio": "string — one of: villa_unifamiliare | condominio_residenziale | edificio_storico | capannone_industriale | negozio_commerciale | altro",
  "numero_piani_visibili": "number — count of visible floors",
  "numero_finestre_visibili": "number — approximate count",
  "intonaco_tipo_attuale": "string — one of: liscio | graffiato_fine | graffiato_medio | rasato | bucciato | strutturato | rustico | bugnato | non_visibile",
  "intonaco_colore_attuale": "string — describe the current plaster color in Italian (es: 'beige chiaro', 'bianco sporco', 'ocra gialla', 'grigio perla')",
  "intonaco_colore_hex": "string — best approximation hex color of the current plaster",
  "presenza_rivestimento_pietra": "boolean — true if any stone cladding is visible",
  "tipo_rivestimento_pietra": "string | null — describe stone type if present",
  "zona_rivestimento_pietra": "string | null — where: zoccolatura | piano_terra | tutta | cantonali | null",
  "presenza_laterizio": "boolean — true if exposed brick is visible",
  "tipo_laterizio": "string | null — describe brick type if present",
  "presenza_cornici_finestre": "boolean — true if window surrounds/frames are visible",
  "colore_cornici": "string | null — color of window surrounds if present",
  "presenza_marcapiani": "boolean — true if horizontal dividing bands between floors are visible",
  "presenza_zoccolatura": "boolean — true if a base plinth/socle zone is visible",
  "presenza_balconi": "boolean",
  "presenza_cappotto_esistente": "boolean — true if thermal insulation coat appears already installed (deep window reveals)",
  "profondita_rivelazione_stimata_cm": "number — estimate window reveal depth in cm (typical: 5-15cm without cappotto, 15-35cm with cappotto)",
  "colore_serramenti_attuale": "string — color of the existing windows/doors (es: 'bianco', 'marrone', 'grigio antracite')",
  "stato_conservazione": "string — one of: ottimo | buono | discreto | deteriorato | pessimo",
  "orientamento_foto": "string — one of: frontale | angolo_sinistro | angolo_destro | prospettiva",
  "note_speciali": "string | null — any notable architectural features that would affect rendering"
}`;

    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are an expert building facade analyst for an architectural visualization system. Analyze the photo and return ONLY valid JSON. No explanation, no markdown.",
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
      if (response.status === 402) return jsonError("AI credits exhausted", "insufficient_credits", 402, rid);
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
      if (match) {
        analysis = JSON.parse(match[1]);
      } else {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        analysis = jsonMatch ? JSON.parse(jsonMatch[0]) : { raw: text };
      }
    }

    log("info", "Facade photo analyzed", { request_id: rid, fn: FN });
    return jsonOk({ analysis }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
