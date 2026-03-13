// ═══════════════════════════════════════════════════════════
// Render Stanza Completo — Prompt Builder v1.0
// ═══════════════════════════════════════════════════════════

// ─── Tipi base ────────────────────────────────────────────────────────────────

export type TipoStanza =
  | "cucina" | "soggiorno" | "camera_da_letto" | "bagno"
  | "studio" | "ingresso" | "taverna" | "sala_da_pranzo"
  | "corridoio" | "altro";

export type TipoIntervento =
  | "verniciatura_pareti"
  | "nuovo_pavimento"
  | "cambio_arredo"
  | "nuovo_soffitto"
  | "nuova_illuminazione"
  | "carta_da_parati"
  | "rivestimento_pareti"
  | "cambio_tende"
  | "restyling_cucina"
  | "restyling_bagno";

export type StileArredo =
  | "moderno" | "scandinavo" | "industriale" | "classico"
  | "rustico" | "minimalista" | "mediterraneo" | "art_deco"
  | "giapponese" | "provenzale" | "eclettico" | "luxe_contemporaneo";

export type Intensita = "leggero" | "medio" | "radicale";

// ─── Config per ogni intervento ───────────────────────────────────────────────

export interface ConfigVerniciatura {
  attivo: boolean;
  colore_code?: string;
  colore_nome?: string;
  colore_hex?: string;
  finitura?: "opaco" | "satinato" | "lucido" | "lavabile";
  applica_a?: "tutte" | "parete_principale" | "parete_accento" | "specifiche";
  colore_accento_hex?: string;
  colore_accento_nome?: string;
}

export interface ConfigPavimento {
  attivo: boolean;
  tipo?: string;
  colore_hex?: string;
  colore_nome?: string;
  pattern?: string;
  finitura?: string;
  dimensione?: string;
}

export interface ConfigArredo {
  attivo: boolean;
  stile?: StileArredo;
  colore_principale_hex?: string;
  colore_principale_nome?: string;
  materiale?: string;
  intensita_cambio?: "colore_sola" | "stile_mantenendo_layout" | "arredo_completo";
  mantieni_elettrodomestici?: boolean;
}

export interface ConfigSoffitto {
  attivo: boolean;
  colore_hex?: string;
  colore_nome?: string;
  tipo?: "piano" | "controsoffitto_cartongesso" | "travi_legno" | "boiserie_soffitto";
  colore_travi?: string;
}

export interface ConfigIlluminazione {
  attivo: boolean;
  tipo?: "faretti_incassati" | "lampadario_centrale" | "led_strip_perimetrale"
       | "lampade_sospensione" | "applique_parete" | "misto";
  temperatura?: "calda_2700k" | "neutra_3000k" | "fredda_4000k";
  intensita_luce?: "soffusa" | "normale" | "forte";
}

export interface ConfigCartaDaParati {
  attivo: boolean;
  stile_pattern?: string;
  colore_base?: string;
  applica_a?: "parete_principale" | "tutte";
  descrizione?: string;
}

export interface ConfigRivestimentoPareti {
  attivo: boolean;
  tipo?: "boiserie_legno" | "mattone_vista" | "pietra_naturale" | "pannelli_3d"
       | "intonaco_spatolato" | "stucco_veneziano";
  colore_hex?: string;
  colore_nome?: string;
  applica_a?: "parete_principale" | "zoccolino" | "tutte";
}

export interface ConfigTende {
  attivo: boolean;
  tipo?: "tende_a_pannello" | "tende_classiche" | "veneziane" | "rullo"
       | "tende_lino" | "tende_velluto" | "nessuna";
  colore_hex?: string;
  colore_nome?: string;
}

export interface ConfigRestylingCucina {
  attivo: boolean;
  colore_frontali_hex?: string;
  colore_frontali_nome?: string;
  materiale_frontali?: "laccato" | "legno" | "effetto_legno" | "vetro" | "metallo";
  colore_piano_lavoro_hex?: string;
  piano_lavoro_materiale?: "marmo" | "granito" | "quarzo" | "laminato" | "legno";
  maniglie?: "senza_maniglia" | "metallo_nero" | "metallo_oro" | "legno" | "cromato";
  cambia_piano_cottura?: boolean;
}

export interface ConfigRestylingBagno {
  attivo: boolean;
  colore_rivestimento_hex?: string;
  colore_rivestimento_nome?: string;
  tipo_rivestimento?: "ceramica" | "marmo" | "microcemento" | "gres";
  cambia_sanitari?: boolean;
  colore_sanitari?: "bianco" | "grigio" | "nero";
  cambia_rubinetteria?: boolean;
  stile_rubinetteria?: "moderno" | "classico" | "industriale" | "nero_opaco" | "oro";
}

// ─── Configurazione completa ──────────────────────────────────────────────────

export interface ConfigurazioneStanza {
  tipo_stanza?: TipoStanza;
  stile_target?: StileArredo;
  intensita: Intensita;

