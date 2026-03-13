// ═══════════════════════════════════════════════════════════════════
// FACCIATA PROMPT BUILDER v1.0.0
// Edile Genius — Modulo Render Facciata
// Genera prompt AI strutturati per la modifica fotografica di facciate
// ═══════════════════════════════════════════════════════════════════

export const FACCIATA_PROMPT_VERSION = "1.0.0";

// ── TIPI BASE ─────────────────────────────────────────────────────

export type TipoInterventoFacciata =
  | "tinteggiatura"
  | "cappotto"
  | "rivestimento"
  | "misto"
  | "rifacimento_totale";

export type ZonaApplicazione =
  | "tutta"
  | "piano_terra"
  | "piani_sup"
  | "zoccolatura"
  | "cantonali"
  | "marcapiano";

export type TipoRivestimento =
  | "pietra_serena" | "travertino" | "arenaria_beige" | "luserna"
  | "marmo_bianco" | "porfido" | "splitface_grigio" | "pietra_rustica"
  | "cotto_rosso" | "clinker_rosso" | "clinker_grigio" | "clinker_beige"
  | "cotto_mattone" | "laterizio_bianco";

export type FinituraIntonaco =
  | "liscio" | "graffiato_fine" | "graffiato_medio" | "rasato"
  | "bucciato" | "strutturato_grosso" | "rustico" | "veneziana" | "bugnato";

// ── INTERFACCIA ANALISI FOTO FACCIATA ────────────────────────────

export interface AnalysiFacciata {
  tipo_edificio: string;
  numero_piani_visibili: number;
  numero_finestre_visibili: number;
  intonaco_tipo_attuale: FinituraIntonaco | string;
  intonaco_colore_attuale: string;
  intonaco_colore_hex: string;
  presenza_rivestimento_pietra: boolean;
  tipo_rivestimento_pietra: string | null;
  zona_rivestimento_pietra: string | null;
  presenza_laterizio: boolean;
  tipo_laterizio: string | null;
  presenza_cornici_finestre: boolean;
  colore_cornici: string | null;
  presenza_marcapiani: boolean;
  presenza_zoccolatura: boolean;
  presenza_balconi: boolean;
  presenza_cappotto_esistente: boolean;
  profondita_rivelazione_stimata_cm: number;
  colore_serramenti_attuale: string;
  stato_conservazione: string;
  orientamento_foto: string;
  note_speciali: string | null;
}

// ── INTERFACCIA CONFIGURAZIONE COLORE ────────────────────────────

export interface ConfigColoreIntonaco {
  colore_id: string;
  colore_name: string;
  colore_hex: string;
  prompt_fragment: string;
  finitura: FinituraIntonaco;
  finitura_prompt: string;
}

// ── INTERFACCIA CONFIGURAZIONE RIVESTIMENTO ──────────────────────

export interface ConfigRivestimento {
  tipo: TipoRivestimento;
  tipo_name: string;
  tipo_prompt: string;
  zona: ZonaApplicazione;
  zona_prompt: string;
  colore_altra_zona?: ConfigColoreIntonaco;
}

// ── INTERFACCIA CONFIGURAZIONE CAPPOTTO ──────────────────────────

export interface ConfigCappotto {
  spessore_cm: number;
  colore: ConfigColoreIntonaco;
  sistema: "eps" | "lana_roccia" | "fibra_legno";
}

// ── INTERFACCIA CONFIGURAZIONE ELEMENTI ARCHITETTONICI ───────────

export interface ConfigElementiArchitettonici {
  cornici_finestre: {
    cambia: boolean;
    colore_name?: string;
    colore_hex?: string;
    prompt_fragment?: string;
  };
  marcapiani: {
    cambia: boolean;
    colore_name?: string;
    colore_hex?: string;
    aggiungi_se_assente?: boolean;
  };
  davanzali: {
    cambia: boolean;
    materiale?: "pietra" | "cemento" | "marmo" | "laterizio";
    colore_name?: string;
  };
  zoccolatura: {
    cambia: boolean;
    tipo?: "intonaco" | "pietra" | "laterizio";
    colore_o_materiale?: string;
  };
}

