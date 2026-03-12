import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders, generateRequestId, log, fetchWithTimeout, jsonOk, jsonError, errorResponse } from "../_shared/utils.ts";

// ─── Inline Prompt Builder v5 ─────────────────────────────────────

const MATERIAL_PHYSICS: Record<string, string> = {
  pvc: "white or colored PVC (polyvinyl chloride) frame — smooth matte surface with very slight plastic texture under direct light, internal multi-chamber structure visible at frame cross-section edges, corners welded with subtle seam lines, uniform color throughout without natural grain, exterior surface shows shallow surface relief from extrusion process",
  alluminio: "extruded aluminum frame — anodized or powder-coated exterior, sharp precise 90° or slightly beveled edges, clearly visible thermal break (dark polyamide strip, approximately 3-5mm wide) between inner and outer shells at frame cross-section, surface shows very subtle directional micro-texture from coating process, thin elegant profile (typically 50-65mm visible sight line width), consistent metallic finish",
  legno: "solid wood frame — clearly visible natural wood grain running along the frame length, slightly rounded milled edges, paint or opaque stain finish showing faint grain texture beneath the coating, traditional mortise-and-tenon visible corner joint geometry (slight raised line at 45° miter), warm organic color variation, thicker profile (68-92mm sight line), possible hairline micro-cracks at painted corners",
  legno_alluminio: "hybrid timber-aluminum composite frame — interior side shows solid wood with warm grain and stain finish, exterior side shows slim precision-extruded aluminum cladding with powder-coated finish, visible thin shadow line at the wood-aluminum transition edge, combines warmth of interior wood aesthetic with weather-resistant modern aluminum exterior",
  acciaio_corten: "Corten weathering steel frame — unmistakable rust-orange patina with rough oxidized surface texture and natural color variation from dark rust-red to lighter orange-tan, ultra-thin sight line profiles (25-35mm visible width), industrial precise geometric form, characteristic streaking pattern typical of Cor-Ten oxidation",
  acciaio_minimale: "ultra-minimal structural steel frame — extremely thin sight lines (15-25mm), deep matte black or dark anthracite powder-coated surface, machined precise geometric edges, nearly frameless appearance with maximum glass-to-frame ratio, industrial modern aesthetic, tiny cap screws or concealed fixings visible at mullion intersections",
};

const APERTURA_DESCRIPTION: Record<string, string> = {
  battente_1_anta: "single-leaf inward-opening casement window — ONE sash panel hinged on the LEFT or RIGHT side, operated by a single lever handle on the opposite stile, 2 hinges visible on the hinge side stile (top and bottom), center-of-glass gasket line visible",
  battente_2_ante: "double-leaf inward-opening casement window — TWO equal sash panels meeting at center, each hinged on its outer side stile, 2 hinges per sash = 4 hinges total (2 visible on left stile, 2 on right stile), each sash has its own lever handle near the center meeting stile, center rebate/espagnolette bolt visible where panels meet",
  battente_3_ante: "triple-leaf casement window — THREE panels, typically center panel fixed (no hinges, no handle) flanked by two opening sashes each with 2 hinges and a handle, visible central fixed mullion and two moving sash dividers",
  scorrevole: "horizontal sliding window — two or more panels sliding on visible aluminum top rail and bottom track, each panel has a flush pull handle or recessed grip, no hinges visible, only sliding hardware guides at top corners",
  scorrevole_alzante: "lift-and-slide large door/window — very large glass panels (typically 1.5-3m wide each), bottom track system with lifting hardware visible, heavy-duty multi-point lock handle on leading edge, no exposed hinges, minimal frame profile at panel edges",
  vasistas: "top-hung tilt-in window — sash hinged at TOP rail only, opens by tilting inward from the bottom, handle located on bottom rail of sash, 2 friction hinges at top corners, scissor-arm stay mechanism visible on both side stiles when open",
  anta_ribalta: "tilt-and-turn window — multi-function sash with BOTH tilt-in (vasistas) and side-swing (battente) capability, 2 hinges on hinge-side stile, distinctive multi-position lever handle (pointing DOWN=closed, HORIZONTAL=tilt, UP=turn), rebated all around",
  bilico: "center-pivot window — sash rotates on central horizontal pivot axis, top half swings inward while bottom swings outward, visible pivot fittings at mid-height of both side stiles, no traditional hinges on frame edges",
  fisso: "fixed non-opening light — no hinges, no handle, no gaps or shadow lines from sash rebate, glass beaded directly into fixed frame, single uninterrupted frame profile all around",
  portafinestra: "full-height balcony/French door — floor-to-near-ceiling height (typically 210-240cm), low threshold (15-20mm) at floor level, same 2-hinges-per-leaf as standard window but larger scale, may have floor-mounted pivot pin, anti-panic handle or lever, often with fixed sidelight panels",
  cassonetto_integrato: "window with integrated roller box — standard opening sash below, above the frame top rail a visible box housing containing the rolled-up shutter, box face-panel protrudes 60-200mm from wall plane, typically same color as frame",
};

