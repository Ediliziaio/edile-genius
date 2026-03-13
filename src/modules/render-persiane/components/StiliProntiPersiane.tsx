import { Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { TipoPersoniana, MaterialePersiana, StatoApertura, TipoOperazione } from "../lib/persianePromptBuilder";

interface StileConfig {
  tipo_operazione?: TipoOperazione;
  tipo_persiana?: TipoPersoniana;
  materiale?: MaterialePersiana;
  colore_mode?: "ral" | "legno";
  colore_ral_code?: string;
  colore_ral_name?: string;
  colore_ral_hex?: string;
  colore_wood_id?: string;
  colore_wood_name?: string;
  stato_apertura?: StatoApertura;
  larghezza_lamella_mm?: number;
}

interface StilePronto {
  nome: string;
  descrizione: string;
  emoji: string;
  preview_hex?: string;
  config: StileConfig;
}

const STILI_FALLBACK: StilePronto[] = [
  {
    nome: "Classico bianco",
    descrizione: "Veneziana in PVC bianco traffico, chiuse",
    emoji: "🤍",
    preview_hex: "#F1F0EB",
    config: { tipo_persiana: "veneziana_classica", materiale: "pvc", colore_mode: "ral", colore_ral_code: "9016", colore_ral_name: "Bianco traffico", colore_ral_hex: "#F1F0EB", stato_apertura: "chiuso" },
  },
  {
    nome: "Verde toscano",
    descrizione: "Scuro pieno in legno, verde abete",
    emoji: "🌲",
    preview_hex: "#2B3D2A",
    config: { tipo_persiana: "scuro_pieno", materiale: "legno_naturale", colore_mode: "ral", colore_ral_code: "6009", colore_ral_name: "Verde abete", colore_ral_hex: "#2B3D2A", stato_apertura: "chiuso" },
  },
  {
    nome: "Larice naturale",
    descrizione: "Veneziana in larice, aperta 45°",
    emoji: "🪵",
    preview_hex: "#B8860B",
    config: { tipo_persiana: "veneziana_classica", materiale: "legno_naturale", colore_mode: "legno", colore_wood_id: "larice_naturale", colore_wood_name: "Larice naturale", stato_apertura: "aperto_45" },
  },
  {
    nome: "Antracite moderno",
    descrizione: "Veneziana alluminio grigio antracite",
    emoji: "🔲",
    preview_hex: "#383E42",
    config: { tipo_persiana: "veneziana_esterna", materiale: "alluminio", colore_mode: "ral", colore_ral_code: "7016", colore_ral_name: "Grigio antracite", colore_ral_hex: "#383E42", stato_apertura: "chiuso" },
  },
  {
    nome: "Gelosia mediterranea",
    descrizione: "Gelosia in legno composito, avorio",
    emoji: "🔶",
    preview_hex: "#E6D3B3",
    config: { tipo_persiana: "gelosia", materiale: "legno_composito", colore_mode: "ral", colore_ral_code: "1015", colore_ral_name: "Avorio chiaro", colore_ral_hex: "#E6D3B3", stato_apertura: "chiuso" },
  },
  {
    nome: "Brise-soleil alluminio",
    descrizione: "Brise-soleil tecnico, alluminio bianco",
    emoji: "☀️",
    preview_hex: "#F4F4F4",
    config: { tipo_persiana: "brise_soleil", materiale: "alluminio", colore_mode: "ral", colore_ral_code: "9010", colore_ral_name: "Bianco puro", colore_ral_hex: "#F4F4F4", stato_apertura: "aperto_90" },
  },
  {
    nome: "Scuro rovere grigio",
    descrizione: "Scuro con cornice, effetto rovere grigio",
    emoji: "🪟",
    preview_hex: "#8B8B7A",
    config: { tipo_persiana: "scuro_cornice", materiale: "legno_composito", colore_mode: "legno", colore_wood_id: "rovere_grigio", colore_wood_name: "Rovere grigio", stato_apertura: "chiuso" },
  },
  {
    nome: "Azzurro mare",
    descrizione: "Scuro pieno in PVC, blu cielo",
    emoji: "🌊",
    preview_hex: "#2980B9",
    config: { tipo_persiana: "scuro_pieno", materiale: "pvc", colore_mode: "ral", colore_ral_code: "5015", colore_ral_name: "Blu cielo", colore_ral_hex: "#2980B9", stato_apertura: "chiuso" },
  },
];

interface Props {
  onApply: (config: StileConfig) => void;
}

export function StiliProntiPersiane({ onApply }: Props) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Stili pronti</p>
        <span className="text-xs text-muted-foreground">Applica con un click</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STILI_FALLBACK.map((stile) => (
          <button
            key={stile.nome}
            onClick={() => onApply(stile.config)}
            className="flex flex-col items-center p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all group text-center"
          >
            <div className="relative">
              {stile.preview_hex && (
                <div
                  className="w-8 h-8 rounded-full border border-border mb-1"
                  style={{ backgroundColor: stile.preview_hex }}
                />
              )}
              <span className="absolute -top-1 -right-2 text-sm">{stile.emoji}</span>
            </div>
            <p className="text-xs font-medium text-foreground mt-1">{stile.nome}</p>
            <p className="text-[10px] text-muted-foreground leading-tight">{stile.descrizione}</p>
            {stile.config.tipo_persiana && (
              <Badge variant="secondary" className="text-[9px] mt-1.5 px-1.5 py-0">
                {stile.config.tipo_persiana.replace(/_/g, " ")}
              </Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
