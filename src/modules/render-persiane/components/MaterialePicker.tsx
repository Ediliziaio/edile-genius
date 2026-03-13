import type { MaterialePersiana, TipoPersoniana } from "../lib/persianePromptBuilder";
import { Check, AlertTriangle } from "lucide-react";

interface MaterialeOption {
  value: MaterialePersiana;
  label: string;
  emoji: string;
  desc: string;
  compatibleWith: TipoPersoniana[] | "all";
  proLabel: string;
}

const MATERIALI: MaterialeOption[] = [
  {
    value: "legno_naturale", label: "Legno naturale", emoji: "🪵",
    desc: "Essenze pregiate (larice, pino, iroko), verniciato o naturale",
    compatibleWith: ["veneziana_classica", "gelosia", "scuro_pieno", "scuro_cornice", "a_libro"],
    proLabel: "Tradizionale",
  },
  {
    value: "legno_composito", label: "Legno composito", emoji: "🟫",
    desc: "Fibra di legno + PVC, alta resistenza alle intemperie",
    compatibleWith: ["veneziana_classica", "veneziana_esterna", "gelosia", "scuro_pieno", "scuro_cornice", "a_libro"],
    proLabel: "Durabile",
  },
  {
    value: "pvc", label: "PVC", emoji: "⬜",
    desc: "Policloruro di vinile, economico e facile manutenzione",
    compatibleWith: ["veneziana_classica", "veneziana_esterna", "scuro_pieno", "avvolgibile_esterno", "a_libro"],
    proLabel: "Economico",
  },
  {
    value: "alluminio", label: "Alluminio", emoji: "🔘",
    desc: "Lega di alluminio anodizzato o verniciato a polvere",
    compatibleWith: "all",
    proLabel: "Tecnico",
  },
  {
    value: "acciaio", label: "Acciaio", emoji: "⚙️",
    desc: "Acciaio galvanizzato, massima resistenza e sicurezza",
    compatibleWith: ["griglia_sicurezza", "veneziana_esterna", "brise_soleil"],
    proLabel: "Resistente",
  },
  {
    value: "fibra_vetro", label: "Fibra di vetro", emoji: "💎",
    desc: "Composito leggero, non conduce calore, ideale per climi estremi",
    compatibleWith: ["veneziana_classica", "veneziana_esterna", "brise_soleil"],
    proLabel: "Premium",
  },
];

const PRO_COLORS: Record<string, string> = {
  Tradizionale: "bg-accent text-accent-foreground",
  Durabile: "bg-accent text-accent-foreground",
  Economico: "bg-accent text-accent-foreground",
  Tecnico: "bg-muted text-muted-foreground",
  Resistente: "bg-muted text-muted-foreground",
  Premium: "bg-accent text-accent-foreground",
};

interface Props {
  value: MaterialePersiana;
  onChange: (v: MaterialePersiana) => void;
  tipoPersiana: TipoPersoniana;
}

export function MaterialePicker({ value, onChange, tipoPersiana }: Props) {
  const available = MATERIALI.filter(
    (m) => m.compatibleWith === "all" || m.compatibleWith.includes(tipoPersiana)
  );
  const currentIsCompatible = available.some((m) => m.value === value);

  return (
    <div className="space-y-2">
      {!currentIsCompatible && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Il materiale selezionato non è compatibile con questo tipo di persiana. Seleziona un'alternativa.
          </p>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {available.map((mat) => {
          const isSelected = value === mat.value;
          return (
            <button
              key={mat.value}
              onClick={() => onChange(mat.value)}
              className={`flex flex-col items-start p-3 rounded-xl border-2 text-left transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="flex items-center gap-2 w-full">
                <span className="text-lg">{mat.emoji}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${PRO_COLORS[mat.proLabel] || "bg-muted text-muted-foreground"}`}>
                  {mat.proLabel}
                </span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary ml-auto" />}
              </div>
              <p className="text-sm font-medium text-foreground mt-1.5">{mat.label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{mat.desc}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