// ── INTERFACCIA PRINCIPALE CONFIGURAZIONE FACCIATA ───────────────

export interface ConfigurazioneFacciata {
  tipo_intervento: TipoInterventoFacciata;
  colore_intonaco?: ConfigColoreIntonaco;
  rivestimento?: ConfigRivestimento;
  cappotto?: ConfigCappotto;
  elementi?: ConfigElementiArchitettonici;
  original_image_width?: number;
  original_image_height?: number;
  note_aggiuntive?: string;
}

// ── DIZIONARI FINITURA ────────────────────────────────────────────

export const FINITURA_PROMPTS: Record<FinituraIntonaco, string> = {
  liscio:             "SMOOTH (liscio) — perfectly flat plaster surface, no visible texture grain, satin-smooth appearance with subtle light reflections on larger surfaces",
  graffiato_fine:     "FINE SCRAPED (graffiato fine) — 1.0-1.5mm grain scraped plaster, uniform horizontal or circular combing marks creating a fine repetitive texture — the most common Italian facade finish",
  graffiato_medio:    "MEDIUM SCRAPED (graffiato medio) — 2.0-2.5mm grain scraped plaster, more pronounced horizontal combing texture, clearly visible grain pattern on close inspection",
  rasato:             "SKIM COAT (rasato) — very fine 0.3-0.5mm texture, nearly smooth but slightly rougher than liscio, modern clean appearance",
  bucciato:           "ORANGE-PEEL (bucciato) — irregular small pebble-like surface texture with rounded protrusions, very common on Italian buildings from 1970s-1990s",
  strutturato_grosso: "COARSE STRUCTURED — 3.0-4.0mm aggregate textured plaster, pronounced rough surface with visible pebble-grain and deep shadows in texture valleys",
  rustico:            "RUSTIC ROUGH-CAST — irregular rough surface with exposed aggregate and occasional stone chips, traditional rural Italian farmhouse appearance",
  veneziana:          "VENETIAN PLASTER (stucco veneziano) — polished multi-layer smooth plaster with subtle depth, translucency, and slight sheen — prestigious finish",
  bugnato:            "RUSTICATED ASHLAR (bugnato) — regular raised rectangular block pattern separated by recessed mortar joints, Neo-classical Italian architectural appearance",
};

// ── DIZIONARIO RIVESTIMENTO ───────────────────────────────────────

