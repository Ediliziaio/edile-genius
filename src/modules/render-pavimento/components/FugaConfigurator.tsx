import { type TipoPavimento } from "../lib/pavimentoPromptBuilder";
import { Slider } from "@/components/ui/slider";

interface Props {
  tipoPavimento: TipoPavimento;
  larghezzaFuga: number;
  onLarghezzaFugaChange: (v: number) => void;
  coloreFuga: string;
  onColoreFugaChange: (v: string) => void;
}

const COLORI_FUGA = [
  { value: "bianco", label: "Bianco", hex: "#F5F5F5" },
  { value: "grigio_ch", label: "Grigio chiaro", hex: "#C0C0C0" },
  { value: "grigio_sc", label: "Grigio scuro", hex: "#606060" },
  { value: "nero", label: "Nero", hex: "#1A1A1A" },
  { value: "beige", label: "Beige", hex: "#D4C4A8" },
  { value: "cementite", label: "Cementite", hex: "#A0998E" },
];

const NEEDS_FUGA: TipoPavimento[] = ["ceramica", "gres_porcellanato", "marmo", "pietra_naturale", "cotto"];

export function FugaConfigurator({ tipoPavimento, larghezzaFuga, onLarghezzaFugaChange, coloreFuga, onColoreFugaChange }: Props) {
  if (!NEEDS_FUGA.includes(tipoPavimento)) return null;

  return (
    <div className="space-y-4 rounded-xl border border-border p-4">
      <p className="text-sm font-semibold text-foreground">Configurazione fuga</p>

      {/* Larghezza */}
      <div>
        <div className="flex justify-between mb-2">
          <span className="text-xs font-medium text-foreground">Larghezza fuga</span>
          <span className="text-xs font-semibold text-primary">{larghezzaFuga}mm</span>
        </div>
        <Slider
          value={[larghezzaFuga]}
          onValueChange={([v]) => onLarghezzaFugaChange(v)}
          min={1} max={20} step={1}
        />
      </div>

      {/* Colore */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2">Colore fuga</p>
        <div className="grid grid-cols-3 gap-2">
          {COLORI_FUGA.map((c) => {
            const isSelected = coloreFuga === c.value;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onColoreFugaChange(c.value)}
                className={`flex items-center gap-2 p-2 rounded-lg border-2 transition-all ${
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                }`}
              >
                <div className="w-4 h-4 rounded-full border border-border" style={{ backgroundColor: c.hex }} />
                <span className="text-[11px] font-medium text-foreground">{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <div className="flex items-center justify-center h-16 rounded-lg bg-muted/30">
        <div className="flex gap-[var(--fuga)]" style={{ "--fuga": `${Math.max(larghezzaFuga * 0.5, 1)}px` } as React.CSSProperties}>
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-12 h-12 bg-muted rounded-sm border" style={{ borderColor: COLORI_FUGA.find(c => c.value === coloreFuga)?.hex ?? "#ccc" }} />
          ))}
        </div>
      </div>
    </div>
  );
}
