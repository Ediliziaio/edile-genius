// ════════════════════════════════════════════════════════════════
// Render Persiane — Prompt Builder v1.1
// ════════════════════════════════════════════════════════════════

export const PERSIANE_PROMPT_VERSION = "1.1.0";

// ── Tipi ──────────────────────────────────────────────────────

export type TipoOperazione = "sostituisci" | "cambia_colore" | "aggiungi" | "rimuovi";

export type TipoPersoniana =
  | "veneziana_classica"
  | "veneziana_esterna"
  | "scuro_pieno"
  | "scuro_cornice"
  | "gelosia"
  | "avvolgibile_esterno"
  | "a_libro"
  | "griglia_sicurezza"
  | "brise_soleil";

export type MaterialePersiana =
  | "legno_naturale"
  | "legno_composito"
  | "alluminio"
  | "pvc"
  | "acciaio"
  | "fibra_vetro";

export type StatoApertura = "chiuso" | "socchiuso" | "aperto_45" | "aperto_90" | "anta_singola_aperta";

export type AperturaLamelle = "chiuse" | "parzialmente_aperte" | "completamente_aperte";

export interface AnalisiPersiana {
  presenza_persiane: boolean;
  tipo_persiana_attuale: string | null;
  materiale_attuale: string | null;
  colore_persiana: string | null;
  stato_apertura: string | null;
  numero_finestre_totali: number | null;
  numero_finestre_con_persiane: number | null;
  larghezza_lamella_stimata_mm: number | null;
  profondita_rivelazione_cm: number | null;
  presenza_cassonetto: boolean;
  stile_architettonico: string | null;
  colore_infissi: string | null;
  note_speciali: string | null;
}

export interface RalColor {
  ral: string;
  name: string;
  hex: string;
}

export interface WoodColor {
  id: string;
  name: string;
  name_en: string;
  prompt_fragment: string;
}

export interface ColorConfig {
  mode: "ral" | "legno";
  ral?: RalColor;
  wood?: WoodColor;
}

export interface ConfigurazionePersiana {
  tipo_operazione: TipoOperazione;
  tipo_persiana: TipoPersoniana;
  materiale: MaterialePersiana;
  colore: ColorConfig;
  stato_apertura: StatoApertura;
  larghezza_lamella_mm: number;
  apertura_lamelle: AperturaLamelle;
  colore_profilo?: ColorConfig;
  aggiungi_a_tutte_finestre: boolean;
  finestre_target?: string;
  note_aggiuntive?: string;
  original_image_width?: number;
  original_image_height?: number;
}

// ── Prompt dictionaries ──────────────────────────────────────

const TIPO_PERSIANA_PROMPTS: Record<TipoPersoniana, string> = {
  veneziana_classica: "traditional Italian slatted shutters (persiane alla veneziana) — horizontal angled slats, hinged panels",
  veneziana_esterna: "external Venetian blinds — horizontal aluminum/wood slats, external mounting on guide rail",
  scuro_pieno: "solid panel shutters (scuri pieni) — flat solid wood/PVC panels without slats",
  scuro_cornice: "framed panel shutters (scuri con cornice) — solid panels with decorative raised frame moulding, historic style",
  gelosia: "fixed-louver shutters (gelosie) — angled slats that do not move, permanent ventilation, Mediterranean style",
  avvolgibile_esterno: "external roller shutters (avvolgibili) — horizontal slats that roll into a box above the window",
  a_libro: "bi-fold shutters (persiane a libro) — panels fold in half outward, ideal for wide openings",
  griglia_sicurezza: "security grille (griglia di sicurezza) — metal anti-burglary grate with industrial design",
  brise_soleil: "architectural brise-soleil — fixed or adjustable horizontal/vertical blades for solar control, contemporary design",
};

const MATERIALE_PROMPTS: Record<MaterialePersiana, string> = {
  legno: "natural solid wood with visible grain texture",
  legno_naturale: "premium natural solid wood (larch, pine, iroko) with authentic visible grain texture, painted or natural finish",
  legno_composito: "wood-composite material (WPC) — wood fiber + PVC blend, high weather resistance with realistic wood-grain embossing",
  alluminio: "extruded aluminum with smooth powder-coated finish",
  pvc: "PVC/uPVC with smooth matte surface, low maintenance",
  acciaio: "galvanized steel with industrial finish",
  ferro_battuto: "wrought iron with ornamental hand-forged details",
  composito: "wood-composite material with realistic wood-grain embossing",
  fibra_vetro: "fiberglass composite — lightweight, non-conductive, ideal for extreme climates",
};

const STATO_APERTURA_PROMPTS: Record<StatoApertura, string> = {
  chiuso: "shutters fully CLOSED, flat against the window frame, covering the entire glass area",
  socchiuso: "shutters slightly AJAR, opened approximately 10-15 degrees from the wall",
  aperto_45: "shutters opened at 45 degrees from the wall, creating a diagonal profile",
  aperto_90: "shutters opened at 90 degrees, perpendicular to the wall, resting flat against the facade",
  anta_singola_aperta: "one panel open at 90 degrees, other panel closed — asymmetric configuration",
};

const APERTURA_LAMELLE_PROMPTS: Record<AperturaLamelle, string> = {
  chiuse: "slats fully CLOSED (horizontal), maximum privacy, no light passing through",
  parzialmente_aperte: "slats tilted at 45 degrees, partial light filtering through gaps",
  completamente_aperte: "slats fully OPEN (nearly vertical), maximum light and ventilation",
};

// ── System prompt ────────────────────────────────────────────

