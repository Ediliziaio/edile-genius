// ═══════════════════════════════════════════════════════════════════
// PROMPT MASTER — Sistema a Blocchi (A–L) per Sostituzione Strutturale Infissi
// Versione: 2.0.0
// ═══════════════════════════════════════════════════════════════════

// ─── Type Enums ───────────────────────────────────────────────────

export type TipoApertura =
  | "battente_1_anta"
  | "battente_2_ante"
  | "battente_3_ante"
  | "scorrevole"
  | "scorrevole_alzante"
  | "vasistas"
  | "anta_ribalta"
  | "bilico"
  | "fisso"
  | "portafinestra"
  | "cassonetto_integrato";

export type MaterialeAttuale =
  | "legno_vecchio"
  | "legno_verniciato"
  | "alluminio_anodizzato"
  | "alluminio_verniciato"
  | "pvc_bianco"
  | "pvc_colorato"
  | "ferro"
  | "acciaio"
  | "sconosciuto";

export type MaterialeNuovo =
  | "pvc"
  | "alluminio"
  | "legno"
  | "legno_alluminio"
  | "acciaio_corten"
  | "acciaio_minimale";

export type StileEdificio =
  | "moderno"
  | "classico"
  | "industriale"
  | "rurale"
  | "liberty"
  | "anni_60_70"
  | "contemporaneo"
  | "storico";

export type ProfiloTelaioSize = "70mm" | "82mm" | "92mm";
export type ProfiloForma = "squadrato" | "arrotondato" | "europeo";
export type ManigliaType = "leva_alluminio" | "leva_acciaio" | "pomolo" | "alzante";
export type ColoreFerratura = "argento" | "nero_opaco" | "inox" | "bronzo" | "oro";

// ─── Interfaces ───────────────────────────────────────────────────

export interface FotoAnalisi {
  tipo_apertura: TipoApertura;
  materiale_attuale: MaterialeAttuale;
  colore_attuale: string;
  condizioni: "buone" | "usurato" | "danneggiato" | "fatiscente";
  num_ante_attuale: number;
  spessore_telaio: string;
  presenza_cassonetto: boolean;
  tipo_cassonetto: string;
  tipo_vetro_attuale: string;
  stile_edificio: StileEdificio;
  materiale_muro: string;
  colore_muro: string;
  presenza_davanzale: boolean;
  presenza_inferriata: boolean;
  piano: string;
  luce: string;
  angolo_ripresa: string;
  note_aggiuntive?: string;
}

export interface ColoreConfig {
  nome: string;
  ral?: string;
  ncs?: string;
  hex?: string;
  finitura: "liscio_opaco" | "liscio_lucido" | "venatura_legno" | "spazzolato" | "satinato" | "goffrato";
}

export interface ProfiloTelaio {
  dimensione: ProfiloTelaioSize;
  camere: number;
  forma: ProfiloForma;
}

export interface VetroConfig {
  tipo: string;
  prompt_fragment?: string;
}

export interface OscuranteConfig {
  tipo: string;
  prompt_fragment?: string;
}

export interface FerramentaConfig {
  maniglia: ManigliaType;
  colore: ColoreFerratura;
}

export interface CassonettoConfig {
  azione: "mantieni" | "rimuovi" | "integra";
}

export interface NuovoInfisso {
  materiale: MaterialeNuovo;
  colore: ColoreConfig;
  profilo: ProfiloTelaio;
  vetro: VetroConfig;
  oscurante?: OscuranteConfig;
  ferramenta: FerramentaConfig;
  cassonetto?: CassonettoConfig;
  num_ante?: number;
}

export interface RenderOptions {
  notes?: string;
}

export interface RenderConfigV2 {
  foto_analisi: FotoAnalisi;
  nuovo_infisso: NuovoInfisso;
  options?: RenderOptions;
}

// Legacy interface kept for backward compat
export interface RenderConfig {
  materiale?: string;
  colore?: string;
  stile?: string;
  vetro?: string;
  oscurante?: string;
  ante?: number;
  note?: string;
  fragments: {
    materiale?: string;
    colore?: string;
    stile?: string;
    vetro?: string;
    oscurante?: string;
  };
}

// ─── Material Physics Dictionary ──────────────────────────────────

