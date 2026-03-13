import { Zap } from "lucide-react";

interface StileConfig {
  tipo_operazione?: string;
  tipo_persiana?: string;
  materiale?: string;
  colore_mode?: "ral" | "legno";
  stato_apertura?: string;
  larghezza_lamella_mm?: number;
}

const STILI: { name: string; emoji: string; desc: string; config: StileConfig }[] = [
  {
    name: "Veneziana Bianca Classica",
    emoji: "🪟",
    desc: "Bianco puro RAL 9010, lamelle 80mm chiuse",
    config: { tipo_operazione: "sostituisci", tipo_persiana: "veneziana_classica", materiale: "pvc", colore_mode: "ral", stato_apertura: "chiuso", larghezza_lamella_mm: 80 },
  },
  {
    name: "Scuro Noce Tradizionale",
    emoji: "🚪",
    desc: "Scuro pieno in legno effetto noce",
    config: { tipo_operazione: "sostituisci", tipo_persiana: "scuro_pieno", materiale: "legno", colore_mode: "legno" },
  },
  {
    name: "Veneziana Antracite Moderna",
    emoji: "🏙️",
    desc: "Grigio antracite RAL 7016, alluminio",
    config: { tipo_operazione: "sostituisci", tipo_persiana: "veneziana_classica", materiale: "alluminio", colore_mode: "ral", stato_apertura: "chiuso", larghezza_lamella_mm: 80 },
  },
  {
    name: "Gelosia Verde Muschio",
    emoji: "🌿",
    desc: "Gelosia in legno verde RAL 6005",
    config: { tipo_operazione: "sostituisci", tipo_persiana: "gelosia", materiale: "legno", colore_mode: "ral" },
  },
  {
    name: "Avvolgibile Bianco",
    emoji: "⬆️",
    desc: "Avvolgibile esterno PVC bianco",
    config: { tipo_operazione: "sostituisci", tipo_persiana: "avvolgibile_esterno", materiale: "pvc", colore_mode: "ral" },
  },
  {
    name: "Persiana Rovere Naturale",
    emoji: "🪵",
    desc: "Veneziana in composito effetto rovere",
    config: { tipo_operazione: "sostituisci", tipo_persiana: "veneziana_classica", materiale: "composito", colore_mode: "legno", larghezza_lamella_mm: 80 },
  },
  {
    name: "Frangisole Grigio Chiaro",
    emoji: "☀️",
    desc: "Frangisole alluminio RAL 7035",
    config: { tipo_operazione: "sostituisci", tipo_persiana: "frangisole", materiale: "alluminio", colore_mode: "ral" },
  },
  {
    name: "Alla Romana Marrone",
    emoji: "🏛️",
    desc: "Alla romana in legno marrone cioccolato",
    config: { tipo_operazione: "sostituisci", tipo_persiana: "alla_romana", materiale: "legno", colore_mode: "ral" },
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
        <p className="text-sm font-semibold text-foreground">Stili pronti — applica con un click</p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {STILI.map((s) => (
          <button
            key={s.name}
            onClick={() => onApply(s.config)}
            className="flex items-start gap-2 p-2.5 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all"
          >
            <span className="text-lg">{s.emoji}</span>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground leading-tight">{s.name}</p>
              <p className="text-[10px] text-muted-foreground leading-tight">{s.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
