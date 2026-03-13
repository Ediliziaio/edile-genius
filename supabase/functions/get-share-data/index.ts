import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Allowed gallery tables to prevent SQL injection
const ALLOWED_TABLES = new Set([
  "render_gallery",
  "render_stanza_gallery",
  "render_facciata_gallery",
  "render_persiane_gallery",
  "render_pavimento_gallery",
  "render_bagno_gallery",
]);

// Column mapping per table (result url + original url)
const TABLE_COLUMNS: Record<string, { result: string; original: string; title: string }> = {
  render_gallery: { result: "render_url", original: "original_url", title: "titolo" },
  render_stanza_gallery: { result: "result_image_url", original: "original_image_url", title: "titolo" },
  render_facciata_gallery: { result: "result_image_url", original: "original_image_url", title: "titolo" },
  render_persiane_gallery: { result: "result_image_url", original: "original_image_url", title: "titolo" },
  render_pavimento_gallery: { result: "result_image_url", original: "original_image_url", title: "titolo" },
  render_bagno_gallery: { result: "result_image_url", original: "original_image_url", title: "titolo" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const shareToken = url.searchParams.get("token");

    if (!shareToken) {
      return new Response(JSON.stringify({ error: "Token mancante" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Fetch share link
    const { data: shareLink, error: linkErr } = await supabase
      .from("render_share_links")
      .select("*")
      .eq("token", shareToken)
      .eq("attivo", true)
      .single();

    if (linkErr || !shareLink) {
      return new Response(JSON.stringify({ error: "Link non trovato o disattivato" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check expiry
    if (shareLink.scade_il && new Date(shareLink.scade_il) < new Date()) {
      return new Response(JSON.stringify({ error: "Link scaduto" }), {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch company branding
    const { data: company } = await supabase
      .from("companies")
      .select("id, name, logo_url, website, phone, email")
      .eq("id", shareLink.company_id)
      .single();

    // Fetch gallery items from their respective tables
    const galleryItems: Array<{
      table: string;
      id: string;
    }> = Array.isArray(shareLink.gallery_items) ? shareLink.gallery_items : [];

    const renders: Array<{
      id: string;
      modulo: string;
      result_url: string | null;
      original_url: string | null;
      titolo: string | null;
    }> = [];

    // Group items by table for efficient querying
    const grouped: Record<string, string[]> = {};
    for (const item of galleryItems) {
      if (!ALLOWED_TABLES.has(item.table)) continue;
      if (!grouped[item.table]) grouped[item.table] = [];
      grouped[item.table].push(item.id);
    }

    for (const [tableName, ids] of Object.entries(grouped)) {
      const cols = TABLE_COLUMNS[tableName];
      if (!cols) continue;

      const { data: rows } = await supabase
        .from(tableName)
        .select(`id, ${cols.result}, ${cols.original}, ${cols.title}`)
        .in("id", ids);

      if (rows) {
        for (const row of rows) {
          renders.push({
            id: row.id,
            modulo: tableName.replace("render_", "").replace("_gallery", ""),
            result_url: row[cols.result] || null,
            original_url: shareLink.mostra_before ? (row[cols.original] || null) : null,
            titolo: row[cols.title] || null,
          });
        }
      }
    }

    // Increment views (fire and forget)
    supabase
      .from("render_share_links")
      .update({
        views_count: (shareLink.views_count || 0) + 1,
        ultima_visita_at: new Date().toISOString(),
      })
      .eq("id", shareLink.id)
      .then(() => {});

    const responseData = {
      shareLink: {
        id: shareLink.id,
        nome_destinatario: shareLink.nome_destinatario,
        messaggio: shareLink.messaggio,
        titolo_pagina: shareLink.titolo_pagina,
        mostra_before: shareLink.mostra_before,
        colore_header: shareLink.colore_header,
        scade_il: shareLink.scade_il,
      },
      azienda: company
        ? {
            nome: company.name,
            logo_url: company.logo_url,
            colore_primario: shareLink.colore_header || "#6D28D9",
            sito_web: company.website,
            email_contatto: company.email,
            telefono: company.phone,
          }
        : null,
      renders,
    };

    return new Response(JSON.stringify({ ok: true, data: responseData }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("get-share-data error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
