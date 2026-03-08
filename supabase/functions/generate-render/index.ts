import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { session_id } = await req.json();
    if (!session_id) throw new Error("session_id required");

    // Load session
    const { data: session, error: sessErr } = await supabase
      .from("render_sessions")
      .select("*")
      .eq("id", session_id)
      .single();
    if (sessErr || !session) throw new Error("Session not found");

    // Generate signed URL for the private bucket image
    const originalUrl: string = session.original_photo_url;
    const bucketPrefix = "/storage/v1/object/public/render-originals/";
    const pathIndex = originalUrl.indexOf(bucketPrefix);
    if (pathIndex === -1) throw new Error("Cannot extract path from original_photo_url");
    const filePath = originalUrl.substring(pathIndex + bucketPrefix.length);

    const { data: signedData, error: signedErr } = await supabase.storage
      .from("render-originals")
      .createSignedUrl(filePath, 3600);
    if (signedErr || !signedData?.signedUrl) throw new Error("Failed to create signed URL");
    const imageUrl = signedData.signedUrl;

    // Check credits
    const { data: credits } = await supabase
      .from("render_credits")
      .select("balance")
      .eq("company_id", session.company_id)
      .single();
    if (!credits || credits.balance <= 0) {
      await supabase.from("render_sessions").update({
        status: "failed",
        error_message: "Crediti render esauriti",
      }).eq("id", session_id);
      return new Response(JSON.stringify({ error: "No render credits" }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Update status to processing
    await supabase.from("render_sessions").update({
      status: "processing",
      processing_started_at: new Date().toISOString(),
    }).eq("id", session_id);

    // Get default provider config
    const { data: providerConfig } = await supabase
      .from("render_provider_config")
      .select("*")
      .eq("is_default", true)
      .eq("is_active", true)
      .single();

    if (!providerConfig) throw new Error("No active provider configured");

    const config = session.config || {};
    const fragments = config.fragments || {};

    // Build prompt
    const parts: string[] = [];
    for (const val of Object.values(fragments)) {
      if (val && typeof val === "string") parts.push(val);
    }
    if (config.notes) parts.push(config.notes);
    const windowDesc = parts.join(", ") || "modern white PVC window frame";

    const userPrompt = `Replace all visible windows in this photograph with: ${windowDesc}. Maintain exact same perspective, lighting conditions, wall texture, and surroundings. The result must look like a real photograph.`;

    let resultUrl: string | null = null;

    // Route to provider
    const providerKey = providerConfig.provider_key;

    if (providerKey === "openai_gpt_image" || providerKey === "openai_dalle3") {
      // Use Lovable AI Gateway with image editing
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: imageUrl } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`AI Gateway error: ${response.status} ${errText}`);
      }

      const data = await response.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;

      if (!imageData) throw new Error("No image returned from AI");

      // Upload result to storage
      const base64 = imageData.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const resultPath = `${session.company_id}/${session_id}_result.png`;

      const { error: uploadErr } = await supabase.storage
        .from("render-results")
        .upload(resultPath, bytes, { contentType: "image/png", upsert: true });
      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from("render-results").getPublicUrl(resultPath);
      resultUrl = urlData.publicUrl;

    } else if (providerKey === "gemini_flash_image") {
      // Same gateway, different model
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: userPrompt },
                { type: "image_url", image_url: { url: session.original_photo_url } },
              ],
            },
          ],
          modalities: ["image", "text"],
        }),
      });

      if (!response.ok) throw new Error(`AI error: ${response.status}`);

      const data = await response.json();
      const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
      if (!imageData) throw new Error("No image returned");

      const base64 = imageData.split(",")[1];
      const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
      const resultPath = `${session.company_id}/${session_id}_result.png`;

      await supabase.storage.from("render-results").upload(resultPath, bytes, { contentType: "image/png", upsert: true });
      const { data: urlData } = supabase.storage.from("render-results").getPublicUrl(resultPath);
      resultUrl = urlData.publicUrl;
    } else {
      throw new Error(`Unsupported provider: ${providerKey}`);
    }

    // Update session with results
    await supabase.from("render_sessions").update({
      status: "completed",
      result_urls: [resultUrl],
      prompt_used: userPrompt,
      provider_key: providerKey,
      cost_real: providerConfig.cost_real_per_render,
      cost_billed: providerConfig.cost_billed_per_render,
      processing_completed_at: new Date().toISOString(),
    }).eq("id", session_id);

    // Deduct credit
    await supabase.rpc("deduct_render_credit", { _company_id: session.company_id });

    // Update provider stats
    await supabase.from("render_provider_config").update({
      renders_generated: (providerConfig.renders_generated || 0) + 1,
    }).eq("id", providerConfig.id);

    // Audit log
    await supabase.from("ai_audit_log").insert({
      action: "render_generated",
      company_id: session.company_id,
      user_id: session.created_by,
      entity_type: "render_session",
      entity_id: session_id,
      details: { provider: providerKey, cost_billed: providerConfig.cost_billed_per_render },
    });

    return new Response(JSON.stringify({ success: true, result_url: resultUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("generate-render error:", err);

    // Try to update session status
    try {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);
      const { session_id } = await req.clone().json().catch(() => ({}));
      if (session_id) {
        await supabase.from("render_sessions").update({
          status: "failed",
          error_message: err instanceof Error ? err.message : "Unknown error",
        }).eq("id", session_id);
      }
    } catch {}

    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
