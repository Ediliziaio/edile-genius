// ── Analisi AI della foto originale ─────────────────────────────
export interface AnalysiBagno {
  dimensione_stimata: "piccolo" | "medio" | "grande" | null;
  forma_bagno: "rettangolare" | "quadrato" | "irregolare" | "lungo_stretto" | null;
  altezza_soffitto: "standard" | "alto" | "basso" | null;
  presenza_vasca: boolean;
  tipo_vasca_attuale: string | null;
  presenza_doccia: boolean;
  tipo_doccia_attuale: string | null;
  presenza_box_doccia: boolean;
  colore_box_attuale: string | null;
  piastrelle_parete_effetto: string | null;
  piastrelle_parete_colore_dominante: string | null;
  piastrelle_parete_formato_stimato: string | null;
  pavimento_effetto: string | null;
  pavimento_colore_dominante: string | null;
  presenza_mobile_bagno: boolean;
  stile_mobile: string | null;
  colore_mobile_dominante: string | null;
  presenza_wc: boolean;
  wc_tipo: "a_terra" | "sospeso" | null;
  presenza_bidet: boolean;
  rubinetteria_finitura: string | null;
  illuminazione_tipo: string | null;
  finestre_presenti: boolean;
  stile_generale: string | null;
  stato_generale: "buono" | "discreto" | "da_rinnovare" | null;
  note_critiche: string | null;
}

// ── Tipo intervento ──────────────────────────────────────────────
export type TipoIntervento =
  | "restyling_piastrelle"
  | "restyling_completo"
  | "demolizione_parziale"
  | "demolizione_completa";

// ── Selezione elementi da modificare ────────────────────────────
export interface SostituzioneElementi {
  piastrelle_parete: boolean;
  pavimento: boolean;
  doccia: boolean;
  vasca: boolean;
  mobile_bagno: boolean;
  sanitari: boolean;
  rubinetteria: boolean;
  parete_colore: boolean;
  illuminazione: boolean;
}

// ── Configurazione piastrelle ────────────────────────────────────
export interface ConfigPiastrella {
  effetto: string;
  formato: string;
  posa: string;
  fuga_colore: string;
  prompt_effetto: string;
  colore_hex?: string;
}

// ── Configurazione doccia ────────────────────────────────────────
export interface ConfigDoccia {
  azione: "mantieni" | "sostituisci" | "rimuovi";
  tipo: string;
  box: string;
  piatto: string;
  profilo: string;
  soffione: "a_parete" | "pioggia_soffitto" | "colonna" | "combinato";
  larghezza_stimata?: number;
  prompt_box: string;
  prompt_piatto: string;
  prompt_profilo: string;
}

// ── Configurazione vasca ─────────────────────────────────────────
export interface ConfigVasca {
  azione: "mantieni" | "sostituisci" | "rimuovi";
  tipo: string;
  forma: string;
  materiale: string;
  posizione: "parete_lunga" | "parete_corta" | "angolo" | "centro_stanza";
  prompt_tipo: string;
  prompt_forma: string;
  prompt_materiale: string;
}

// ── Configurazione mobile bagno (vanity) ────────────────────────
export interface ConfigVanity {
  azione: "mantieni" | "sostituisci" | "rimuovi";
  stile: string;
  colore: string;
  piano: string;
  lavabo: "integrato" | "appoggio_ovale" | "appoggio_rettangolare" | "semincasso";
  larghezza_cm: number;
  prompt_stile: string;
  prompt_piano: string;
}

// ── Configurazione sanitari ──────────────────────────────────────
export interface ConfigSanitari {
  azione_wc: "mantieni" | "sostituisci";
  wc_tipo: "sospeso" | "a_terra" | "rimless_sospeso";
  azione_bidet: "mantieni" | "sostituisci" | "rimuovi";
  colore: "bianco" | "grigio" | "nero";
}

// ── Configurazione rubinetteria ──────────────────────────────────
export interface ConfigRubinetteria {
  azione: "mantieni" | "sostituisci";
  finitura: string;
  stile: string;
  prompt_finitura: string;
}