export const RIVESTIMENTO_PROMPTS: Record<string, string> = {
  pietra_serena:    "PIETRA SERENA stone cladding — classic Florentine blue-grey sandstone (calcarenite), smooth sawn finish with uniform fine grain and subtle parallel stratification lines. Color: cool medium grey #7A8080. Used traditionally at bases and architectural highlights in Tuscany and Umbria.",
  travertino:       "TRAVERTINO (travertine) stone cladding — cream-to-warm-beige limestone with characteristic cross-cut porous pattern showing natural voids and occasional vein-like striations. Color range: warm ivory to light caramel #D4C4A0. Classic Roman and Central Italian architectural material.",
  arenaria_beige:   "ARENARIA (sandstone) cladding — warm sandy-beige with uniform fine-grain surface and visible natural stratification lines. Color: warm medium sandy-beige #C8A870.",
  luserna:          "PIETRA DI LUSERNA cladding — silver-grey crystalline quartzite with characteristic split-face texture showing mica sparkle and natural cleavage planes. Color: cool silver-grey #686870. Traditional Piedmontese architecture.",
  marmo_bianco:     "MARMO BIANCO (white marble) cladding — brilliant white with fine grey veining, honed or polished finish. Color: near-white #F0EEEC. Prestigious contemporary or classical architectural use.",
  porfido:          "PORFIDO (porphyry) cladding — dark red-purple volcanic stone with crystalline surface texture and irregular split face. Color: deep red-purple #7A5858. Typical of Trentino-Alto Adige region.",
  splitface_grigio: "GREY SPLITFACE stone cladding — rough split-face natural stone with strongly irregular texture and deep shadow channels. Color: medium cool grey #888890. Contemporary architectural aesthetic.",
  pietra_rustica:   "MIXED RUSTIC STONE cladding — irregular natural stone pieces in warm mixed earth tones (beige, buff, grey), laid in random coursed pattern. Traditional rural Italian farmhouse (cascina) appearance.",
  cotto_rosso:      "COTTO ROSSO laterizio faccia vista — classic warm red fired clay brick in Italian standard format (25×6cm or 25×5.5cm), laid in running bond with approx 10mm mortar joint. Color: warm red #A84030. Very common on Italian residential facades.",
  clinker_rosso:    "CLINKER ROSSO — high-fired vitrified brick, very dense non-porous surface, deep warm red color #9A3828. Slightly longer format than standard brick (24×7.1cm). Minimal water absorption. Modern premium residential.",
  clinker_grigio:   "CLINKER GRIGIO — high-fired grey-anthracite vitrified brick #707070, contemporary industrial-modern aesthetic. Dense surface with no efflorescence.",
  clinker_beige:    "CLINKER BEIGE — warm cream-yellow high-fired vitrified brick #C0A878. Elegant neutral tone, European contemporary aesthetic.",
  cotto_mattone:    "COTTO MATTONE — traditional Italian handmade-appearance brick with slight colour variations from rustic firing. Format: 25×6cm. Color variations: orange-red to darker burgundy-red. Historic building character.",
  laterizio_bianco: "LATERIZIO BIANCO — whitewashed or slip-coated brick in white/cream tone #E0D8D0, Mediterranean coastal aesthetic. The brick bond pattern is visible through the white coating.",
};

// ── DIZIONARIO ZONA APPLICAZIONE ─────────────────────────────────

export const ZONA_PROMPTS: Record<ZonaApplicazione, string> = {
  tutta:       "APPLY TO: entire facade — from ground level to roofline, including all floors. The new finish covers 100% of the facade surface.",
  piano_terra: "APPLY TO: ground floor only — from ground level up to the floor line of the first floor (bottom of first-floor windows). Upper floors keep their existing finish. The transition line is at the first floor sill/lintel level.",
  piani_sup:   "APPLY TO: upper floors only — from the first floor upward. Ground floor keeps its existing finish. The transition is at the ground floor ceiling/first floor sill level.",
  zoccolatura: "APPLY TO: base plinth zone only — the lowest 80-120cm of the facade above ground level. Creates a clear visual plinth/dado band at the base of the building. Above this zone, the existing facade finish continues unchanged.",
  cantonali:   "APPLY TO: corner quoins only — vertical strips approximately 40-60cm wide at the left and right edges of the facade. The central facade field keeps its existing finish. Creates a traditional quoin corner treatment.",
  marcapiano:  "APPLY TO: floor-separating band only — a horizontal band 15-25cm high running the full width of the facade, positioned at each floor division level. The facade field above and below the band keeps its existing finish.",
};

// ── BLOCK BUILDERS ────────────────────────────────────────────────