const MATERIAL_PHYSICS: Record<MaterialeNuovo, string> = {
  pvc: "white or colored PVC (polyvinyl chloride) with smooth matte surface, visible internal chamber structure at edges, welded corners with subtle seam lines, slight plastic sheen under direct light, uniform color without grain, rounded or sharp profile edges depending on system",
  alluminio: "extruded aluminum with anodized or powder-coated finish, sharp precise edges, visible thermal break strips (dark polyamide) between inner and outer shells, metallic surface with subtle directional brushing marks, thin elegant profile (typically 50-65mm visible width), matte or semi-gloss finish",
  legno: "solid wood frame with visible natural grain pattern, slightly rounded edges from milling, paint or stain finish showing subtle wood texture beneath, traditional mortise-and-tenon corner joints, warm organic appearance, thicker profile (68-92mm), possible hairline cracks in painted surfaces",
  legno_alluminio: "hybrid frame: interior shows solid wood with natural grain and warm finish, exterior shows slim aluminum cladding with powder-coated color, visible transition line where wood meets aluminum at the edge, combines warmth of wood inside with weather-resistant aluminum outside",
  acciaio_corten: "Corten weathering steel frame with characteristic rust-orange patina, rough oxidized surface texture, ultra-thin profiles (25-35mm sight lines), dark brown-orange color with natural variation, industrial aesthetic",
  acciaio_minimale: "minimal steel frame with extremely thin sight lines (15-25mm), black or dark gray powder-coated surface, precise geometric edges, virtually invisible frame creating a nearly frameless glass appearance, modern industrial look",
};

// ─── Apertura Descriptions ────────────────────────────────────────

const APERTURA_DESCRIPTION: Record<TipoApertura, string> = {
  battente_1_anta: "single-leaf casement window that opens inward on side hinges, with visible handle on the opening side",
  battente_2_ante: "double-leaf casement window with two opening panels meeting at center, both with handles, typically with a central mullion",
  battente_3_ante: "triple-leaf casement window with three panels, typically center fixed and sides opening",
  scorrevole: "horizontal sliding window with one or more panels sliding on tracks, visible rail at top and bottom",
  scorrevole_alzante: "lift-and-slide door/window with large glass panels that lift slightly then slide horizontally, heavy-duty hardware",
  vasistas: "top-hinged window that tilts inward from the bottom, with a handle at the bottom rail",
  anta_ribalta: "tilt-and-turn window that can both swing inward like a door and tilt inward from the top, with a multi-position handle",
  bilico: "pivot window rotating on a central horizontal axis, the top swings inward while the bottom swings outward",
  fisso: "fixed non-opening window with no handles or hinges, glass held firmly in the frame",
  portafinestra: "full-height French door/balcony door reaching from floor to near ceiling, with handle and typically a low threshold",
  cassonetto_integrato: "window with integrated roller shutter box (cassonetto) visible above the frame, housing a roll-up shutter",
};

// ─── Material Distinction ─────────────────────────────────────────

export function getMaterialDistinction(
  oldMat: MaterialeAttuale,
  newMat: MaterialeNuovo
): string {
  const oldDesc: Record<string, string> = {
    legno_vecchio: "aged unpainted or faded wood with visible weathering, cracks and grain",
    legno_verniciato: "painted wood with possible peeling or chipping paint",
    alluminio_anodizzato: "old anodized aluminum with dull silver or bronze tone",
    alluminio_verniciato: "painted aluminum with possible fading or chalking",
    pvc_bianco: "white PVC that may be yellowed or stained from UV exposure",
    pvc_colorato: "colored PVC with possible fading",
    ferro: "old iron frame with possible rust, heavy thick profile",
    acciaio: "steel frame, possibly with paint wear",
    sconosciuto: "existing frame material",
  };

  return `Remove the existing ${oldDesc[oldMat] || "old frame"} completely. Replace it with a brand new ${MATERIAL_PHYSICS[newMat]}. The material change should be clearly visible — this is a full structural replacement, not a repaint or overlay.`;
}

// ─── Block Builders (A–L) ─────────────────────────────────────────