  verniciatura: ConfigVerniciatura;
  pavimento: ConfigPavimento;
  arredo: ConfigArredo;
  soffitto: ConfigSoffitto;
  illuminazione: ConfigIlluminazione;
  carta_da_parati: ConfigCartaDaParati;
  rivestimento_pareti: ConfigRivestimentoPareti;
  tende: ConfigTende;
  restyling_cucina: ConfigRestylingCucina;
  restyling_bagno: ConfigRestylingBagno;

  note_aggiuntive?: string;
  original_image_width?: number;
  original_image_height?: number;
}

export interface AnalisiStanza {
  tipo_stanza?: string;
  stile_attuale?: string;
  condizione_generale?: string;
  pareti?: {
    colore_principale?: string;
    colore_hex?: string;
    finitura?: string;
    numero_pareti_visibili?: number;
    presenza_carta_da_parati?: boolean;
    presenza_rivestimento?: boolean;
  };
  pavimento?: {
    tipo?: string;
    colore?: string;
    colore_hex?: string;
    pattern?: string;
    condizione?: string;
  };
  soffitto?: {
    colore?: string;
    altezza_stimata?: string;
    tipo?: string;
    presenza_cornici?: boolean;
  };
  arredo?: {
    stile?: string;
    colore_dominante?: string;
    materiale_dominante?: string;
    densita?: string;
    elementi_principali?: string[];
  };
  illuminazione?: {
    tipo_principale?: string;
    temperatura_stimata?: string;
    sorgenti_visibili?: string[];
    luminosita_ambiente?: string;
  };
  caratteristiche_speciali?: {
    presenza_finestre?: boolean;
    numero_finestre_visibili?: number;
    presenza_camino?: boolean;
    presenza_travi?: boolean;
    presenza_colonne?: boolean;
    presenza_nicchie?: boolean;
    presenza_arco?: boolean;
  };
  colore_dominante_generale?: string;
  palette_principale?: string[];
  interventi_suggeriti?: string[];
  note_speciali?: string;
}

// ─── Dizionari stile ──────────────────────────────────────────────────────────

const STILE_ARREDO_PROMPTS: Record<StileArredo, string> = {
  moderno: `contemporary modern style: clean geometric lines, minimal ornamentation, materials like glass/metal/lacquered wood, neutral palette with bold accents, functional design`,
  scandinavo: `Scandinavian style: light wood tones, white walls, natural textiles (linen/wool), simple functional furniture, hygge warmth, muted palette with natural accents`,
  industriale: `industrial loft style: exposed materials (brick/concrete/steel), dark metal frames, Edison bulbs, reclaimed wood, monochromatic palette with warm accents`,
  classico: `classic traditional style: ornate moldings, upholstered furniture, symmetrical arrangements, rich wood tones, traditional fabrics (velvet/damask), warm color palette`,
  rustico: `rustic country style: natural rough materials, exposed wooden beams, terracotta, stone, hand-crafted objects, warm earth tones, lived-in character`,
  minimalista: `minimalist style: extreme visual reduction, only essential furniture, monochromatic or duo-chromatic palette, hidden storage, generous negative space`,
  mediterraneo: `Mediterranean style: warm terracotta and sand tones, white walls, blue accents, handcrafted ceramics, natural materials, arched elements, mosaic details`,
  art_deco: `Art Déco style: bold geometric patterns, luxurious materials (velvet/marble/brass), high contrast palette (black/gold/cream), symmetrical arrangements, dramatic statement pieces`,
  giapponese: `Japandi style: wabi-sabi aesthetics, natural wood and bamboo, neutral muted palette, low furniture, natural textiles, zen minimalism, indoor plants`,
  provenzale: `Provençal French style: patinated painted furniture, lavender and sunflower tones, floral patterns, rustic charm, whitewashed walls, vintage accessories`,
  eclettico: `eclectic style: bold mix of patterns and textures, varied furniture styles from different eras, rich layered color palette, personal and collected aesthetic`,
  luxe_contemporaneo: `luxury contemporary style: premium materials (marble/velvet/brass/glass), rich jewel tones, statement lighting, bespoke furniture, hotel-like refined aesthetic`,
};

const INTENSITA_PROMPTS: Record<Intensita, string> = {
  leggero: `LIGHT REFRESH (tono su tono): Make subtle changes only — update colors while keeping existing furniture style and room structure. Changes should feel like a natural evolution, not a renovation.`,
  medio: `MEDIUM RENOVATION: Replace specified elements with new materials and colors. Maintain room structure and most permanent elements. The space should look noticeably different but recognizable.`,
  radicale: `FULL TRANSFORMATION: Complete renovation of all specified elements. The room should look completely transformed — new style, new colors, new materials. Only structural elements (windows, doors, room shape) remain.`,
};

// ─── Block builders ────────────────────────────────────────────────────────────