function buildBlock_A(analisi: AnalysiFacciata): string {
  return `[BLOCK A – EXISTING FACADE ANALYSIS]
Building type: ${analisi.tipo_edificio.replace(/_/g, " ")}
Visible floors: ${analisi.numero_piani_visibili}
Visible windows: ${analisi.numero_finestre_visibili}
Photo orientation: ${analisi.orientamento_foto}

Current plaster finish: ${analisi.intonaco_tipo_attuale}
Current plaster color: ${analisi.intonaco_colore_attuale} (approx. ${analisi.intonaco_colore_hex})
Conservation state: ${analisi.stato_conservazione}

Existing features:
- Stone/brick cladding present: ${analisi.presenza_rivestimento_pietra || analisi.presenza_laterizio ? "YES" : "NO"}${analisi.tipo_rivestimento_pietra ? ` — type: ${analisi.tipo_rivestimento_pietra}` : ""}
- Window cornice frames: ${analisi.presenza_cornici_finestre ? "YES" : "NO"}${analisi.colore_cornici ? ` — color: ${analisi.colore_cornici}` : ""}
- Horizontal floor bands (marcapiani): ${analisi.presenza_marcapiani ? "YES" : "NO"}
- Base plinth (zoccolatura): ${analisi.presenza_zoccolatura ? "YES" : "NO"}
- Balconies: ${analisi.presenza_balconi ? "YES" : "NO"}
- Existing thermal coat (cappotto): ${analisi.presenza_cappotto_esistente ? "YES" : "NO"}
- Window reveal depth: approx. ${analisi.profondita_rivelazione_stimata_cm}cm
- Current window/door color: ${analisi.colore_serramenti_attuale}
${analisi.note_speciali ? `Special notes: ${analisi.note_speciali}` : ""}`;
}

function buildBlock_B(config: ConfigurazioneFacciata): string {
  const items: string[] = [];

  switch (config.tipo_intervento) {
    case "tinteggiatura":
      items.push("✅ REPLACE: entire plaster surface color and finish");
      items.push("🚫 KEEP: all stone/brick elements unchanged");
      items.push("🚫 KEEP: all architectural decorative elements (cornici, marcapiani, davanzali)");
      break;
    case "cappotto":
      items.push("✅ REPLACE: entire facade with new thermal coat system");
      items.push("✅ MODIFY: window reveals become deeper (cappotto thickness adds depth)");
      items.push("✅ REPLACE: plaster color and finish on new thermal coat");
      items.push("🚫 KEEP: windows, doors, balconies, roof unchanged");
      break;
    case "rivestimento": {
      const zona = config.rivestimento?.zona || "tutta";
      items.push(`✅ REPLACE: facade surface in zone: ${zona} — with new cladding material`);
      if (zona !== "tutta") {
        items.push("🚫 KEEP: other facade zones with their existing finish");
      }
      items.push("🚫 KEEP: windows, doors, roof, balcony rails");
      break;
    }
    case "misto":
      items.push("✅ REPLACE: ground floor with specified stone/brick cladding");
      items.push("✅ REPLACE: upper floors with specified plaster color and finish");
      items.push("🚫 KEEP: windows, doors, roof");
      break;
    case "rifacimento_totale":
      items.push("✅ REPLACE: entire facade surface — new plaster finish from scratch");
      items.push("✅ IMPROVE: overall regularity and appearance of the facade");
      items.push("🚫 KEEP: windows, doors, balconies, roof");
      break;
  }

  if (config.elementi?.cornici_finestre?.cambia) {
    items.push(`✅ REPLACE: window cornice frames → ${config.elementi.cornici_finestre.colore_name}`);
  } else {
    items.push("🚫 KEEP: window cornice frames as in original");
  }

  return `[BLOCK B – REPLACEMENT MANIFEST]
Intervention type: ${config.tipo_intervento.replace(/_/g, " ").toUpperCase()}

${items.join("\n")}

⚠️ CRITICAL: Preserve EXACT perspective, geometry, and proportions of the building.
⚠️ CRITICAL: Windows, doors, balcony railings must remain PIXEL-IDENTICAL unless specified.`;
}

function buildBlock_C_Tinteggiatura(config: ConfigColoreIntonaco): string {
  return `[BLOCK C – PLASTER COLOR & FINISH SPECIFICATION]
NEW PLASTER COLOR: ${config.colore_name}
Color hex reference: ${config.colore_hex}
Color description: ${config.prompt_fragment}

NEW PLASTER FINISH: ${config.finitura.replace(/_/g, " ").toUpperCase()}
Finish description: ${config.finitura_prompt}

CRITICAL RENDERING RULES for plaster:
- Apply this color CONSISTENTLY across all plaster areas in the specified zone
- The finish texture must be visible and accurate — not smooth where graffiato is specified
- Render correct specular highlights for the finish type
- Large facade areas will show slight color variation due to natural light angle — this is correct
- Maintain correct shadow rendering on texture relief
- The color must match hex ${config.colore_hex} in neutral lighting conditions`;
}