function buildBlock_A(): string {
  return `[BLOCK A – ROLE & MISSION]
You are an expert architectural visualization AI specializing in photorealistic window and door replacement. Your mission is to perform a COMPLETE STRUCTURAL REPLACEMENT of the existing windows/doors in the photograph — not a simple color overlay or filter. You must remove the old frame entirely and render a new frame with different material physics, profile geometry, and surface properties. The result must be indistinguishable from a real professional photograph.`;
}

function buildBlock_B(analisi: FotoAnalisi): string {
  return `[BLOCK B – PHOTO ANALYSIS]
Current window analysis:
- Opening type: ${APERTURA_DESCRIPTION[analisi.tipo_apertura] || analisi.tipo_apertura}
- Current material: ${analisi.materiale_attuale}
- Current color: ${analisi.colore_attuale}
- Condition: ${analisi.condizioni}
- Number of panels: ${analisi.num_ante_attuale}
- Frame thickness: ${analisi.spessore_telaio}
- Roller shutter box present: ${analisi.presenza_cassonetto ? "yes — " + analisi.tipo_cassonetto : "no"}
- Current glass type: ${analisi.tipo_vetro_attuale}
- Building style: ${analisi.stile_edificio}
- Wall material: ${analisi.materiale_muro}
- Wall color: ${analisi.colore_muro}
- Window sill present: ${analisi.presenza_davanzale ? "yes" : "no"}
- Security bars present: ${analisi.presenza_inferriata ? "yes" : "no"}
- Floor level: ${analisi.piano}
- Lighting: ${analisi.luce}
- Camera angle: ${analisi.angolo_ripresa}`;
}

function buildBlock_C(analisi: FotoAnalisi, infisso: NuovoInfisso): string {
  return `[BLOCK C – STRUCTURAL REPLACEMENT]
${getMaterialDistinction(analisi.materiale_attuale, infisso.materiale)}`;
}

function buildBlock_D(infisso: NuovoInfisso): string {
  const mat = MATERIAL_PHYSICS[infisso.materiale];
  const col = infisso.colore;
  let colorDesc = col.nome;
  if (col.ral) colorDesc += ` (RAL ${col.ral})`;
  if (col.ncs) colorDesc += ` (NCS ${col.ncs})`;

  const finituraMap: Record<string, string> = {
    liscio_opaco: "smooth matte finish with no visible sheen",
    liscio_lucido: "smooth glossy finish with visible reflections",
    venatura_legno: "wood-grain textured surface (foil or laminated)",
    spazzolato: "brushed metallic finish with directional micro-lines",
    satinato: "satin finish with soft, diffused light reflection",
    goffrato: "embossed/textured surface with tactile micro-pattern",
  };

  return `[BLOCK D – NEW FRAME MATERIAL & COLOR]
Material: ${mat}
Color: ${colorDesc}
Surface finish: ${finituraMap[col.finitura] || col.finitura}`;
}

function buildBlock_E(infisso: NuovoInfisso): string {
  const p = infisso.profilo;
  const sizeDesc: Record<ProfiloTelaioSize, string> = {
    "70mm": "70mm residential profile with 3 internal chambers, standard thermal insulation",
    "82mm": "82mm premium profile with 5 internal chambers, enhanced thermal insulation (Uw ~1.0)",
    "92mm": "92mm Passivhaus-grade profile with 7 internal chambers, maximum thermal insulation (Uw ~0.7)",
  };
  const formaDesc: Record<ProfiloForma, string> = {
    squadrato: "squared/angular edges with sharp 90° corners",
    arrotondato: "softly rounded edges with radius corners",
    europeo: "classic European profile with slight bevel and gentle curves",
  };

  return `[BLOCK E – FRAME PROFILE GEOMETRY]
Profile: ${sizeDesc[p.dimensione]}
Shape: ${formaDesc[p.forma]}
${infisso.num_ante ? `Number of panels: ${infisso.num_ante}` : ""}`;
}

function buildBlock_F(infisso: NuovoInfisso): string {
  const v = infisso.vetro;
  return `[BLOCK F – GLASS TYPE]
${v.prompt_fragment || v.tipo}
The glass must show realistic reflections consistent with the scene lighting, slight greenish tint on edges typical of multi-pane glass, and proper transparency showing interior darkness or curtains.`;
}

