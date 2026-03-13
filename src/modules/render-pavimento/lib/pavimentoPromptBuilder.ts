// ═══════════════════════════════════════════════════════════
// Render Pavimento — Prompt Builder v1.0
// ═══════════════════════════════════════════════════════════

export type TipoOperazione = "sostituisci" | "aggiungi" | "cambia_colore";

export type TipoPavimento =
  | "parquet" | "laminato" | "ceramica" | "gres_porcellanato"
  | "marmo" | "pietra_naturale" | "vinile_lvt" | "cotto"
  | "cemento_resina" | "moquette";

export type Sottotipo = string;

export type PatternPosa =
  | "rettilineo_dritto" | "a_correre" | "spina_di_pesce" | "spina_ungherese"
  | "diagonale_45" | "cassero_irregolare" | "opus_romanum" | "opus_incertum"
  | "doppia_fila" | "modulare" | "esagonale";

export type Finitura =
  | "lucido" | "opaco" | "satinato" | "spazzolato" | "boccardato"
  | "anticato" | "levigato" | "naturale";

export type ColoreMode = "palette" | "ral" | "legno" | "libero";

export interface PavimentoColore {
  mode: ColoreMode;
  code?: string;
  name?: string;
  hex?: string;
  ral_code?: string;
  wood_id?: string;
  wood_name?: string;
  free_text?: string;
}

export interface PavimentoConfig {
  tipo_operazione: TipoOperazione;
  tipo_pavimento: TipoPavimento;
  sottotipo?: Sottotipo;
  finitura: Finitura;
  pattern_posa: PatternPosa;
  colore: PavimentoColore;
  dimensione_piastrella?: string;
  larghezza_listello_mm?: number;
  lunghezza_listello_mm?: number;
  larghezza_fuga_mm?: number;
  colore_fuga?: string;
}

export interface AnalysisData {
  tipo_pavimento_rilevato?: string;
  pattern_rilevato?: string;
  finitura_rilevata?: string;
  stato_pavimento?: string;
  colore_approssimativo?: { hex?: string; name?: string };
  tipo_stanza?: string;
  dimensione_stimata_mm?: string;
  larghezza_fuga_stimata_mm?: number;
  luminosita?: string;
  note_ai?: string;
}

// ── Prompt dictionaries ──────────────────────────────────

const TIPO_PAVIMENTO_PROMPTS: Record<TipoPavimento, string> = {
  parquet: "solid or engineered hardwood parquet flooring with visible wood grain",
  laminato: "high-definition laminate flooring with realistic wood-effect surface",
  ceramica: "glazed ceramic tile flooring with uniform smooth surface",
  gres_porcellanato: "rectified porcelain stoneware tile flooring, technical grade",
  marmo: "natural marble slab flooring with distinctive veining patterns",
  pietra_naturale: "natural stone flooring (slate, basalt, travertine or similar)",
  vinile_lvt: "luxury vinyl tile (LVT) flooring, waterproof plank format",
  cotto: "handmade terracotta tile flooring, traditional Mediterranean style",
  cemento_resina: "seamless microcement or resin-coated continuous flooring",
  moquette: "wall-to-wall carpet flooring, textile surface",
};

const PATTERN_POSA_PROMPTS: Record<PatternPosa, string> = {
  rettilineo_dritto: "straight linear grid pattern with aligned joints",
  a_correre: "running bond / staggered brick-like pattern",
  spina_di_pesce: "herringbone pattern at 90° angle",
  spina_ungherese: "Hungarian herringbone (chevron) pattern at 45°",
  diagonale_45: "diagonal 45° rotated grid pattern",
  cassero_irregolare: "irregular staggered pattern with random offsets",
  opus_romanum: "Roman opus pattern with mixed rectangular sizes",
  opus_incertum: "opus incertum with irregular organic stone shapes",
  doppia_fila: "double-row parallel pattern",
  modulare: "modular pattern combining multiple tile sizes",
  esagonale: "hexagonal tile pattern",
};

const FINITURA_PROMPTS: Record<Finitura, string> = {
  lucido: "high-gloss polished mirror-like finish",
  opaco: "matte non-reflective finish",
  satinato: "satin semi-gloss finish with soft sheen",
  spazzolato: "brushed textured finish with visible linear strokes",
  boccardato: "bush-hammered rough anti-slip surface",
  anticato: "antiqued aged patina finish",
  levigato: "honed smooth finish, no gloss",
  naturale: "natural unfinished surface, raw material texture",
};