function buildBlock_Intro(config: ConfigurazioneStanza, analisi: AnalisiStanza | null): string {
  const attivi = getInterventiAttivi(config);
  const stanzaLabel = analisi?.tipo_stanza ?? config.tipo_stanza ?? "room";
  return `[BLOCK 0 — MISSION]
You are transforming a photograph of a ${stanzaLabel} interior.
ACTIVE INTERVENTIONS: ${attivi.join(", ")}
STYLE TARGET: ${config.stile_target ? STILE_ARREDO_PROMPTS[config.stile_target] : "maintain coherent style"}
TRANSFORMATION INTENSITY: ${INTENSITA_PROMPTS[config.intensita]}
ABSOLUTE RULE: Apply ONLY the listed interventions. Everything else must remain PIXEL-PERFECT unchanged.`;
}

function buildBlock_Pareti(config: ConfigVerniciatura, analisi: AnalisiStanza | null): string {
  if (!config.attivo) {
    return `[BLOCK PARETI — NO CHANGE]
Walls: preserve EXACTLY as in original photo. Color: ${analisi?.pareti?.colore_principale ?? "unchanged"}. Do not modify.`;
  }

  const applicazione = config.applica_a === "parete_principale"
    ? "Apply new color to the main/focal wall only"
    : config.applica_a === "parete_accento"
    ? "Apply new color to ONE accent wall (feature wall), keep other walls in a lighter complementary tone"
    : "Apply new color to ALL visible walls";

  const featureWallNote = config.colore_accento_hex
    ? `\nFEATURE WALL: one wall in ${config.colore_accento_nome ?? ""} (${config.colore_accento_hex}), remaining walls in ${config.colore_nome ?? ""} (${config.colore_hex ?? ""})`
    : "";

  return `[BLOCK PARETI — REPAINT]
${applicazione}
Target color: ${config.colore_nome ?? "specified color"} — exact hex: ${config.colore_hex ?? "#FFFFFF"}
Paint finish: ${config.finitura ?? "opaco"}${featureWallNote}

WALL PAINTING RULES:
- Color must be uniform and consistent across all painted surfaces
- Respect all architectural elements: window/door frames, baseboards, cornices remain in their existing color
- Light from windows and lamps affects wall appearance: the painted color must read correctly under existing room lighting
- Shadows in room corners remain natural (darker toned wall color, not different color)
- Junctions between wall/ceiling and wall/floor must be clean paint lines`;
}

function buildBlock_Pavimento(config: ConfigPavimento, analisi: AnalisiStanza | null): string {
  if (!config.attivo) {
    return `[BLOCK PAVIMENTO — NO CHANGE]
Floor: preserve EXACTLY. Type: ${analisi?.pavimento?.tipo ?? "unchanged"}. Do not modify.`;
  }
  return `[BLOCK PAVIMENTO — REPLACE]
Replace existing floor with: ${config.tipo ?? "specified flooring"}
Color: ${config.colore_nome ?? ""} — hex: ${config.colore_hex ?? ""}
Pattern: ${config.pattern ?? "a_correre"}
Finish: ${config.finitura ?? "opaco"}
${config.dimensione ? `Format: ${config.dimensione}` : ""}

FLOOR RULES:
- Replace floor surface ONLY — do not move furniture or objects
- New floor must follow correct perspective with room's vanishing points
- Pattern must be geometrically consistent wall-to-wall
- Furniture shadows cast onto new floor naturally
- Baseboards/skirting boards stay in existing position`;
}

function buildBlock_Arredo(config: ConfigArredo, analisi: AnalisiStanza | null, tipoStanza?: TipoStanza): string {
  if (!config.attivo) {
    return `[BLOCK ARREDO — NO CHANGE]
Furniture: preserve EXACTLY as in original photo. Do not move, replace or recolor.`;
  }

  const stileDesc = config.stile ? STILE_ARREDO_PROMPTS[config.stile as StileArredo] : "updated style";
  const intensitaArredo = config.intensita_cambio ?? "stile_mantenendo_layout";

  let cambioDesc = "";
  if (intensitaArredo === "colore_sola") {
    cambioDesc = `COLOR CHANGE ONLY: Keep exact same furniture pieces and positions. Only repaint/recolor all furniture to ${config.colore_principale_nome ?? ""} (${config.colore_principale_hex ?? ""}) and matching tones.`;
  } else if (intensitaArredo === "stile_mantenendo_layout") {
    cambioDesc = `STYLE CHANGE: Replace furniture with new pieces in ${config.stile} style. Maintain same spatial layout and functional zones. New furniture must be proportionate to the room.`;
  } else {
    cambioDesc = `COMPLETE REDESIGN: Replace all furniture with new ${config.stile} style pieces. New layout, new colors, new materials. Make the space look professionally designed.`;
  }

  const cucinaNote = tipoStanza === "cucina" && config.mantieni_elettrodomestici
    ? "\nKEEP appliances (fridge, oven, dishwasher) in existing positions."
    : "";

  return `[BLOCK ARREDO — REDESIGN]
${cambioDesc}
Style: ${stileDesc}
Primary color: ${config.colore_principale_nome ?? "natural"} (${config.colore_principale_hex ?? ""})
Material: ${config.materiale ?? "mixed natural"}${cucinaNote}

FURNITURE RULES:
- New furniture must look physically placed in the room (correct perspective, proportions, shadows)
- No floating furniture — pieces must rest on the floor
- Maintain logical room function and circulation space
- Window light falls correctly on new furniture surfaces
- All new pieces must be coherent in style and era`;
}

