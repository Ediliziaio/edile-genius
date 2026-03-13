// ═══════════════════════════════════════════════════════════════════
// FACCIATA PRESETS — Stili Pronti preconfigurati
// Edile Genius — Modulo Render Facciata
// ═══════════════════════════════════════════════════════════════════

import type { ConfigurazioneFacciata } from "./facciataPromptBuilder";

export interface StileProntoFacciata {
  id: string;
  name: string;
  desc: string;
  emoji: string;
  colori: string[];
  config: Partial<ConfigurazioneFacciata>;
}

export const STILI_PRONTI_FACCIATA: StileProntoFacciata[] = [
  {
    id: "moderno_grigio",
    name: "Moderno Grigio",
    desc: "Facciata contemporanea grigio antracite con finitura rasata",
    emoji: "🏙️",
    colori: ["#484848", "#D8D4D0"],
    config: {
      tipo_intervento: "tinteggiatura",
      colore_intonaco: {
        colore_id: "grigio_antracite",
        colore_name: "Grigio Antracite",
        colore_hex: "#484848",
        prompt_fragment: "anthracite dark grey plaster — very dark grey, modern premium contemporary facades",
        finitura: "rasato",
        finitura_prompt: "SKIM COAT (rasato) — very fine 0.3-0.5mm texture, nearly smooth but slightly rougher than liscio, modern clean appearance",
      },
    },
  },
  {
    id: "classico_bianco_avorio",
    name: "Classico Bianco Avorio",
    desc: "Tradizione italiana — bianco antico con graffiato fine",
    emoji: "🏛️",
    colori: ["#EDE8DC"],
    config: {
      tipo_intervento: "tinteggiatura",
      colore_intonaco: {
        colore_id: "bianco_antico",
        colore_name: "Bianco Antico",
        colore_hex: "#EDE8DC",
        prompt_fragment: "antique warm white plaster with slight cream undertone — classic Italian residential appearance",
        finitura: "graffiato_fine",
        finitura_prompt: "FINE SCRAPED (graffiato fine) — 1.0-1.5mm grain scraped plaster, uniform horizontal or circular combing marks creating a fine repetitive texture",
      },
    },
  },
  {
    id: "toscano_ocra",
    name: "Toscano Ocra",
    desc: "Calore della Toscana — ocra classica con finitura liscia",
    emoji: "🌻",
    colori: ["#C8922A"],
    config: {
      tipo_intervento: "tinteggiatura",
      colore_intonaco: {
        colore_id: "ocra_classica",
        colore_name: "Ocra Classica",
        colore_hex: "#C8922A",
        prompt_fragment: "classic ochre yellow plaster — warm saturated yellow-orange, typical Emilian and Venetian historic facades",
        finitura: "liscio",
        finitura_prompt: "SMOOTH (liscio) — perfectly flat plaster surface, no visible texture grain, satin-smooth appearance",
      },
    },
  },
  {
    id: "cappotto_bianco_graffiato",
    name: "Cappotto + Bianco Graffiato",
    desc: "Efficienza energetica — cappotto 12cm con bianco graffiato",
    emoji: "🏠",
    colori: ["#F5F5F0"],
    config: {
      tipo_intervento: "cappotto",
      cappotto: {
        spessore_cm: 12,
        sistema: "eps",
        colore: {
          colore_id: "bianco_puro",
          colore_name: "Bianco Puro",
          colore_hex: "#F5F5F0",
          prompt_fragment: "pure bright white smooth plaster — clean neutral Scandinavian appearance, maximum brightness",
          finitura: "graffiato_fine",
          finitura_prompt: "FINE SCRAPED (graffiato fine) — 1.0-1.5mm grain scraped plaster, uniform horizontal or circular combing marks",
        },
      },
    },
  },
  {
    id: "misto_travertino_beige",
    name: "Misto: Travertino + Beige",
    desc: "Piano terra travertino, piani superiori beige sabbia",
    emoji: "🏛️",
    colori: ["#D4C4A0", "#D4C4A8"],
    config: {
      tipo_intervento: "misto",
      rivestimento: {
        tipo: "travertino",
        tipo_name: "Travertino",
        tipo_prompt: "TRAVERTINO (travertine) stone cladding — cream-to-warm-beige limestone with characteristic cross-cut porous pattern showing natural voids and occasional vein-like striations",
        zona: "piano_terra",
        zona_prompt: "APPLY TO: ground floor only — from ground level up to the floor line of the first floor",
      },
      colore_intonaco: {
        colore_id: "beige_sabbia",
        colore_name: "Beige Sabbia",
        colore_hex: "#D4C4A8",
        prompt_fragment: "sandy beige plaster — warm neutral tone, very common on Italian single-family homes",
        finitura: "graffiato_fine",
        finitura_prompt: "FINE SCRAPED (graffiato fine) — 1.0-1.5mm grain scraped plaster, uniform horizontal or circular combing marks",
      },
    },
  },
  {
    id: "pietra_zoccolatura",
    name: "Zoccolatura in Pietra Serena",
    desc: "Pietra Serena alla base, bianco calce ai piani superiori",
    emoji: "🪨",
    colori: ["#7A8080", "#F0EDE4"],
    config: {
      tipo_intervento: "misto",
      rivestimento: {
        tipo: "pietra_serena",
        tipo_name: "Pietra Serena",
        tipo_prompt: "PIETRA SERENA stone cladding — classic Florentine blue-grey sandstone (calcarenite), smooth sawn finish with uniform fine grain",
        zona: "zoccolatura",
        zona_prompt: "APPLY TO: base plinth zone only — the lowest 80-120cm of the facade above ground level",
      },
      colore_intonaco: {
        colore_id: "bianco_calce",
        colore_name: "Bianco Calce",
        colore_hex: "#F0EDE4",
        prompt_fragment: "lime-white plaster — slightly chalky warm white, traditional Mediterranean appearance",
        finitura: "liscio",
        finitura_prompt: "SMOOTH (liscio) — perfectly flat plaster surface, no visible texture grain, satin-smooth appearance",
      },
    },
  },
  {
    id: "laterizio_rosso",
    name: "Laterizio Faccia Vista",
    desc: "Mattone a vista rosso classico su tutta la facciata",
    emoji: "🧱",
    colori: ["#A84030"],
    config: {
      tipo_intervento: "rivestimento",
      rivestimento: {
        tipo: "cotto_rosso",
        tipo_name: "Cotto Rosso",
        tipo_prompt: "COTTO ROSSO laterizio faccia vista — classic warm red fired clay brick in Italian standard format (25×6cm or 25×5.5cm), laid in running bond with approx 10mm mortar joint",
        zona: "tutta",
        zona_prompt: "APPLY TO: entire facade — from ground level to roofline, including all floors",
      },
    },
  },
  {
    id: "verde_salvia_contemporaneo",
    name: "Verde Salvia Contemporaneo",
    desc: "Colore natura — verde salvia con rasato moderno",
    emoji: "🌿",
    colori: ["#8A9878"],
    config: {
      tipo_intervento: "tinteggiatura",
      colore_intonaco: {
        colore_id: "verde_salvia",
        colore_name: "Verde Salvia",
        colore_hex: "#8A9878",
        prompt_fragment: "sage green plaster — muted grey-green, organic contemporary aesthetic",
        finitura: "rasato",
        finitura_prompt: "SKIM COAT (rasato) — very fine 0.3-0.5mm texture, nearly smooth but slightly rougher than liscio, modern clean appearance",
      },
    },
  },
];
