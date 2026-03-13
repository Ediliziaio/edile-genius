import { Zap } from "lucide-react";
import { STILI_PRONTI_FACCIATA, type StileProntoFacciata } from "../lib/facciataPresets";
import type { ConfigurazioneFacciata } from "../lib/facciataPromptBuilder";

interface Props {
  onApply: (config: Partial<ConfigurazioneFacciata>) => void;
}

export function StiliProntiFacciata({ onApply }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Stili pronti — applica con un click</p>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {STILI_PRONTI_FACCIATA.map((stile) => (
          <button
            key={stile.id}
            onClick={() => onApply(stile.config)}
            className="flex items-start gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 text-left transition-all"
          >
            {/* Palette colori */}
            <div className="flex flex-col gap-1 flex-shrink-0 pt-0.5">
              {stile.colori.map((hex, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-border shadow-sm"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground">
                {stile.emoji} {stile.name}
              </p>
              <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{stile.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
