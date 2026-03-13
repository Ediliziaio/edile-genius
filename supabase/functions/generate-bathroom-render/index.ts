import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "generate-bathroom-render";

  let sessionId: string | undefined;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) return jsonError("Unauthorized", "auth_error", 401, rid);

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) return jsonError("Unauthorized", "auth_error", 401, rid);

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    sessionId = body.session_id;
    if (!sessionId) return jsonError("session_id required", "validation_error", 400, rid);

    // Fetch session
    const { data: session, error: sessErr } = await supabase
      .from("render_bagno_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();
    if (sessErr || !session) return jsonError("Session not found", "not_found", 404, rid);

    // Verify user belongs to same company
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    if (!profile || profile.company_id !== session.company_id) {
      return jsonError("Access denied", "auth_error", 403, rid);
    }

    // Generate signed URL for original photo
    const originalPath = session.foto_originale_path;
    if (!originalPath) return jsonError("No original photo in session", "validation_error", 400, rid);

    const { data: signedData, error: signedErr } = await supabase.storage
      .from("bagno-originals")
      .createSignedUrl(originalPath, 3600);
    if (signedErr || !signedData?.signedUrl) throw new Error("Failed to create signed URL");
    const imageUrl = signedData.signedUrl;

    // Check credits
    const { data: credits } = await supabase
      .from("render_credits")
      .select("balance")
      .eq("company_id", session.company_id)
      .single();
    if (!credits || credits.balance <= 0) {
      await supabase.from("render_bagno_sessions")
        .update({ stato: "errore", error_message: "Crediti render esauriti" })
        .eq("id", sessionId);
      return jsonError("No render credits", "insufficient_credits", 402, rid);
    }

    // Mark processing
    await supabase.from("render_bagno_sessions")
      .update({ stato: "processing", processing_started_at: new Date().toISOString() })
      .eq("id", sessionId);

    // Get provider config
    const { data: providerConfig } = await supabase
      .from("render_provider_config")
      .select("*")
      .eq("is_default", true)
      .eq("is_active", true)
      .single();
    if (!providerConfig) throw new Error("No active provider configured");

    // Build prompt from session config
    const config = session.configurazione || {};
    const analisi = session.analisi_bagno || {};
    const { systemPrompt, userPrompt, blocks, promptVersion } = buildBathroomPrompt(config, analisi);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Call AI
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3.1-flash-image-preview",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userPrompt },
              { type: "image_url", image_url: { url: imageUrl } },
            ],
          },
        ],
        modalities: ["image", "text"],
        temperature: 1,
        max_tokens: 16384,
      }),
    }, 120_000);

    if (!response.ok) {
      const errText = await response.text();
      log("error", "AI Gateway error", { request_id: rid, fn: FN, status: response.status });
      throw new Error(`AI Gateway error: ${response.status} ${errText.substring(0, 200)}`);
    }

    const data = await response.json();
    const imageData = data.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageData) throw new Error("No image returned from AI");

    // Upload result
    const base64 = imageData.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    const resultPath = `${session.company_id}/${sessionId}_result.png`;
    const { error: uploadErr } = await supabase.storage
      .from("bagno-results")
      .upload(resultPath, bytes, { contentType: "image/png", upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("bagno-results").getPublicUrl(resultPath);
    const resultUrl = urlData.publicUrl;

    // Deduct credit AFTER success
    await supabase.rpc("deduct_render_credit", { _company_id: session.company_id });

    // Update session
    await supabase.from("render_bagno_sessions").update({
      stato: "completato",
      render_result_path: resultPath,
      render_result_url: resultUrl,
      prompt_usato: userPrompt.substring(0, 10000),
      prompt_blocks: blocks,
      prompt_version: promptVersion,
      provider_key: providerConfig.provider_key,
      cost_real: providerConfig.cost_real_per_render,
      cost_billed: providerConfig.cost_billed_per_render,
      processing_completed_at: new Date().toISOString(),
    }).eq("id", sessionId);

    // Audit log
    await supabase.from("render_provider_config")
      .update({ renders_generated: (providerConfig.renders_generated || 0) + 1 })
      .eq("id", providerConfig.id);
    await supabase.from("ai_audit_log").insert({
      action: "bathroom_render_generated",
      company_id: session.company_id,
      user_id: session.created_by,
      entity_type: "render_bagno_session",
      entity_id: sessionId,
      details: {
        provider: providerConfig.provider_key,
        cost_billed: providerConfig.cost_billed_per_render,
        prompt_version: promptVersion,
      },
    });

    log("info", "Bathroom render completed", { request_id: rid, fn: FN, session_id: sessionId });
    return jsonOk({ success: true, result_url: resultUrl }, rid);
  } catch (err) {
    log("error", "Bathroom render failed", {
      request_id: rid, fn: FN, session_id: sessionId,
      error: err instanceof Error ? err.message : "unknown",
    });

    try {
      if (sessionId) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("render_bagno_sessions").update({
          stato: "errore",
          error_message: err instanceof Error ? err.message : "Unknown error",
        }).eq("id", sessionId);
      }
    } catch { /* best effort */ }

    return errorResponse(err, rid, FN);
  }
});

