import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { ConfigCappotto } from "../lib/facciataPromptBuilder";
import { ColoreIntonacoSelector } from "./ColoreIntonacoSelector";

interface Props {
  value: ConfigCappotto;
  onChange: (v: ConfigCappotto) => void;
  currentRevealDepth?: number;
}

const SISTEMI: { value: ConfigCappotto["sistema"]; label: string; desc: string }[] = [
  { value: "eps", label: "EPS (Polistirene)", desc: "Il più comune, ottimo rapporto costo/prestazione" },
  { value: "lana_roccia", label: "Lana di Roccia", desc: "Migliore resistenza al fuoco, più traspirante" },
  { value: "fibra_legno", label: "Fibra di Legno", desc: "Ecologico, ottimo sfasamento termico estivo" },
];

export function CappottoConfigurator({ value, onChange, currentRevealDepth = 8 }: Props) {
  return (
    <div className="space-y-5">
      {/* Spessore */}
      <div>
        <Label className="text-sm font-medium mb-2 block">
          Spessore: {value.spessore_cm} cm
        </Label>
        <Slider
          value={[value.spessore_cm]}
          onValueChange={([v]) => onChange({ ...value, spessore_cm: v })}
          min={4}
          max={20}
          step={2}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground mt-1">
          <span>4 cm</span>
          <span>20 cm</span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Profondità mazzette finestre: ~{currentRevealDepth}cm → ~{currentRevealDepth + value.spessore_cm}cm
        </p>
      </div>

      {/* Sistema isolante */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Sistema isolante</Label>
        <div className="grid gap-2">
          {SISTEMI.map(s => (
            <button
              key={s.value}
              onClick={() => onChange({ ...value, sistema: s.value })}
              className={`flex flex-col p-3 rounded-lg border-2 text-left transition-all ${
                value.sistema === s.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-sm font-medium text-foreground">{s.label}</span>
              <span className="text-xs text-muted-foreground">{s.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Colore finale */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Colore finale del cappotto</Label>
        <ColoreIntonacoSelector
          value={value.colore}
          onChange={(colore) => onChange({ ...value, colore })}
        />
      </div>
    </div>
  );
}
