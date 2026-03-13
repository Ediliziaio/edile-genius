import { corsHeaders, generateRequestId, jsonOk, jsonError, errorResponse, log } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  const requestId = generateRequestId();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, mime_type, session_id } = await req.json();

    if (!image_base64) {
      return jsonError("image_base64 is required", "validation_error", 400, requestId);
    }

    log("info", "analyze-floor-photo called", { request_id: requestId, session_id });

    // TODO: Implement actual AI analysis (Gemini Vision)
    // For now return a stub analysis
    const stubAnalysis = {
      tipo_pavimento_rilevato: "ceramica",
      pattern_rilevato: "rettilineo_dritto",
      finitura_rilevata: "opaco",
      stato_pavimento: "buono",
      colore_approssimativo: { hex: "#B0A89A", name: "Beige chiaro" },
      tipo_stanza: "soggiorno",
      dimensione_stimata_mm: "60x60",
      larghezza_fuga_stimata_mm: 3,
      luminosita: "media",
      note_ai: "Pavimento in ceramica beige con posa rettilinea. Ambiente luminoso, arredato.",
      confidence: 0.85,
    };

    return jsonOk({ ok: true, data: stubAnalysis }, requestId);
  } catch (err) {
    return errorResponse(err, requestId, "analyze-floor-photo");
  }
});
