import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

// ─── Inline Prompt Builder v3 ─────────────────────────────────────

const MATERIAL_PHYSICS: Record<string, string> = {
  pvc: "white or colored PVC (polyvinyl chloride) frame — smooth matte surface with very slight plastic texture under direct light, internal multi-chamber structure visible at frame cross-section edges, corners welded with subtle seam lines, uniform color throughout without natural grain, exterior surface shows shallow surface relief from extrusion process",
  alluminio: "extruded aluminum frame — anodized or powder-coated exterior, sharp precise 90° or slightly beveled edges, clearly visible thermal break (dark polyamide strip, approximately 3-5mm wide) between inner and outer shells at frame cross-section, surface shows very subtle directional micro-texture from coating process, thin elegant profile (typically 50-65mm visible sight line width), consistent metallic finish",
  legno: "solid wood frame — clearly visible natural wood grain running along the frame length, slightly rounded milled edges, paint or opaque stain finish showing faint grain texture beneath the coating, traditional mortise-and-tenon visible corner joint geometry (slight raised line at 45° miter), warm organic color variation, thicker profile (68-92mm sight line), possible hairline micro-cracks at painted corners",
  legno_alluminio: "hybrid timber-aluminum composite frame — interior side shows solid wood with warm grain and stain finish, exterior side shows slim precision-extruded aluminum cladding with powder-coated finish, visible thin shadow line at the wood-aluminum transition edge, combines warmth of interior wood aesthetic with weather-resistant modern aluminum exterior",
  acciaio_corten: "Corten weathering steel frame — unmistakable rust-orange patina with rough oxidized surface texture and natural color variation from dark rust-red to lighter orange-tan, ultra-thin sight line profiles (25-35mm visible width), industrial precise geometric form, characteristic streaking pattern typical of Cor-Ten oxidation",
  acciaio_minimale: "ultra-minimal structural steel frame — extremely thin sight lines (15-25mm), deep matte black or dark anthracite powder-coated surface, machined precise geometric edges, nearly frameless appearance with maximum glass-to-frame ratio, industrial modern aesthetic, tiny cap screws or concealed fixings visible at mullion intersections",
};

const APERTURA_DESCRIPTION: Record<string, string> = {
  battente_1_anta: "single-leaf inward-opening casement window, 2 hinges on hinge side",
  battente_2_ante: "double-leaf casement window, 2 hinges per sash = 4 total",
  battente_3_ante: "triple-leaf casement window, center fixed, sides opening",
  scorrevole: "horizontal sliding window on tracks",
  scorrevole_alzante: "lift-and-slide door/window with large glass panels",
  vasistas: "top-hinged tilt-in window",
  anta_ribalta: "tilt-and-turn window with multi-position handle",
  bilico: "center-pivot window",
  fisso: "fixed non-opening window, no hinges, no handle",
  portafinestra: "full-height French door/balcony door",
  cassonetto_integrato: "window with integrated roller shutter box above",
};

const CASSONETTO_MATERIAL_DESC: Record<string, string> = {
  pvc_tradizionale: "traditional PVC roller shutter housing — rectangular box profile 160-200mm above window, smooth matte PVC surface",
  pvc_slim: "slim-profile PVC cassonetto — reduced-depth 110-130mm visible height, minimalist profile",
  pvc_integrato: "wall-integrated cassonetto — fully recessed into masonry, only 30-40mm visible, virtually invisible",
  alluminio_coibentato: "insulated aluminum cassonetto — powder-coated panels, visible side inspection covers, 170-210mm height",
};

const TAPPARELLA_DESC: Record<string, string> = {
  pvc_avvolgibile: "PVC roll-up shutter — horizontal PVC slats 37-55mm wide, smooth rounded profile, bottom rail with rubber seal, side guide channels",
  alluminio_avvolgibile: "aluminum roll-up shutter — aluminum foam-filled slats 37-55mm wide, metallic sheen, precise joints, side guide channels",
  microforata: "microperforated roll-up shutter — slats with circular perforations 3-4mm diameter, filtered light, partial vision",
  persiana_alluminio: "aluminum louvered shutter (persiana) — horizontal slats 60-80mm wide, S-curve profile, pivot pins, Mediterranean aesthetic",
  veneziana_integrata: "integral venetian blind between glazing — thin horizontal lines 25mm apart inside double-glazing unit, ultra-minimal",
  nessuna: "No shutter or blind — bare window frame only",
};