// ── Configurazione parete / colori ──────────────────────────────
export interface ConfigParete {
  azione: "mantieni" | "tinta" | "lastra";
  tipo: string;
  colore_hex?: string;
  colore_nome?: string;
}

// ── Layout per demolizione completa ─────────────────────────────
export interface ConfigLayout {
  attivo: boolean;
  larghezza_cm: number;
  lunghezza_cm: number;
  posizione_doccia: "fondo_sinistra" | "fondo_destra" | "fondo_centro" | "laterale_sinistra" | "laterale_destra";
  posizione_vasca: "parete_lunga" | "parete_corta" | "angolo" | "centro" | "assente";
  posizione_mobile: "parete_lunga" | "parete_corta" | "angolo";
  posizione_wc: "accanto_mobile" | "angolo" | "parete_corta";
  note_layout?: string;
}

// ── Configurazione completa del render ──────────────────────────
export interface ConfigurazioneBagno {
  tipo_intervento: TipoIntervento;
  sostituzione: SostituzioneElementi;
  piastrelle_parete: ConfigPiastrella;
  pavimento: ConfigPiastrella;
  doccia: ConfigDoccia;
  vasca: ConfigVasca;
  vanity: ConfigVanity;
  sanitari: ConfigSanitari;
  rubinetteria: ConfigRubinetteria;
  parete: ConfigParete;
  layout: ConfigLayout;
  illuminazione_tipo?: string;
}

// ── DIZIONARI DESCRIZIONE MATERIALI ─────────────────────────────
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

// ═══════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

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

// ═══════════════════════════════════════════════════════════════
// BLOCK BUILDERS
// ═══════════════════════════════════════════════════════════════

