import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const authToken = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(authToken!);
    if (!user)
      return new Response(JSON.stringify({ error: "Non autenticato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const { fotoUrls, oggettoCantiere, preventivoId } = await req.json();

    // Download and convert photos to base64 (max 5)
    const foteParts: Array<{ inline_data: { mime_type: string; data: string } }> = [];
    for (const url of (fotoUrls as string[]).slice(0, 5)) {
      try {
        const res = await fetch(url);
        const buf = await res.arrayBuffer();
        const bytes = new Uint8Array(buf);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        const b64 = btoa(binary);
        const mime = res.headers.get("content-type") || "image/jpeg";
        foteParts.push({ inline_data: { mime_type: mime, data: b64 } });
      } catch {
        /* skip unloadable photos */
      }
    }

    if (foteParts.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nessuna foto caricabile" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const prompt = `Sei un geometra esperto. Analizza queste foto di cantiere/immobile${oggettoCantiere ? ` (${oggettoCantiere})` : ""}.

Stima le superfici principali visibili nelle foto e suggerisci le voci di computo metrico.

Restituisci SOLO un JSON valido con questa struttura:
{
  "superfici": [
    {
      "elemento": "nome elemento (es. pavimento soggiorno, pareti bagno, facciata est)",
      "mq_stimati": 25.5,
      "confidenza": "alta|media|bassa",
      "note": "breve motivazione della stima",
      "foto_ref": "foto_1|foto_2|..."
    }
  ],
  "note_generali": "osservazioni generali sull'immobile e i lavori visibili",
  "suggerimenti_voci": [
    {
      "descrizione": "Fornitura e posa pavimento in gres porcellanato",
      "categoria": "Pavimentazioni",
      "unita": "mq",
      "quantita_suggerita": 25.5
    }
  ]
}

REGOLE:
- Sii conservativo nelle stime (meglio sottostimare che sovrastimare)
- Se non riesci a stimare una superficie con confidenza almeno "bassa", non includerla
- Suggerisci solo voci coerenti con quello che vedi nelle foto
- Per "confidenza alta" la stima è ±10%, media ±25%, bassa ±40%`;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY non configurata" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = {
      contents: [
        {
          role: "user",
          parts: [...foteParts, { text: prompt }],
        },
      ],
      generationConfig: { temperature: 0.2, maxOutputTokens: 2048 },
    };

    const res = await fetch(`${GEMINI_API}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    const rawText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text || "{}";

    let analisi: Record<string, unknown> = {};
    try {
      const cleaned = rawText
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      analisi = JSON.parse(cleaned);
    } catch {
      analisi = {
        superfici: [],
        note_generali: rawText,
        suggerimenti_voci: [],
      };
    }

    // Save to preventivo
    if (preventivoId) {
      await supabase
        .from("preventivi")
        .update({ superfici_stimate: analisi })
        .eq("id", preventivoId);
    }

    return new Response(JSON.stringify({ ok: true, data: { analisi } }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    console.error("[analizza-superfici-preventivo]", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