const CERNIERA_DESC: Record<string, string> = {
  europea: "Standard European butt hinge — two plates ~50×35mm, 3 screws per plate, 8mm knuckle, projects 3-4mm from frame",
  a_libro: "Book-fold concealed hinge — partially recessed, only outer knuckle visible as 6mm × 40mm strip",
  invisibile: "Fully concealed pivot hinge — completely hidden when closed, no visible hardware, premium appearance",
};

const CERNIERA_COLORE_DESC: Record<string, string> = {
  argento: "silver chrome", nero_opaco: "matte black", inox: "brushed stainless steel",
  bronzo: "antique bronze", oro: "polished gold/brass", uguale_maniglia: "same as handle",
};

function buildPromptFromConfig(session: any): { systemPrompt: string; userPrompt: string; negativePrompt: string; promptVersion: string; blocks: Record<string, string> } {
  const analisi = session.foto_analisi || {};
  const config = session.config || {};
  const nuovoInfisso = config.nuovo_infisso || {};
  const notes = config.notes || config.options?.notes || "";

  const hasV2 = analisi.tipo_apertura && (nuovoInfisso.materiale || nuovoInfisso.sostituzione);

  if (!hasV2) {
    // Legacy v1 fallback
    const fragments = config.fragments || {};
    const parts: string[] = [];
    for (const val of Object.values(fragments)) { if (val && typeof val === "string") parts.push(val); }
    if (config.notes) parts.push(config.notes);
    const windowDesc = parts.join(", ") || "modern white PVC window frame";
    const system = "You are an expert architectural visualization AI. Replace the existing windows/doors with new ones while maintaining photorealistic quality.";
    const user = `Replace all visible windows in this photograph with: ${windowDesc}. Maintain exact same perspective, lighting, wall texture, and surroundings.`;
    const negative = "cartoon, illustration, sketch, drawing, watermark, text overlay, blurry, distorted perspective, different building, changed wall color, unrealistic lighting";
    return { systemPrompt: system, userPrompt: user, negativePrompt: negative, promptVersion: "1.0.0", blocks: { legacy: user } };
  }

  // v3 prompt
  const sost = nuovoInfisso.sostituzione || { infissi: true, cassonetto: false, tapparella: false };
  const colore = nuovoInfisso.colore || {};
  const profilo = nuovoInfisso.profilo || {};
  const vetro = nuovoInfisso.vetro || {};
  const ferramenta = nuovoInfisso.ferramenta || {};
  const cassonetto = nuovoInfisso.cassonetto || {};
  const tapparella = nuovoInfisso.tapparella || {};
  const cerniere = nuovoInfisso.cerniere || {};

  const oldMatDesc: Record<string, string> = { legno_vecchio: "aged wood", legno_verniciato: "painted wood", alluminio_anodizzato: "old anodized aluminum", alluminio_verniciato: "painted aluminum", pvc_bianco: "white PVC possibly yellowed", pvc_colorato: "colored PVC", ferro: "old iron frame", acciaio: "steel frame", sconosciuto: "existing frame" };
  const finituraMap: Record<string, string> = { liscio_opaco: "smooth matte finish", liscio_lucido: "smooth glossy finish", venatura_legno: "wood-grain textured surface", spazzolato: "brushed metallic finish", satinato: "satin finish", goffrato: "embossed/textured surface" };
  const profiloSize: Record<string, string> = { "70mm": "70mm residential profile with 3 chambers", "82mm": "82mm premium profile with 5 chambers", "92mm": "92mm Passivhaus-grade profile with 7 chambers" };
  const profiloForma: Record<string, string> = { squadrato: "squared/angular edges", arrotondato: "softly rounded edges", europeo: "classic European profile" };
  const manigliaDesc: Record<string, string> = { leva_alluminio: "aluminum lever handle", leva_acciaio: "stainless steel lever handle", pomolo: "round knob handle", alzante: "lift-and-slide handle" };
  const coloreFerrDesc: Record<string, string> = { argento: "silver/chrome", nero_opaco: "matte black", inox: "brushed stainless steel", bronzo: "antique bronze", oro: "polished gold/brass" };

  const blocks: Record<string, string> = {};

  // Block A
  blocks.A = `[BLOCK A – ROLE & MISSION]\nYou are a SURGICAL PHOTOREALISTIC IMAGE EDITOR for architectural visualization. Your ONLY task: replace EXACTLY the specified building elements while leaving EVERYTHING ELSE 100% pixel-perfect identical. This is PRECISE SURGICAL REPLACEMENT, not artistic interpretation.`;

  // Block B
  blocks.B = `[BLOCK B – EXISTING ELEMENTS INVENTORY]\nWindow/door type: ${APERTURA_DESCRIPTION[analisi.tipo_apertura] || analisi.tipo_apertura}\nCurrent material: ${analisi.materiale_attuale}, Color: ${analisi.colore_attuale}, Condition: ${analisi.condizioni}\nPanels: ${analisi.num_ante_attuale}, Frame depth: ${analisi.spessore_telaio}\nGlass: ${analisi.tipo_vetro_attuale}\nRoller box: ${analisi.presenza_cassonetto ? 'YES — ' + analisi.tipo_cassonetto + ', color: ' + (analisi.colore_cassonetto_attuale || 'unknown') : 'NOT PRESENT'}\nShutter: ${analisi.presenza_tapparella ? 'YES — ' + (analisi.tipo_tapparella_attuale || 'unknown') + ', color: ' + (analisi.colore_tapparella_attuale || 'unknown') : 'NOT PRESENT'}\nBuilding: ${analisi.stile_edificio}, Wall: ${analisi.materiale_muro} (${analisi.colore_muro})\nSill: ${analisi.presenza_davanzale ? 'YES (' + (analisi.tipo_davanzale || 'unknown') + ')' : 'NO'}, Bars: ${analisi.presenza_inferriata ? 'YES' : 'NO'}\nFloor: ${analisi.piano}, Light: ${analisi.luce}, Angle: ${analisi.angolo_ripresa}`;

  // Block C — Selective replacement
  const cLines: string[] = ['[BLOCK C – SELECTIVE REPLACEMENT INSTRUCTIONS]', 'Replace ONLY the following elements:'];
  if (sost.infissi) {
    cLines.push(`\n✅ REPLACE — Window/door frames and glass:\nRemove: ${oldMatDesc[analisi.materiale_attuale] || "old frame"}\nInstall: ${MATERIAL_PHYSICS[nuovoInfisso.materiale] || nuovoInfisso.materiale}`);
  } else {
    cLines.push(`\n🚫 DO NOT TOUCH — Keep existing frames as-is`);
  }
  if (sost.cassonetto) {
    if (cassonetto.azione === "rimuovi") {
      cLines.push(`\n✅ REMOVE cassonetto — fill with continuous wall surface`);
    } else if (cassonetto.azione === "sostituisci" && cassonetto.materiale) {
      let cColor = "";
      if (cassonetto.colore?.nome) { cColor = `Color: ${cassonetto.colore.nome}`; if (cassonetto.colore.ral) cColor += ` (RAL ${cassonetto.colore.ral})`; }
      cLines.push(`\n✅ REPLACE cassonetto:\n${CASSONETTO_MATERIAL_DESC[cassonetto.materiale] || cassonetto.materiale}\n${cColor}`);
    } else {
      cLines.push(`\n🚫 DO NOT TOUCH cassonetto`);
    }
  } else {
    cLines.push(`\n🚫 DO NOT TOUCH — ${analisi.presenza_cassonetto ? 'Keep existing cassonetto' : 'No cassonetto — do not add'}`);
  }
  if (sost.tapparella) {
    if (tapparella.azione === "rimuovi") {
      cLines.push(`\n✅ REMOVE shutter system completely`);
    } else if (tapparella.azione === "sostituisci" && tapparella.materiale) {
      let tDesc = `\n✅ REPLACE shutter:\n${TAPPARELLA_DESC[tapparella.materiale] || tapparella.materiale}`;
      if (tapparella.colore?.nome) { tDesc += `\nSlat color: ${tapparella.colore.nome}${tapparella.colore.ral ? ` (RAL ${tapparella.colore.ral})` : ""}`; }
      if (tapparella.colore_guide?.nome) { tDesc += `\nGuide color: ${tapparella.colore_guide.nome}${tapparella.colore_guide.ral ? ` (RAL ${tapparella.colore_guide.ral})` : ""}`; }
      const stato = tapparella.stato_render || "chiusa";
      tDesc += `\nState: ${stato === 'aperta' ? 'FULLY OPEN (rolled up)' : stato === 'mezza' ? 'HALF OPEN (lower 50%)' : 'FULLY CLOSED'}`;
      cLines.push(tDesc);
    } else {
      cLines.push(`\n🚫 DO NOT TOUCH shutter`);
    }
  } else {
    cLines.push(`\n🚫 DO NOT TOUCH — ${analisi.presenza_tapparella ? 'Keep existing shutter' : 'No shutter — do not add'}`);
  }
  blocks.C = cLines.join('\n');

  // Block D
  if (sost.infissi) {
    let colorDesc = colore.nome || ""; if (colore.ral) colorDesc += ` (RAL ${colore.ral})`;
    blocks.D = `[BLOCK D – NEW FRAME MATERIAL & COLOR]\nMaterial: ${MATERIAL_PHYSICS[nuovoInfisso.materiale] || nuovoInfisso.materiale}\nColor: ${colorDesc}\nFinish: ${finituraMap[colore.finitura] || colore.finitura || "smooth matte"}`;
  } else {
    blocks.D = `[BLOCK D – FRAME MATERIAL — SKIPPED]\nFrame replacement not requested.`;
  }

  // Block E — Profile + Hinges
  if (sost.infissi) {
    const numAnte = nuovoInfisso.num_ante || analisi.num_ante_attuale || 1;
    const cerPerAnta = cerniere.num_per_anta || 2;
    const cerTotal = cerPerAnta * numAnte;
    const cerTipo = CERNIERA_DESC[cerniere.tipo] || cerniere.tipo || "standard hinge";
    const cerColore = CERNIERA_COLORE_DESC[cerniere.colore] || cerniere.colore || "silver";
    blocks.E = `[BLOCK E – FRAME PROFILE & HINGE GEOMETRY]\nProfile: ${profiloSize[profilo.dimensione] || profilo.dimensione || "standard"}\nShape: ${profiloForma[profilo.forma] || profilo.forma || "standard"}\nPanels: ${numAnte}\n\nHINGE DETAIL:\nTotal hinges: ${cerTotal} (${cerPerAnta} per sash × ${numAnte} sash${numAnte > 1 ? 'es' : ''})\nHinge type: ${cerTipo}\nHinge color: ${cerColore}\nPlacement: 1/5 and 4/5 of sash height\nEach hinge: ${cerniere.tipo === 'invisibile' ? 'fully recessed — NOT visible' : 'two plates visible ~50×35mm, 3 screws per plate'}`;
  } else {
    blocks.E = `[BLOCK E – FRAME PROFILE — SKIPPED]\nFrame replacement not requested.`;
  }

  // Block F
  if (sost.infissi) {
    blocks.F = `[BLOCK F – GLASS UNIT]\n${vetro.prompt_fragment || vetro.tipo || "double glazed clear glass"}\nRealistic reflections, greenish tint on edges, proper transparency.`;
  } else {
    blocks.F = `[BLOCK F – GLASS — SKIPPED]`;
  }

  // Block G — Hardware
  if (sost.infissi) {
    blocks.G = `[BLOCK G – HARDWARE]\nHandle: ${manigliaDesc[ferramenta.maniglia] || ferramenta.maniglia || "lever handle"}\nColor: ${coloreFerrDesc[ferramenta.colore] || ferramenta.colore || "silver"}`;
  } else {
    blocks.G = `[BLOCK G – HARDWARE — SKIPPED]`;
  }

  // Block H — Cassonetto
  if (sost.cassonetto && cassonetto.azione === "rimuovi") {
    blocks.H = `[BLOCK H – ROLLER BOX REMOVAL]\nRemove entire cassonetto. Show continuous wall surface matching surrounding facade.`;
  } else if (sost.cassonetto && cassonetto.azione === "sostituisci" && cassonetto.materiale) {
    let cColor = "";
    if (cassonetto.colore?.nome) { cColor = `Color: ${cassonetto.colore.nome}`; if (cassonetto.colore.ral) cColor += ` (RAL ${cassonetto.colore.ral})`; }
    blocks.H = `[BLOCK H – NEW ROLLER BOX]\nReplace with: ${CASSONETTO_MATERIAL_DESC[cassonetto.materiale] || cassonetto.materiale}\n${cColor}\nPosition: above window, flush with wall. Bottom: shutter exit slot ~15-20mm. Width: matching frame outer width.`;
  } else {
    blocks.H = `[BLOCK H – ROLLER BOX]\n${analisi.presenza_cassonetto ? "Keep existing cassonetto as-is." : "No cassonetto. Do not add one."}`;
  }

  // Block I — Tapparella
  if (sost.tapparella && tapparella.azione === "rimuovi") {
    blocks.I = `[BLOCK I – SHUTTER REMOVAL]\nRemove existing shutter system completely. Show bare window frame.`;
  } else if (sost.tapparella && tapparella.azione === "sostituisci" && tapparella.materiale) {
    let iLines = `[BLOCK I – NEW SHUTTER]\nInstall: ${TAPPARELLA_DESC[tapparella.materiale] || tapparella.materiale}`;
    if (tapparella.colore?.nome) iLines += `\nSlat color: ${tapparella.colore.nome}${tapparella.colore.ral ? ` (RAL ${tapparella.colore.ral})` : ""}`;
    if (tapparella.colore_guide?.nome) iLines += `\nGuide color: ${tapparella.colore_guide.nome}${tapparella.colore_guide.ral ? ` (RAL ${tapparella.colore_guide.ral})` : ""}`;
    const stato = tapparella.stato_render || "chiusa";
    iLines += `\nState: ${stato === 'aperta' ? 'FULLY OPEN (rolled up, no curtain visible)' : stato === 'mezza' ? 'HALF OPEN (lower 50% covered)' : 'FULLY CLOSED (entire glass covered)'}`;
    iLines += `\nGuide channels: 16-20mm wide, straight, parallel, both sides.`;
    blocks.I = iLines;
  } else {
    blocks.I = `[BLOCK I – SHUTTER]\n${analisi.presenza_tapparella ? "Keep existing shutter as-is." : "No shutter. Do not add one."}`;
  }

  // Block J
  blocks.J = `[BLOCK J – ENVIRONMENT PRESERVATION]\nKeep EXACTLY: wall (${analisi.colore_muro}, ${analisi.materiale_muro}), ${analisi.presenza_davanzale ? "sill (" + (analisi.tipo_davanzale || "existing") + ")" : "no sill"}, ${analisi.presenza_inferriata ? "security bars" : "no bars"}, perspective (${analisi.angolo_ripresa}), all surroundings, sky, lighting (${analisi.luce}).`;

  // Block K
  blocks.K = `[BLOCK K – LIGHTING & SHADOWS]\nMatch lighting (${analisi.luce}). Render correct shadows from new frame, hinges, handle, cassonetto protrusion. Glass reflections match scene light direction. Ambient occlusion in frame corners and wall-frame transition.`;

  // Block L
  blocks.L = `[BLOCK L – NEGATIVE CONSTRAINTS]\nDO NOT: change wall/facade, alter perspective, add absent elements, change sky/weather, create CGI artifacts, add text/watermarks, distort proportions, add hinges to fixed windows, add shutters/cassonetto not requested. Must be photorealistic.`;

  const systemPrompt = blocks.A;
  const userParts = [blocks.B, blocks.C, blocks.D, blocks.E, blocks.F, blocks.G, blocks.H, blocks.I, blocks.J, blocks.K, blocks.L];
  if (notes) userParts.push(`[ADDITIONAL NOTES]\n${notes}`);
  const userPrompt = userParts.join("\n\n");
  const negativePrompt = "cartoon, illustration, sketch, drawing, watermark, text overlay, blurry, distorted perspective, different building, changed wall color, unrealistic lighting, 3D render, CGI artifacts, missing hinges, wrong panels, shutters not requested, cassonetto added without request";
  return { systemPrompt, userPrompt, negativePrompt, promptVersion: "3.0.0", blocks };
}