function buildBlock_A(analisi: AnalysiBagno): string {
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

function buildBlock_B(cfg: ConfigurazioneBagno): string {
  const s = cfg.sostituzione;
  const toChange: string[] = [];
  const toKeep: string[] = [];

  const elements: { key: keyof SostituzioneElementi; label: string }[] = [
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

  for (const el of elements) {
    if (s[el.key]) toChange.push(`✅ REPLACE: ${el.label}`);
    else toKeep.push(`🚫 KEEP EXACTLY: ${el.label}`);
  }

  return `[BLOCK B – SELECTIVE REPLACEMENT DECLARATION]
ELEMENTS TO CHANGE IN THIS RENDER:
${toChange.join("\n")}

ELEMENTS THAT MUST REMAIN IDENTICAL TO ORIGINAL PHOTO:
${toKeep.join("\n")}

CRITICAL: Only replace what is listed as "REPLACE". Every other surface, object, and pixel
outside the replacement zones must remain photorealistic and identical to the original photo.`;
}

function buildBlock_C(cfg: ConfigurazioneBagno): string {
  if (!cfg.sostituzione.piastrelle_parete) return `[BLOCK C – WALL TILES — KEPT AS ORIGINAL]`;

  const p = cfg.piastrelle_parete;
  const physics = TILE_PHYSICS[p.effetto] || "ceramic tile surface";

  return `[BLOCK C – NEW WALL TILES SPECIFICATION]
Tile effect: ${p.prompt_effetto}
Material physics: ${physics}
Format/size: ${p.formato} tiles
Layout pattern: ${p.posa} — ${buildPosaDescription(p.posa)}
Grout color: ${buildFugaDescription(p.fuga_colore)}
Grout joint width: ${p.formato.includes("lastra") ? "1-2mm (minimal, large format)" : p.formato.includes("10x") || p.formato.includes("mosaico") ? "2-3mm" : "2-3mm standard"}

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

function buildBlock_D(cfg: ConfigurazioneBagno): string {
  if (!cfg.sostituzione.pavimento) return `[BLOCK D – FLOOR — KEPT AS ORIGINAL]`;

  const p = cfg.pavimento;
  const physics = TILE_PHYSICS[p.effetto] || "porcelain floor tile";

  return `[BLOCK D – NEW FLOOR SPECIFICATION]
Floor tile effect: ${p.prompt_effetto}
Material physics: ${physics}
Format/size: ${p.formato}
Layout pattern: ${p.posa} — ${buildPosaDescription(p.posa)}
Grout color: ${buildFugaDescription(p.fuga_colore)}

FLOOR APPLICATION:
- Cover entire bathroom floor visible in the photo
- Floor must extend continuously under toilet, bidet base, and vanity if floor-standing
- Correct perspective foreshortening towards back of bathroom
- If existing shower tray is to be kept, maintain its outline but apply floor tile up to its edge
- If new piatto doccia a raso (flush) is configured: no visible threshold, floor continues into shower

FLOOR RENDERING RULES:
- ${physics}
- If marble or glossy tile: subtle floor reflections of walls and fixtures visible
- Pattern direction must be consistent (not rotated mid-room)
- Edge tiles must be cut proportionally at room boundaries`;
}

function buildBlock_E(cfg: ConfigurazioneBagno, analisi: AnalysiBagno): string {
  const d = cfg.doccia;

  if (d.azione === "mantieni") return `[BLOCK E – SHOWER — KEPT AS ORIGINAL]`;
  if (d.azione === "rimuovi")
    return `[BLOCK E – SHOWER — REMOVE: Fill the shower area with wall tiles matching BLOCK C. Remove all shower hardware, screen, tray.]`;

  let showerRules: string;
  if (d.tipo === "walk_in") {
    showerRules =
      "Walk-in open shower: NO door or enclosure on one or more sides. The open side faces into bathroom. Single fixed glass panel (if any) has NO moving part.";
  } else if (d.tipo === "nicchia_box") {
    showerRules =
      "Shower alcove: glass door on front face only. Three tiled walls inside visible. Door opens INTO the shower area.";
  } else if (d.tipo === "angolare") {
    showerRules =
      "Corner shower: two glass panels meeting at 90° corner. Both panels are equal height. Door on one of the two glass panels.";
  } else {
    showerRules =
      "Semi-circular shower: curved glass panel forming quarter-circle arc.";
  }

  const glassAppearance =
    d.box === "box_trasparente"
      ? "water marks and minor reflections visible through"
      : "translucent/frosted/tinted";

  return `[BLOCK E – NEW SHOWER SPECIFICATION]
Shower type: ${buildShowerTypeDesc(d.tipo)}
Glass enclosure: ${d.prompt_box}
Shower tray/floor: ${d.prompt_piatto}
Frame/profiles: ${d.prompt_profilo}
Shower head: ${buildSoffioneDesc(d.soffione)}

SHOWER RENDERING RULES:
${showerRules}
- Glass panels must have correct ${glassAppearance} appearance
- Profiles (${d.profilo}) must be visible at top rail, door edge, and wall anchor points
- Shower tray: ${d.prompt_piatto}
- All shower tile inside matches BLOCK C wall tiles
- Water fixtures: ${d.prompt_profilo} finish for all visible hardware
- Shower must be realistically positioned where current shower is in photo (unless BLOCK L instructs different position)`;
}

function buildBlock_F(cfg: ConfigurazioneBagno): string {
  const v = cfg.vasca;

  if (v.azione === "mantieni") return `[BLOCK F – BATHTUB — KEPT AS ORIGINAL]`;
  if (v.azione === "rimuovi")
    return `[BLOCK F – BATHTUB — REMOVE: Remove bathtub entirely. Fill the floor area with matching floor tiles (BLOCK D). Tile the wall behind where bathtub was (BLOCK C).]`;

  const isFreestanding =
    v.tipo === "vasca_freestanding" || v.tipo === "vasca_freestanding_muro";

  const bathRules = isFreestanding
    ? `FREESTANDING BATHTUB:
- Bathtub stands independently on bathroom floor
- All four sides (or three if against wall) are fully visible and rendered in 3D
- Bathtub feet/plinth visible at floor contact
- Floor tiles continue underneath and around the bathtub
- Freestanding tap/mixer ${cfg.rubinetteria.finitura} standing next to bathtub OR wall-mounted above
- The bathtub appears as a sculptural object in the space`
    : `BUILT-IN BATHTUB:
- Bathtub recessed into alcove or against wall
- Side panel/apron visible on the long open face
- Top edge (bath rim) visible at correct height
- If incassata: three sides are tiled or paneled, one long side is the apron panel
- Tap/mixer on long side or short end, ${cfg.rubinetteria.finitura} finish`;

  return `[BLOCK F – NEW BATHTUB SPECIFICATION]
Bathtub type: ${v.prompt_tipo}
Shape: ${v.prompt_forma}
Finish/material: ${v.prompt_materiale}
Positioning: ${buildVascaPositionDesc(v.posizione)}

BATHTUB RENDERING RULES:
${bathRules}
- Bathtub material: ${v.prompt_materiale}
- Correct scale relative to room (standard Italian bath 170×75cm typical)
- Correct shadows under and around the bathtub matching scene lighting`;
}

function buildBlock_G(cfg: ConfigurazioneBagno): string {
  const vm = cfg.vanity;

  if (vm.azione === "mantieni") return `[BLOCK G – VANITY — KEPT AS ORIGINAL]`;
  if (vm.azione === "rimuovi")
    return `[BLOCK G – VANITY — REMOVE: Remove vanity/cabinet. Show only wall behind (tiled per BLOCK C or painted per BLOCK I).]`;

  const mountingRules = vm.stile.includes("sospeso")
    ? "FLOATING VANITY: cabinet is wall-mounted with a visible gap (10-15cm) between base and floor. Floor tiles continue under the vanity. No legs or base touching floor."
    : "FLOOR-STANDING VANITY: cabinet rests on floor. No gap visible.";

  return `[BLOCK G – NEW VANITY/FURNITURE SPECIFICATION]
Vanity style: ${vm.prompt_stile}
Width: approx ${vm.larghezza_cm}cm
Cabinet color: ${vm.colore}
Countertop: ${vm.prompt_piano}
Sink/washbasin: ${buildLavaboDesc(vm.lavabo)}
Tap finish: ${cfg.rubinetteria.finitura !== "mantieni" ? cfg.rubinetteria.prompt_finitura : "matching existing fixtures"}

VANITY RENDERING RULES:
${mountingRules}
- Cabinet finish: ${vm.colore} — render with correct material sheen (lacquered = satin-gloss, wood = grain visible)
- Countertop: ${vm.prompt_piano}
- Sink: ${buildLavaboDesc(vm.lavabo)} — correct ceramic/stone white surface
- Mirror above vanity: if present in original, keep mirror in same position and style
- Under-sink storage: doors or open shelves per the stile description
- Correct scale: ${vm.larghezza_cm}cm wide, approx 50cm deep, 85cm floor-to-top height (or floating height)
- Hardware (handles if present): ${cfg.rubinetteria.finitura} finish`;
}

function buildBlock_H(cfg: ConfigurazioneBagno): string {
  if (!cfg.sostituzione.sanitari) return `[BLOCK H – TOILET & BIDET — KEPT AS ORIGINAL]`;

  const s = cfg.sanitari;
  const toiletDesc =
    s.wc_tipo === "sospeso" || s.wc_tipo === "rimless_sospeso"
      ? "wall-hung toilet — the pan is mounted to the wall, floor below is completely clear, in-wall cistern concealed behind wall (not visible externally)"
      : "floor-standing toilet — the base rests on the floor, floor connection visible";

  const bidetLine =
    s.azione_bidet !== "rimuovi"
      ? `Bidet: ${s.azione_bidet === "sostituisci" ? "new " : ""}${s.wc_tipo === "sospeso" ? "wall-hung bidet" : "floor-standing bidet"}, ${s.colore} ceramic, matching toilet style`
      : "Bidet: REMOVE — show floor tiles where bidet was";

  const floorRule =
    s.wc_tipo === "sospeso"
      ? "NO floor base visible — complete floor continuity under toilet pan"
      : "Floor contact: circular or rectangular base visible at floor level";

  return `[BLOCK H – TOILET & BIDET SPECIFICATION]
Toilet type: ${toiletDesc}
Toilet color: ${s.colore} ceramic
${bidetLine}

TOILET RENDERING RULES:
- Ceramic surface: smooth high-gloss ${s.colore} ceramic
- Soft-close seat cover in matching or white color
- ${floorRule}
- Flush button: rectangular push-plate on wall above cistern (if wall-hung) OR tank lid button (if floor-standing)
- Correct proportion: standard WC 360-400mm wide, 550-700mm deep`;
}

function buildBlock_I(cfg: ConfigurazioneBagno): string {
  if (!cfg.sostituzione.rubinetteria) return `[BLOCK I – FIXTURES — KEPT AS ORIGINAL]`;

  const r = cfg.rubinetteria;
  const bathLine =
    cfg.vasca.azione !== "rimuovi" && cfg.vasca.azione !== "mantieni"
      ? `- Bath mixer/filler: ${r.prompt_finitura}, mounted on bath rim or wall above bath`
      : "";

  return `[BLOCK I – FIXTURES & TAPS SPECIFICATION]
All visible taps, mixers, showerhead, and hardware: ${r.prompt_finitura}
Style: ${buildRubStyle(r.stile)}

FIXTURES TO RENDER:
- Washbasin mixer/tap: ${r.stile} body form, ${r.prompt_finitura}, mounted on countertop or wall
- Shower mixer/thermostatic: ${r.prompt_finitura} valve on shower wall
- Shower head: ${r.prompt_finitura} finish on all fittings
${bathLine}
- Towel rail/radiator (if visible): ${r.prompt_finitura} finish
- ALL metal hardware visible in bathroom adopts ${r.prompt_finitura} finish

FIXTURE RENDERING RULES:
- ${r.prompt_finitura} — apply correct physical appearance to all hardware
- Correct scale: standard single-lever mixer 150-200mm tall
- Aerator/spout visible at tap end
- Correct shadow casting from chrome/metal surfaces`;
}

function buildBlock_J(cfg: ConfigurazioneBagno): string {
  if (!cfg.sostituzione.parete_colore) return `[BLOCK J – WALL PAINT — KEPT AS ORIGINAL]`;

  const p = cfg.parete;
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
Wall treatment: ${buildPareteDesc(p.tipo)}
${p.colore_nome ? `Color: ${p.colore_nome}` : ""}
${p.colore_hex ? `Approximate hex: ${p.colore_hex}` : ""}

WALL PAINT APPLICATION:
${applicationRules}
- Painted surfaces must show subtle lighting gradient (brighter near light source, slightly darker in corners)
- Paint finish must NOT appear flat or CGI — subtle natural wall texture visible in photo`;
}

function buildBlock_K(cfg: ConfigurazioneBagno): string {
  if (!cfg.sostituzione.illuminazione) return `[BLOCK K – LIGHTING — KEPT AS ORIGINAL]`;

  const il = cfg.illuminazione_tipo || "faretti";

  let lightingRules: string;
  if (il === "faretti") {
    lightingRules =
      "Replace existing ceiling light with recessed spotlights (faretti a incasso) — circular trim flush with ceiling, white or chrome. Multiple units spaced evenly.";
  } else if (il === "specchio_led") {
    lightingRules =
      "LED-illuminated mirror: mirror with integrated edge LED strip creating backlit halo effect around perimeter. Warm white glow visible around mirror edges.";
  } else if (il === "led_profilo") {
    lightingRules =
      "Recessed LED profile: indirect ambient light from LED profile at ceiling-wall junction or under vanity. Warm white glow visible.";
  } else {
    lightingRules =
      "Surface-mounted ceiling light (plafoniera) — circular or square flush ceiling fixture.";
  }

  return `[BLOCK K – LIGHTING SPECIFICATION]
New lighting type: ${buildIlluminazioneDesc(il)}

LIGHTING RENDERING:
${lightingRules}
- Overall lighting quality must remain photorealistic and match original photo's ambient light direction
- Do NOT add unrealistic bloom or lens flare effects
- Maintain natural shadows consistent with light source position`;
}

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPT & NEGATIVE PROMPT
// ═══════════════════════════════════════════════════════════════

export const BATHROOM_SYSTEM_PROMPT = `SURGICAL INTERIOR DESIGN VISUALIZATION EDITOR
You are performing a precise surgical replacement of bathroom interior elements in a real photograph.

RULE 1: Replace ONLY what is explicitly listed in BLOCK B as "✅ REPLACE".
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

export const BATHROOM_NEGATIVE_PROMPT = [
  // General
  "cartoon", "illustration", "sketch", "3D render", "CGI look", "oversaturated",
  "HDR effect", "vignette", "watermark", "text overlay",
  // Tiles
  "wrong tile perspective", "floating tiles", "tiles not meeting at corners",
  "inconsistent grout width", "tile pattern not continuous",
  "wood grain on ceramic tile", "flat color on marble tile",
  // Shower
  "shower screen on wrong side", "missing shower hardware", "shower tray wrong color",
  "glass screen without frame when profiles specified",
  // Bathtub
  "bathtub wrong shape", "bathtub floating above floor", "missing bathtub feet",
  "freestanding bath without floor contact",
  // Sanitary
  "toilet floating above floor", "wall-hung toilet with visible base",
  "toilet wrong scale", "bidet merged with toilet",
  // General scene
  "changed room dimensions", "different window position", "different ceiling height",
  "altered room perspective", "added furniture not requested",
  "added plants or decorative objects", "changed wall opening",
  "different lighting direction", "different season or time of day",
].join(", ");

// ═══════════════════════════════════════════════════════════════
// LAYOUT BLOCK (demolizione completa)
// ═══════════════════════════════════════════════════════════════

export function buildBlock_Layout(layout: ConfigLayout): string {
  return `[BLOCK LAYOUT – COMPLETE BATHROOM REDESIGN]
⚠️ FULL REDESIGN: This render shows a completely new bathroom layout.

Room dimensions: approx ${layout.larghezza_cm}cm × ${layout.lunghezza_cm}cm
Ceiling height: standard (240cm unless specified)

NEW ELEMENT POSITIONING:
- Shower: ${layout.posizione_doccia.replace(/_/g, " ")} of room
- Bathtub: ${layout.posizione_vasca.replace(/_/g, " ")} (or remove if "assente")
- Vanity/sink: along ${layout.posizione_mobile.replace(/_/g, " ")} wall
- Toilet: ${layout.posizione_wc.replace(/_/g, " ")}

${layout.note_layout ? `Additional layout notes: ${layout.note_layout}` : ""}

CRITICAL:
- The walls, floor, and structural openings (windows, door) remain in same positions
- Only the bathroom fixtures and fittings are rearranged
- All plumbing connections are assumed to be relocated as needed
- Render must show the new layout in a photorealistic perspective matching original photo angle`;
}

// ═══════════════════════════════════════════════════════════════
// MAIN EXPORT
// ═══════════════════════════════════════════════════════════════

export function buildBathroomPrompt(
  analisi: AnalysiBagno,
  config: ConfigurazioneBagno
): { userPrompt: string; systemPrompt: string; negativePrompt: string } {
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

  if (config.tipo_intervento === "demolizione_completa" && config.layout.attivo) {
    blocks.push(buildBlock_Layout(config.layout));
  }

  blocks.push(`[BLOCK FINALE – RENDER QUALITY REQUIREMENTS]
Output must look like a professional interior design magazine photograph.
Render at the same camera angle and perspective as the original photo.
Maintain all lighting, shadows, reflections, and ambient quality from original.
Do not add watermarks, text, or any overlay.
Output format: photorealistic JPEG/PNG, same aspect ratio as input.
Negative prompt — avoid: ${BATHROOM_NEGATIVE_PROMPT}`);

  return {
    userPrompt: blocks.join("\n\n"),
    systemPrompt: BATHROOM_SYSTEM_PROMPT,
    negativePrompt: BATHROOM_NEGATIVE_PROMPT,
  };
}
