import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: claims, error: authErr } = await supabase.auth.getUser();
    if (authErr || !claims?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const { company_id, waba_id } = await req.json();
    if (!company_id || !waba_id) {
      return new Response(JSON.stringify({ error: "company_id and waba_id required" }), { status: 400, headers: corsHeaders });
    }

    const adminClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get access token
    const { data: wabaConfig } = await adminClient
      .from("whatsapp_waba_config")
      .select("access_token_encrypted")
      .eq("company_id", company_id)
      .eq("waba_id", waba_id)
      .single();

    if (!wabaConfig?.access_token_encrypted) {
      return new Response(JSON.stringify({ error: "WABA not configured" }), { status: 400, headers: corsHeaders });
    }

    // Fetch templates from Meta
    const metaRes = await fetch(
      `https://graph.facebook.com/v21.0/${waba_id}/message_templates?limit=100`,
      {
        headers: { Authorization: `Bearer ${wabaConfig.access_token_encrypted}` },
      }
    );

    const metaData = await metaRes.json();

    if (!metaRes.ok) {
      return new Response(JSON.stringify({ error: "Meta API error", details: metaData }), {
        status: metaRes.status,
        headers: corsHeaders,
      });
    }

    // Upsert templates
    const templates = (metaData.data || []).map((t: any) => ({
      company_id,
      meta_template_id: t.id,
      name: t.name,
      category: t.category,
      language: t.language,
      status: t.status,
      components: t.components || [],
      rejection_reason: t.rejected_reason || null,
    }));

    if (templates.length > 0) {
      const { error } = await adminClient
        .from("whatsapp_templates")
        .upsert(templates, { onConflict: "company_id,name,language" });

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
      }
    }

    return new Response(JSON.stringify({ success: true, synced: templates.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("templates-sync error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), { status: 500, headers: corsHeaders });
  }
});
