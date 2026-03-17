import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GEMINI_API =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent";
const EMBED_API =
  "https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent";

interface Contesto {
  clienteNome?: string;
  progettoNome?: string;
  indirizzoCantiere?: string;
  oggettoLavori?: string;
  tipiRender?: string[];
  descrizioneRender?: string;
  superficiStimate?: {
    superfici?: Array<{
      elemento: string;
      mq_stimati: number;
      confidenza: string;
    }>;
  };
}

interface GeneraSezionePayload {
  preventivoId: string;
  sezioneId: string;
  tipoSezione: string;
  titoloSezione: string;
  config: Record<string, unknown>;
  contesto: Contesto;
  aziendaId: string;
  categoriaKb?: string;
  queryKb?: string;
}

async function generateEmbedding(
  testo: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(`${EMBED_API}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "models/text-embedding-004",
      content: { parts: [{ text: testo }] },
      taskType: "RETRIEVAL_QUERY",
    }),
  });
  const data = await res.json();
  return `[${data.embedding.values.join(",")}]`;
}

const LUNGHEZZA_ISTR: Record<string, string> = {
  breve: "1 paragrafo di 3-5 righe",
  media: "2-3 paragrafi ben strutturati",
  dettagliata: "4-6 paragrafi con sottotitoli se opportuno",
};

const TONO_ISTR: Record<string, string> = {
  formale: "linguaggio formale e professionale",
  professionale: "tono professionale e fiducioso",
  tecnico: "linguaggio tecnico preciso con dettagli specifici",
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
    const { data: { user } } = await supabase.auth.getUser(authToken!);
    if (!user)
      return new Response(JSON.stringify({ error: "Non autenticato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const payload: GeneraSezionePayload = await req.json();
    const {
      preventivoId,
      sezioneId,
      tipoSezione,
      titoloSezione,
      config,
      contesto,
      aziendaId,
      categoriaKb,
      queryKb,
    } = payload;

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey)
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY non configurata" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    let kbContesto = "";
    let chunksUsati: string[] = [];

    // ── RAG: Retrieve KB context ──────────────────────────────────────────
    if (config.usa_kb !== false && aziendaId) {
      const queryText =
        queryKb ||
        `${tipoSezione} ${contesto.oggettoLavori || ""} ${contesto.tipiRender?.join(" ") || ""}`.trim();

      try {
        const embedding = await generateEmbedding(queryText, apiKey);

        const { data: chunks } = await supabase.rpc("search_kb_chunks", {
          p_company_id: aziendaId,
          p_embedding: embedding,
          p_categoria: categoriaKb || null,
          p_top_k: 6,
          p_threshold: 0.68,
        });

        if (chunks?.length > 0) {
          chunksUsati = chunks.map((c: { id: string }) => c.id);
          kbContesto = chunks
            .map(
              (c: { testo: string; similarity: number }, i: number) =>
                `--- Fonte KB ${i + 1} (similarità ${(c.similarity * 100).toFixed(0)}%) ---\n${c.testo}`
            )
            .join("\n\n");
        }
      } catch (err) {
        console.warn("RAG search fallita:", err);
      }
    }

    // ── Build type-specific prompt ────────────────────────────────────────
    const lunghezza =
      LUNGHEZZA_ISTR[(config.lunghezza as string) || "media"] || "2 paragrafi";
    const tono =
      TONO_ISTR[(config.tono as string) || "professionale"] || "tono professionale";
    const istruzioniCustom = config.istruzioni_custom
      ? `Istruzione aggiuntiva: ${config.istruzioni_custom}`
      : "";

    let promptSpecifico = "";

    switch (tipoSezione) {
      case "presentazione_azienda":
        promptSpecifico = kbContesto
          ? `Scrivi la sezione "Chi siamo" per il preventivo, basandoti ESCLUSIVAMENTE su queste informazioni aziendali fornite:\n\n${kbContesto}\n\nNON inventare informazioni non presenti. Usa ${lunghezza} e ${tono}.`
          : `Scrivi una breve presentazione aziendale generica e professionale. Usa 2 paragrafi. Lascia [NOME AZIENDA] come placeholder.`;
        break;

      case "analisi_progetto": {
        const renderInfo = contesto.tipiRender?.length
          ? `Render prodotti: ${contesto.tipiRender.join(", ")}.`
          : "";
        const superficiInfo = contesto.superficiStimate?.superfici?.length
          ? `Superfici stimate: ${contesto.superficiStimate.superfici.map((s) => `${s.elemento}: ~${s.mq_stimati}mq`).join(", ")}.`
          : "";
        promptSpecifico = `Scrivi la sezione "Analisi del progetto" per un preventivo di ristrutturazione.

Dati disponibili:
- Cliente: ${contesto.clienteNome || "non specificato"}
- Progetto: ${contesto.progettoNome || "ristrutturazione"}
- Cantiere: ${contesto.indirizzoCantiere || "non specificato"}
- Lavori previsti: ${contesto.oggettoLavori || "non specificati"}
- ${renderInfo}
- ${superficiInfo}
${kbContesto ? `\nInformazioni aziendali pertinenti:\n${kbContesto}` : ""}

Scrivi ${lunghezza} con ${tono}.
${istruzioniCustom}`;
        break;
      }

      case "descrizione_lavori":
        promptSpecifico = `Scrivi la sezione "Descrizione dei lavori" per il preventivo.

Lavori previsti: ${contesto.oggettoLavori || "ristrutturazione immobile"}
Render prodotti: ${contesto.tipiRender?.join(", ") || "non specificato"}
${
  contesto.superficiStimate?.superfici
    ? `Superfici:\n${contesto.superficiStimate.superfici.map((s) => `- ${s.elemento}: ~${s.mq_stimati}mq (${s.confidenza})`).join("\n")}`
    : ""
}
${kbContesto ? `\nProdotti/materiali disponibili dalla knowledge base:\n${kbContesto}` : ""}

Struttura la risposta come lista di fasi/lavorazioni con dettagli tecnici.
Usa ${lunghezza} con ${tono}.
${istruzioniCustom}`;
        break;

      case "schede_prodotti":
        if (!kbContesto) {
          // No KB data — return placeholder
          const noKbResult = {
            testo:
              "Nessun prodotto trovato nella knowledge base per questo progetto. Aggiungi schede tecniche nella sezione Knowledge Base.",
            chunks_usati: [],
            warning: "KB vuota per la categoria richiesta",
          };
          return new Response(JSON.stringify({ ok: true, data: noKbResult }), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
        promptSpecifico = `Basandoti ESCLUSIVAMENTE sui seguenti estratti dalla knowledge base aziendale,
scrivi una presentazione dei prodotti/materiali più pertinenti per questo progetto.

Lavori previsti: ${contesto.oggettoLavori || "ristrutturazione"}
Render prodotti: ${contesto.tipiRender?.join(", ") || ""}

Estratti knowledge base:
${kbContesto}

Per ogni prodotto pertinente includi: nome, caratteristiche principali, vantaggi.
Presenta SOLO prodotti effettivamente menzionati negli estratti. Non inventare.
Usa un ${tono}.`;
        break;

      case "note_finali":
        promptSpecifico = `Scrivi una sezione conclusiva/ringraziamento per il preventivo.

Cliente: ${contesto.clienteNome || "Gentile Cliente"}
${kbContesto ? `Informazioni aziendali:\n${kbContesto}` : ""}

Usa ${tono}, ${lunghezza}.
Includi una call-to-action professionale.
${istruzioniCustom}`;
        break;

      case "condizioni_contrattuali":
        promptSpecifico = `Scrivi la sezione "Condizioni Contrattuali" per un preventivo edilizio.
${kbContesto ? `\nUsa ESCLUSIVAMENTE queste informazioni contrattuali dalla knowledge base aziendale:\n${kbContesto}\nNON inventare clausole, modalità di pagamento o tempistiche non presenti.` : "\nNessuna informazione contrattuale specifica disponibile nella knowledge base. Scrivi condizioni standard di settore."}

Includi se disponibili: modalità di pagamento, tempistiche lavori, clausole standard, gestione varianti in corso d'opera, validità del preventivo.
Se le informazioni non sono nella KB, usa formule generiche come "da concordare" o "secondo accordi".

Contesto progetto:
- Cliente: ${contesto.clienteNome || "non specificato"}
- Lavori: ${contesto.oggettoLavori || "ristrutturazione"}

Usa ${tono}, ${lunghezza}.
${istruzioniCustom}`;
        break;

      case "garanzie":
        promptSpecifico = `Scrivi la sezione "Garanzie e Assistenza Post-Vendita" per un preventivo edilizio.
${kbContesto ? `\nUsa ESCLUSIVAMENTE queste informazioni sulle garanzie dalla knowledge base aziendale:\n${kbContesto}\nNON inventare durate, coperture o certificazioni non presenti.` : "\nNessuna garanzia specifica nella knowledge base. Usa le garanzie standard di settore: garanzia biennale per difetti di conformità (D.Lgs 206/2005), garanzia decennale per vizi strutturali (art. 1669 c.c.)."}

Includi: garanzia sui lavori eseguiti, garanzia sui materiali, assistenza post-vendita, modalità di segnalazione difetti.

Usa ${tono}, ${lunghezza}.
${istruzioniCustom}`;
        break;

      case "superfici_computo": {
        const superficiData = contesto.superficiStimate?.superfici?.length
          ? `Superfici analizzate da AI:\n${contesto.superficiStimate.superfici.map((s) => `- ${s.elemento}: ~${s.mq_stimati} mq (confidenza: ${s.confidenza})`).join("\n")}`
          : "Nessuna superficie analizzata disponibile.";
        promptSpecifico = `Scrivi la sezione "Analisi Superfici e Computo Metrico" per un preventivo edilizio.

${superficiData}

Cantiere: ${contesto.indirizzoCantiere || "non specificato"}
Lavori previsti: ${contesto.oggettoLavori || "ristrutturazione"}
${kbContesto ? `\nRiferimenti tecnici dalla knowledge base:\n${kbContesto}` : ""}

Presenta le superfici stimate in modo chiaro e professionale.
Se disponibili, indica il livello di confidenza delle stime (alta ±10%, media ±25%, bassa ±40%).
NON inventare metrature non fornite nei dati sopra.

Usa ${tono}, ${lunghezza}.
${istruzioniCustom}`;
        break;
      }

      default:
        promptSpecifico = `Scrivi la sezione "${titoloSezione}" per un preventivo di ristrutturazione.
${kbContesto ? `\nRiferito a questi contenuti aziendali:\n${kbContesto}` : ""}
Usa 2-3 paragrafi con tono professionale.`;
    }

    // ── Call Gemini ───────────────────────────────────────────────────────
    const geminiBody = {
      system_instruction: {
        parts: [
          {
            text: `Sei un consulente esperto in ristrutturazioni edili e interior design.
Scrivi contenuti per preventivi professionali in italiano.
REGOLE:
- Scrivi SOLO il contenuto della sezione richiesta (non titoli, non intestazioni)
- Non includere "[Nome Azienda]" a meno che non sia già nel testo della KB
- Usa un linguaggio preciso e professionale
- Non inventare dati tecnici o di prodotto non forniti
- Output in formato testo semplice (non markdown, non HTML)`,
          },
        ],
      },
      contents: [{ role: "user", parts: [{ text: promptSpecifico }] }],
      generationConfig: { temperature: 0.6, maxOutputTokens: 2048 },
    };

    const geminiRes = await fetch(`${GEMINI_API}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiBody),
    });

    const geminiData = await geminiRes.json();
    const testo =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // ── Save section via read-merge-write ─────────────────────────────────
    if (preventivoId) {
      const { data: prev } = await supabase
        .from("preventivi")
        .select("sezioni_json")
        .eq("id", preventivoId)
        .single();

      const sezioniAttuale =
        (prev?.sezioni_json as Record<string, unknown>) || {};
      sezioniAttuale[sezioneId] = { testo, chunks_usati: chunksUsati };

      await supabase
        .from("preventivi")
        .update({ sezioni_json: sezioniAttuale })
        .eq("id", preventivoId);
    }

    return new Response(
      JSON.stringify({
        ok: true,
        data: { testo, chunks_usati: chunksUsati },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[genera-sezione-preventivo]", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
