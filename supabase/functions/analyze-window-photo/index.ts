import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { image_url } = await req.json();
    if (!image_url) throw new Error("image_url required");

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert window and building analyst for an architectural visualization system. Analyze the photo and return a JSON object with ALL of the following fields. Be precise and technical.

Required JSON fields:
- tipo_apertura: one of "battente_1_anta", "battente_2_ante", "battente_3_ante", "scorrevole", "scorrevole_alzante", "vasistas", "anta_ribalta", "bilico", "fisso", "portafinestra", "cassonetto_integrato"
- materiale_attuale: one of "legno_vecchio", "legno_verniciato", "alluminio_anodizzato", "alluminio_verniciato", "pvc_bianco", "pvc_colorato", "ferro", "acciaio", "sconosciuto"
- colore_attuale: string describing the current frame color (e.g., "bianco ingiallito", "marrone scuro", "grigio argento")
- condizioni: one of "buone", "usurato", "danneggiato", "fatiscente"
- num_ante_attuale: integer (number of window panels/leaves visible)
- spessore_telaio: string estimate (e.g., "circa 60mm", "circa 80mm")
- presenza_cassonetto: boolean (is there a roller shutter box above the window?)
- tipo_cassonetto: string (e.g., "esterno sporgente", "a filo muro", "integrato", "assente")
- tipo_vetro_attuale: string (e.g., "vetro singolo", "doppio vetro", "triplo vetro", "vetro con piombature")
- stile_edificio: one of "moderno", "classico", "industriale", "rurale", "liberty", "anni_60_70", "contemporaneo", "storico"
- materiale_muro: string (e.g., "intonaco", "mattone faccia vista", "pietra naturale", "cemento grezzo")
- colore_muro: string (e.g., "bianco sporco", "giallo ocra", "grigio chiaro")
- presenza_davanzale: boolean
- presenza_inferriata: boolean
- piano: string (e.g., "piano terra", "primo piano", "secondo piano")
- luce: string (e.g., "luce diretta mattutina", "luce diffusa nuvoloso", "controluce", "ombra parziale")
- angolo_ripresa: string (e.g., "frontale", "angolo 30° da sinistra", "dal basso verso alto")
- note_aggiuntive: string (any additional relevant observations about the window, surroundings, or special features)

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
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error(`AI error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";

    // Parse JSON from response
    let analysis;
    try {
      analysis = JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown code block
      const match = text.match(/```(?:json)?\s*([\s\S]*?)```/);
      analysis = match ? JSON.parse(match[1]) : { raw: text };
    }

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("analyze-window-photo error:", err);
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
