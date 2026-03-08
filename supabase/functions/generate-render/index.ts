import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Inline Prompt Builder (mirrors src/modules/render/lib/promptBuilder.ts) ───

const MATERIAL_PHYSICS: Record<string, string> = {
  pvc: "white or colored PVC (polyvinyl chloride) with smooth matte surface, visible internal chamber structure at edges, welded corners with subtle seam lines, slight plastic sheen under direct light, uniform color without grain, rounded or sharp profile edges depending on system",
  alluminio: "extruded aluminum with anodized or powder-coated finish, sharp precise edges, visible thermal break strips (dark polyamide) between inner and outer shells, metallic surface with subtle directional brushing marks, thin elegant profile (typically 50-65mm visible width), matte or semi-gloss finish",
  legno: "solid wood frame with visible natural grain pattern, slightly rounded edges from milling, paint or stain finish showing subtle wood texture beneath, traditional mortise-and-tenon corner joints, warm organic appearance, thicker profile (68-92mm), possible hairline cracks in painted surfaces",
  legno_alluminio: "hybrid frame: interior shows solid wood with natural grain and warm finish, exterior shows slim aluminum cladding with powder-coated color, visible transition line where wood meets aluminum at the edge, combines warmth of wood inside with weather-resistant aluminum outside",
  acciaio_corten: "Corten weathering steel frame with characteristic rust-orange patina, rough oxidized surface texture, ultra-thin profiles (25-35mm sight lines), dark brown-orange color with natural variation, industrial aesthetic",
  acciaio_minimale: "minimal steel frame with extremely thin sight lines (15-25mm), black or dark gray powder-coated surface, precise geometric edges, virtually invisible frame creating a nearly frameless glass appearance, modern industrial look",
};

const APERTURA_DESCRIPTION: Record<string, string> = {
  battente_1_anta: "single-leaf casement window that opens inward on side hinges",
  battente_2_ante: "double-leaf casement window with two opening panels meeting at center",
  battente_3_ante: "triple-leaf casement window with three panels",
  scorrevole: "horizontal sliding window with panels sliding on tracks",
  scorrevole_alzante: "lift-and-slide door/window with large glass panels",
  vasistas: "top-hinged window that tilts inward from the bottom",
  anta_ribalta: "tilt-and-turn window that can swing and tilt inward",
  bilico: "pivot window rotating on a central horizontal axis",
  fisso: "fixed non-opening window with no handles or hinges",
  portafinestra: "full-height French door/balcony door",
  cassonetto_integrato: "window with integrated roller shutter box above",
};

