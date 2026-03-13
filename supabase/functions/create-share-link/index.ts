import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Non autenticato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Non autenticato" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get company_id from profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", user.id)
      .single();

    if (!profile?.company_id) {
      return new Response(JSON.stringify({ error: "Nessuna azienda associata" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const payload = await req.json();
    const {
      galleryItems,
      nomeDestinatario,
      emailDestinatario,
      messaggio,
      scadenzaGiorni,
      titoloPagina,
      coloreHeader,
      mostraBefore = true,
    } = payload;

    if (!galleryItems || !Array.isArray(galleryItems) || galleryItems.length === 0) {
      return new Response(JSON.stringify({ error: "galleryItems richiesto" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate 32-byte crypto token → base64url
    const randomBytes = new Uint8Array(32);
    crypto.getRandomValues(randomBytes);
    const shareToken = btoa(String.fromCharCode(...randomBytes))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");

    const scadeIl = scadenzaGiorni
      ? new Date(Date.now() + scadenzaGiorni * 24 * 60 * 60 * 1000).toISOString()
      : null;

    const { data: shareLink, error } = await supabase
      .from("render_share_links")
      .insert({
        company_id: profile.company_id,
        created_by: user.id,
        token: shareToken,
        gallery_items: galleryItems,
        nome_destinatario: nomeDestinatario || null,
        email_destinatario: emailDestinatario || null,
        messaggio: messaggio || null,
        scade_il: scadeIl,
        titolo_pagina: titoloPagina || null,
        colore_header: coloreHeader || null,
        mostra_before: mostraBefore,
        attivo: true,
        views_count: 0,
      })
      .select("id, token")
      .single();

    if (error) throw error;

    return new Response(
      JSON.stringify({
        ok: true,
        data: { token: shareToken, id: shareLink.id },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("create-share-link error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
