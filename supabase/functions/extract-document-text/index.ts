import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    const {
      data: { user },
    } = await supabase.auth.getUser(authToken!);
    if (!user)
      return new Response(JSON.stringify({ error: "Non autenticato" }), {
        status: 401,
        headers: corsHeaders,
      });

    const { documentoId } = await req.json();

    const { data: doc, error: docErr } = await supabase
      .from("preventivo_kb_documenti")
      .select("*")
      .eq("id", documentoId)
      .single();

    if (docErr || !doc)
      return new Response(JSON.stringify({ error: "Documento non trovato" }), {
        status: 404,
        headers: corsHeaders,
      });

    await supabase
      .from("preventivo_kb_documenti")
      .update({ stato: "elaborazione" })
      .eq("id", documentoId);

    // Download file from storage
    const storagePath = doc.file_url;
    const { data: fileData, error: fileErr } = await supabase.storage
      .from("preventivo-kb")
      .download(storagePath);

    if (fileErr || !fileData)
      throw new Error("File non scaricabile: " + fileErr?.message);

    const arrayBuffer = await fileData.arrayBuffer();
    let pagineTesto: Array<{ pagina: number; testo: string }> = [];
    let totalePagine = 0;

    if (doc.file_type === "pdf") {
      // Use Gemini Vision for PDF text extraction
      const uint8 = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < uint8.length; i++) {
        binary += String.fromCharCode(uint8[i]);
      }
      const base64 = btoa(binary);

      const geminiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${Deno.env.get("GEMINI_API_KEY")}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inline_data: {
                      mime_type: "application/pdf",
                      data: base64,
                    },
                  },
                  {
                    text: `Estrai tutto il testo da questo documento PDF mantenendo la struttura logica (titoli, paragrafi, liste, tabelle).
Restituisci un JSON con questa struttura:
{
  "pagine": [
    { "pagina": 1, "testo": "contenuto pagina 1" },
    { "pagina": 2, "testo": "contenuto pagina 2" }
  ],
  "totale_pagine": N
}
Restituisci SOLO il JSON valido, senza markdown.`,
                  },
                ],
              },
            ],
            generationConfig: { temperature: 0, maxOutputTokens: 8192 },
          }),
        }
      );

      if (!geminiRes.ok)
        throw new Error(`Gemini extraction error: ${geminiRes.status}`);

      const geminiData = await geminiRes.json();
      const rawText =
        geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

      try {
        const cleaned = rawText
          .replace(/```json\n?/g, "")
          .replace(/```\n?/g, "")
          .trim();
        const parsed = JSON.parse(cleaned);
        pagineTesto = parsed.pagine || [];
        totalePagine = parsed.totale_pagine || pagineTesto.length;
      } catch {
        pagineTesto = [{ pagina: 1, testo: rawText }];
        totalePagine = 1;
      }
    } else if (doc.file_type === "txt") {
      const testo = new TextDecoder().decode(arrayBuffer);
      pagineTesto = [{ pagina: 1, testo }];
      totalePagine = 1;
    } else {
      pagineTesto = [
        {
          pagina: 1,
          testo: "Documento non supportato per estrazione diretta",
        },
      ];
      totalePagine = 0;
    }

    await supabase
      .from("preventivo_kb_documenti")
      .update({ pagine: totalePagine })
      .eq("id", documentoId);

    return new Response(
      JSON.stringify({ pagineTesto, totalePagine, documentoId }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[extract-document-text]", err);
    const message = err instanceof Error ? err.message : String(err);

    try {
      const body = await req.clone().json();
      if (body?.documentoId) {
        const supabase = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
        );
        await supabase
          .from("preventivo_kb_documenti")
          .update({ stato: "errore", errore_msg: message })
          .eq("id", body.documentoId);
      }
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