function buildBlock_G(infisso: NuovoInfisso): string {
  if (!infisso.oscurante || infisso.oscurante.tipo === "nessuno") {
    return `[BLOCK G – SHUTTERS/BLINDS]
No external shutters or blinds. Clean window frame only.`;
  }
  return `[BLOCK G – SHUTTERS/BLINDS]
${infisso.oscurante.prompt_fragment || infisso.oscurante.tipo}`;
}

function buildBlock_H(infisso: NuovoInfisso): string {
  const f = infisso.ferramenta;
  const manigliaDesc: Record<ManigliaType, string> = {
    leva_alluminio: "aluminum lever handle with clean modern lines",
    leva_acciaio: "stainless steel lever handle with premium feel",
    pomolo: "round knob handle (pomolo), compact profile",
    alzante: "lift-and-slide handle with ergonomic grip for heavy panels",
  };
  const coloreDesc: Record<ColoreFerratura, string> = {
    argento: "silver/chrome finish",
    nero_opaco: "matte black finish",
    inox: "brushed stainless steel finish",
    bronzo: "antique bronze finish",
    oro: "polished gold/brass finish",
  };

  return `[BLOCK H – HARDWARE & HANDLES]
Handle type: ${manigliaDesc[f.maniglia]}
Handle color: ${coloreDesc[f.colore]}
Hinges should be barely visible, matching the handle color. Show realistic hardware shadows.`;
}

function buildBlock_I(analisi: FotoAnalisi, infisso: NuovoInfisso): string {
  const c = infisso.cassonetto;
  if (!c || c.azione === "mantieni") {
    return `[BLOCK I – ROLLER SHUTTER BOX]
${analisi.presenza_cassonetto ? "Keep the existing roller shutter box (cassonetto) as-is, matching its current appearance." : "No roller shutter box present in the original. Do not add one."}`;
  }
  if (c.azione === "rimuovi") {
    return `[BLOCK I – ROLLER SHUTTER BOX]
Remove the existing roller shutter box completely. The wall above the window should show continuous wall surface matching the surrounding masonry.`;
  }
  return `[BLOCK I – ROLLER SHUTTER BOX]
Replace the existing roller shutter box with a modern integrated cassonetto that blends with the new frame color and material.`;
}

function buildBlock_J(analisi: FotoAnalisi): string {
  return `[BLOCK J – ENVIRONMENTAL PRESERVATION]
CRITICAL CONSTRAINTS — preserve ALL of the following exactly as in the original photo:
- Wall color (${analisi.colore_muro}), texture, and material (${analisi.materiale_muro})
- ${analisi.presenza_davanzale ? "Window sill — keep exact same shape, material, and position" : "No window sill — do not add one"}
- ${analisi.presenza_inferriata ? "Security bars/grilles — keep in place unless explicitly asked to remove" : "No security bars present"}
- Building perspective, vanishing points, and camera angle (${analisi.angolo_ripresa})
- All surrounding elements: pipes, cables, gutters, plants, adjacent windows
- Street/ground level elements
- Sky and ambient lighting (${analisi.luce})`;
}

function buildBlock_K(analisi: FotoAnalisi): string {
  return `[BLOCK K – LIGHTING & SHADOWS]
Match the exact lighting conditions:
- Light source: ${analisi.luce}
- Render correct shadows cast by the new frame profile onto the wall and sill
- Inner frame shadows showing the depth/recession of the new profile
- Glass reflections must match the scene's light direction
- Ambient occlusion in frame corners and where frame meets wall`;
}

function buildBlock_L(): string {
  return `[BLOCK L – NEGATIVE CONSTRAINTS]
DO NOT:
- Change the wall color, texture, or any part of the building facade
- Alter the camera perspective or focal length
- Add elements not present in the original (plants, decorations, people)
- Change the sky, weather, or ambient lighting
- Create cartoon, illustrated, or obviously AI-generated artifacts
- Add text, watermarks, or overlays
- Distort proportions or change window opening dimensions
- Make the image look like a 3D rendering — it must be photorealistic`;
}

// ─── Main Builder ─────────────────────────────────────────────────

export interface PromptResult {
  systemPrompt: string;
  userPrompt: string;
  negativePrompt: string;
  promptVersion: string;
  charCount: number;
  blocks: Record<string, string>;
}