const CASSONETTO_MATERIAL_DESC: Record<string, string> = {
  pvc_tradizionale: "traditional PVC roller shutter housing (cassonetto PVC standard) — rectangular box profile protruding 160-200mm above window top rail, face panel approximately 200mm tall, smooth matte PVC surface with subtle panel seam line, bottom strip slightly recessed where shutter curtain exits, same extrusion quality as PVC window frame",
  pvc_slim: "slim-profile PVC cassonetto — reduced-depth housing only 110-130mm visible height above frame, lower profile ratio for modern facades, smooth face panel with minimal protrusion (80-100mm from wall), contemporary proportions matching thin-profile frame systems",
  pvc_integrato: "wall-integrated cassonetto (cassonetto a muro/incassato) — fully recessed into masonry, only the bottom inspection strip approximately 30-40mm visible below wall surface level, wall plaster or cladding runs continuously over the housing, virtually invisible from exterior — only a thin reveal line marks its position",
  alluminio_coibentato: "insulated aluminum cassonetto — aluminum face panels with powder-coated finish matching or contrasting frame, visible side inspection cover flanges at 45° angles, polyurethane foam fill (not visible but implied by professional thermal appearance), face panel 170-210mm height, crisp machined edges and corners",
};

const TAPPARELLA_DESC: Record<string, string> = {
  pvc_avvolgibile: "PVC roll-up shutter curtain — horizontal extruded PVC slats 37-55mm wide, each slat with smooth rounded upper edge and male-female interlocking lower edge, uniform matte colored surface with very subtle extrusion line texture running horizontally, bottom end-rail heavier profile (40-60mm) with integrated rubber seal and lift lug, side guide channels (guide) visible as thin U-profile strips on left and right jamb faces, total curtain thickness approximately 8-12mm",
  alluminio_avvolgibile: "aluminum roll-up shutter curtain — extruded aluminum foam-filled slats 37-55mm wide, slightly metallic surface sheen compared to PVC, slat walls approximately 1.2-1.5mm thick with visible interior foam at side edges when looked at obliquely, crisp precise slat-to-slat joints, heavier appearance than PVC equivalent, bottom bar with EPDM rubber weatherstrip, side guide channels in matching anodized or powder-coated aluminum",
  microforata: "microperforated roll-up shutter — same slat profile as standard PVC/aluminum avvolgibile but with regular grid of circular perforations 3-4mm diameter at approximately 6-8mm centers, perforation pattern creates a screenprint-like texture visible across the curtain surface, light passes through holes creating dappled interior light, retains privacy from outside while allowing partial outward vision from inside",
  persiana_alluminio: "aluminum louvered shutter (persiana avvolgibile) — horizontal extruded aluminum slats 60-80mm wide with traditional shutter profile (S-curve cross-section), visible twin pivot pins at each slat end inserted into side guide channels, slats appear at consistent angle (typically 30-45° open or closed), side channel guides are deeper (40-50mm) than standard roller guides, traditional Mediterranean aesthetic, bottom rail is a solid bar connecting all slat pivots",
  veneziana_integrata: "integral blind between glazing (tendina veneziana integrata) — visible only as a series of very thin parallel horizontal lines 25mm apart suspended between the two glass panes inside the double-glazing unit, slat lines cast faint shadow on interior glass surface, operated by a small external thumb-wheel or magnetic control on frame edge, no external mechanism visible, glass still appears transparent with blind fully open, gives ultra-minimal modern look",
  nessuna: "No shutter or blind — bare window frame only with no additional covering system",
};

const CERNIERA_DESC: Record<string, string> = {
  europea: "Standard European butt hinge (cerniera europea) — two rectangular steel plates approximately 50×35mm each, 3 countersunk screws per plate, polished or coated to match hardware, central pin knuckle approximately 8mm diameter, hinge projects 3-4mm from frame face when closed",
  a_libro: "Book-fold concealed hinge (cerniera a libro) — when door/window is closed hinge is partially recessed into frame rebate, only the outer knuckle visible as a thin strip approximately 6mm × 40mm, appears more elegant and flush than standard hinge",
  invisibile: "Fully concealed pivot hinge (cerniera invisibile/nascosta) — completely hidden inside frame rebate when window is closed, no visible hardware on frame face, only a very faint rebate shadow line indicates hinge location, premium invisible appearance",
};

const CERNIERA_COLORE_DESC: Record<string, string> = {
  argento: "silver polished chrome finish",
  nero_opaco: "matte black finish",
  inox: "brushed stainless steel finish",
  bronzo: "antique bronze finish",
  oro: "polished gold/brass finish",
  uguale_maniglia: "same finish as the window handle",
};

// ─── v5 Dictionaries ──────────────────────────────────────────────

const CINGHIA_DESC: Record<string, string> = {
  con_cinghia: "manual strap winder (avvolgitore a cinghia) — rectangular surface-mounted plastic box (120×160mm) on interior wall beside window, 15mm wide woven polyester strap exits through wall slot and wraps around internal spring-loaded drum, visible strap hanging in slight arc when at rest",
  senza_cinghia: "motorized (no strap) — no visible strap or winder on interior or exterior; small flush switch plate (single rocker UP/DOWN/STOP) or RF remote receiver mounted near frame; motor housed inside roller tube within cassonetto, inaudible from exterior",
  con_catenella: "bead chain operator (catenella) — small-diameter stainless-steel or plastic bead chain loop hanging 300-400mm beside window frame, connected to internal geared clutch mechanism at frame edge, used for venetian blinds or light roller screens",
  con_manovella: "manual crank operator (manovella) — folding or fixed metal crank handle 100-150mm long projecting from frame edge or wall plate, connected via rigid rod through wall to worm-gear mechanism on roller tube, visible crank hardware at waist height beside window",
};