const COLORE_FUGA_PROMPTS: Record<string, string> = {
  bianco: "white grout",
  grigio_ch: "light grey grout",
  grigio_sc: "dark grey grout",
  nero: "black grout",
  beige: "beige/cream grout",
  cementite: "natural cement-colored grout",
};

// ── Build prompt ──────────────────────────────────────────

export function buildPavimentoPrompt(config: PavimentoConfig, analysis?: AnalysisData): { systemPrompt: string; userPrompt: string } {
  const tipoPav = TIPO_PAVIMENTO_PROMPTS[config.tipo_pavimento] ?? config.tipo_pavimento;
  const pattern = PATTERN_POSA_PROMPTS[config.pattern_posa] ?? config.pattern_posa;
  const finitura = FINITURA_PROMPTS[config.finitura] ?? config.finitura;

  // Color description
  let coloreDesc = "";
  if (config.colore.mode === "ral" && config.colore.ral_code) {
    coloreDesc = `RAL ${config.colore.ral_code} (${config.colore.name ?? ""}) color`;
  } else if (config.colore.mode === "legno" && config.colore.wood_name) {
    coloreDesc = `${config.colore.wood_name} wood-effect finish`;
  } else if (config.colore.mode === "libero" && config.colore.free_text) {
    coloreDesc = config.colore.free_text;
  } else if (config.colore.name) {
    coloreDesc = `${config.colore.name} color`;
  }

  // Dimensions
  let dimensionsDesc = "";
  if (config.dimensione_piastrella) {
    dimensionsDesc = `, tile format ${config.dimensione_piastrella}cm`;
  } else if (config.larghezza_listello_mm && config.lunghezza_listello_mm) {
    dimensionsDesc = `, plank size ${config.larghezza_listello_mm}mm × ${config.lunghezza_listello_mm}mm`;
  }

  // Grout
  let groutDesc = "";
  if (config.larghezza_fuga_mm && config.larghezza_fuga_mm > 0) {
    const groutColor = config.colore_fuga ? (COLORE_FUGA_PROMPTS[config.colore_fuga] ?? config.colore_fuga) : "matching grout";
    groutDesc = ` with ${config.larghezza_fuga_mm}mm ${groutColor} joints`;
  }

  // Analysis context
  let analysisContext = "";
  if (analysis) {
    analysisContext = `\nCurrent floor analysis: ${analysis.tipo_pavimento_rilevato ?? "unknown"} flooring, ${analysis.pattern_rilevato ?? "unknown"} pattern, ${analysis.stato_pavimento ?? "unknown"} condition.`;
    if (analysis.tipo_stanza) analysisContext += ` Room type: ${analysis.tipo_stanza}.`;
    if (analysis.luminosita) analysisContext += ` Lighting: ${analysis.luminosita}.`;
  }

  const operationVerb = config.tipo_operazione === "sostituisci"
    ? "Replace the existing floor entirely"
    : config.tipo_operazione === "cambia_colore"
      ? "Change only the color/finish of the existing floor"
      : "Add new flooring where none exists";

  const systemPrompt = `You are a photorealistic floor rendering AI. You receive a photo of an interior room and must surgically modify ONLY the floor surface.

CRITICAL RULES:
1. PRESERVE everything that is NOT the floor: walls, ceiling, furniture, doors, windows, baseboards, lighting, shadows, reflections
2. The new floor must match the room's perspective, lighting and shadow direction perfectly
3. Maintain exact same camera angle and lens distortion
4. Grout lines (if applicable) must follow the room's vanishing points
5. Floor reflections must match the room's light sources
6. Furniture legs must appear to rest naturally on the new surface
7. Baseboards/skirting boards must remain untouched
8. Shadow intensity and direction must be consistent with existing light sources`;

  const userPrompt = `${operationVerb} with:
- Material: ${tipoPav}${config.sottotipo ? ` (${config.sottotipo})` : ""}
- Laying pattern: ${pattern}
- Finish: ${finitura}
- Color: ${coloreDesc}${dimensionsDesc}${groutDesc}
${analysisContext}

Generate a photorealistic result maintaining the room's exact geometry, lighting and furnishings.`;

  return { systemPrompt, userPrompt };
}