function buildBlock_D_Rivestimento(riv: ConfigRivestimento, _analisi: AnalysiFacciata): string {
  const complementarySection = riv.zona !== "tutta" && riv.colore_altra_zona
    ? `\nCOMPLEMENTARY ZONE:
The area NOT covered by cladding should have:
Color: ${riv.colore_altra_zona.colore_name} (${riv.colore_altra_zona.colore_hex})
Finish: ${riv.colore_altra_zona.finitura.replace(/_/g, " ")}
${riv.colore_altra_zona.finitura_prompt}\n`
    : "";

  return `[BLOCK D – CLADDING MATERIAL SPECIFICATION]
NEW CLADDING MATERIAL: ${riv.tipo_name}
Material description: ${riv.tipo_prompt}

APPLICATION ZONE: ${ZONA_PROMPTS[riv.zona]}
${complementarySection}
CLADDING RENDERING RULES:
- The cladding material must show realistic physical depth (3D relief, not flat paint)
- Show correct mortar/joint lines appropriate to the material format
- Apply correct shadow and light behavior on the material surface
- The transition between cladding zone and plaster zone must be clean and straight
- Cladding must appear structurally applied — NOT like a sticker or decal
- Show subtle color variation within the cladding to simulate real material batching`;
}

function buildBlock_E_Cappotto(cap: ConfigCappotto, analisi: AnalysiFacciata): string {
  const currentDepth = analisi.profondita_rivelazione_stimata_cm || 8;
  const newRevealDepth = currentDepth + cap.spessore_cm;

  return `[BLOCK E – THERMAL COAT (CAPPOTTO) SPECIFICATION]
THERMAL INSULATION SYSTEM: ${cap.sistema.replace(/_/g, " ").toUpperCase()}
Insulation thickness: ${cap.spessore_cm}cm

VISUAL CHANGES DUE TO CAPPOTTO:
1. WINDOW REVEALS: The window reveals (the depth between the facade face and window frame)
   MUST increase by ${cap.spessore_cm}cm from the current depth.
   Current estimated reveal depth: ~${currentDepth}cm
   New reveal depth after cappotto: ~${newRevealDepth}cm
   This creates clearly visible deeper shadow bands around all windows.

2. FACADE PROJECTION: The entire facade face projects ${cap.spessore_cm}cm forward from
   the original position. Window sills will have a slightly reduced projection.

3. CORNER PROFILE: At building corners, the cappotto adds ${cap.spessore_cm}cm to each face,
   creating a slightly rounded or squared-off corner depending on the system.

FINAL PLASTER ON CAPPOTTO:
Color: ${cap.colore.colore_name} (${cap.colore.colore_hex})
${cap.colore.prompt_fragment}
Finish: ${cap.colore.finitura.replace(/_/g, " ")} — ${cap.colore.finitura_prompt}

CAPPOTTO RENDERING RULES:
- The facade MUST look completely smooth and new (no existing cracks or imperfections visible)
- Window reveal depth increase is MANDATORY — this is a key visual indicator of cappotto
- The shadow in the deeper reveals gives a modern professional appearance
- The new plaster on the cappotto system has perfectly regular texture`;
}

