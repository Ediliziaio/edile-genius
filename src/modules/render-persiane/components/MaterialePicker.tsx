import type { MaterialePersiana, TipoPersoniana } from "../lib/persianePromptBuilder";

const MATERIALS: { value: MaterialePersiana; label: string; emoji: string }[] = [
  { value: "legno", label: "Legno", emoji: "🪵" },
  { value: "alluminio", label: "Alluminio", emoji: "🔩" },
  { value: "pvc", label: "PVC", emoji: "🧱" },
  { value: "acciaio", label: "Acciaio", emoji: "⚙️" },
  { value: "ferro_battuto", label: "Ferro Battuto", emoji: "🔨" },
  { value: "composito", label: "Composito", emoji: "🧩" },
];

interface Props {
  value: MaterialePersiana;
  onChange: (v: MaterialePersiana) => void;
  tipoPersiana: TipoPersoniana;
}

export function MaterialePicker({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {MATERIALS.map((m) => (
        <button
          key={m.value}
          onClick={() => onChange(m.value)}
          className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 text-center transition-all ${
            value === m.value
              ? "border-primary bg-primary/5 ring-1 ring-primary/30"
              : "border-border hover:border-primary/30"
          }`}
        >
          <span className="text-lg">{m.emoji}</span>
          <span className="text-xs font-medium text-foreground">{m.label}</span>
        </button>
      ))}
    </div>
  );
}