// ─── Main Handler ─────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  const rid = generateRequestId();
  const FN = "generate-render";

  let sessionId: string | undefined;

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── Auth: validate JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }
    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !user) {
      return jsonError("Unauthorized", "auth_error", 401, rid);
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    sessionId = body.session_id;
    if (!sessionId) return jsonError("session_id required", "validation_error", 400, rid);

    const { data: session, error: sessErr } = await supabase.from("render_sessions").select("*").eq("id", sessionId).single();
    if (sessErr || !session) return jsonError("Session not found", "not_found", 404, rid);

    // Generate signed URL
    const originalUrl: string = session.original_photo_url;
    const bucketPrefix = "/storage/v1/object/public/render-originals/";
    const pathIndex = originalUrl.indexOf(bucketPrefix);
    if (pathIndex === -1) throw new Error("Cannot extract path from original_photo_url");
    const filePath = originalUrl.substring(pathIndex + bucketPrefix.length);
    const { data: signedData, error: signedErr } = await supabase.storage.from("render-originals").createSignedUrl(filePath, 3600);
    if (signedErr || !signedData?.signedUrl) throw new Error("Failed to create signed URL");
    const imageUrl = signedData.signedUrl;

    // Check credits
    const { data: credits } = await supabase.from("render_credits").select("balance").eq("company_id", session.company_id).single();
    if (!credits || credits.balance <= 0) {
      await supabase.from("render_sessions").update({ status: "failed", error_message: "Crediti render esauriti" }).eq("id", sessionId);
      return jsonError("No render credits", "insufficient_credits", 402, rid);
    }

    await supabase.from("render_sessions").update({ status: "processing", processing_started_at: new Date().toISOString() }).eq("id", sessionId);

    const { data: providerConfig } = await supabase.from("render_provider_config").select("*").eq("is_default", true).eq("is_active", true).single();
    if (!providerConfig) throw new Error("No active provider configured");

    const { systemPrompt, userPrompt, negativePrompt, promptVersion, blocks } = buildPromptFromConfig(session);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // 120s timeout
    const response = await fetchWithTimeout("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: [{ type: "text", text: userPrompt }, { type: "image_url", image_url: { url: imageUrl } }] },
        ],
        modalities: ["image", "text"],
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

    const base64 = imageData.split(",")[1];
    const bytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
    const resultPath = `${session.company_id}/${sessionId}_result.png`;
    const { error: uploadErr } = await supabase.storage.from("render-results").upload(resultPath, bytes, { contentType: "image/png", upsert: true });
    if (uploadErr) throw uploadErr;

    const { data: urlData } = supabase.storage.from("render-results").getPublicUrl(resultPath);
    const resultUrl = urlData.publicUrl;

    await supabase.rpc("deduct_render_credit", { _company_id: session.company_id });

    await supabase.from("render_sessions").update({
      status: "completed", result_urls: [resultUrl], prompt_used: userPrompt.substring(0, 10000),
      provider_key: providerConfig.provider_key, cost_real: providerConfig.cost_real_per_render,
      cost_billed: providerConfig.cost_billed_per_render, processing_completed_at: new Date().toISOString(),
      prompt_blocks: blocks, prompt_version: promptVersion, prompt_char_count: (systemPrompt + userPrompt).length,
      config_snapshot: session.config,
    }).eq("id", sessionId);

    await supabase.from("render_provider_config").update({ renders_generated: (providerConfig.renders_generated || 0) + 1 }).eq("id", providerConfig.id);
    await supabase.from("ai_audit_log").insert({
      action: "render_generated", company_id: session.company_id, user_id: session.created_by,
      entity_type: "render_session", entity_id: sessionId,
      details: { provider: providerConfig.provider_key, cost_billed: providerConfig.cost_billed_per_render, prompt_version: promptVersion },
    });

    log("info", "Render completed", { request_id: rid, fn: FN, session_id: sessionId });
    return jsonOk({ success: true, result_url: resultUrl }, rid);
  } catch (err) {
    log("error", "Render failed", { request_id: rid, fn: FN, session_id: sessionId, error: err instanceof Error ? err.message : "unknown" });

    try {
      if (sessionId) {
        const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
        await supabase.from("render_sessions").update({
          status: "failed", error_message: err instanceof Error ? err.message : "Unknown error",
        }).eq("id", sessionId);
      }
    } catch { /* best effort */ }

    return errorResponse(err, rid, FN);
  }
});