function buildBlock_F_ElementiArchitettonici(
  elem: ConfigElementiArchitettonici,
  analisi: AnalysiFacciata
): string {
  const parts: string[] = ["[BLOCK F – ARCHITECTURAL ELEMENTS]"];

  // Cornici finestre
  if (analisi.presenza_cornici_finestre) {
    if (elem.cornici_finestre?.cambia && elem.cornici_finestre.colore_name) {
      parts.push(`WINDOW CORNICE FRAMES: ✅ CHANGE to ${elem.cornici_finestre.colore_name} (${elem.cornici_finestre.colore_hex})
${elem.cornici_finestre.prompt_fragment || ""}`);
    } else {
      parts.push(`WINDOW CORNICE FRAMES: 🚫 KEEP exactly as in original photo (${analisi.colore_cornici || "existing color"})`);
    }
  } else {
    parts.push("WINDOW CORNICE FRAMES: none present in original photo — do not add");
  }

  // Marcapiani
  if (analisi.presenza_marcapiani) {
    if (elem.marcapiani?.cambia && elem.marcapiani.colore_name) {
      parts.push(`FLOOR BANDS (MARCAPIANI): ✅ CHANGE to ${elem.marcapiani.colore_name} (${elem.marcapiani.colore_hex || ""})`);
    } else {
      parts.push("FLOOR BANDS (MARCAPIANI): 🚫 KEEP color as in original photo");
    }
  }

  // Davanzali
  if (elem.davanzali?.cambia && elem.davanzali.materiale) {
    parts.push(`WINDOW SILLS (DAVANZALI): ✅ CHANGE to ${elem.davanzali.materiale} material, ${elem.davanzali.colore_name || "matching color"}`);
  } else {
    parts.push("WINDOW SILLS (DAVANZALI): 🚫 KEEP as in original photo");
  }

  return parts.join("\n\n");
}

function buildBlock_G_Preservazione(analisi: AnalysiFacciata): string {
  return `[BLOCK G – PRESERVATION RULES (DO NOT CHANGE)]
The following elements must be PIXEL-IDENTICAL to the original photograph:
- All windows and glazed doors (frames, glass, handles)
- All opaque doors (portoni, entrance doors)
- Balcony railings and structures
- Roof tiles, gutters, downpipes
- Garden, vegetation, ground level
- Sky and background
- Any street furniture, vehicles, or context visible
- Neighboring buildings (if visible)
- Photo perspective and camera angle
- Image dimensions: ${analisi.orientamento_foto} view — maintain exact proportions

DO NOT add, remove, or modify any of the above elements.
DO NOT alter the building geometry or massing.
DO NOT change the size or position of any window or door openings.`;
}

function buildBlock_H_QualityRules(): string {
  return `[BLOCK H – PHOTOREALISM QUALITY RULES]
✅ The output must be indistinguishable from a real architectural photograph
✅ Correct perspective rendering — all horizontal lines must remain parallel to horizon
✅ Correct light/shadow on the new facade surface matching original photo lighting direction
✅ Correct atmospheric perspective if building is in a wider scene
✅ No visible artificial processing artifacts, halos, or edge seams
✅ Correct shadow depth on window reveals consistent with solar angle in photo
✅ Texture scale must be proportional to building scale (not too large or too small)
✅ Material surface reflection appropriate to finish type (matte plaster ≠ polished stone)

NEGATIVE (DO NOT RENDER):
- cartoon, illustration, sketch, watercolor, artistic interpretation
- CGI look, oversaturated, HDR effect, vignette
- changed window positions, changed window sizes
- changed building proportions or massing
- added windows or doors not in original
- artificial glow or bloom on facade
- visible seam between new material and original elements
- flat uniform color without texture where texture was specified
- texture at wrong scale (too large or too small for the building)`;
}

// ── SYSTEM PROMPT FACCIATA ────────────────────────────────────────