const STILE_TELAIO_DESC: Record<string, string> = {
  nodo_ridotto: "reduced-node (nodo ridotto) profile — sash sits nearly flush with outer frame, minimal step between sash face and frame face (only 3-5mm reveal), maximizes glass area, contemporary flush-line aesthetic, gasket lines barely visible",
  nodo_ridotto_maniglia_centrale: "reduced-node profile with CENTER-PLACED handle — same flush geometry as nodo ridotto, BUT the lever handle is positioned at exact vertical center of the sash height (not at standard 1/2-down or lock-stile position), creating a symmetrical visual balance point",
  minimal_squadrato: "minimal squared profile — ultra-thin sight lines (35-45mm), sharp 90° edges with no rounding, Bauhaus-inspired geometric precision, maximum glass-to-frame ratio",
  classico_arrotondato: "classic rounded profile — traditional residential proportions with softly rounded edges (radius 3-5mm), wider sight lines (55-70mm), familiar warm aesthetic",
  europeo_classico: "classic European profile — standard 70-82mm system with gentle 2mm edge radius, balanced proportions suitable for renovation of traditional buildings",
  arco_sagomato: "arched/shaped frame — non-rectangular frame following arch, gothic, or custom curved geometry at top rail, requires bent or segmented profile pieces, traditional architectural feature",
};

const MANIGLIE_V5: Record<string, string> = {
  toulon: "Toulon-style curved ergonomic lever handle — smooth S-curve body form, rounded grip terminus, 130-145mm total length, slim 22-25mm grip diameter, visible curved shank transition from backplate to lever body",
  classica_dritta: "Classic straight lever handle — flat rectangular profile, 120-130mm lever length, 20-22mm grip thickness, square or slightly beveled edges, standard Italian residential window hardware",
  vienna: "Vienna butterfly-wing (farfalla) lever handle — two symmetric curved wing-lobes flanking the center spindle rose, graceful organic silhouette, traditional Viennese architectural style, ornate period-appropriate appearance with visible casting detail",
  q_moderna: "Q-model squared minimal lever handle — strict rectangular cross-section with sharp 90° corners, completely flat face with no rounding, 125-135mm lever length, Bauhaus/industrial minimalist style, clean architectural appearance",
  con_rosetta: "Lever handle with decorative backplate (con rosetta) — circular or square backplate 50-60mm spanning the spindle area, lever body 120-130mm emerging from plate center, visible screw heads on plate corners or perimeter",
  pomolo: "Round pomolo knob handle — spherical or cylindrical form 35-45mm diameter, compact low projection from frame face, smooth rounded surface with visible setscrew or cover cap",
  alzante: "Lift-and-slide (alzante) operating handle — long ergonomic lever 200-280mm with curved palm grip, heavy die-cast body with visible mechanism pivot, projects 60-80mm from frame face, used on large sliding door panels",
  nessuna: "Fixed light (no handle) — completely clean frame face with no handle hardware, no backplate, no visible spindle hole. The sash is non-opening.",
};