// ─── Bathroom Prompt Builder ──────────────────────────────────────

function buildBathroomPrompt(
  config: Record<string, any>,
  analisi: Record<string, any>,
): { systemPrompt: string; userPrompt: string; blocks: Record<string, string>; promptVersion: string } {
  const blocks: Record<string, string> = {};

  // System prompt
  blocks.A = `You are an expert bathroom renovation visualization AI. Your task is to transform the existing bathroom in the provided photograph according to the user's configuration, producing a PHOTOREALISTIC result indistinguishable from a real photograph.

CRITICAL RULES:
- The output MUST look like a real photograph taken with a camera, NOT a 3D render or illustration.
- Maintain the EXACT same camera angle, perspective, and field of view.
- Maintain the EXACT same room dimensions, layout, and spatial proportions.
- Only change elements explicitly specified in the configuration. Everything else MUST remain identical.
- Lighting should remain consistent with the original photo.
- Output image dimensions MUST match the original photo dimensions exactly.`;

  // Block B — Current bathroom analysis
  const a = analisi;
  blocks.B = `[BLOCK B – CURRENT BATHROOM INVENTORY]
Bathroom size: ${a.dimensione_stimata || "unknown"}
Layout: ${a.forma_bagno || "unknown"}
Current style: ${a.stile_generale || "unknown"}
Condition: ${a.stato_generale || "unknown"}
Bathtub present: ${a.presenza_vasca ?? "unknown"} (type: ${a.tipo_vasca_attuale || "n/a"})
Shower present: ${a.presenza_doccia ?? "unknown"} (type: ${a.tipo_doccia_attuale || "n/a"})
Shower enclosure: ${a.presenza_box_doccia ?? "unknown"} (color: ${a.colore_box_attuale || "n/a"})
Wall tiles: ${a.piastrelle_parete_effetto || "unknown"} in ${a.piastrelle_parete_colore_dominante || "unknown"}, format: ${a.piastrelle_parete_formato_stimato || "unknown"}
Floor: ${a.pavimento_effetto || "unknown"} in ${a.pavimento_colore_dominante || "unknown"}
Vanity: ${a.presenza_mobile_bagno ?? "unknown"} (style: ${a.stile_mobile || "n/a"}, color: ${a.colore_mobile_dominante || "n/a"})
WC: ${a.wc_tipo || "unknown"}, Bidet: ${a.presenza_bidet ?? "unknown"}
Taps finish: ${a.rubinetteria_finitura || "unknown"}
Lighting: ${a.illuminazione_tipo || "unknown"}`;

  // Block C — Wall tiles configuration
  const piastrelle = config.piastrelle || {};
  if (piastrelle.effetto || piastrelle.formato || piastrelle.posa) {
    blocks.C = `[BLOCK C – WALL TILES SPECIFICATION]
Effect/material: ${piastrelle.effetto_prompt || piastrelle.effetto || "keep existing"}
Format: ${piastrelle.formato_prompt || piastrelle.formato || "keep existing"}
Laying pattern: ${piastrelle.posa_prompt || piastrelle.posa || "keep existing"}
Grout color: ${piastrelle.fuga_colore || "matching"}
Coverage: ${piastrelle.copertura || "full walls"}`;
  }

  // Block D — Floor tiles
  const pavimento = config.pavimento || {};
  if (pavimento.effetto || pavimento.formato) {
    blocks.D = `[BLOCK D – FLOOR TILES SPECIFICATION]
Effect/material: ${pavimento.effetto_prompt || pavimento.effetto || "keep existing"}
Format: ${pavimento.formato_prompt || pavimento.formato || "keep existing"}
Laying pattern: ${pavimento.posa_prompt || pavimento.posa || "keep existing"}
Grout color: ${pavimento.fuga_colore || "matching"}`;
  }

  // Block E — Shower
  const doccia = config.doccia || {};
  if (doccia.tipo || doccia.box || doccia.piatto || doccia.profilo) {
    blocks.E = `[BLOCK E – SHOWER SPECIFICATION]
Type: ${doccia.tipo_prompt || doccia.tipo || "keep existing"}
Glass enclosure: ${doccia.box_prompt || doccia.box || "keep existing"}
Shower tray: ${doccia.piatto_prompt || doccia.piatto || "keep existing"}
Profile finish: ${doccia.profilo_prompt || doccia.profilo || "keep existing"}`;
  }

  // Block F — Bathtub
  const vasca = config.vasca || {};
  if (vasca.tipo || vasca.forma || vasca.materiale) {
    blocks.F = `[BLOCK F – BATHTUB SPECIFICATION]
Type: ${vasca.tipo_prompt || vasca.tipo || "keep existing"}
Shape: ${vasca.forma_prompt || vasca.forma || "keep existing"}
Material/color: ${vasca.materiale_prompt || vasca.materiale || "keep existing"}`;
  }

  // Block G — Vanity
  const vanity = config.vanity || {};
  if (vanity.stile || vanity.colore || vanity.piano) {
    blocks.G = `[BLOCK G – BATHROOM VANITY SPECIFICATION]
Style: ${vanity.stile_prompt || vanity.stile || "keep existing"}
Color: ${vanity.colore_prompt || vanity.colore || "keep existing"}
Countertop: ${vanity.piano_prompt || vanity.piano || "keep existing"}`;
  }

  // Block H — Taps/fixtures
  const rubinetteria = config.rubinetteria || {};
  if (rubinetteria.finitura || rubinetteria.stile) {
    blocks.H = `[BLOCK H – TAP & FIXTURE SPECIFICATION]
Finish: ${rubinetteria.finitura_prompt || rubinetteria.finitura || "keep existing"}
Style: ${rubinetteria.stile_prompt || rubinetteria.stile || "keep existing"}
CRITICAL: ALL visible taps, faucets, shower heads, and fixtures MUST use this finish consistently.`;
  }

  // Block I — Walls
  const pareti = config.pareti || {};
  if (pareti.tipo) {
    blocks.I = `[BLOCK I – WALL TREATMENT]
Type: ${pareti.tipo_prompt || pareti.tipo || "keep existing"}
${pareti.colore_tinta ? `Paint color: ${pareti.colore_tinta}` : ""}`;
  }

  // Block J — Lighting
  const illuminazione = config.illuminazione || {};
  if (illuminazione.tipo) {
    blocks.J = `[BLOCK J – LIGHTING]
Type: ${illuminazione.tipo_prompt || illuminazione.tipo || "keep existing"}`;
  }

  // Block K — Negative constraints
  blocks.K = `[BLOCK K – ABSOLUTE NEGATIVE CONSTRAINTS]
NEVER DO any of the following:
- ✗ Change room dimensions, layout, or spatial proportions
- ✗ Alter camera perspective or field of view
- ✗ Add elements not present in the original (windows, doors, walls)
- ✗ Change ceiling height or room shape
- ✗ Produce cartoon, illustrated, or CGI-look artifacts
- ✗ Add text, watermarks, or overlays
- ✗ Make the result look like a 3D render — must be indistinguishable from real photograph
- ✗ Change elements not explicitly configured (if only tiles are configured, keep everything else identical)`;

  // Block L — Final checklist
  const checklist: string[] = [];
  if (piastrelle.effetto) checklist.push(`☐ WALL TILES → REPLACE with ${piastrelle.effetto} in ${piastrelle.formato || "original format"}`);
  if (pavimento.effetto) checklist.push(`☐ FLOOR → REPLACE with ${pavimento.effetto}`);
  if (doccia.tipo) checklist.push(`☐ SHOWER → ${doccia.tipo}`);
  if (vasca.tipo) checklist.push(`☐ BATHTUB → ${vasca.tipo}`);
  if (vanity.stile) checklist.push(`☐ VANITY → ${vanity.stile} in ${vanity.colore || "specified color"}`);
  if (rubinetteria.finitura) checklist.push(`☐ TAPS → all in ${rubinetteria.finitura} finish`);
  checklist.push(`☐ UNCHANGED ELEMENTS → KEEP 100% identical`);
  checklist.push(`☐ IMAGE DIMENSIONS → output MUST match original photo dimensions exactly`);

  blocks.L = `[BLOCK L – FINAL PRESERVATION CHECKLIST]
Before outputting the image, verify EVERY item below. If any item is wrong, regenerate.

${checklist.join("\n")}`;

  // Assemble
  const systemPrompt = blocks.A;
  const userParts = [blocks.B];
  if (blocks.C) userParts.push(blocks.C);
  if (blocks.D) userParts.push(blocks.D);
  if (blocks.E) userParts.push(blocks.E);
  if (blocks.F) userParts.push(blocks.F);
  if (blocks.G) userParts.push(blocks.G);
  if (blocks.H) userParts.push(blocks.H);
  if (blocks.I) userParts.push(blocks.I);
  if (blocks.J) userParts.push(blocks.J);
  userParts.push(blocks.K);
  userParts.push(blocks.L); // Last for recency bias

  const notes = config.notes || "";
  if (notes) userParts.push(`[ADDITIONAL NOTES]\n${notes}`);

  const userPrompt = userParts.join("\n\n");

  return { systemPrompt, userPrompt, blocks, promptVersion: "bagno-1.0.0" };
}