function buildPromptFromConfig(session: any): { systemPrompt: string; userPrompt: string; negativePrompt: string; promptVersion: string; blocks: Record<string, string> } {
  const analisi = session.foto_analisi || {};
  const config = session.config || {};
  const nuovoInfisso = config.nuovo_infisso || {};
  const notes = config.notes || config.options?.notes || "";

  // Check if we have V2 structured data
  const hasV2 = analisi.tipo_apertura && nuovoInfisso.materiale;

  if (!hasV2) {
    // Fallback to legacy prompt
    const fragments = config.fragments || {};
    const parts: string[] = [];
    for (const val of Object.values(fragments)) {
      if (val && typeof val === "string") parts.push(val);
    }
    if (config.notes) parts.push(config.notes);
    const windowDesc = parts.join(", ") || "modern white PVC window frame";

    const system = "You are an expert architectural visualization AI. Replace the existing windows/doors with new ones while maintaining photorealistic quality. Keep building structure, surroundings, lighting, and perspective exactly the same.";
    const user = `Replace all visible windows in this photograph with: ${windowDesc}. Maintain exact same perspective, lighting conditions, wall texture, and surroundings. The result must look like a real photograph.`;
    const negative = "cartoon, illustration, sketch, drawing, watermark, text overlay, blurry, distorted perspective, different building, changed wall color, unrealistic lighting";

    return { systemPrompt: system, userPrompt: user, negativePrompt: negative, promptVersion: "1.0.0", blocks: { legacy: user } };
  }

  // V2 block-based prompt
  const colore = nuovoInfisso.colore || {};
  const profilo = nuovoInfisso.profilo || {};
  const vetro = nuovoInfisso.vetro || {};
  const oscurante = nuovoInfisso.oscurante || {};
  const ferramenta = nuovoInfisso.ferramenta || {};
  const cassonetto = nuovoInfisso.cassonetto || {};

  const oldMatDesc: Record<string, string> = {
    legno_vecchio: "aged wood with visible weathering",
    legno_verniciato: "painted wood with possible peeling",
    alluminio_anodizzato: "old anodized aluminum",
    alluminio_verniciato: "painted aluminum with fading",
    pvc_bianco: "white PVC possibly yellowed",
    pvc_colorato: "colored PVC with fading",
    ferro: "old iron frame with possible rust",
    acciaio: "steel frame with paint wear",
    sconosciuto: "existing frame",
  };

  const finituraMap: Record<string, string> = {
    liscio_opaco: "smooth matte finish",
    liscio_lucido: "smooth glossy finish",
    venatura_legno: "wood-grain textured surface",
    spazzolato: "brushed metallic finish",
    satinato: "satin finish",
    goffrato: "embossed/textured surface",
  };

  const profiloSize: Record<string, string> = {
    "70mm": "70mm residential profile with 3 internal chambers",
    "82mm": "82mm premium profile with 5 internal chambers",
    "92mm": "92mm Passivhaus-grade profile with 7 internal chambers",
  };

  const profiloForma: Record<string, string> = {
    squadrato: "squared/angular edges",
    arrotondato: "softly rounded edges",
    europeo: "classic European profile with slight bevel",
  };

  const manigliaDesc: Record<string, string> = {
    leva_alluminio: "aluminum lever handle",
    leva_acciaio: "stainless steel lever handle",
    pomolo: "round knob handle",
    alzante: "lift-and-slide handle",
  };

  const coloreFerrDesc: Record<string, string> = {
    argento: "silver/chrome", nero_opaco: "matte black", inox: "brushed stainless steel", bronzo: "antique bronze", oro: "polished gold/brass",
  };

  // Build blocks
  const blocks: Record<string, string> = {};

  blocks.A = `[BLOCK A – ROLE & MISSION]\nYou are an expert architectural visualization AI. Perform a COMPLETE STRUCTURAL REPLACEMENT of the existing windows/doors — not a color overlay. Remove the old frame entirely and render a new frame with different material physics, profile geometry, and surface properties. The result must be indistinguishable from a real photograph.`;

  blocks.B = `[BLOCK B – PHOTO ANALYSIS]\nCurrent window: ${APERTURA_DESCRIPTION[analisi.tipo_apertura] || analisi.tipo_apertura}\nMaterial: ${analisi.materiale_attuale}, Color: ${analisi.colore_attuale}, Condition: ${analisi.condizioni}\nPanels: ${analisi.num_ante_attuale}, Frame thickness: ${analisi.spessore_telaio}\nRoller box: ${analisi.presenza_cassonetto ? analisi.tipo_cassonetto : "none"}\nBuilding: ${analisi.stile_edificio}, Wall: ${analisi.materiale_muro} (${analisi.colore_muro})\nSill: ${analisi.presenza_davanzale ? "yes" : "no"}, Bars: ${analisi.presenza_inferriata ? "yes" : "no"}\nFloor: ${analisi.piano}, Light: ${analisi.luce}, Angle: ${analisi.angolo_ripresa}`;

  blocks.C = `[BLOCK C – STRUCTURAL REPLACEMENT]\nRemove the existing ${oldMatDesc[analisi.materiale_attuale] || "old frame"} completely. Replace with brand new ${MATERIAL_PHYSICS[nuovoInfisso.materiale] || nuovoInfisso.materiale}. This is a full structural replacement, not a repaint.`;

  let colorDesc = colore.nome || "";
  if (colore.ral) colorDesc += ` (RAL ${colore.ral})`;
  blocks.D = `[BLOCK D – NEW FRAME MATERIAL & COLOR]\nMaterial: ${MATERIAL_PHYSICS[nuovoInfisso.materiale] || nuovoInfisso.materiale}\nColor: ${colorDesc}\nFinish: ${finituraMap[colore.finitura] || colore.finitura || "smooth matte"}`;

  blocks.E = `[BLOCK E – FRAME PROFILE]\nProfile: ${profiloSize[profilo.dimensione] || profilo.dimensione || "standard"}\nShape: ${profiloForma[profilo.forma] || profilo.forma || "standard"}${nuovoInfisso.num_ante ? `\nPanels: ${nuovoInfisso.num_ante}` : ""}`;

  blocks.F = `[BLOCK F – GLASS]\n${vetro.prompt_fragment || vetro.tipo || "double glazed clear glass"}\nShow realistic reflections, slight greenish tint on edges, proper transparency.`;

  blocks.G = oscurante.tipo && oscurante.tipo !== "nessuno"
    ? `[BLOCK G – SHUTTERS/BLINDS]\n${oscurante.prompt_fragment || oscurante.tipo}`
    : `[BLOCK G – SHUTTERS/BLINDS]\nNo external shutters or blinds.`;

  blocks.H = `[BLOCK H – HARDWARE]\nHandle: ${manigliaDesc[ferramenta.maniglia] || ferramenta.maniglia || "lever handle"}\nColor: ${coloreFerrDesc[ferramenta.colore] || ferramenta.colore || "silver"}`;

  if (cassonetto.azione === "rimuovi") {
    blocks.I = `[BLOCK I – ROLLER BOX]\nRemove existing roller shutter box. Show continuous wall surface.`;
  } else if (cassonetto.azione === "integra") {
    blocks.I = `[BLOCK I – ROLLER BOX]\nReplace with modern integrated cassonetto matching new frame.`;
  } else {
    blocks.I = `[BLOCK I – ROLLER BOX]\n${analisi.presenza_cassonetto ? "Keep existing roller shutter box as-is." : "No roller box. Do not add one."}`;
  }

  blocks.J = `[BLOCK J – PRESERVE]\nKeep EXACTLY: wall color (${analisi.colore_muro}), texture (${analisi.materiale_muro}), perspective (${analisi.angolo_ripresa}), ${analisi.presenza_davanzale ? "window sill" : "no sill"}, ${analisi.presenza_inferriata ? "security bars" : "no bars"}, all surroundings, sky, lighting.`;

  blocks.K = `[BLOCK K – LIGHTING]\nMatch lighting (${analisi.luce}). Render correct shadows from new frame profile. Glass reflections must match scene light direction.`;

  blocks.L = `[BLOCK L – CONSTRAINTS]\nDO NOT: change wall/facade, alter perspective, add absent elements, change sky/weather, create cartoon/CGI artifacts, add text/watermarks, distort proportions. Must be photorealistic.`;

  const systemPrompt = blocks.A;
  const userParts = [blocks.B, blocks.C, blocks.D, blocks.E, blocks.F, blocks.G, blocks.H, blocks.I, blocks.J, blocks.K, blocks.L];
  if (notes) userParts.push(`[ADDITIONAL NOTES]\n${notes}`);
  const userPrompt = userParts.join("\n\n");
  const negativePrompt = "cartoon, illustration, sketch, drawing, watermark, text overlay, blurry, distorted perspective, different building, changed wall color, unrealistic lighting, 3D render, CGI artifacts";

  return { systemPrompt, userPrompt, negativePrompt, promptVersion: "2.0.0", blocks };
}

// ─── Main Handler ─────────────────────────────────────────────────

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

    // Build prompt using the new block system
    const { systemPrompt, userPrompt, negativePrompt, promptVersion, blocks } = buildPromptFromConfig(session);

    let resultUrl: string | null = null;
    const providerKey = providerConfig.provider_key;

    // All providers use the same Lovable AI Gateway
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
            role: "system",
            content: systemPrompt,
          },
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

    // Update session with results + prompt metadata
    await supabase.from("render_sessions").update({
      status: "completed",
      result_urls: [resultUrl],
      prompt_used: userPrompt.substring(0, 10000),
      provider_key: providerKey,
      cost_real: providerConfig.cost_real_per_render,
      cost_billed: providerConfig.cost_billed_per_render,
      processing_completed_at: new Date().toISOString(),
      prompt_blocks: blocks,
      prompt_version: promptVersion,
      prompt_char_count: (systemPrompt + userPrompt).length,
      config_snapshot: session.config,
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
      details: { provider: providerKey, cost_billed: providerConfig.cost_billed_per_render, prompt_version: promptVersion },
    });

    return new Response(JSON.stringify({ success: true, result_url: resultUrl }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error("generate-render error:", err);

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
