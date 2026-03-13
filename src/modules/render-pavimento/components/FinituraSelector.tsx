import { type Finitura, type TipoPavimento } from "../lib/pavimentoPromptBuilder";

interface Props {
  value: Finitura;
  onChange: (v: Finitura) => void;
  tipoPavimento: TipoPavimento;
}

interface FinituraOption {
  value: Finitura;
  label: string;
  lucidezza: number; // 0-100
  compatibleWith: TipoPavimento[] | "all";
}

const FINITURE: FinituraOption[] = [
  { value: "lucido", label: "Lucido", lucidezza: 100, compatibleWith: ["ceramica", "gres_porcellanato", "marmo"] },
  { value: "satinato", label: "Satinato", lucidezza: 60, compatibleWith: ["ceramica", "gres_porcellanato", "marmo", "cemento_resina"] },
  { value: "opaco", label: "Opaco", lucidezza: 15, compatibleWith: "all" },
  { value: "spazzolato", label: "Spazzolato", lucidezza: 25, compatibleWith: ["parquet", "laminato", "gres_porcellanato"] },
  { value: "boccardato", label: "Boccardato", lucidezza: 5, compatibleWith: ["pietra_naturale", "gres_porcellanato"] },
  { value: "anticato", label: "Anticato", lucidezza: 20, compatibleWith: ["cotto", "pietra_naturale", "parquet"] },
  { value: "levigato", label: "Levigato", lucidezza: 70, compatibleWith: ["marmo", "pietra_naturale", "cemento_resina"] },
  { value: "naturale", label: "Naturale", lucidezza: 10, compatibleWith: ["parquet", "pietra_naturale", "cotto"] },
];

export function FinituraSelector({ value, onChange, tipoPavimento }: Props) {
  const available = FINITURE.filter(
    (f) => f.compatibleWith === "all" || f.compatibleWith.includes(tipoPavimento)
  );

  return (
    <div className="space-y-2">
      {available.map((f) => {
        const isSelected = value === f.value;
        return (
          <button
            key={f.value}
            type="button"
            onClick={() => onChange(f.value)}
            className={`flex items-center gap-3 w-full p-3 rounded-xl border-2 text-left transition-all ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 bg-card"
            }`}
          >
            <span className="text-sm font-semibold text-foreground w-24">{f.label}</span>
            <div className="flex-1">
              <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary/60 transition-all"
                  style={{ width: `${f.lucidezza}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] text-muted-foreground w-10 text-right">{f.lucidezza}%</span>
          </button>
        );
      })}
    </div>
  );
}
