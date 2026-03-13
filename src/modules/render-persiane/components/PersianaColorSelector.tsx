import { useState } from "react";
import { Label } from "@/components/ui/label";
import type { RalColor, WoodColor } from "../lib/persianePromptBuilder";

// Subset of common RAL colors for shutters
const RAL_COLORS: RalColor[] = [
  { ral: "9010", name: "Bianco Puro", hex: "#F5F5F0" },
  { ral: "9001", name: "Bianco Crema", hex: "#FDF4E3" },
  { ral: "7016", name: "Grigio Antracite", hex: "#383E42" },
  { ral: "7035", name: "Grigio Chiaro", hex: "#D7D7D7" },
  { ral: "8017", name: "Marrone Cioccolato", hex: "#45322E" },
  { ral: "8014", name: "Marrone Seppia", hex: "#49392D" },
  { ral: "6005", name: "Verde Muschio", hex: "#2F4538" },
  { ral: "3005", name: "Rosso Vino", hex: "#5E2129" },
  { ral: "5014", name: "Blu Colomba", hex: "#637D96" },
  { ral: "1015", name: "Avorio Chiaro", hex: "#E6D690" },
  { ral: "7001", name: "Grigio Argento", hex: "#8E9AA0" },
  { ral: "6021", name: "Verde Pallido", hex: "#89AC76" },
];

const WOOD_COLORS: WoodColor[] = [
  { id: "noce", name: "Noce", name_en: "Walnut", prompt_fragment: "walnut wood grain — rich warm brown with dark streaks" },
  { id: "rovere", name: "Rovere", name_en: "Oak", prompt_fragment: "natural oak wood grain — light golden-brown with subtle grain" },
  { id: "douglas", name: "Douglas", name_en: "Douglas Fir", prompt_fragment: "Douglas fir wood — reddish-brown with pronounced grain" },
  { id: "ciliegio", name: "Ciliegio", name_en: "Cherry", prompt_fragment: "cherry wood — warm reddish-brown, smooth grain" },
  { id: "mogano", name: "Mogano", name_en: "Mahogany", prompt_fragment: "mahogany wood — deep red-brown with fine straight grain" },
  { id: "castagno", name: "Castagno", name_en: "Chestnut", prompt_fragment: "chestnut wood — golden-brown with rustic visible grain" },
];

interface Props {
  coloreMode: "ral" | "legno";
  onColoreModeChange: (m: "ral" | "legno") => void;
  ralSelezionato: RalColor | null;
  onRalChange: (c: RalColor) => void;
  woodSelezionato: WoodColor | null;
  onWoodChange: (c: WoodColor) => void;
}

export function PersianaColorSelector({
  coloreMode, onColoreModeChange,
  ralSelezionato, onRalChange,
  woodSelezionato, onWoodChange,
}: Props) {
  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-2">
        {(["ral", "legno"] as const).map((m) => (
          <button
            key={m}
            onClick={() => onColoreModeChange(m)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
              coloreMode === m
                ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/30"
            }`}
          >
            {m === "ral" ? "🎨 Colore RAL" : "🪵 Effetto Legno"}
          </button>
        ))}
      </div>

      {/* RAL picker */}
      {coloreMode === "ral" && (
        <div className="grid grid-cols-6 gap-2">
          {RAL_COLORS.map((c) => (
            <button
              key={c.ral}
              onClick={() => onRalChange(c)}
              title={`RAL ${c.ral} — ${c.name}`}
              className={`flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
                ralSelezionato?.ral === c.ral
                  ? "border-primary ring-2 ring-primary/30"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <div className="w-8 h-8 rounded-md border border-border" style={{ backgroundColor: c.hex }} />
              <span className="text-[9px] text-muted-foreground leading-tight text-center">{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Wood picker */}
      {coloreMode === "legno" && (
        <div className="grid grid-cols-3 gap-2">
          {WOOD_COLORS.map((w) => (
            <button
              key={w.id}
              onClick={() => onWoodChange(w)}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                woodSelezionato?.id === w.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-lg">🪵</span>
              <p className="text-xs font-medium text-foreground mt-1">{w.name}</p>
              <p className="text-[10px] text-muted-foreground">{w.name_en}</p>
            </button>
          ))}
        </div>
      )}

      {/* Selection summary */}
      {coloreMode === "ral" && ralSelezionato && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: ralSelezionato.hex }} />
          <span className="text-xs text-foreground font-medium">RAL {ralSelezionato.ral} — {ralSelezionato.name}</span>
        </div>
      )}
      {coloreMode === "legno" && woodSelezionato && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/50">
          <span>🪵</span>
          <span className="text-xs text-foreground font-medium">{woodSelezionato.name} ({woodSelezionato.name_en})</span>
        </div>
      )}
    </div>
  );
}
