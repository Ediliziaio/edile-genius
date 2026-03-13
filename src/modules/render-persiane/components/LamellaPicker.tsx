import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { AperturaLamelle } from "../lib/persianePromptBuilder";

const APERTURA_OPTIONS: { value: AperturaLamelle; label: string; desc: string }[] = [
  { value: "chiuse", label: "Chiuse", desc: "Max privacy" },
  { value: "parzialmente_aperte", label: "Mezze aperte", desc: "Lamelle 45°" },
  { value: "completamente_aperte", label: "Aperte", desc: "Max luce" },
];

interface Props {
  larghezza: number;
  onLarghezzaChange: (v: number) => void;
  apertura: AperturaLamelle;
  onAperturaChange: (v: AperturaLamelle) => void;
}

export function LamellaPicker({ larghezza, onLarghezzaChange, apertura, onAperturaChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-sm font-medium">Larghezza lamella: {larghezza}mm</Label>
        <Slider
          value={[larghezza]}
          onValueChange={([v]) => onLarghezzaChange(v)}
          min={40}
          max={120}
          step={5}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>40mm</span>
          <span>120mm</span>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-sm font-medium">Apertura lamelle</Label>
        <div className="grid grid-cols-3 gap-2">
          {APERTURA_OPTIONS.map((o) => (
            <button
              key={o.value}
              onClick={() => onAperturaChange(o.value)}
              className={`p-2 rounded-lg border-2 text-center transition-colors ${
                apertura === o.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <p className="text-xs font-medium text-foreground">{o.label}</p>
              <p className="text-[10px] text-muted-foreground">{o.desc}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