const HARDWARE_COLORS_V5: Record<string, string> = {
  cromo_lucido: "polished chrome — bright specular reflection",
  inox_spazzolato: "brushed stainless steel — directional satin micro-lines",
  nero_opaco: "matte black powder coat — no specular highlight",
  nero_lucido: "gloss black — clear specular reflection",
  bronzo_anticato: "antique bronze patina — warm irregular oxidized surface",
  oro_pvd: "polished gold PVD coating — warm yellow specular reflection",
  ottone_spazzolato: "brushed brass — warm gold directional micro-lines",
  titanio: "titanium anodized — cool grey with subtle metallic depth",
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

  // v5 prompt
  const sost = nuovoInfisso.sostituzione || { infissi: true, cassonetto: false, tapparella: false };
  const colore = nuovoInfisso.colore || {};
  const profilo = nuovoInfisso.profilo || {};
  const vetro = nuovoInfisso.vetro || {};
  const ferramenta = nuovoInfisso.ferramenta || {};
  const cassonetto = nuovoInfisso.cassonetto || {};
  const tapparella = nuovoInfisso.tapparella || {};
  const cerniere = nuovoInfisso.cerniere || {};
  const trasformazione = nuovoInfisso.trasformazione || {};

  const oldMatDesc: Record<string, string> = { legno_vecchio: "aged wood", legno_verniciato: "painted wood", alluminio_anodizzato: "old anodized aluminum", alluminio_verniciato: "painted aluminum", pvc_bianco: "white PVC possibly yellowed", pvc_colorato: "colored PVC", ferro: "old iron frame", acciaio: "steel frame", sconosciuto: "existing frame" };
  const finituraMap: Record<string, string> = { liscio_opaco: "smooth matte finish", liscio_lucido: "smooth glossy finish", venatura_legno: "wood-grain textured surface", spazzolato: "brushed metallic finish", satinato: "satin finish", goffrato: "embossed/textured surface" };
  const profiloSize: Record<string, string> = { "70mm": "70mm residential profile with 3 chambers", "82mm": "82mm premium profile with 5 chambers", "92mm": "92mm Passivhaus-grade profile with 7 chambers" };
  const profiloForma: Record<string, string> = { squadrato: "squared/angular edges", arrotondato: "softly rounded edges", europeo: "classic European profile" };

  const blocks: Record<string, string> = {};

  // Block A — v6 system prompt with RULE 9, 10, 11
  blocks.A = `[BLOCK A – ROLE & MISSION]\nYou are a SURGICAL PHOTOREALISTIC IMAGE EDITOR for architectural visualization. Your ONLY task: replace EXACTLY the specified building elements while leaving EVERYTHING ELSE 100% pixel-perfect identical. This is PRECISE SURGICAL REPLACEMENT, not artistic interpretation.\n\nCRITICAL RENDERING RULES:\n1. If the frame color is a SOLID RAL color: render perfectly uniform flat color with NO wood grain, NO natural texture variation, NO organic patterns. Only the specified finish texture (matte/glossy/satin) is allowed.\n2. If the frame color is a WOOD EFFECT laminate: render realistic wood grain pattern with natural color variation, visible grain direction running along the frame length, knot patterns, and subtle depth — as a high-quality laminate film applied over PVC or aluminum substrate.\n3. Never mix these two modes — a RAL color must never show grain, and a wood effect must always show grain.\n4. Handle hardware must match the exact style and finish specified — do not default to generic lever handles.\n5. Frame profile style (nodo ridotto, minimal, classic) must be accurately represented in sight-line width and edge geometry.\n6. If cinghia/motor mode is specified, render the appropriate operating mechanism.\n7. If a transformation is requested, accurately depict the new opening type while preserving the original wall opening dimensions.\n8. All shadows, reflections, and ambient occlusion must be physically correct for the new elements.\n9. CASSONETTO — if marked ✅ REPLACE in BLOCK C, the roller shutter box ABOVE the window MUST be rendered in the exact specified color/finish. This is a separate element from the window frame. The cassonetto sits on or above the window opening in a rectangular housing box. It MUST change to match BLOCK H specification.\n10. TAPPARELLA — if marked ✅ REPLACE in BLOCK C, every slat of the roller shutter MUST be rendered in the exact specified color/finish.\n11. Output image dimensions must match input image dimensions exactly.`;

  // Block B
  blocks.B = `[BLOCK B – EXISTING ELEMENTS INVENTORY]\nWindow/door type: ${APERTURA_DESCRIPTION[analisi.tipo_apertura] || analisi.tipo_apertura}\nCurrent material: ${analisi.materiale_attuale}, Color: ${analisi.colore_attuale}, Condition: ${analisi.condizioni}\nPanels: ${analisi.num_ante_attuale}, Frame depth: ${analisi.spessore_telaio}\nGlass: ${analisi.tipo_vetro_attuale}\nRoller box: ${analisi.presenza_cassonetto ? 'YES — ' + analisi.tipo_cassonetto + ', color: ' + (analisi.colore_cassonetto_attuale || 'unknown') : 'NOT PRESENT'}\nShutter: ${analisi.presenza_tapparella ? 'YES — ' + (analisi.tipo_tapparella_attuale || 'unknown') + ', color: ' + (analisi.colore_tapparella_attuale || 'unknown') : 'NOT PRESENT'}\nBuilding: ${analisi.stile_edificio}, Wall: ${analisi.materiale_muro} (${analisi.colore_muro})\nSill: ${analisi.presenza_davanzale ? 'YES (' + (analisi.tipo_davanzale || 'unknown') + ')' : 'NO'}, Bars: ${analisi.presenza_inferriata ? 'YES' : 'NO'}\nFloor: ${analisi.piano}, Light: ${analisi.luce}, Angle: ${analisi.angolo_ripresa}`;

  // Block C — Selective replacement (v6: explicit color descriptions)
  const cLines: string[] = ['[BLOCK C – REPLACEMENT MANIFEST]', 'EXACTLY these elements must change — NOTHING else:'];
  if (sost.infissi) {
    let infissoColorDesc = colore.nome || "white";
    if (nuovoInfisso.colore_mode === "legno" && nuovoInfisso.colore_wood_effect) {
      infissoColorDesc = `${nuovoInfisso.colore_wood_effect.name || nuovoInfisso.colore_wood_effect.id} wood-effect laminate`;
    } else if (colore.ral) {
      infissoColorDesc = `${colore.nome} (RAL ${colore.ral})`;
    }
    cLines.push(`\n✅ REPLACE window/door frame (infisso) → new finish: ${infissoColorDesc}`);
  } else {
    cLines.push(`\n🚫 KEEP window/door frame exactly as in original photo`);
  }
  if (sost.cassonetto) {
    if (cassonetto.azione === "rimuovi") {
      cLines.push(`\n✅ REMOVE cassonetto (roller shutter box) — fill with continuous wall surface`);
    } else if (cassonetto.azione === "sostituisci" && cassonetto.materiale) {
      // v6: use top-level cass_ fields with fallback
      const cassMode = nuovoInfisso.cass_colore_mode || cassonetto.colore_mode || "ral";
      let cassColorDesc = "";
      if (cassMode === "legno") {
        const cwe = nuovoInfisso.cass_wood_effect || cassonetto.colore_wood_effect;
        cassColorDesc = cwe ? `${cwe.name || cwe.id} wood-effect laminate` : "wood-effect laminate";
      } else {
        const cc = nuovoInfisso.cass_colore || cassonetto.colore;
        cassColorDesc = cc ? `${cc.name || cc.nome || ""}${cc.ral ? ` (RAL ${cc.ral})` : ""}` : "specified color";
      }
      cLines.push(`\n✅ REPLACE cassonetto (roller shutter box above window) → new finish: ${cassColorDesc}`);
    } else {
      cLines.push(`\n🚫 KEEP cassonetto exactly as in original photo`);
    }
  } else {
    cLines.push(`\n🚫 ${analisi.presenza_cassonetto ? 'KEEP existing cassonetto exactly as in photo' : 'No cassonetto present — do not add one'}`);
  }
  if (sost.tapparella) {
    if (tapparella.azione === "rimuovi") {
      cLines.push(`\n✅ REMOVE tapparella (roller shutter slats) completely`);
    } else if (tapparella.azione === "sostituisci" && tapparella.materiale) {
      const tapMode = nuovoInfisso.tap_colore_mode || tapparella.colore_mode || "ral";
      let tapColorDesc = "";
      if (tapMode === "legno") {
        const twe = nuovoInfisso.tap_wood_effect || tapparella.colore_wood_effect;
        tapColorDesc = twe ? `${twe.name || twe.id} wood-effect laminate` : "wood-effect laminate";
      } else {
        const tc = nuovoInfisso.tap_colore || tapparella.colore;
        tapColorDesc = tc ? `${tc.name || tc.nome || ""}${tc.ral ? ` (RAL ${tc.ral})` : ""}` : "specified color";
      }
      cLines.push(`\n✅ REPLACE tapparella (roller shutter slats) → new finish: ${tapColorDesc}`);
    } else {
      cLines.push(`\n🚫 KEEP tapparella exactly as in original photo`);
    }
  } else {
    cLines.push(`\n🚫 ${analisi.presenza_tapparella ? 'KEEP existing shutter exactly as in photo' : 'No shutter present — do not add one'}`);
  }
  cLines.push(`\n⚠️ CRITICAL: Every element marked 🚫 KEEP must be pixel-identical to the original.`);
  cLines.push(`⚠️ CRITICAL: Every element marked ✅ REPLACE must be rendered with the EXACT specified finish.`);
  blocks.C = cLines.join('\n');

  // Block D — Material & Color (v5: wood effect support)
  if (sost.infissi) {
    const coloreMode = nuovoInfisso.colore_mode || "ral";
    if (coloreMode === "legno" && nuovoInfisso.colore_wood_effect) {
      const we = nuovoInfisso.colore_wood_effect;
      blocks.D = `[BLOCK D – NEW FRAME MATERIAL & COLOR]\nMaterial: ${MATERIAL_PHYSICS[nuovoInfisso.materiale] || nuovoInfisso.materiale}\nColor mode: WOOD EFFECT LAMINATE\nWood effect: ${we.name || we.id} — ${we.prompt_fragment || "realistic wood grain laminate film"}\nFinish: ${finituraMap[colore.finitura] || colore.finitura || "wood-grain textured surface"}\n\nWOOD EFFECT RENDERING RULES:\n- The frame surface MUST show realistic wood grain pattern with natural color variation\n- Grain direction runs ALONG the frame length (horizontal on top/bottom rails, vertical on side stiles)\n- Show subtle depth and knot patterns characteristic of the specified wood species\n- The surface is a high-quality laminate film applied over the substrate — it should look like real wood but with the precision and uniformity of a factory-applied finish\n- Do NOT render as painted solid color — grain texture is mandatory`;
    } else {
      let colorDesc = colore.nome || ""; if (colore.ral) colorDesc += ` (RAL ${colore.ral})`;
      blocks.D = `[BLOCK D – NEW FRAME MATERIAL & COLOR]\nMaterial: ${MATERIAL_PHYSICS[nuovoInfisso.materiale] || nuovoInfisso.materiale}\nColor: ${colorDesc}\nFinish: ${finituraMap[colore.finitura] || colore.finitura || "smooth matte"}\n\nSOLID RAL COLOR RENDERING RULES:\n- The frame surface MUST be perfectly uniform in color with NO wood grain, NO natural texture variation, NO organic patterns\n- Only the specified surface finish texture (matte/glossy/satin/brushed) is permitted\n- Color must be consistent across all frame members (rails, stiles, mullions)\n- Do NOT add any grain or natural material patterns to a solid RAL color`;
    }
  } else {
    blocks.D = `[BLOCK D – FRAME MATERIAL — SKIPPED]\nFrame replacement not requested.`;
  }

  // Block E — Profile + Hinges + Frame Style (v5: stile telaio)
  if (sost.infissi) {
    const numAnte = nuovoInfisso.num_ante || analisi.num_ante_attuale || 1;
    const cerPerAnta = cerniere.num_per_anta || 2;
    const cerTotal = cerPerAnta * numAnte;
    const cerTipo = CERNIERA_DESC[cerniere.tipo] || cerniere.tipo || "standard hinge";
    const cerColore = CERNIERA_COLORE_DESC[cerniere.colore] || cerniere.colore || "silver";

    let stileTelaioPart = "";
    const stileTelaio = nuovoInfisso.stile_telaio;
    if (stileTelaio && STILE_TELAIO_DESC[stileTelaio]) {
      stileTelaioPart = `\nFrame style: ${STILE_TELAIO_DESC[stileTelaio]}`;
      if (stileTelaio === "nodo_ridotto_maniglia_centrale") {
        stileTelaioPart += `\nHANDLE PLACEMENT OVERRIDE: The lever handle MUST be positioned at the exact vertical CENTER of the sash height, creating visual symmetry. Do NOT place it at the standard lock-stile position.`;
      }
    }

    blocks.E = `[BLOCK E – FRAME PROFILE & HINGE GEOMETRY]\nProfile system: ${profiloSize[profilo.dimensione] || profilo.dimensione || "standard"}\nEdge shape: ${profiloForma[profilo.forma] || profilo.forma || "standard"}${stileTelaioPart}\nNumber of opening panels (sashes): ${numAnte}\n\nHINGE DETAIL (technically accurate Italian window standard):\nTotal hinges: ${cerTotal} (${cerPerAnta} per sash × ${numAnte} sash${numAnte > 1 ? 'es' : ''})\nHinge type: ${cerTipo}\nHinge color/finish: ${cerColore}\nHinge placement rule: place hinges at 1/5 and 4/5 of sash height (top hinge ~200mm from top rail, bottom hinge ~200mm from bottom rail)\nEach hinge: ${cerniere.tipo === 'invisibile' ? 'fully recessed — NOT visible from exterior' : 'two plates visible on hinge-side stile, ~50×35mm each, 3 screws per plate'}\nCast correct shadow of hinge knuckle onto frame face and wall rebate.`;
  } else {
    blocks.E = `[BLOCK E – FRAME PROFILE — SKIPPED]\nFrame replacement not requested.`;
  }

  // Block F
  if (sost.infissi) {
    blocks.F = `[BLOCK F – GLASS UNIT]\n${vetro.prompt_fragment || vetro.tipo || "double glazed clear glass"}\nTechnical rendering requirements:\n- Thin greenish tint at glass edge (typical of multi-pane low-iron or standard float glass)\n- Specular highlight/reflection matching scene light source direction\n- Interior appears as dark/neutral (curtains or room interior barely visible)\n- Air gap line between panes invisible from exterior at normal viewing angle\n- Spacer bar (15-16mm aluminum or warm-edge) visible only at perimeter inside rebate`;
  } else {
    blocks.F = `[BLOCK F – GLASS — SKIPPED]`;
  }

  // Block G — Hardware (v5: detailed handle types + finishes)
  if (sost.infissi) {
    const manigliaStile = ferramenta.maniglia_stile;
    const hwFinish = ferramenta.colore_hardware_finish;

    if (manigliaStile && MANIGLIE_V5[manigliaStile]) {
      const handleDesc = MANIGLIE_V5[manigliaStile];
      const finishDesc = hwFinish ? hwFinish : (ferramenta.colore_hardware_id && HARDWARE_COLORS_V5[ferramenta.colore_hardware_id]) ? HARDWARE_COLORS_V5[ferramenta.colore_hardware_id] : "silver chrome finish";
      blocks.G = `[BLOCK G – HARDWARE DETAILS]\nHandle style: ${handleDesc}\nHandle finish: ${finishDesc}\nHandle position: centered on the meeting stile (vertical center of sash height) for battente windows, lower third for portafinestre\nEspagnolette lock bar: concealed inside frame rebate, only the multi-point locking pins (3-4) visible at frame edge when window is shown open\nCorner connectors: thin aluminum corner keys inside profile — not visible externally\nStrikeplate: small 20×60mm metal plate recessed into frame face opposite handle — show subtle shadow`;
    } else {
      // Legacy fallback
      const legacyManigliaDesc: Record<string, string> = { leva_alluminio: "aluminum lever handle", leva_acciaio: "stainless steel lever handle", pomolo: "round knob handle", alzante: "lift-and-slide lever handle" };
      const legacyColoreDesc: Record<string, string> = { argento: "silver/chrome", nero_opaco: "matte black", inox: "brushed stainless steel", bronzo: "antique bronze", oro: "polished gold/brass" };
      blocks.G = `[BLOCK G – HARDWARE DETAILS]\nHandle: ${legacyManigliaDesc[ferramenta.maniglia] || ferramenta.maniglia || "lever handle"}\nColor: ${legacyColoreDesc[ferramenta.colore] || ferramenta.colore || "silver"}\nHandle position: centered on the meeting stile (vertical center of sash height) for battente windows, lower third for portafinestre\nEspagnolette lock bar: concealed inside frame rebate, only the multi-point locking pins (3-4) visible at frame edge when window is shown open\nCorner connectors: thin aluminum corner keys inside profile — not visible externally\nStrikeplate: small 20×60mm metal plate recessed into frame face opposite handle — show subtle shadow`;
    }
  } else {
    blocks.G = `[BLOCK G – HARDWARE — SKIPPED]`;
  }

  // Block H — Cassonetto (v6: uses top-level cass_ fields with fallback)
  if (sost.cassonetto && cassonetto.azione === "rimuovi") {
    blocks.H = `[BLOCK H – ROLLER BOX REMOVAL]\nRemove entire cassonetto. Show continuous wall surface matching surrounding facade. The wall fill must be seamless — no visible ghost outline, shadow gap or discoloration where the box was. Match plaster texture, paint sheen level, aging/weathering exactly to surrounding wall.`;
  } else if (sost.cassonetto && cassonetto.azione === "sostituisci" && cassonetto.materiale) {
    const cassMode = nuovoInfisso.cass_colore_mode || cassonetto.colore_mode || "ral";
    const cassWood = nuovoInfisso.cass_wood_effect || cassonetto.colore_wood_effect;
    const cassColorObj = nuovoInfisso.cass_colore || cassonetto.colore;
    const isWoodCass = cassMode === "legno";

    let cColor = "";
    if (isWoodCass && cassWood) {
      cColor = `Target finish: ${cassWood.name || cassWood.id} wood-effect laminate foil — ${cassWood.prompt_fragment || "realistic wood grain laminate"}\n\nCASSONETTO WOOD EFFECT RENDERING RULES:\n- The cassonetto box MUST show visible wood grain texture on its visible face\n- Grain orientation: horizontal (parallel to the top of the window)\n- The cassonetto is covered with the same laminate foil as specified\n- Do NOT render it as flat solid color — grain must be visible`;
    } else if (cassColorObj) {
      const name = cassColorObj.name || cassColorObj.nome || "";
      const ral = cassColorObj.ral || "";
      const hex = cassColorObj.hex || "";
      cColor = `Target finish: ${name}${ral ? ` (RAL ${ral})` : ""}\n\nCASSONETTO RAL COLOR RENDERING RULES:\n- The cassonetto box MUST be rendered in the exact RAL color specified\n- Render as smooth flat consistent tone — no grain, no texture\n${ral ? `- The color must match RAL ${ral}${hex ? ` (${hex})` : ""}` : ""}\n- Correct specular highlights for PVC surface (matte-satin)`;
    }
    blocks.H = `[BLOCK H – NEW ROLLER BOX (CASSONETTO)]\nIMPORTANT: The cassonetto (roller shutter box housing) MUST be replaced.\nReplace with: ${CASSONETTO_MATERIAL_DESC[cassonetto.materiale] || cassonetto.materiale}\n${cColor}\nCassonetto shape: keep EXACT same dimensions and proportions as existing cassonetto.\nPosition: above window, flush with wall. Bottom: shutter exit slot ~15-20mm. Width: matching frame outer width.\nSide flanges: small triangular or stepped PVC/aluminum caps where cassonetto meets wall on left and right.\nCast appropriate shadow from cassonetto protrusion onto wall below.\nCRITICAL: Do NOT leave the cassonetto in the original color if replacement was requested.`;
  } else {
    blocks.H = `[BLOCK H – ROLLER BOX]\n${analisi.presenza_cassonetto ? "Keep existing cassonetto exactly as-is." : "No cassonetto. Do not add one."}`;
  }

  // Block I — Tapparella (v6: uses top-level tap_ fields with fallback)
  if (sost.tapparella && tapparella.azione === "rimuovi") {
    blocks.I = `[BLOCK I – SHUTTER REMOVAL]\nRemove the existing shutter/blind system completely. Show bare window frame with no shutter curtain, no side guides, no bottom bar. If guide channels were surface-mounted on wall: remove them and show clean wall face.`;
  } else if (sost.tapparella && tapparella.azione === "sostituisci" && tapparella.materiale) {
    const tapMode = nuovoInfisso.tap_colore_mode || tapparella.colore_mode || "ral";
    const tapWood = nuovoInfisso.tap_wood_effect || tapparella.colore_wood_effect;
    const tapColorObj = nuovoInfisso.tap_colore || tapparella.colore;
    const isWoodTap = tapMode === "legno";

    let iLines = `[BLOCK I – NEW SHUTTER/BLIND SYSTEM]\nInstall: ${TAPPARELLA_DESC[tapparella.materiale] || tapparella.materiale}`;
    if (isWoodTap && tapWood) {
      iLines += `\nRoller shutter finish: ${tapWood.name || tapWood.id} wood-effect laminate — ${tapWood.prompt_fragment || "realistic wood grain laminate"}`;
      iLines += `\nTAPPARELLA WOOD EFFECT: slats MUST show wood grain texture — grain runs horizontally across each slat. Do NOT render as solid color.`;
    } else if (tapColorObj) {
      const name = tapColorObj.name || tapColorObj.nome || "";
      const ral = tapColorObj.ral || "";
      iLines += `\nRoller shutter finish: ${name}${ral ? ` (RAL ${ral})` : ""} — solid uniform color, NO wood grain`;
    }
    if (tapparella.colore_guide?.nome) iLines += `\nGuide color: ${tapparella.colore_guide.nome}${tapparella.colore_guide.ral ? ` (RAL ${tapparella.colore_guide.ral})` : ""}`;
    const stato = tapparella.stato_render || "chiusa";
    iLines += `\nState: ${stato === 'aperta' ? 'FULLY OPEN (rolled up into cassonetto, no curtain visible below. Only side guide channels remain visible)' : stato === 'mezza' ? 'HALF OPEN (curtain partially lowered covering lower 50%, slat texture visible on lower portion, upper glass clear)' : 'FULLY CLOSED (entire glass covered from cassonetto bottom to sill, full slat texture visible, bottom bar resting on or near sill)'}`;
    iLines += `\nGuide channels: 16-20mm wide × 20-25mm deep, mounted on wall face or frame edge. Guide channel extends from cassonetto bottom to window sill level (or floor for portafinestre). Ensure guide channels are straight, parallel, and symmetrically positioned on both sides.`;

    // v5: cinghia/motor
    const cinghia = tapparella.cinghia;
    if (cinghia && CINGHIA_DESC[cinghia]) {
      iLines += `\n\nOPERATING MECHANISM:\n${CINGHIA_DESC[cinghia]}`;
    }

    blocks.I = iLines;
  } else {
    blocks.I = `[BLOCK I – SHUTTER]\n${analisi.presenza_tapparella ? "Keep existing shutter exactly as-is." : "No shutter. Do not add one."}`;
  }

  // Block J
  blocks.J = `[BLOCK J – PIXEL-PERFECT ENVIRONMENT PRESERVATION]\nThe following MUST remain 100% unchanged — zero modification allowed:\n- Wall: color (${analisi.colore_muro}), material (${analisi.materiale_muro}), texture, aging, stains, weathering\n- Window sill: ${analisi.presenza_davanzale ? "KEEP — same " + (analisi.tipo_davanzale || "material") + ", shape, shadow, any chips or weathering" : "NOT PRESENT — do not add a sill"}\n- Security bars: ${analisi.presenza_inferriata ? "KEEP — maintain all bars at exact position, color, shadow" : "NOT PRESENT — do not add bars"}\n- Camera: preserve exact perspective, focal length, vanishing points (${analisi.angolo_ripresa})\n- Surroundings: every pipe, cable, drain, crack, plant, neighboring window, balcony, street element\n- Sky/background: identical — no color shift, no weather change\n- Lighting: same direction, same ambient/diffuse ratio (${analisi.luce})`;

  // Block K
  blocks.K = `[BLOCK K – PHOTOREALISTIC LIGHTING & SHADOWS]\nLighting scene: ${analisi.luce}\nRequired shadow elements (all must be physically correct):\n- Frame shadow: new frame profile casts shadow into wall rebate — depth approximately 15-25mm\n- Hinge shadow: small cast shadow from each hinge knuckle on hinge-side stile face\n- Handle shadow: lever or knob casts shadow on frame face — direction matches scene light\n- Cassonetto shadow: ${analisi.presenza_cassonetto ? 'box face casts horizontal shadow onto wall below it — match overhang depth' : 'no cassonetto shadow'}\n- Shutter shadow: if shutter partially open, hanging curtain edge casts shadow on window below\n- Glass reflection: specular highlight on glass matches scene light direction, not perpendicular to camera\n- Ambient occlusion: soft dark gradient in wall-to-frame rebate transition, in frame corners, under sill`;

  // Block L
  blocks.L = `[BLOCK L – ABSOLUTE NEGATIVE CONSTRAINTS]\nNEVER DO any of the following — instant disqualification:\n- ✗ Change wall color, texture, plaster pattern, or any facade element not explicitly requested\n- ✗ Alter camera perspective, field of view, or tilt/shift\n- ✗ Add elements absent in the original (plants, people, decorations, extra windows)\n- ✗ Change sky color, cloud pattern, or weather conditions\n- ✗ Produce cartoon, illustrated, or CGI-look artifacts\n- ✗ Add text, watermarks, copyright marks, or any overlays\n- ✗ Distort window proportions or change opening/glass dimensions\n- ✗ Add hinges to fixed lights (fisso) — fixed panels have NO hinges\n- ✗ Add shutters or cassonetto if replacement was NOT requested AND none existed in photo\n- ✗ Change the number of window panes unless explicitly requested in config\n- ✗ Make the result look like a 3D render — must be indistinguishable from real photograph\n- ✗ Show wood grain on a solid RAL color frame\n- ✗ Show flat uniform color on a wood-effect laminate frame`;

  // Block M — Transformation (v5)
  if (trasformazione?.attiva && trasformazione.da && trasformazione.a) {
    const da = trasformazione.da;
    const a = trasformazione.a;
    const daDesc = APERTURA_DESCRIPTION[da] || da;
    const aDesc = APERTURA_DESCRIPTION[a] || a;

    let transformInstructions = `[BLOCK M – OPENING TYPE TRANSFORMATION]\nTransform opening from: ${daDesc}\nTransform opening to: ${aDesc}\n\nTRANSFORMATION RULES:\n- The wall opening (masonry hole) dimensions MUST remain identical — do not enlarge or shrink the opening\n- Only the frame, sash configuration, and hardware change to match the new opening type\n- Preserve exact wall opening position, lintel, and sill`;

    // Specific transformation guidance
    if (da.includes("fisso") && a.includes("battente")) {
      transformInstructions += `\n\nSPECIFIC: Fixed → Casement conversion:\n- Add hinges on one side stile (2 hinges for standard height)\n- Add lever handle on opposite stile\n- Show subtle sash rebate line (shadow gap ~2mm) around the opening sash perimeter\n- The fixed glass-bead profile is replaced by an opening sash profile with gaskets`;
    } else if (a.includes("anta_ribalta")) {
      transformInstructions += `\n\nSPECIFIC: Conversion to Tilt-and-Turn:\n- Show multi-position lever handle on lock stile\n- Add 2 hinges on hinge-side stile\n- Show tilt-and-turn hardware: visible corner drives at top corners, mushroom-head locking pins at frame edge\n- Sash rebate line visible all around`;
    } else if (a.includes("scorrevole")) {
      transformInstructions += `\n\nSPECIFIC: Conversion to Sliding:\n- Show visible bottom track rail and top guide rail\n- Panels overlap at center — show the overlap shadow line\n- Flush pull handles or recessed grips instead of lever handles\n- No hinges — only sliding guides at top corners`;
    } else if (da.includes("battente_1") && a.includes("battente_2")) {
      transformInstructions += `\n\nSPECIFIC: Single to Double casement:\n- Split the existing opening into TWO equal sash panels meeting at center\n- Add a central mullion or meeting stile\n- Each sash gets its own handle and 2 hinges\n- Show center rebate line where panels meet`;
    } else if (a.includes("vasistas")) {
      transformInstructions += `\n\nSPECIFIC: Conversion to Top-hung Vasistas:\n- Hinges at TOP rail only (2 friction hinges)\n- Handle at BOTTOM rail of sash\n- Scissor-arm stay mechanism on side stiles`;
    }

    blocks.M = transformInstructions;
  }

  const systemPrompt = blocks.A;
  const userParts = [blocks.B, blocks.C, blocks.D, blocks.E, blocks.F, blocks.G, blocks.H, blocks.I, blocks.J, blocks.K, blocks.L];
  if (blocks.M) userParts.push(blocks.M);
  if (notes) userParts.push(`[ADDITIONAL NOTES]\n${notes}`);
  const userPrompt = userParts.join("\n\n");
  const negativePrompt = "cartoon, illustration, sketch, drawing, watermark, text overlay, blurry, distorted perspective, different building, changed wall color, unrealistic lighting, 3D render, CGI artifacts, missing hinges, wrong panels, shutters not requested, cassonetto added without request, wood grain on RAL solid color, flat color on wood-effect laminate, wrong handle style, mismatched hardware finish, cassonetto unchanged when replacement was requested, wrong cassonetto color, cassonetto same color as original when asked to change, tapparella unchanged when replacement was requested, resized or cropped original photo, different image dimensions than original, letterboxing, pillarboxing";
  return { systemPrompt, userPrompt, negativePrompt, promptVersion: "6.0.0", blocks };
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
        temperature: 1,
        max_tokens: 8192,
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
