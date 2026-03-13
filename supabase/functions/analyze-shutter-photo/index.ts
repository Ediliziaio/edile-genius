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

    log("info", "analyze-shutter-photo called", { request_id: requestId, session_id, has_image: !!image_base64 });

    // TODO: Implement actual Vision API call (Gemini/OpenAI)
    // For now return a stub analysis
    const analisi = {
      presenza_persiane: true,
      tipo_persiana_attuale: "veneziana_classica",
      materiale_attuale: "legno",
      colore_persiana: "verde scuro",
      stato_apertura: "chiuso",
      numero_finestre_totali: 4,
      numero_finestre_con_persiane: 4,
      larghezza_lamella_stimata_mm: 80,
      profondita_rivelazione_cm: 12,
      presenza_cassonetto: false,
      stile_architettonico: "residenziale tradizionale",
      colore_infissi: "bianco",
      note_speciali: null,
    };

    return jsonOk({ analisi }, requestId);
  } catch (err) {
    return errorResponse(err, requestId, "analyze-shutter-photo");
  }
});
