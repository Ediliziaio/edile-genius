import type { TipoPersoniana } from "../lib/persianePromptBuilder";
import { Check } from "lucide-react";

const TIPI_PERSIANA: {
  value: TipoPersoniana;
  label: string;
  emoji: string;
  desc: string;
  tags: string[];
}[] = [
  { value: "veneziana_classica", label: "Veneziana classica", emoji: "🪟", desc: "Lamelle orizzontali orientabili, montaggio laterale", tags: ["Classico", "Versatile"] },
  { value: "veneziana_esterna", label: "Veneziana esterna", emoji: "🏗️", desc: "Montaggio esterno su guida, alta protezione solare", tags: ["Moderno", "Tecnico"] },
  { value: "gelosia", label: "Gelosia", emoji: "🔲", desc: "Listelli fissi inclinati, tipica dell'architettura mediterranea", tags: ["Tradizionale", "Mediterraneo"] },
  { value: "scuro_pieno", label: "Scuro pieno", emoji: "🚪", desc: "Pannello pieno, massima oscurazione, stile classico", tags: ["Classico", "Rustico"] },
  { value: "scuro_cornice", label: "Scuro con cornice", emoji: "🖼️", desc: "Pannello con specchiature decorate, stile storico", tags: ["Storico", "Elegante"] },
  { value: "a_libro", label: "A libro", emoji: "📖", desc: "Si piega a metà verso l'esterno, ideale per aperture ampie", tags: ["Moderno", "Funzionale"] },
  { value: "avvolgibile_esterno", label: "Avvolgibile esterno", emoji: "📜", desc: "Lamelle avvolgibili in cassonetto esterno a vista", tags: ["Tecnico", "Isolante"] },
  { value: "griglia_sicurezza", label: "Griglia di sicurezza", emoji: "🔒", desc: "Griglia metallica antieffrazione, design industriale", tags: ["Sicurezza", "Industriale"] },
  { value: "brise_soleil", label: "Brise-soleil", emoji: "☀️", desc: "Lamelle fisse/orientabili orizzontali, controllo solare architettonico", tags: ["Architettonico", "Contemporaneo"] },
];

interface Props {
  value: TipoPersoniana;
  onChange: (v: TipoPersoniana) => void;
}

export function PersianaStylePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-1 gap-2">
      {TIPI_PERSIANA.map((tipo) => {
        const isSelected = value === tipo.value;
        return (
          <button
            key={tipo.value}
            onClick={() => onChange(tipo.value)}
            className={`flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                : "border-border hover:border-primary/30"
            }`}
          >
            <span className="text-xl flex-shrink-0 mt-0.5">{tipo.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{tipo.label}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{tipo.desc}</p>
              <div className="flex gap-1 mt-1.5">
                {tipo.tags.map((tag) => (
                  <span key={tag} className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