export const FACADE_SYSTEM_PROMPT = `SURGICAL ARCHITECTURAL FACADE VISUALIZATION EDITOR — v1.0
You are performing a precise surgical modification of a real Italian building facade photograph.

RULE 1: Modify ONLY what is explicitly listed as ✅ REPLACE in BLOCK B.
RULE 2: Every element marked 🚫 KEEP must be pixel-IDENTICAL to the original photo.
RULE 3: The result must be completely indistinguishable from a real architectural photograph.
RULE 4: Maintain exact building geometry — do not alter proportions, perspective, or massing.
RULE 5: Window reveals depth must increase when cappotto is specified — this is mandatory.
RULE 6: Plaster texture (graffiato, liscio, bucciato, etc.) must be correctly and uniformly rendered.
RULE 7: Stone or brick cladding must show realistic 3D relief and material depth — not flat paint.
RULE 8: Apply cladding ONLY in the specified zone — transitions must be clean and architecturally correct.
RULE 9: Preserve the existing windows, doors, balconies exactly — these are not being changed.
RULE 10: Output image dimensions must match input image dimensions exactly.
No artistic interpretation. No CGI look. Photorealistic architectural visualization only.`;

// ── NEGATIVE PROMPT FACCIATA ──────────────────────────────────────

export const FACADE_NEGATIVE_PROMPT = [
  "cartoon", "illustration", "sketch", "watercolor", "artistic rendering",
  "CGI look", "oversaturated", "HDR effect", "vignette", "lens flare",
  "changed building proportions", "altered perspective", "moved windows",
  "added windows not in original", "changed window sizes",
  "different building massing", "modified roof",
  "flat uniform color where texture was specified",
  "texture at wrong scale",
  "smooth plaster where graffiato was requested",
  "stone cladding looking like flat paint",
  "brick without mortar joints",
  "wrong stone type",
  "changed window frames", "changed door color",
  "modified balcony railings", "altered roof tiles",
  "different sky", "changed vegetation",
  "visible seam between new and old material",
  "halo around edited area",
  "unnatural shadow direction",
  "black bars", "white bars", "letterboxing", "pillarboxing",
  "image cropped differently than original",
  "image resized or stretched",
].join(", ");

// ── FUNZIONE PRINCIPALE ───────────────────────────────────────────

export function buildFacciataPrompt(
  analisi: AnalysiFacciata,
  config: ConfigurazioneFacciata
): { userPrompt: string; systemPrompt: string; negativePrompt: string } {

  const blocks: string[] = [];

  // Block A — analisi facciata esistente
  blocks.push(buildBlock_A(analisi));

  // Block B — manifest sostituzioni
  blocks.push(buildBlock_B(config));

  // Block C/D/E — configurazione specifica per tipo intervento
  switch (config.tipo_intervento) {
    case "tinteggiatura":
    case "rifacimento_totale":
      if (config.colore_intonaco) {
        blocks.push(buildBlock_C_Tinteggiatura(config.colore_intonaco));
      }
      break;

    case "cappotto":
      if (config.cappotto) {
        blocks.push(buildBlock_E_Cappotto(config.cappotto, analisi));
      }
      break;

    case "rivestimento":
      if (config.rivestimento) {
        blocks.push(buildBlock_D_Rivestimento(config.rivestimento, analisi));
      }
      break;

    case "misto":
      if (config.rivestimento) {
        blocks.push(buildBlock_D_Rivestimento(config.rivestimento, analisi));
      }
      if (config.colore_intonaco) {
        blocks.push(buildBlock_C_Tinteggiatura(config.colore_intonaco));
      }
      break;
  }

  // Block F — elementi architettonici (se configurati)
  if (config.elementi) {
    blocks.push(buildBlock_F_ElementiArchitettonici(config.elementi, analisi));
  }

  // Block G — regole preservazione
  blocks.push(buildBlock_G_Preservazione(analisi));

  // Block H — qualità fotorealismo
  blocks.push(buildBlock_H_QualityRules());

  // Note aggiuntive utente
  if (config.note_aggiuntive) {
    blocks.push(`[BLOCK Z – ADDITIONAL NOTES]\n${config.note_aggiuntive}`);
  }

  const userPrompt = blocks.join("\n\n");

  return {
    userPrompt,
    systemPrompt: FACADE_SYSTEM_PROMPT,
    negativePrompt: FACADE_NEGATIVE_PROMPT,
  };
}