function buildBlock_Soffitto(config: ConfigSoffitto, analisi: AnalisiStanza | null): string {
  if (!config.attivo) {
    return `[BLOCK SOFFITTO — NO CHANGE]
Ceiling: preserve EXACTLY as in original. Do not modify.`;
  }

  if (config.tipo === "travi_legno") {
    return `[BLOCK SOFFITTO — WOODEN BEAMS]
Add exposed wooden ceiling beams:
Color/tone: ${config.colore_travi ?? "natural oak"}
Beam placement: evenly spaced, structurally credible, parallel to longest wall
The existing white/colored ceiling between beams remains visible
RULE: Beams must look structurally integrated, not decorative stickers`;
  }

  return `[BLOCK SOFFITTO — REPAINT/REDESIGN]
Ceiling type: ${config.tipo ?? "piano"}
Color: ${config.colore_nome ?? ""} (${config.colore_hex ?? "#FFFFFF"})
${config.tipo === "controsoffitto_cartongesso" ? "Add plasterboard false ceiling with clean linear design, hidden LED strip perimeter possible" : ""}
CEILING RULES: Ceiling color affects room mood — paint evenly, no brush marks, correct perspective foreshortening visible from room angle`;
}

function buildBlock_Illuminazione(config: ConfigIlluminazione, analisi: AnalisiStanza | null): string {
  if (!config.attivo) {
    return `[BLOCK ILLUMINAZIONE — NO CHANGE]
Lighting: preserve as in original. Maintain same ambiance.`;
  }

  const tipoDesc: Record<string, string> = {
    faretti_incassati: "multiple recessed ceiling spotlights, evenly distributed grid",
    lampadario_centrale: "single central ceiling pendant light, proportional to room",
    led_strip_perimetrale: "LED strip lighting around ceiling perimeter, indirect glow",
    lampade_sospensione: "hanging pendant lamps above key furniture (table, island)",
    applique_parete: "wall-mounted sconces flanking key architectural elements",
    misto: "mixed lighting: central fixture + accent lighting",
  };

  const tempDesc: Record<string, string> = {
    calda_2700k: "warm 2700K light — golden, cozy, like candlelight ambiance",
    neutra_3000k: "neutral warm 3000K — balanced, welcoming, residential standard",
    freddo_4000k: "cool daylight 4000K — bright, clinical, modern office feel",
  };

  return `[BLOCK ILLUMINAZIONE — UPDATE]
New lighting: ${tipoDesc[config.tipo ?? "misto"] ?? config.tipo}
Color temperature: ${tempDesc[config.temperatura ?? "neutra_3000k"] ?? config.temperatura}
Intensity: ${config.intensita_luce ?? "normale"}

LIGHTING RULES:
- New light fixtures must be physically plausible (correct ceiling attachment, cable routing)
- Light temperature affects wall color appearance — warm light makes colors warmer
- Cast shadows from new lighting must be coherent with light source positions
- Light pools on floor/walls visible if appropriate for fixture type`;
}

function buildBlock_CartaDaParati(config: ConfigCartaDaParati, analisi: AnalisiStanza | null): string {
  if (!config.attivo) return `[BLOCK CARTA DA PARATI — NO CHANGE]\nWallpaper: not applied. Preserve existing walls.`;
  return `[BLOCK CARTA DA PARATI — APPLY]
Apply wallpaper to: ${config.applica_a ?? "parete_principale"}
Pattern/style: ${config.stile_pattern ?? "geometric modern"}
Base color: ${config.colore_base ?? ""}
${config.descrizione ? `Description: ${config.descrizione}` : ""}

WALLPAPER RULES:
- Pattern must tile/repeat consistently with correct scale
- Wallpaper must go edge-to-edge on target wall with clean boundaries at corners, ceiling and floor
- Pattern repeat must be consistent — no mis-aligned joins`;
}

function buildBlock_RivestimentoPareti(config: ConfigRivestimentoPareti): string {
  if (!config.attivo) return `[BLOCK RIVESTIMENTO PARETI — NO CHANGE]\nWall cladding: not applied. Preserve existing walls.`;

  const tipoDesc: Record<string, string> = {
    boiserie_legno: "wooden wall paneling (boiserie): horizontal/vertical planks or classic panel frames",
    mattone_vista: "exposed brick wall: natural clay brick, traditional Italian bond pattern",
    pietra_naturale: "natural stone cladding: irregular stacked stone with mortar joints",
    pannelli_3d: "3D decorative wall panels: geometric raised pattern",
    intonaco_spatolato: "textured spatula plaster: artisanal hand-applied finish with visible tool marks",
    stucco_veneziano: "Venetian stucco: polished marmorino plaster with marble-like depth and sheen",
  };

  return `[BLOCK RIVESTIMENTO PARETI — APPLY]
Apply to: ${config.applica_a ?? "parete_principale"}
Type: ${tipoDesc[config.tipo ?? "boiserie_legno"] ?? config.tipo}
Color: ${config.colore_nome ?? ""} (${config.colore_hex ?? ""})

CLADDING RULES:
- Material must show authentic physical depth and texture
- Correct perspective — material recedes with wall perspective
- Junction with ceiling and floor must be clean`;
}

