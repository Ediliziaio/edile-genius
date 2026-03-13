import { corsHeaders, generateRequestId, jsonOk, jsonError, errorResponse, log } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  const requestId = generateRequestId();

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image_base64, mime_type, prompt, system_prompt, session_id, target_width, target_height } = await req.json();

    if (!image_base64 || !prompt) {
      return jsonError("image_base64 and prompt are required", "validation_error", 400, requestId);
    }

    log("info", "generate-shutter-render called", {
      request_id: requestId,
      session_id,
      target_width,
      target_height,
      prompt_length: prompt?.length,
    });

    // TODO: Implement actual AI render generation (Gemini Image / GPT-Image-1)
    // For now return a stub result
    return jsonError(
      "Generazione render non ancora implementata. Configura il provider AI in SuperAdmin > Config Render AI.",
      "provider_error",
      501,
      requestId
    );
  } catch (err) {
    return errorResponse(err, requestId, "generate-shutter-render");
  }
});
