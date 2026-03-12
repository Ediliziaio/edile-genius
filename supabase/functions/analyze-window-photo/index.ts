import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "analyze-window-photo";

  try {
    // Auth validation — prevent unauthorized AI credit consumption
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) return jsonError("Unauthorized", "auth_error", 401, rid);

    const { image_url } = await req.json();
    if (!image_url) return jsonError("image_url required", "validation_error", 400, rid);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return jsonError("LOVABLE_API_KEY not configured", "system_error", 500, rid);

    // 60s timeout — no retry (expensive AI call)
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert window and building analyst for an architectural visualization system. Analyze the photo and return a JSON object with ALL of the following fields. Be precise and technical.

Required JSON fields:
- tipo_apertura: one of "battente_1_anta", "battente_2_ante", "battente_3_ante", "scorrevole", "scorrevole_alzante", "vasistas", "anta_ribalta", "bilico", "fisso", "portafinestra", "cassonetto_integrato"
- materiale_attuale: one of "legno_vecchio", "legno_verniciato", "alluminio_anodizzato", "alluminio_verniciato", "pvc_bianco", "pvc_colorato", "ferro", "acciaio", "sconosciuto"
- colore_attuale: string describing the current frame color
- condizioni: one of "buone", "usurato", "danneggiato", "fatiscente"
- num_ante_attuale: integer
- spessore_telaio: string estimate
- presenza_cassonetto: boolean
- tipo_cassonetto: string
- tipo_vetro_attuale: string
- stile_edificio: one of "moderno", "classico", "industriale", "rurale", "liberty", "anni_60_70", "contemporaneo", "storico"
- materiale_muro: string
- colore_muro: string
- presenza_davanzale: boolean
- presenza_inferriata: boolean
- piano: string
- luce: string
- angolo_ripresa: string
- note_aggiuntive: string

Return ONLY valid JSON, no markdown code blocks, no additional text.`,
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analizza le finestre/porte in questa foto dell'edificio. Fornisci un'analisi dettagliata e strutturata." },
              { type: "image_url", image_url: { url: image_url } },
            ],
          },
        ],
      }),
    }, 60_000);

    if (!response.ok) {
      if (response.status === 429) {
        return jsonError("Rate limit exceeded", "rate_limited", 429, rid);
      }
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

    log("info", "Window photo analyzed", { request_id: rid, fn: FN });
    return jsonOk({ analysis }, rid);
  } catch (err) {
    return errorResponse(err, rid, FN);
  }
});
