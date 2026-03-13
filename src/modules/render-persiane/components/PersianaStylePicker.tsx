import type { TipoPersoniana } from "../lib/persianePromptBuilder";

const TYPES: { value: TipoPersoniana; label: string; emoji: string; desc: string }[] = [
  { value: "veneziana_classica", label: "Veneziana Classica", emoji: "🪟", desc: "Lamelle orizzontali orientabili" },
  { value: "veneziana_esterna", label: "Veneziana Esterna", emoji: "🏗️", desc: "Montaggio esterno, lamelle regolabili" },
  { value: "scuro_pieno", label: "Scuro Pieno", emoji: "🚪", desc: "Pannello pieno senza lamelle" },
  { value: "scuro_dogato", label: "Scuro Dogato", emoji: "📐", desc: "Doghe verticali a incastro" },
  { value: "persiana_scorrevole", label: "Scorrevole", emoji: "↔️", desc: "Scorre su binario esterno" },
  { value: "gelosia", label: "Gelosia", emoji: "🔲", desc: "Lamelle fisse, ventilazione permanente" },
  { value: "avvolgibile_esterno", label: "Avvolgibile", emoji: "⬆️", desc: "Si arrotola nel cassonetto" },
  { value: "frangisole", label: "Frangisole", emoji: "☀️", desc: "Lame orientabili, schermatura solare" },
  { value: "alla_romana", label: "Alla Romana", emoji: "🏛️", desc: "Ante pieghevoli a libro" },
];

interface Props {
  value: TipoPersoniana;
  onChange: (v: TipoPersoniana) => void;
}

export function PersianaStylePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TYPES.map((t) => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 text-center transition-all ${
            value === t.value
              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
              : "border-border hover:border-primary/30"
          }`}
        >
          <span className="text-xl">{t.emoji}</span>
          <span className="text-xs font-medium text-foreground leading-tight">{t.label}</span>
          <span className="text-[10px] text-muted-foreground leading-tight">{t.desc}</span>
        </button>
      ))}
    </div>
  );
}