const PERSIANE_SYSTEM_PROMPT = `You are an expert architectural visualization AI specializing in Italian residential shutters and facade modifications.

RULES:
1. Output MUST be a photorealistic image indistinguishable from a real photograph
2. Preserve EXACTLY the same perspective, lighting, and camera angle as the original photo
3. Shutters must be correctly proportioned to the window dimensions
4. Material texture must be accurate at the building's scale
5. Shadows cast by shutters must be consistent with the light direction in the original photo
6. Window reveals, sills, and surrounding wall texture must remain unchanged
7. Hinges and mounting hardware must be architecturally correct for the shutter type
8. Color must match the specified value under natural daylight conditions
9. Adjacent building elements (balconies, cornices, drainpipes) must remain intact
10. The overall atmosphere, sky, vegetation, and surroundings must remain identical`;

const PERSIANE_NEGATIVE_PROMPT = "cartoon, drawing, painting, sketch, illustration, 3D render, CGI, unrealistic proportions, distorted perspective, floating elements, visible seams, artifacts, blurry, low resolution, watermark, text overlay, wrong scale, miniature, dollhouse";

// ── Build prompt ─────────────────────────────────────────────

export function buildPersianaPrompt(
  analisi: AnalisiPersiana,
  config: ConfigurazionePersiana
): { userPrompt: string; systemPrompt: string; negativePrompt: string } {
  const blocks: string[] = [];

  // Block A — Analysis context
  blocks.push(`[BLOCK A – CURRENT STATE ANALYSIS]
Building style: ${analisi.stile_architettonico || "residential"}
Current shutters present: ${analisi.presenza_persiane ? "YES" : "NO"}
Current shutter type: ${analisi.tipo_persiana_attuale || "none"}
Current material: ${analisi.materiale_attuale || "unknown"}
Current color: ${analisi.colore_persiana || "unknown"}
Window frame color: ${analisi.colore_infissi || "unknown"}
Total windows visible: ${analisi.numero_finestre_totali || "unknown"}
Windows with shutters: ${analisi.numero_finestre_con_persiane || 0}
Roller shutter box present: ${analisi.presenza_cassonetto ? "YES" : "NO"}
Window reveal depth: ~${analisi.profondita_rivelazione_cm || 10}cm
${analisi.note_speciali ? `Special notes: ${analisi.note_speciali}` : ""}`);

  // Block B — Operation
  const opMap: Record<TipoOperazione, string> = {
    sostituisci: "REPLACE existing shutters with a different type while keeping the same window positions",
    cambia_colore: "CHANGE THE COLOR/FINISH of the existing shutters — keep the same type and shape",
    aggiungi: "ADD NEW shutters where none currently exist — install on bare windows",
    rimuovi: "REMOVE all existing shutters — show the facade with bare windows, reconstruct the wall/plaster behind them credibly",
  };
  blocks.push(`[BLOCK B – OPERATION]\n${opMap[config.tipo_operazione]}`);

  // Block C — Shutter specification (skip for rimuovi)
  if (config.tipo_operazione !== "rimuovi") {
    let colorPrompt = "";
    if (config.colore.mode === "ral" && config.colore.ral) {
      colorPrompt = `RAL ${config.colore.ral.ral} (${config.colore.ral.name}) — hex ${config.colore.ral.hex}`;
    } else if (config.colore.mode === "legno" && config.colore.wood) {
      colorPrompt = config.colore.wood.prompt_fragment;
    }

    blocks.push(`[BLOCK C – SHUTTER SPECIFICATION]
Type: ${TIPO_PERSIANA_PROMPTS[config.tipo_persiana]}
Material: ${MATERIALE_PROMPTS[config.materiale]}
Color/Finish: ${colorPrompt}
Opening state: ${STATO_APERTURA_PROMPTS[config.stato_apertura]}
Slat width: ${config.larghezza_lamella_mm}mm
Slat aperture: ${APERTURA_LAMELLE_PROMPTS[config.apertura_lamelle]}
${config.aggiungi_a_tutte_finestre ? "Apply to ALL visible windows" : config.finestre_target || ""}`);

    // Block D — Profile color (optional)
    if (config.colore_profilo) {
      let profiloColor = "";
      if (config.colore_profilo.mode === "ral" && config.colore_profilo.ral) {
        profiloColor = `RAL ${config.colore_profilo.ral.ral} (${config.colore_profilo.ral.name})`;
      } else if (config.colore_profilo.mode === "legno" && config.colore_profilo.wood) {
        profiloColor = config.colore_profilo.wood.prompt_fragment;
      }
      if (profiloColor) {
        blocks.push(`[BLOCK D – FRAME/PROFILE COLOR]\nShutter frame/profile color (different from slats): ${profiloColor}`);
      }
    }
  }

  // Block E — Preservation
  blocks.push(`[BLOCK E – PRESERVATION RULES]
✅ Keep the EXACT same building perspective and camera angle
✅ Preserve all non-shutter facade elements (cornices, balconies, drainpipes, vegetation)
✅ Maintain identical lighting, shadows, and atmospheric conditions
✅ Window glass reflections must remain natural
✅ Wall texture and color adjacent to shutters must be seamless`);

  // Block F — Dimensions
  if (config.original_image_width && config.original_image_height) {
    blocks.push(`[BLOCK F – OUTPUT DIMENSIONS]\nOutput: ${config.original_image_width}×${config.original_image_height}px`);
  }

  // Block Z — Notes
  if (config.note_aggiuntive) {
    blocks.push(`[BLOCK Z – ADDITIONAL NOTES]\n${config.note_aggiuntive}`);
  }

  return {
    userPrompt: blocks.join("\n\n"),
    systemPrompt: PERSIANE_SYSTEM_PROMPT,
    negativePrompt: PERSIANE_NEGATIVE_PROMPT,
  };
}
