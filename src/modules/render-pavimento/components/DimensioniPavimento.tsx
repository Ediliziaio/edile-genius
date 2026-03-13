import { type TipoPavimento } from "../lib/pavimentoPromptBuilder";
import { Slider } from "@/components/ui/slider";

interface Props {
  tipoPavimento: TipoPavimento;
  dimensionePiastrella?: string;
  onDimensionePiastrellaChange: (v: string) => void;
  larghezzaListello: number;
  onLarghezzaListelloChange: (v: number) => void;
  lunghezzaListello: number;
  onLunghezzaListelloChange: (v: number) => void;
}

const FORMATI_PIASTRELLA = [
  { value: "20x20", label: "20×20", ratio: 1 },
  { value: "30x30", label: "30×30", ratio: 1 },
  { value: "40x40", label: "40×40", ratio: 1 },
  { value: "60x30", label: "60×30", ratio: 2 },
  { value: "60x60", label: "60×60", ratio: 1 },
  { value: "80x80", label: "80×80", ratio: 1 },
  { value: "120x60", label: "120×60", ratio: 2 },
  { value: "120x120", label: "120×120", ratio: 1 },
];

const PLANK_TYPES: TipoPavimento[] = ["parquet", "laminato", "vinile_lvt"];
const TILE_TYPES: TipoPavimento[] = ["ceramica", "gres_porcellanato", "marmo", "pietra_naturale", "cotto"];
const SEAMLESS_TYPES: TipoPavimento[] = ["cemento_resina", "moquette"];

export function DimensioniPavimento({
  tipoPavimento, dimensionePiastrella, onDimensionePiastrellaChange,
  larghezzaListello, onLarghezzaListelloChange,
  lunghezzaListello, onLunghezzaListelloChange,
}: Props) {
  if (SEAMLESS_TYPES.includes(tipoPavimento)) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-center">
        <p className="text-sm text-muted-foreground">Superficie continua — nessuna dimensione da configurare</p>
      </div>
    );
  }

  if (PLANK_TYPES.includes(tipoPavimento)) {
    return (
      <div className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Larghezza listello</span>
            <span className="text-xs font-semibold text-primary">{larghezzaListello}mm</span>
          </div>
          <Slider
            value={[larghezzaListello]}
            onValueChange={([v]) => onLarghezzaListelloChange(v)}
            min={80} max={300} step={10}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>80mm</span><span>300mm</span>
          </div>
        </div>
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-xs font-medium text-foreground">Lunghezza listello</span>
            <span className="text-xs font-semibold text-primary">{lunghezzaListello}mm</span>
          </div>
          <Slider
            value={[lunghezzaListello]}
            onValueChange={([v]) => onLunghezzaListelloChange(v)}
            min={300} max={2400} step={100}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
            <span>300mm</span><span>2400mm</span>
          </div>
        </div>
        {/* Preview */}
        <div className="flex items-center justify-center p-3 rounded-xl bg-muted/30 border border-border">
          <div
            className="bg-primary/20 border border-primary/40 rounded"
            style={{ width: `${Math.min(larghezzaListello / 3, 80)}px`, height: `${Math.min(lunghezzaListello / 20, 80)}px` }}
          />
          <span className="text-[10px] text-muted-foreground ml-3">{larghezzaListello} × {lunghezzaListello}mm</span>
        </div>
      </div>
    );
  }

  if (TILE_TYPES.includes(tipoPavimento)) {
    return (
      <div className="grid grid-cols-4 gap-2">
        {FORMATI_PIASTRELLA.map((f) => {
          const isSelected = dimensionePiastrella === f.value;
          return (
            <button
              key={f.value}
              type="button"
              onClick={() => onDimensionePiastrellaChange(f.value)}
              className={`flex flex-col items-center p-2.5 rounded-xl border-2 transition-all ${
                isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"
              }`}
            >
              <div
                className="bg-primary/15 border border-primary/30 rounded mb-1"
                style={{ width: `${20 + (f.ratio === 1 ? 16 : 28)}px`, height: `${20 + 16}px` }}
              />
              <span className="text-[10px] font-semibold text-foreground">{f.label}</span>
              <span className="text-[9px] text-muted-foreground">cm</span>
            </button>
          );
        })}
      </div>
    );
  }

  return null;
}