function buildBlock_Tende(config: ConfigTende): string {
  if (!config.attivo) return `[BLOCK TENDE — NO CHANGE]\nCurtains: preserve existing or none.`;
  if (config.tipo === "nessuna") return `[BLOCK TENDE — REMOVE]\nRemove all curtains/blinds from windows. Show bare windows cleanly.`;
  return `[BLOCK TENDE — ADD/REPLACE]
Add curtain/blind type: ${config.tipo ?? "tende_lino"}
Color: ${config.colore_nome ?? ""} (${config.colore_hex ?? ""})

CURTAIN RULES:
- Hang from ceiling or high curtain rod — full height creates taller room feeling
- Natural drape/fold appropriate for fabric type
- Correct perspective — curtain width proportional to window width × 1.5-2×`;
}

function buildBlock_RestylingCucina(config: ConfigRestylingCucina): string {
  if (!config.attivo) return `[BLOCK CUCINA — NO CHANGE]\nKitchen: preserve EXACTLY as in original photo.`;
  return `[BLOCK CUCINA — RESTYLING]
Kitchen cabinet frontals: ${config.colore_frontali_nome ?? ""} (${config.colore_frontali_hex ?? ""})
Material: ${config.materiale_frontali ?? "laccato"} finish
Handles: ${config.maniglie ?? "metallo_nero"}
${config.colore_piano_lavoro_hex ? `Countertop: ${config.piano_lavoro_materiale ?? "quarzo"} in ${config.colore_piano_lavoro_hex}` : ""}

KITCHEN RULES:
- Replace ONLY cabinet frontals and handles — keep cabinet carcass positions
- Do not move appliances or change plumbing
- New frontals must look physically attached with correct shadow depth
- Countertop material must show correct texture and edge profile`;
}

function buildBlock_RestylingBagno(config: ConfigRestylingBagno): string {
  if (!config.attivo) return `[BLOCK BAGNO — NO CHANGE]\nBathroom: preserve EXACTLY as in original photo.`;
  return `[BLOCK BAGNO — RESTYLING]
Wall/floor tiles: ${config.colore_rivestimento_nome ?? ""} (${config.colore_rivestimento_hex ?? ""}) — ${config.tipo_rivestimento ?? "gres"}
${config.cambia_sanitari ? `Sanitaryware: replace with ${config.colore_sanitari ?? "bianco"} contemporary pieces` : "Sanitaryware: preserve existing"}
${config.cambia_rubinetteria ? `Fittings: ${config.stile_rubinetteria ?? "moderno"} style chrome/metal` : "Fittings: preserve existing"}

BATHROOM RULES:
- Tile pattern must be consistent and correctly perspective-foreshortened
- Plumbing connections remain in same positions
- New sanitaryware must fit within existing footprint`;
}

