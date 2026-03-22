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

    // Verify user belongs to same company (superadmins bypass)
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
    const { data: userRoles } = await supabase.from("user_roles").select("role").eq("user_id", user.id);
    const isSuperAdmin = userRoles?.some((r: { role: string }) => r.role === "superadmin" || r.role === "superadmin_user");
    if (!isSuperAdmin && (!profile || profile.company_id !== session.company_id)) {
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

    // Pre-flight credit check (avoids wasting AI quota on zero-balance)
    const { data: preCheck } = await supabase
      .from("render_credits")
      .select("balance")
      .eq("company_id", session.company_id)
      .single();
    if (!preCheck || preCheck.balance <= 0) {
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

    // Build prompt from session config using full prompt builder v2
    const config = session.configurazione || {};
    const analisi = session.analisi_bagno || {};
    const { systemPrompt, userPrompt, promptVersion } = buildBathroomPromptV2(analisi, config);

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

    // Extract image from response — check multiple possible locations:
    // 1. images field (Nano banana format): data.choices[0].message.images[0].image_url.url
    // 2. content as array: data.choices[0].message.content[].image_url.url or inlineData
    // 3. content as string: data:image/...
    let imageData: string | undefined;

    const imagesField = data.choices?.[0]?.message?.images;
    const contentField = data.choices?.[0]?.message?.content;

    if (Array.isArray(imagesField) && imagesField.length > 0) {
      imageData = imagesField[0]?.image_url?.url;
    } else if (typeof contentField === "string" && contentField.startsWith("data:image")) {
      imageData = contentField;
    } else if (Array.isArray(contentField)) {
      const imgPart = contentField.find((p: any) => p.type === "image_url" || p.inlineData);
      if (imgPart?.image_url?.url) {
        imageData = imgPart.image_url.url;
      } else if (imgPart?.inlineData?.data) {
        imageData = `data:image/png;base64,${imgPart.inlineData.data}`;
      }
    }

    if (!imageData) {
      log("error", "No image in AI response", { request_id: rid, fn: FN, keys: Object.keys(data.choices?.[0]?.message || {}) });
      throw new Error("No image returned from AI");
    }

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

    // Atomic deduction with FOR UPDATE lock — handles race condition
    const { data: deductResult } = await supabase.rpc("deduct_render_credit", { _company_id: session.company_id });
    if (deductResult === "insufficient") {
      await supabase.from("render_bagno_sessions").update({ stato: "errore", error_message: "Crediti render esauriti" }).eq("id", sessionId);
      return jsonError("No render credits", "insufficient_credits", 402, rid);
    }

    // Update session
    await supabase.from("render_bagno_sessions").update({
      stato: "completato",
      render_result_path: resultPath,
      render_result_url: resultUrl,
      prompt_usato: userPrompt.substring(0, 10000),
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

// ═══════════════════════════════════════════════════════════════
// FULL BATHROOM PROMPT BUILDER v2.0.0
// Ported from src/modules/render-bagno/lib/bathroomPromptBuilder.ts
// ═══════════════════════════════════════════════════════════════

const TILE_PHYSICS: Record<string, string> = {
  marmo_carrara: "natural marble: slight translucency at surface, reflective with minor surface imperfections, polished high-gloss or satin finish",
  marmo_calacatta: "premium marble: high-polish reflective surface, dramatic contrast between white base and bold veining",
  marmo_sahara_noir: "dark marble: deep polished black surface with vivid contrasting gold/white veining reflecting light",
  marmo_marquinia: "black marble: deep glossy black with fine white vein network, elegant high-contrast reflections",
  marmo_verde_guatemala: "green marble: deep polished forest green surface with white/grey veining, bold natural stone",
  marmo_statuario: "premium white marble: pure bright white polished surface with thin grey-blue veining, classic refined luxury",
  marmo_emperador: "brown marble: deep warm brown polished surface with lighter cream/beige veining network",
  cemento_grigio: "concrete effect: matte non-reflective surface with fine aggregate texture, slight surface variation",
  cemento_bianco: "white concrete: very light matte surface with fine grain, subtle surface micro-relief",
  cemento_antracite: "dark concrete: near-black matte surface with very fine aggregate visible",
  legno_rovere_chiaro: "light oak porcelain: warm honey base with parallel grain lines, matte to satin finish, NOT actual wood",
  legno_rovere_scuro: "dark oak porcelain: medium-dark warm brown with oak grain, matte finish",
  legno_wenge: "wengé porcelain: very dark espresso brown with contrasting lighter grain, premium modern appearance",
  pietra_ardesia: "slate: dark cleft surface with characteristic layered texture, slight natural colour variation, rough-matte finish",
  travertino: "travertino: warm ivory surface with characteristic linear voids/pores, satin finish",
  basalto: "basalt: dark charcoal grey with fine crystalline texture, contemporary industrial-natural appearance",
  mono_bianco: "gloss white ceramic: perfectly smooth uniform bright white, high specular reflection",
  mono_nero: "gloss black porcelain: perfectly smooth uniform deep black, high specular reflection",
  mono_grigio: "medium grey porcelain: neutral mid-grey uniform surface, matte or satin finish",
  mono_verde_salvia: "sage green ceramic: soft muted sage green uniform, matte finish, botanical aesthetic",
  mono_blu_navy: "navy blue ceramic: deep rich navy blue uniform, matte finish, Mediterranean appeal",
  mono_terracotta: "terracotta ceramic: warm red-orange-brown uniform, matte unglazed, rustic Mediterranean",
  mono_greige: "greige porcelain: warm neutral grey-beige uniform, contemporary understated appearance",
  mosaico_esagoni: "hexagonal mosaic: multiple small hex tiles with visible white grout network, collective surface reflectivity",
  mosaico_penny: "penny round mosaic: small circular tiles creating organic dotted pattern, grout visible between circles",
  mosaico_subway: "subway tile: small rectangular tiles in staggered bond, classic grout joint grid visible",
  mosaico_chevron: "chevron mosaic: elongated tiles in V-pattern, dynamic directional movement",
};

function buildPosaDescription(posa: string): string {
  const MAP: Record<string, string> = {
    orizzontale: "tiles laid in straight horizontal courses, all vertical joints aligned",
    verticale: "tiles in straight vertical stacks, all horizontal joints aligned, visually elongates wall height",
    sfalsata_50: "staggered brick-bond, each row shifted 50% of tile width, traditional yet timeless",
    sfalsata_33: "staggered bond with 1/3 offset, contemporary minimalist pattern",
    spina_pesce: "herringbone pattern at 45° angle, classic elegant diagonal directional layout",
    diagonale: "tiles rotated 45° to wall, diamond orientation, all joints at 45° to walls",
    quadri_dritti: "standard straight grid, joints perpendicular and parallel to all walls",
  };
  return MAP[posa] || posa;
}

function buildFugaDescription(fuga: string): string {
  const MAP: Record<string, string> = {
    fuga_bianca: "white grout (#F5F5F5) — tiles appear as unified surface, classic clean look",
    fuga_grigio_chiaro: "light grey grout (#CCCCCC) — subtle joint definition",
    fuga_grigio: "medium grey grout (#888888) — clear joint grid visible",
    fuga_nera: "black grout (#1A1A1A) — high contrast, dramatic modern grid",
    fuga_avorio: "ivory/cream grout (#E8D8B0) — warm traditional appearance",
    fuga_terracotta: "terracotta grout (#C4622D) — Mediterranean warm rustic tone",
  };
  return MAP[fuga] || fuga;
}

function buildShowerTypeDesc(tipo: string): string {
  const MAP: Record<string, string> = {
    walk_in: "open walk-in shower, no full enclosure, modern minimalist",
    nicchia_box: "alcove shower with glass door enclosure on front face",
    angolare: "corner shower, two glass panels at 90°",
    semicircolare: "quadrant shower, curved glass panel",
    vasca_doccia_combo: "shower over bath combo",
  };
  return MAP[tipo] || tipo;
}

function buildSoffioneDesc(soffione: string): string {
  const MAP: Record<string, string> = {
    a_parete: "wall-mounted shower head at standard height (~200cm)",
    pioggia_soffitto: "ceiling rain shower head — large flat overhead plate mounted in ceiling",
    colonna: "shower column with integrated body jets and top shower",
    combinato: "combination wall mixer + overhead rain shower ceiling plate",
  };
  return MAP[soffione] || soffione;
}

function buildVascaPositionDesc(pos: string): string {
  const MAP: Record<string, string> = {
    parete_lunga: "positioned along the longest wall of the bathroom",
    parete_corta: "positioned along the shorter end wall",
    angolo: "in a corner with two sides against walls",
    centro_stanza: "freestanding in center of bathroom floor space",
  };
  return MAP[pos] || pos;
}

function buildLavaboDesc(tipo: string): string {
  const MAP: Record<string, string> = {
    integrato: "integrated ceramic basin seamlessly merged with countertop",
    appoggio_ovale: "oval above-counter washbasin sitting on top of countertop",
    appoggio_rettangolare: "rectangular above-counter washbasin on countertop",
    semincasso: "semi-recessed basin, partly dropped into countertop",
  };
  return MAP[tipo] || tipo;
}

function buildRubStyle(stile: string): string {
  const MAP: Record<string, string> = {
    stile_quadro: "squared minimal tap — sharp 90° edges, flat faces, architectural minimalist",
    stile_tondo: "round/cylindrical tap — traditional curved body, classic proportions",
    stile_industrial: "industrial exposed pipe-section design, cross-head or lever handles",
    stile_vintage: "vintage/retro curved body, traditional proportions, porcelain detail",
  };
  return MAP[stile] || stile;
}

function buildPareteDesc(tipo: string): string {
  const MAP: Record<string, string> = {
    parete_tinta: "uniform painted wall in specified colour",
    parete_mista: "lower half tiled (120cm), upper half painted in specified colour",
    parete_lastra_cemento: "large concrete panel cladding — seamless matte grey-beige",
    parete_lastra_pietra: "natural/engineered stone panel cladding",
    parete_piastrelle: "fully tiled floor to ceiling",
  };
  return MAP[tipo] || tipo;
}

function buildIlluminazioneDesc(tipo: string): string {
  const MAP: Record<string, string> = {
    faretti: "recessed ceiling spotlights (faretti a incasso), circular chrome or white trim",
    plafoniera: "flush ceiling light fixture (plafoniera), circular or rectangular",
    specchio_led: "LED illuminated mirror with backlit halo effect",
    led_profilo: "indirect LED profile lighting at ceiling perimeter",
  };
  return MAP[tipo] || tipo;
}

// ── BLOCK BUILDERS ──────────────────────────────────────────────

function buildBlock_A(analisi: Record<string, any>): string {
  return `[BLOCK A – EXISTING BATHROOM CONTEXT]
Bathroom size: ${analisi.dimensione_stimata || "medium"} (estimated)
Ceiling height: ${analisi.altezza_soffitto || "standard"}
Layout: ${analisi.forma_bagno || "rectangular"}
Current style: ${analisi.stile_generale || "unknown"}
Renovation status: ${analisi.stato_generale || "to renovate"}
Currently present: ${[
    analisi.presenza_vasca ? `bathtub (${analisi.tipo_vasca_attuale})` : null,
    analisi.presenza_doccia ? `shower (${analisi.tipo_doccia_attuale})` : null,
    analisi.presenza_mobile_bagno ? `vanity (${analisi.stile_mobile}, ${analisi.colore_mobile_dominante})` : null,
    analisi.presenza_wc ? `WC (${analisi.wc_tipo})` : null,
    analisi.presenza_bidet ? "bidet" : null,
  ]
    .filter(Boolean)
    .join(", ")}
Current wall tiles: ${analisi.piastrelle_parete_effetto}, ${analisi.piastrelle_parete_colore_dominante}, ${analisi.piastrelle_parete_formato_stimato}
Current floor: ${analisi.pavimento_effetto}, ${analisi.pavimento_colore_dominante}
Current fixtures: ${analisi.rubinetteria_finitura}
${analisi.note_critiche ? `AI Notes: ${analisi.note_critiche}` : ""}`;
}

function buildBlock_B(cfg: Record<string, any>): string {
  const s = cfg.sostituzione || {};
  const san = cfg.sanitari || {};
  const toChange: string[] = [];
  const toKeep: string[] = [];

  const elements = [
    { key: "piastrelle_parete", label: "WALL TILES" },
    { key: "pavimento", label: "FLOOR TILES" },
    { key: "doccia", label: "SHOWER" },
    { key: "vasca", label: "BATHTUB" },
    { key: "mobile_bagno", label: "VANITY/FURNITURE" },
    { key: "sanitari", label: "TOILET & BIDET" },
    { key: "rubinetteria", label: "TAPS/FIXTURES" },
    { key: "parete_colore", label: "WALL PAINT" },
    { key: "illuminazione", label: "LIGHTING" },
  ];

  const toModernize: string[] = [];

  for (const el of elements) {
    if (s[el.key]) {
      toChange.push(`✅ REPLACE: ${el.label} — full replacement per user specification`);
    } else if (el.key === "sanitari" && (san.wc_tipo || san.azione_bidet)) {
      toChange.push(`🔄 UPGRADE TYPE: ${el.label} — upgrade to user-specified type while keeping position`);
    } else if (el.key === "doccia" && (cfg.doccia?.tipo || cfg.doccia?.box)) {
      toChange.push(`🔄 UPGRADE TYPE: ${el.label} — upgrade to user-specified shower type while keeping position`);
    } else if (el.key === "vasca" && (cfg.vasca?.tipo || cfg.vasca?.azione === "sostituisci" || cfg.vasca?.azione === "rimuovi")) {
      toChange.push(`🔄 UPGRADE TYPE: ${el.label} — upgrade/change bathtub per user specification`);
    } else {
      toModernize.push(`🔄 MODERNIZE (keep type): ${el.label}`);
    }
  }

  return `[BLOCK B – SELECTIVE REPLACEMENT DECLARATION]
ELEMENTS TO FULLY REPLACE IN THIS RENDER:
${toChange.join("\n")}

ELEMENTS THAT SHOULD BE MODERNIZED BUT KEEP THEIR TYPE:
${toModernize.join("\n")}

CRITICAL RULE: Elements marked "REPLACE" must be replaced entirely per the specifications below.
Elements marked "UPGRADE TYPE" must be changed to the specified type/style while keeping their position.
Elements marked "MODERNIZE" may be updated to a cleaner, more modern version that harmonizes
with the new design — but the CATEGORY of object must NOT change.
A toilet must remain a toilet. A bidet must remain a bidet. A bathtub must remain a bathtub.
Do NOT add, remove, or swap fixture types. Only improve their aesthetic appearance.`;
}

function buildBlock_C(cfg: Record<string, any>): string {
  const s = cfg.sostituzione || {};
  if (!s.piastrelle_parete) return `[BLOCK C – WALL TILES — KEPT AS ORIGINAL]`;

  const p = cfg.piastrelle_parete || {};
  const physics = TILE_PHYSICS[p.effetto] || "ceramic tile surface";

  return `[BLOCK C – NEW WALL TILES SPECIFICATION]
Tile effect: ${p.prompt_effetto || p.effetto || "ceramic"}
Material physics: ${physics}
Format/size: ${p.formato || "30x60cm"} tiles
Layout pattern: ${p.posa || "sfalsata_50"} — ${buildPosaDescription(p.posa || "sfalsata_50")}
Grout color: ${buildFugaDescription(p.fuga_colore || "fuga_grigio_chiaro")}
Grout joint width: ${(p.formato || "").includes("lastra") ? "1-2mm (minimal, large format)" : "2-3mm standard"}

WALL TILE APPLICATION ZONES:
- All wall surfaces that are currently tiled in the original photo
- Including inside shower alcove walls (all three tiled sides)
- Include ceiling if visible and currently tiled
- The tile pattern must be continuous and geometrically correct (no perspective errors)
- Tiles must align correctly at corners, edges, and transitions

RENDERING RULES FOR WALL TILES:
- Render ${physics}
- Grout lines must be sharp and consistent in width throughout
- Tiles must have correct perspective distortion matching camera angle
- Reflections and highlights must match bathroom lighting in the photo`;
}

function buildBlock_D(cfg: Record<string, any>): string {
  const s = cfg.sostituzione || {};
  if (!s.pavimento) return `[BLOCK D – FLOOR — KEPT AS ORIGINAL]`;

  const p = cfg.pavimento || {};
  const physics = TILE_PHYSICS[p.effetto] || "porcelain floor tile";

  return `[BLOCK D – NEW FLOOR SPECIFICATION]
Floor tile effect: ${p.prompt_effetto || p.effetto || "porcelain"}
Material physics: ${physics}
Format/size: ${p.formato || "60x60cm"}
Layout pattern: ${p.posa || "quadri_dritti"} — ${buildPosaDescription(p.posa || "quadri_dritti")}
Grout color: ${buildFugaDescription(p.fuga_colore || "fuga_grigio_chiaro")}

FLOOR APPLICATION:
- Cover entire bathroom floor visible in the photo
- Floor must extend continuously under toilet, bidet base, and vanity if floor-standing
- Correct perspective foreshortening towards back of bathroom
- If new piatto doccia a raso (flush) is configured: no visible threshold, floor continues into shower

FLOOR RENDERING RULES:
- ${physics}
- If marble or glossy tile: subtle floor reflections of walls and fixtures visible
- Pattern direction must be consistent (not rotated mid-room)
- Edge tiles must be cut proportionally at room boundaries`;
}

function buildBlock_E(cfg: Record<string, any>, analisi: Record<string, any>): string {
  const d = cfg.doccia || {};

  // Show as original only if no toggle AND no user config
  const hasDocConfig = d.tipo || d.box;
  if (d.azione === "mantieni" && !cfg.sostituzione?.doccia && !hasDocConfig) return `[BLOCK E – SHOWER — KEPT AS ORIGINAL]`;
  if (d.azione === "rimuovi")
    return `[BLOCK E – SHOWER — REMOVE: Fill the shower area with wall tiles matching BLOCK C. Remove all shower hardware, screen, tray.]`;

  let showerRules: string;
  if (d.tipo === "walk_in") {
    showerRules = "Walk-in open shower: NO door or enclosure on one or more sides. The open side faces into bathroom. Single fixed glass panel (if any) has NO moving part.";
  } else if (d.tipo === "nicchia_box") {
    showerRules = "Shower alcove: glass door on front face only. Three tiled walls inside visible. Door opens INTO the shower area.";
  } else if (d.tipo === "angolare") {
    showerRules = "Corner shower: two glass panels meeting at 90° corner. Both panels are equal height. Door on one of the two glass panels.";
  } else {
    showerRules = "Semi-circular shower: curved glass panel forming quarter-circle arc.";
  }

  const glassAppearance = d.box === "box_trasparente" ? "water marks and minor reflections visible through" : "translucent/frosted/tinted";

  return `[BLOCK E – NEW SHOWER SPECIFICATION]
Shower type: ${buildShowerTypeDesc(d.tipo)}
Glass enclosure: ${d.prompt_box || d.box || "transparent glass"}
Shower tray/floor: ${d.prompt_piatto || d.piatto || "flush"}
Frame/profiles: ${d.prompt_profilo || d.profilo || "chrome"}
Shower head: ${buildSoffioneDesc(d.soffione || "a_parete")}

SHOWER RENDERING RULES:
${showerRules}
- Glass panels must have correct ${glassAppearance} appearance
- Profiles (${d.profilo || "chrome"}) must be visible at top rail, door edge, and wall anchor points
- Shower tray: ${d.prompt_piatto || d.piatto || "flush"}
- All shower tile inside matches BLOCK C wall tiles
- Water fixtures: ${d.prompt_profilo || d.profilo || "chrome"} finish for all visible hardware
- Shower must be realistically positioned where current shower is in photo (unless BLOCK LAYOUT instructs different position)`;
}

function buildBlock_F(cfg: Record<string, any>): string {
  const v = cfg.vasca || {};

  // Show as original only if no toggle AND no user config
  const hasVascaConfig = v.tipo || v.azione === "sostituisci" || v.azione === "rimuovi";
  if (v.azione === "mantieni" && !cfg.sostituzione?.vasca && !hasVascaConfig) return `[BLOCK F – BATHTUB — KEPT AS ORIGINAL]`;
  if (v.azione === "rimuovi")
    return `[BLOCK F – BATHTUB — REMOVE: Remove bathtub entirely. Fill the floor area with matching floor tiles (BLOCK D). Tile the wall behind where bathtub was (BLOCK C).]`;

  const isFreestanding = v.tipo === "vasca_freestanding" || v.tipo === "vasca_freestanding_muro";

  const bathRules = isFreestanding
    ? `FREESTANDING BATHTUB:
- Bathtub stands independently on bathroom floor
- All four sides (or three if against wall) are fully visible and rendered in 3D
- Bathtub feet/plinth visible at floor contact
- Floor tiles continue underneath and around the bathtub
- Freestanding tap/mixer standing next to bathtub OR wall-mounted above
- The bathtub appears as a sculptural object in the space`
    : `BUILT-IN BATHTUB:
- Bathtub recessed into alcove or against wall
- Side panel/apron visible on the long open face
- Top edge (bath rim) visible at correct height
- If incassata: three sides are tiled or paneled, one long side is the apron panel
- Tap/mixer on long side or short end`;

  return `[BLOCK F – NEW BATHTUB SPECIFICATION]
Bathtub type: ${v.prompt_tipo || v.tipo || "built-in"}
Shape: ${v.prompt_forma || v.forma || "rectangular"}
Finish/material: ${v.prompt_materiale || v.materiale || "white acrylic"}
Positioning: ${buildVascaPositionDesc(v.posizione || "parete_lunga")}

BATHTUB RENDERING RULES:
${bathRules}
- Bathtub material: ${v.prompt_materiale || v.materiale || "white acrylic"}
- Correct scale relative to room (standard Italian bath 170×75cm typical)
- Correct shadows under and around the bathtub matching scene lighting`;
}

function buildBlock_G(cfg: Record<string, any>): string {
  const vm = cfg.vanity || {};

  if (vm.azione === "mantieni" || !cfg.sostituzione?.mobile_bagno) return `[BLOCK G – VANITY — KEPT AS ORIGINAL]`;
  if (vm.azione === "rimuovi")
    return `[BLOCK G – VANITY — REMOVE: Remove vanity/cabinet. Show only wall behind (tiled per BLOCK C or painted per BLOCK J).]`;

  const mountingRules = (vm.stile || "").includes("sospeso")
    ? "FLOATING VANITY: cabinet is wall-mounted with a visible gap (10-15cm) between base and floor. Floor tiles continue under the vanity. No legs or base touching floor."
    : "FLOOR-STANDING VANITY: cabinet rests on floor. No gap visible.";

  const rubFinitura = cfg.rubinetteria?.prompt_finitura || cfg.rubinetteria?.finitura || "chrome";

  return `[BLOCK G – NEW VANITY/FURNITURE SPECIFICATION]
Vanity style: ${vm.prompt_stile || vm.stile || "modern"}
Width: approx ${vm.larghezza_cm || 80}cm
Cabinet color: ${vm.colore || "white"}
Countertop: ${vm.prompt_piano || vm.piano || "ceramic"}
Sink/washbasin: ${buildLavaboDesc(vm.lavabo || "integrato")}
Tap finish: ${rubFinitura}

VANITY RENDERING RULES:
${mountingRules}
- Cabinet finish: ${vm.colore || "white"} — render with correct material sheen (lacquered = satin-gloss, wood = grain visible)
- Countertop: ${vm.prompt_piano || vm.piano || "ceramic"}
- Sink: ${buildLavaboDesc(vm.lavabo || "integrato")} — correct ceramic/stone white surface
- Mirror above vanity: if present in original, keep mirror in same position and style
- Correct scale: ${vm.larghezza_cm || 80}cm wide, approx 50cm deep, 85cm floor-to-top height (or floating height)
- Hardware (handles if present): ${rubFinitura} finish`;
}

function buildBlock_H(cfg: Record<string, any>): string {
  const s = cfg.sostituzione || {};
  const san = cfg.sanitari || {};
  const wcTipo = san.wc_tipo || "sospeso";
  const colore = san.colore || "bianco";

  // If no full replacement AND no user config, keep as original
  if (!s.sanitari && !san.wc_tipo && !san.azione_bidet) {
    return `[BLOCK H – TOILET & BIDET — KEPT AS ORIGINAL]`;
  }

  const upgradeNote = !s.sanitari ? " (upgrade to specified type, keep position)" : "";

  const toiletDesc = wcTipo === "sospeso" || wcTipo === "rimless_sospeso"
    ? "wall-hung toilet — the pan is mounted to the wall, floor below is completely clear, in-wall cistern concealed behind wall (not visible externally)"
    : "floor-standing toilet — the base rests on the floor, floor connection visible";

  const bidetAction = san.azione_bidet || "mantieni";
  const bidetLine = bidetAction !== "rimuovi"
    ? `Bidet: ${bidetAction === "sostituisci" ? "new " : ""}${wcTipo === "sospeso" ? "wall-hung bidet" : "floor-standing bidet"}, ${colore} ceramic, matching toilet style`
    : "Bidet: REMOVE — show floor tiles where bidet was";

  const floorRule = wcTipo === "sospeso"
    ? "NO floor base visible — complete floor continuity under toilet pan"
    : "Floor contact: circular or rectangular base visible at floor level";

  return `[BLOCK H – TOILET & BIDET SPECIFICATION${upgradeNote}]
Toilet type: ${toiletDesc}
Toilet color: ${colore} ceramic
${bidetLine}

TOILET RENDERING RULES:
- Ceramic surface: smooth high-gloss ${colore} ceramic
- Soft-close seat cover in matching or white color
- ${floorRule}
- Flush button: rectangular push-plate on wall above cistern (if wall-hung) OR tank lid button (if floor-standing)
- Correct proportion: standard WC 360-400mm wide, 550-700mm deep`;
}

function buildBlock_I(cfg: Record<string, any>): string {
  const s = cfg.sostituzione || {};
  if (!s.rubinetteria) return `[BLOCK I – FIXTURES — KEPT AS ORIGINAL]`;

  const r = cfg.rubinetteria || {};
  const finitura = r.prompt_finitura || r.finitura || "chrome";
  const stile = r.stile || "stile_tondo";

  const bathLine = cfg.vasca?.azione !== "rimuovi" && cfg.vasca?.azione !== "mantieni"
    ? `- Bath mixer/filler: ${finitura}, mounted on bath rim or wall above bath`
    : "";

  return `[BLOCK I – FIXTURES & TAPS SPECIFICATION]
All visible taps, mixers, showerhead, and hardware: ${finitura}
Style: ${buildRubStyle(stile)}

FIXTURES TO RENDER:
- Washbasin mixer/tap: ${stile} body form, ${finitura}, mounted on countertop or wall
- Shower mixer/thermostatic: ${finitura} valve on shower wall
- Shower head: ${finitura} finish on all fittings
${bathLine}
- Towel rail/radiator (if visible): ${finitura} finish
- ALL metal hardware visible in bathroom adopts ${finitura} finish

FIXTURE RENDERING RULES:
- ${finitura} — apply correct physical appearance to all hardware
- Correct scale: standard single-lever mixer 150-200mm tall
- Aerator/spout visible at tap end
- Correct shadow casting from chrome/metal surfaces`;
}

function buildBlock_J(cfg: Record<string, any>): string {
  const s = cfg.sostituzione || {};
  if (!s.parete_colore) return `[BLOCK J – WALL PAINT — KEPT AS ORIGINAL]`;

  const p = cfg.parete || {};
  if (p.azione === "mantieni") return `[BLOCK J – WALL PAINT — KEPT AS ORIGINAL]`;

  let applicationRules: string;
  if (p.tipo === "parete_mista") {
    applicationRules = `HALF-AND-HALF LAYOUT:
- Lower half (approx 120cm from floor): tiled with BLOCK C wall tiles
- Upper half (120cm to ceiling): painted in the specified colour
- Clear horizontal dividing line or profile strip between tile and paint`;
  } else if (p.tipo === "parete_tinta") {
    applicationRules = `FULL PAINTED WALL:
- All non-tiled wall surfaces painted in the specified colour
- Even matte finish unless otherwise specified
- Paint does NOT go over tile areas (tile remains where specified)`;
  } else if (p.tipo === "parete_lastra_cemento") {
    applicationRules = `CONCRETE PANEL CLADDING:
- Large concrete-effect panels covering the specified wall surface
- Seamless matte grey-beige surface, minimal joints
- Large format (typically 1200×2400mm) visible slab edges`;
  } else {
    applicationRules = `Stone panel cladding on wall — natural stone texture applied to specified wall surfaces`;
  }

  return `[BLOCK J – WALL PAINT / FINISH SPECIFICATION]
Wall treatment: ${buildPareteDesc(p.tipo || "parete_tinta")}
${p.colore_nome ? `Color: ${p.colore_nome}` : ""}
${p.colore_hex ? `Approximate hex: ${p.colore_hex}` : ""}

WALL PAINT APPLICATION:
${applicationRules}
- Painted surfaces must show subtle lighting gradient (brighter near light source, slightly darker in corners)
- Paint finish must NOT appear flat or CGI — subtle natural wall texture visible in photo`;
}

function buildBlock_K(cfg: Record<string, any>): string {
  const s = cfg.sostituzione || {};
  if (!s.illuminazione) return `[BLOCK K – LIGHTING — KEPT AS ORIGINAL]`;

  const il = cfg.illuminazione_tipo || "faretti";

  let lightingRules: string;
  if (il === "faretti") {
    lightingRules = "Replace existing ceiling light with recessed spotlights (faretti a incasso) — circular trim flush with ceiling, white or chrome. Multiple units spaced evenly.";
  } else if (il === "specchio_led") {
    lightingRules = "LED-illuminated mirror: mirror with integrated edge LED strip creating backlit halo effect around perimeter. Warm white glow visible around mirror edges.";
  } else if (il === "led_profilo") {
    lightingRules = "Recessed LED profile: indirect ambient light from LED profile at ceiling-wall junction or under vanity. Warm white glow visible.";
  } else {
    lightingRules = "Surface-mounted ceiling light (plafoniera) — circular or square flush ceiling fixture.";
  }

  return `[BLOCK K – LIGHTING SPECIFICATION]
New lighting type: ${buildIlluminazioneDesc(il)}

LIGHTING RENDERING:
${lightingRules}
- Overall lighting quality must remain photorealistic and match original photo's ambient light direction
- Do NOT add unrealistic bloom or lens flare effects
- Maintain natural shadows consistent with light source position`;
}

function buildBlock_Layout(layout: Record<string, any>): string {
  return `[BLOCK LAYOUT – COMPLETE BATHROOM REDESIGN]
⚠️ FULL REDESIGN: This render shows a completely new bathroom layout.

Room dimensions: approx ${layout.larghezza_cm || 200}cm × ${layout.lunghezza_cm || 300}cm
Ceiling height: standard (240cm unless specified)

NEW ELEMENT POSITIONING:
- Shower: ${(layout.posizione_doccia || "fondo_sinistra").replace(/_/g, " ")} of room
- Bathtub: ${(layout.posizione_vasca || "assente").replace(/_/g, " ")} (or remove if "assente")
- Vanity/sink: along ${(layout.posizione_mobile || "parete_lunga").replace(/_/g, " ")} wall
- Toilet: ${(layout.posizione_wc || "accanto_mobile").replace(/_/g, " ")}

${layout.note_layout ? `Additional layout notes: ${layout.note_layout}` : ""}

CRITICAL:
- The walls, floor, and structural openings (windows, door) remain in same positions
- Only the bathroom fixtures and fittings are rearranged
- All plumbing connections are assumed to be relocated as needed
- Render must show the new layout in a photorealistic perspective matching original photo angle`;
}

// ── SYSTEM & NEGATIVE PROMPTS ──────────────────────────────────

const BATHROOM_SYSTEM_PROMPT = `SURGICAL INTERIOR DESIGN VISUALIZATION EDITOR
You are performing a precise surgical replacement of bathroom interior elements in a real photograph.

RULE 1: Replace ONLY what is explicitly listed in BLOCK B as "✅ REPLACE" or "🔄 UPGRADE TYPE".
RULE 2: Every other surface, object, and pixel must be photorealistic and identical to original.
RULE 3: The result must be completely indistinguishable from a professional interior design photograph.
RULE 4: Tile patterns must be geometrically correct — proper perspective, consistent joint width, no floating tiles.
RULE 5: All replaced materials must have physically correct appearance (marble=polished reflective, concrete=matte, wood=grain visible).
RULE 6: Fixtures and hardware must cast correct shadows matching the scene's ambient lighting.
RULE 7: Scale and proportions of all replaced elements must match realistic Italian bathroom standards.
RULE 8: Glass shower screens must show correct transparency/translucency with water marks and reflections.
RULE 9: DO NOT change room dimensions, ceiling height, window positions, or structural elements.
RULE 10: DO NOT add people, towels, plants, or decorative objects that were not in the original photo.
No artistic interpretation. No CGI. No illustration. Photorealism only.`;

const BATHROOM_NEGATIVE_PROMPT = [
  "cartoon", "illustration", "sketch", "3D render", "CGI look", "oversaturated",
  "HDR effect", "vignette", "watermark", "text overlay",
  "wrong tile perspective", "floating tiles", "tiles not meeting at corners",
  "inconsistent grout width", "tile pattern not continuous",
  "wood grain on ceramic tile", "flat color on marble tile",
  "shower screen on wrong side", "missing shower hardware", "shower tray wrong color",
  "glass screen without frame when profiles specified",
  "bathtub wrong shape", "bathtub floating above floor", "missing bathtub feet",
  "freestanding bath without floor contact",
  "toilet floating above floor", "wall-hung toilet with visible base",
  "toilet wrong scale", "bidet merged with toilet",
  "changed room dimensions", "different window position", "different ceiling height",
  "altered room perspective", "added furniture not requested",
  "added plants or decorative objects", "changed wall opening",
  "different lighting direction", "different season or time of day",
].join(", ");

const QUALITY_SUFFIX = `
[FINAL QUALITY REQUIREMENTS]

PHOTOGRAPHIC REALISM CHECKLIST:
✅ Result must look like a professional interior design magazine photo
✅ Same camera perspective, angle, and focal length as original photo
✅ Correct perspective distortion on all flat surfaces (floor, walls)
✅ Tile grout lines follow convergence lines correctly
✅ Reflections on polished surfaces are physically accurate
✅ All shadows are consistent with a single ambient light source
✅ Materials have correct surface qualities (marble=polished+reflective, concrete=matte, wood=grain visible)
✅ No floating objects — everything touches its support surface correctly

ITALIAN BATHROOM PROPORTIONS (standard reference):
- Toilet: 360-400mm wide, 550-700mm deep
- Bidet: 360mm wide, 560mm deep (next to toilet, same height)
- Shower tray: typically 80×80cm, 90×90cm, 70×140cm or custom
- Bathtub: typically 170×75cm or 160×70cm
- Vanity height: 85cm standard; floating vanities at 80-90cm from floor
- Wall tile height: typically 200-240cm (floor to ceiling in new build)

LIGHTING CONSISTENCY:
- Do not change the direction or quality of ambient light from original photo
- Correct shadows under floating vanity, behind toilet, in shower corners
- Reflections on mirror remain consistent with scene

GROUT LINE TECHNICAL REQUIREMENT:
- Grout joint width must be perfectly consistent throughout
- 1-2mm for large format slabs
- 2-3mm for 30×60cm and smaller
- 3-5mm for mosaics and small format tiles
- NO wavy or irregular grout lines

Do not include watermarks, text overlays, or any artificial marks.
Output must be exactly the same pixel dimensions and aspect ratio as the input photo.`;

// ── MAIN BUILDER FUNCTION ──────────────────────────────────────

function buildBathroomPromptV2(
  analisi: Record<string, any>,
  config: Record<string, any>,
): { systemPrompt: string; userPrompt: string; promptVersion: string } {
  const blocks: string[] = [
    buildBlock_A(analisi),
    buildBlock_B(config),
    buildBlock_C(config),
    buildBlock_D(config),
    buildBlock_E(config, analisi),
    buildBlock_F(config),
    buildBlock_G(config),
    buildBlock_H(config),
    buildBlock_I(config),
    buildBlock_J(config),
    buildBlock_K(config),
  ];

  if (config.tipo_intervento === "demolizione_completa" && config.layout?.attivo) {
    blocks.push(buildBlock_Layout(config.layout));
  }

  blocks.push(`[BLOCK FINALE – RENDER QUALITY REQUIREMENTS]
Output must look like a professional interior design magazine photograph.
Render at the same camera angle and perspective as the original photo.
Maintain all lighting, shadows, reflections, and ambient quality from original.
Do not add watermarks, text, or any overlay.
Output format: photorealistic JPEG/PNG, same aspect ratio as input.
Negative prompt — avoid: ${BATHROOM_NEGATIVE_PROMPT}`);

  blocks.push(QUALITY_SUFFIX);

  return {
    systemPrompt: BATHROOM_SYSTEM_PROMPT,
    userPrompt: blocks.join("\n\n"),
    promptVersion: "bagno-2.0.0",
  };
}