export function buildRenderPromptV2(
  config: RenderConfigV2,
  _provider: string
): PromptResult {
  const { foto_analisi, nuovo_infisso, options } = config;

  const blocks: Record<string, string> = {
    A: buildBlock_A(),
    B: buildBlock_B(foto_analisi),
    C: buildBlock_C(foto_analisi, nuovo_infisso),
    D: buildBlock_D(nuovo_infisso),
    E: buildBlock_E(nuovo_infisso),
    F: buildBlock_F(nuovo_infisso),
    G: buildBlock_G(nuovo_infisso),
    H: buildBlock_H(nuovo_infisso),
    I: buildBlock_I(foto_analisi, nuovo_infisso),
    J: buildBlock_J(foto_analisi),
    K: buildBlock_K(foto_analisi),
    L: buildBlock_L(),
  };

  const systemPrompt = blocks.A;

  const userParts = [blocks.B, blocks.C, blocks.D, blocks.E, blocks.F, blocks.G, blocks.H, blocks.I, blocks.J, blocks.K, blocks.L];
  if (options?.notes) {
    userParts.push(`[ADDITIONAL NOTES]\n${options.notes}`);
  }
  const userPrompt = userParts.join("\n\n");

  const negativePrompt = "cartoon, illustration, sketch, drawing, watermark, text overlay, blurry, distorted perspective, different building, changed wall color, unrealistic lighting, 3D render look, CGI artifacts, plastic appearance, oversaturated colors";

  const fullText = systemPrompt + userPrompt;

  return {
    systemPrompt,
    userPrompt,
    negativePrompt,
    promptVersion: "2.0.0",
    charCount: fullText.length,
    blocks,
  };
}

// ─── Legacy builder (kept for backward compat) ────────────────────

export function buildRenderPrompt(config: RenderConfig, provider: string): {
  system: string;
  user: string;
  negative: string;
} {
  const parts: string[] = [];

  if (config.fragments.materiale) parts.push(config.fragments.materiale);
  if (config.fragments.colore) parts.push(config.fragments.colore);
  if (config.fragments.stile) parts.push(config.fragments.stile);
  if (config.fragments.vetro) parts.push(config.fragments.vetro);
  if (config.fragments.oscurante && config.fragments.oscurante !== "no shutters or blinds") {
    parts.push(config.fragments.oscurante);
  }
  if (config.ante && config.ante > 1) parts.push(`${config.ante}-panel window`);
  if (config.note) parts.push(config.note);

  const windowDesc = parts.join(", ");

  const system = `You are an expert architectural visualization AI. Your task is to replace the existing windows/doors in a building photograph with new ones while maintaining photorealistic quality. Keep the building structure, surroundings, lighting, and perspective exactly the same. Only replace the window/door frames and glass.`;
  const user = `Replace all visible windows in this photograph with: ${windowDesc}. Maintain exact same perspective, lighting conditions, wall texture, and surroundings. The result must look like a real photograph, not a rendering. Keep shadows consistent with the existing light direction.`;
  const negative = `cartoon, illustration, sketch, drawing, watermark, text overlay, blurry, distorted perspective, different building, changed wall color, unrealistic lighting`;

  return { system, user, negative };
}

// ─── Photo Validation (unchanged) ─────────────────────────────────

export function validatePhoto(file: File): { valid: boolean; error?: string } {
  const validTypes = ["image/jpeg", "image/png", "image/webp"];
  if (!validTypes.includes(file.type)) {
    return { valid: false, error: "Formato non supportato. Usa JPG, PNG o WebP." };
  }
  if (file.size > 20 * 1024 * 1024) {
    return { valid: false, error: "File troppo grande. Massimo 20MB." };
  }
  if (file.size < 10 * 1024) {
    return { valid: false, error: "File troppo piccolo. Carica una foto di qualità." };
  }
  return { valid: true };
}

export async function checkImageDimensions(file: File): Promise<{ width: number; height: number; valid: boolean; error?: string }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (img.width < 600 || img.height < 600) {
        resolve({ width: img.width, height: img.height, valid: false, error: `Risoluzione troppo bassa (${img.width}×${img.height}). Minimo 600×600px.` });
      } else {
        resolve({ width: img.width, height: img.height, valid: true });
      }
    };
    img.onerror = () => resolve({ width: 0, height: 0, valid: false, error: "Impossibile leggere l'immagine." });
    img.src = URL.createObjectURL(file);
  });
}
