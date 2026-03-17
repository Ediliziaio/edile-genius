import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
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

    const { preventivoId, templateSezioni, aziendaId } = await req.json();

    // Load preventivo for context
    const { data: prev } = await supabase
      .from("preventivi")
      .select("*")
      .eq("id", preventivoId)
      .single();

    if (!prev) {
      return new Response(
        JSON.stringify({ error: "Preventivo non trovato" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Idempotency guard: reject if already generating
    if (prev.stato === "generazione") {
      return new Response(
        JSON.stringify({ error: "Generazione già in corso", code: "ALREADY_GENERATING" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Conditional update: only if stato hasn't changed (optimistic lock)
    const { data: lockResult } = await supabase
      .from("preventivi")
      .update({ stato: "generazione" })
      .eq("id", preventivoId)
      .neq("stato", "generazione")
      .select("id");

    if (!lockResult || lockResult.length === 0) {
      return new Response(
        JSON.stringify({ error: "Generazione già in corso", code: "ALREADY_GENERATING" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const contesto = {
      clienteNome: prev.cliente_nome,
      progettoNome: prev.titolo,
      indirizzoCantiere: prev.indirizzo_cantiere,
      oggettoLavori: prev.oggetto_lavori,
      tipiRender: (prev.render_ids as string[]) || [],
      superficiStimate: prev.superfici_stimate,
    };

    // Filter to only AI/KB-generated sections
    const sezioniAI = (templateSezioni as Array<Record<string, unknown>>).filter(
      (s) =>
        s.attiva &&
        ["ai_generated", "kb_document"].includes(s.sorgente as string) &&
        !["copertina", "render_visivi", "computo_metrico", "offerta_economica"].includes(
          s.tipo as string
        )
    );

    let successCount = 0;
    const errori: string[] = [];

    for (const sezione of sezioniAI) {
      try {
        const config = sezione.config as Record<string, unknown>;
        const categoriaKb = config?.categoria_kb as string | undefined;
        const queryKb =
          (config?.query_hint as string) ||
          `${sezione.tipo} ${contesto.oggettoLavori || ""} ${(contesto.tipiRender || []).join(" ")}`;

        const { data: sezData, error: sezErr } =
          await supabase.functions.invoke("genera-sezione-preventivo", {
            body: {
              preventivoId,
              sezioneId: sezione.id,
              tipoSezione: sezione.tipo,
              titoloSezione: sezione.titolo,
              config,
              contesto,
              aziendaId,
              categoriaKb,
              queryKb,
            },
            headers: { Authorization: `Bearer ${authToken}` },
          });

        if (!sezErr && sezData) {
          successCount++;
        } else {
          errori.push(
            `${sezione.titolo}: ${sezErr?.message || "Errore generazione"}`
          );
        }

        // Rate limiting pause
        await new Promise((r) => setTimeout(r, 800));
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        errori.push(`${sezione.titolo}: ${msg}`);
      }
    }

    // Update stato to pronto
    await supabase
      .from("preventivi")
      .update({ stato: "pronto" })
      .eq("id", preventivoId);

    return new Response(
      JSON.stringify({
        ok: true,
        data: {
          sezioni_generate: successCount,
          errori: errori.length > 0 ? errori : null,
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    console.error("[genera-preventivo-completo]", err);
    const message = err instanceof Error ? err.message : String(err);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