function buildBlock_Preservazione(config: ConfigurazioneStanza, analisi: AnalisiStanza | null): string {
  const preserveLines: string[] = [];
  if (!config.verniciatura.attivo) preserveLines.push("✅ Walls — preserve exactly");
  if (!config.pavimento.attivo) preserveLines.push("✅ Floor — preserve exactly");
  if (!config.arredo.attivo) preserveLines.push("✅ All furniture and objects — preserve exactly");
  if (!config.soffitto.attivo) preserveLines.push("✅ Ceiling — preserve exactly");
  if (!config.illuminazione.attivo) preserveLines.push("✅ Light fixtures — preserve exactly");
  if (!config.carta_da_parati.attivo) preserveLines.push("✅ Wall finish/paper — preserve exactly");
  if (!config.tende.attivo) preserveLines.push("✅ Curtains/blinds — preserve exactly");

  return `[BLOCK PRESERVAZIONE — CRITICAL]
The following elements must be preserved PIXEL-PERFECTLY (unchanged):
${preserveLines.join("\n")}

ALWAYS preserve regardless:
- Room geometry and architecture (walls, doorways, archways, niches, columns)
- Windows (frames, glass, external view)
- Structural elements visible in photo
- Objects on surfaces (unless arredo cambio is active)
- Room proportions and spatial layout
- Output image pixel dimensions = input image dimensions`;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getInterventiAttivi(config: ConfigurazioneStanza): string[] {
  return [
    config.verniciatura.attivo && "verniciatura_pareti",
    config.pavimento.attivo && "nuovo_pavimento",
    config.arredo.attivo && "cambio_arredo",
    config.soffitto.attivo && "nuovo_soffitto",
    config.illuminazione.attivo && "nuova_illuminazione",
    config.carta_da_parati.attivo && "carta_da_parati",
    config.rivestimento_pareti.attivo && "rivestimento_pareti",
    config.tende.attivo && "cambio_tende",
    config.restyling_cucina.attivo && "restyling_cucina",
    config.restyling_bagno.attivo && "restyling_bagno",
  ].filter(Boolean) as string[];
}

// ─── System prompt ────────────────────────────────────────────────────────────

export const ROOM_SYSTEM_PROMPT = `You are an expert architectural visualization AI specialized in interior design transformation of room photographs.

CORE MISSION: Transform room photographs by applying specified interior design interventions with absolute photorealism. The result must be indistinguishable from a real interior design photograph.

FUNDAMENTAL RULES:
RULE 1 — SURGICAL PRECISION: Apply ONLY the listed interventions. Everything not listed must be preserved exactly.
RULE 2 — PHOTOREALISM: Every changed element must look like it was always there — no compositing seams, no floating objects.
RULE 3 — STYLE COHERENCE: All active interventions must work together as a unified interior design concept.
RULE 4 — PERSPECTIVE INTEGRITY: All new elements follow the exact same vanishing points and perspective as the original photo.
RULE 5 — LIGHTING CONSISTENCY: New materials and surfaces respond to the existing room lighting direction and quality.
RULE 6 — MATERIAL AUTHENTICITY: Every material (wood, stone, fabric, paint) must display authentic physical properties.
RULE 7 — ARCHITECTURAL RESPECT: Never remove or alter structural elements (windows, doors, walls, columns) unless explicitly instructed.
RULE 8 — COLOR ACCURACY: Paint colors, material colors must match the specified hex codes under the room's existing lighting.
RULE 9 — SCALE REALISM: Furniture, tiles, and all objects must be architecturally scaled correctly.
RULE 10 — OUTPUT DIMENSIONS: Output image must have exactly the same pixel dimensions as the input photo.
RULE 11 — NO HALLUCINATION: Never add elements not specified (no plants, no decorative objects, no extra furniture).
RULE 12 — SHADOW PHYSICS: Cast shadows from furniture and light sources must be physically correct on all new surfaces.`.trim();

export const ROOM_QUALITY_SUFFIX = `

FINAL QUALITY REQUIREMENTS:
✅ Every active intervention applied with photorealistic quality
✅ All non-modified elements preserved pixel-perfectly
✅ Unified interior design style coherence across all changes
✅ Correct perspective on all new surfaces and objects
✅ Material textures authentic and physically accurate
✅ Color accuracy matches specifications under room lighting
✅ Lighting is consistent — shadows, reflections, light pools are physically correct
✅ No visible compositing edges or AI artifacts
✅ Output dimensions identical to input image
✅ Room feels like a real, livable, professionally designed space`.trim();

// ─── Main builder ──────────────────────────────────────────────────────────────

export function buildStanzaPrompt(
  analisi: AnalisiStanza | null,
  config: ConfigurazioneStanza
): { userPrompt: string; systemPrompt: string } {
  const attivi = getInterventiAttivi(config);

  if (attivi.length === 0) {
    return {
      userPrompt: "No interventions selected. Please select at least one element to change.",
      systemPrompt: ROOM_SYSTEM_PROMPT,
    };
  }

  const blocks = [
    buildBlock_Intro(config, analisi),
    buildBlock_Pareti(config.verniciatura, analisi),
    buildBlock_Pavimento(config.pavimento, analisi),
    buildBlock_Arredo(config.arredo, analisi, config.tipo_stanza),
    buildBlock_Soffitto(config.soffitto, analisi),
    buildBlock_Illuminazione(config.illuminazione, analisi),
    buildBlock_CartaDaParati(config.carta_da_parati, analisi),
    buildBlock_RivestimentoPareti(config.rivestimento_pareti),
    buildBlock_Tende(config.tende),
    buildBlock_RestylingCucina(config.restyling_cucina),
    buildBlock_RestylingBagno(config.restyling_bagno),
    buildBlock_Preservazione(config, analisi),
  ];

  // Contesto stanza attuale
  if (analisi) {
    blocks.push(`[BLOCK CONTESTO ATTUALE]
Current room type: ${analisi.tipo_stanza ?? "residential"}
Current style: ${analisi.stile_attuale ?? "mixed"}
Current wall color: ${analisi.pareti?.colore_principale ?? "unknown"} (${analisi.pareti?.colore_hex ?? ""})
Current floor: ${analisi.pavimento?.tipo ?? "unknown"} — ${analisi.pavimento?.colore ?? ""}
Current ceiling height: ${analisi.soffitto?.altezza_stimata ?? "standard"}
Room lighting: ${analisi.illuminazione?.luminosita_ambiente ?? "medium"}
Furniture density: ${analisi.arredo?.densita ?? "medium"}
Special features: ${JSON.stringify(analisi.caratteristiche_speciali ?? {})}
AI notes: ${analisi.note_speciali ?? "none"}`);
  }

  if (config.note_aggiuntive) {
    blocks.push(`[BLOCK NOTE PERSONALIZZATE]\n${config.note_aggiuntive}`);
  }

  return {
    userPrompt: blocks.join("\n\n") + "\n\n" + ROOM_QUALITY_SUFFIX,
    systemPrompt: ROOM_SYSTEM_PROMPT,
  };
}

// ─── Stili pronti fallback ────────────────────────────────────────────────────

export const STANZA_STILI_PRONTI_FALLBACK: {
  nome: string;
  desc: string;
  emoji: string;
  preview_hex: string;
  stile: StileArredo;
  config: Partial<ConfigurazioneStanza>;
}[] = [
  {
    nome: "Scandinavo bianco",
    desc: "Pareti bianco calce, parquet rovere chiaro, arredo nordico — luminoso e pulito",
    emoji: "🤍", preview_hex: "#F2EDE4", stile: "scandinavo",
    config: {
      intensita: "medio", stile_target: "scandinavo",
      verniciatura: { attivo: true, colore_hex: "#F2EDE4", colore_nome: "Bianco calce", finitura: "opaco", applica_a: "tutte" },
      pavimento: { attivo: true, tipo: "parquet", colore_hex: "#D4B896", colore_nome: "Rovere chiaro", pattern: "a_correre", finitura: "opaco" },
      arredo: { attivo: true, stile: "scandinavo", colore_principale_hex: "#F8F8F8", colore_principale_nome: "Bianco/legno", materiale: "legno_naturale", intensita_cambio: "stile_mantenendo_layout" },
      soffitto: { attivo: false }, illuminazione: { attivo: false },
      carta_da_parati: { attivo: false }, rivestimento_pareti: { attivo: false },
      tende: { attivo: true, tipo: "tende_lino", colore_hex: "#EDE8DC", colore_nome: "Lino naturale" },
      restyling_cucina: { attivo: false }, restyling_bagno: { attivo: false },
    },
  },
  {
    nome: "Industriale scuro",
    desc: "Pareti grigio carbone, mattone a vista, pavimento cemento, arredo industrial",
    emoji: "🏭", preview_hex: "#454548", stile: "industriale",
    config: {
      intensita: "radicale", stile_target: "industriale",
      verniciatura: { attivo: true, colore_hex: "#454548", colore_nome: "Grigio carbone", finitura: "opaco", applica_a: "parete_principale" },
      pavimento: { attivo: true, tipo: "cemento_resina", colore_hex: "#9E9E9E", colore_nome: "Cemento grigio", pattern: "rettilineo_dritto", finitura: "opaco" },
      arredo: { attivo: true, stile: "industriale", colore_principale_hex: "#1A1A1A", colore_principale_nome: "Nero/metallo", materiale: "metallo", intensita_cambio: "stile_mantenendo_layout" },
      rivestimento_pareti: { attivo: true, tipo: "mattone_vista", colore_hex: "#8B4040", colore_nome: "Mattone rosso", applica_a: "parete_principale" },
      illuminazione: { attivo: true, tipo: "lampade_sospensione", temperatura: "calda_2700k", intensita_luce: "soffusa" },
      soffitto: { attivo: false }, carta_da_parati: { attivo: false },
      tende: { attivo: false }, restyling_cucina: { attivo: false }, restyling_bagno: { attivo: false },
    },
  },
  {
    nome: "Verde salvia + parquet",
    desc: "Parete accento verde salvia, parquet spina di pesce, tende lino — tendenza 2025",
    emoji: "🌿", preview_hex: "#8A9E7E", stile: "moderno",
    config: {
      intensita: "medio", stile_target: "moderno",
      verniciatura: { attivo: true, colore_hex: "#F2EDE4", colore_nome: "Bianco calce", finitura: "opaco", applica_a: "parete_accento", colore_accento_hex: "#8A9E7E", colore_accento_nome: "Verde salvia" },
      pavimento: { attivo: true, tipo: "parquet", colore_hex: "#C8913A", colore_nome: "Rovere miele", pattern: "spina_di_pesce", finitura: "opaco" },
      arredo: { attivo: false },
      tende: { attivo: true, tipo: "tende_lino", colore_hex: "#EDE8DC", colore_nome: "Lino naturale" },
      soffitto: { attivo: false }, illuminazione: { attivo: false },
      carta_da_parati: { attivo: false }, rivestimento_pareti: { attivo: false },
      restyling_cucina: { attivo: false }, restyling_bagno: { attivo: false },
    },
  },
  {
    nome: "Lusso marmo e velluto",
    desc: "Pareti blu navy, pavimento marmo bianco, arredo luxe con velluto — opulento",
    emoji: "💎", preview_hex: "#1B2A4A", stile: "luxe_contemporaneo",
    config: {
      intensita: "radicale", stile_target: "luxe_contemporaneo",
      verniciatura: { attivo: true, colore_hex: "#1B2A4A", colore_nome: "Blu navy", finitura: "opaco", applica_a: "tutte" },
      pavimento: { attivo: true, tipo: "marmo", colore_hex: "#F5F2EE", colore_nome: "Bianco Carrara", pattern: "rettilineo_dritto", finitura: "lucido", dimensione: "120x120" },
      arredo: { attivo: true, stile: "luxe_contemporaneo", colore_principale_hex: "#1B3A6B", colore_principale_nome: "Velluto blu", materiale: "velluto", intensita_cambio: "arredo_completo" },
      illuminazione: { attivo: true, tipo: "lampade_sospensione", temperatura: "calda_2700k", intensita_luce: "soffusa" },
      soffitto: { attivo: false }, carta_da_parati: { attivo: false },
      rivestimento_pareti: { attivo: false }, tende: { attivo: false },
      restyling_cucina: { attivo: false }, restyling_bagno: { attivo: false },
    },
  },
  {
    nome: "Caldo terracotta",
    desc: "Tinte terracotta, pavimento cotto, boiserie legno — calore mediterraneo",
    emoji: "🏺", preview_hex: "#C0613A", stile: "mediterraneo",
    config: {
      intensita: "medio", stile_target: "mediterraneo",
      verniciatura: { attivo: true, colore_hex: "#D4876A", colore_nome: "Terracotta soft", finitura: "opaco", applica_a: "tutte" },
      pavimento: { attivo: true, tipo: "cotto", colore_hex: "#C1693A", colore_nome: "Terracotta", pattern: "opus_incertum", finitura: "anticato", dimensione: "30x30" },
      rivestimento_pareti: { attivo: true, tipo: "boiserie_legno", colore_hex: "#C8913A", colore_nome: "Legno naturale", applica_a: "zoccolino" },
      arredo: { attivo: false }, soffitto: { attivo: false }, illuminazione: { attivo: false },
      carta_da_parati: { attivo: false }, tende: { attivo: false },
      restyling_cucina: { attivo: false }, restyling_bagno: { attivo: false },
    },
  },
  {
    nome: "Minimalista bianco totale",
    desc: "Tutto bianco: pareti, soffitto, arredo essenziale — purezza assoluta",
    emoji: "⬜", preview_hex: "#FFFFFF", stile: "minimalista",
    config: {
      intensita: "radicale", stile_target: "minimalista",
      verniciatura: { attivo: true, colore_hex: "#FFFFFF", colore_nome: "Bianco puro", finitura: "opaco", applica_a: "tutte" },
      soffitto: { attivo: true, colore_hex: "#FFFFFF", colore_nome: "Bianco puro", tipo: "piano" },
      pavimento: { attivo: true, tipo: "gres_porcellanato", colore_hex: "#F0F0F0", colore_nome: "Grigio chiaro", pattern: "rettilineo_dritto", finitura: "opaco", dimensione: "120x120" },
      arredo: { attivo: true, stile: "minimalista", colore_principale_hex: "#F8F8F8", colore_principale_nome: "Bianco/legno chiaro", materiale: "legno_chiaro", intensita_cambio: "arredo_completo" },
      illuminazione: { attivo: true, tipo: "faretti_incassati", temperatura: "neutra_3000k", intensita_luce: "normale" },
      carta_da_parati: { attivo: false }, rivestimento_pareti: { attivo: false },
      tende: { attivo: false }, restyling_cucina: { attivo: false }, restyling_bagno: { attivo: false },
    },
  },
  {
    nome: "Japandi naturale",
    desc: "Pareti avorio, travi legno, arredo Japandi, tende lino — zen e caldo",
    emoji: "🎋", preview_hex: "#F5EDD6", stile: "giapponese",
    config: {
      intensita: "medio", stile_target: "giapponese",
      verniciatura: { attivo: true, colore_hex: "#F5EDD6", colore_nome: "Avorio caldo", finitura: "opaco", applica_a: "tutte" },
      soffitto: { attivo: true, tipo: "travi_legno", colore_travi: "larice naturale", colore_hex: "#C8A870" },
      pavimento: { attivo: true, tipo: "parquet", colore_hex: "#C8913A", colore_nome: "Rovere medio", pattern: "rettilineo_dritto", finitura: "spazzolato" },
      arredo: { attivo: true, stile: "giapponese", colore_principale_hex: "#C8913A", colore_principale_nome: "Legno naturale", materiale: "legno_bambu", intensita_cambio: "stile_mantenendo_layout" },
      tende: { attivo: true, tipo: "tende_lino", colore_hex: "#EDE8DC", colore_nome: "Lino naturale" },
      carta_da_parati: { attivo: false }, rivestimento_pareti: { attivo: false },
      illuminazione: { attivo: false }, restyling_cucina: { attivo: false }, restyling_bagno: { attivo: false },
    },
  },
  {
    nome: "Pareti verde bottiglia",
    desc: "Solo pareti verde bottiglia scuro, resto invariato — intervento minimo ad alto impatto",
    emoji: "🌲", preview_hex: "#2D4A38", stile: "moderno",
    config: {
      intensita: "leggero", stile_target: "moderno",
      verniciatura: { attivo: true, colore_hex: "#2D4A38", colore_nome: "Verde bottiglia", finitura: "opaco", applica_a: "tutte" },
      pavimento: { attivo: false }, arredo: { attivo: false }, soffitto: { attivo: false },
      illuminazione: { attivo: false }, carta_da_parati: { attivo: false },
      rivestimento_pareti: { attivo: false }, tende: { attivo: false },
      restyling_cucina: { attivo: false }, restyling_bagno: { attivo: false },
    },
  },
];
