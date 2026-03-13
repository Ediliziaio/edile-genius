import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ChunkAndEmbedPayload {
  documentoId: string;
  companyId: string;
  categoria: string;
  pagineTesto: Array<{ pagina: number; testo: string }>;
}

const CHUNK_SIZE = 600;
const CHUNK_OVERLAP = 80;

function splitInChunks(testo: string, size: number, overlap: number): string[] {
  const chunks: string[] = [];
  let start = 0;

  while (start < testo.length) {
    let end = Math.min(start + size, testo.length);

    if (end < testo.length) {
      const lastPeriod = testo.lastIndexOf(". ", end);
      const lastNewline = testo.lastIndexOf("\n", end);
      const breakPoint = Math.max(lastPeriod, lastNewline);
      if (breakPoint > start + size * 0.6) {
        end = breakPoint + 1;
      }
    }

    const chunk = testo.slice(start, end).trim();
    if (chunk.length > 50) {
      chunks.push(chunk);
    }

    start = end - overlap;
  }

  return chunks;
}

async function generateEmbedding(
  testo: string,
  apiKey: string
): Promise<number[]> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "models/text-embedding-004",
        content: { parts: [{ text: testo }] },
        taskType: "RETRIEVAL_DOCUMENT",
      }),
    }
  );

  if (!res.ok)
    throw new Error(`Embedding error: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.embedding.values;
}

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

    const payload: ChunkAndEmbedPayload = await req.json();
    const { documentoId, companyId, categoria, pagineTesto } = payload;

    const apiKey = Deno.env.get("GEMINI_API_KEY")!;
    let totalChunks = 0;
    const chunksToInsert: Array<Record<string, unknown>> = [];

    for (const pagina of pagineTesto) {
      if (!pagina.testo?.trim()) continue;

      const chunks = splitInChunks(pagina.testo, CHUNK_SIZE, CHUNK_OVERLAP);

      for (let i = 0; i < chunks.length; i++) {
        const testo = chunks[i];

        let embedding: number[];
        try {
          embedding = await generateEmbedding(testo, apiKey);
        } catch (embErr) {
          console.warn(
            `Embedding fallito per chunk ${i} pagina ${pagina.pagina}:`,
            embErr
          );
          continue;
        }

        // Rate limiting pause every 5 embeddings
        if (i > 0 && i % 5 === 0) {
          await new Promise((r) => setTimeout(r, 500));
        }

        chunksToInsert.push({
          documento_id: documentoId,
          company_id: companyId,
          testo,
          testo_preview: testo.slice(0, 200),
          pagina: pagina.pagina,
          chunk_index: totalChunks,
          embedding: `[${embedding.join(",")}]`,
          categoria,
        });

        totalChunks++;
      }
    }

    // Delete old chunks (re-indexing)
    await supabase
      .from("preventivo_kb_chunks")
      .delete()
      .eq("documento_id", documentoId);

    // Batch insert in groups of 20
    const BATCH_SIZE = 20;
    for (let i = 0; i < chunksToInsert.length; i += BATCH_SIZE) {
      const batch = chunksToInsert.slice(i, i + BATCH_SIZE);
      const { error: insertErr } = await supabase
        .from("preventivo_kb_chunks")
        .insert(batch);

      if (insertErr) throw insertErr;
    }

    // Update document status
    await supabase
      .from("preventivo_kb_documenti")
      .update({
        stato: "indicizzato",
        indicizzato_at: new Date().toISOString(),
        chunks_count: totalChunks,
      })
      .eq("id", documentoId);

    return new Response(
      JSON.stringify({ success: true, chunks_creati: totalChunks }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[chunk-and-embed]", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});
