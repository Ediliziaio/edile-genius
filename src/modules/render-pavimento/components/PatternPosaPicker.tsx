import { type PatternPosa, type TipoPavimento } from "../lib/pavimentoPromptBuilder";

interface Props {
  value: PatternPosa;
  onChange: (v: PatternPosa) => void;
  tipoPavimento: TipoPavimento;
}

interface PatternOption {
  value: PatternPosa;
  label: string;
  emoji: string;
  compatibleWith: TipoPavimento[] | "all";
}

const PATTERNS: PatternOption[] = [
  { value: "rettilineo_dritto", label: "Dritto", emoji: "▦", compatibleWith: "all" },
  { value: "a_correre", label: "A correre", emoji: "▤", compatibleWith: ["parquet", "laminato", "ceramica", "gres_porcellanato", "vinile_lvt", "cotto"] },
  { value: "spina_di_pesce", label: "Spina di pesce", emoji: "⟋⟍", compatibleWith: ["parquet", "laminato", "gres_porcellanato", "vinile_lvt"] },
  { value: "spina_ungherese", label: "Spina ungherese", emoji: "⟨⟩", compatibleWith: ["parquet", "laminato"] },
  { value: "diagonale_45", label: "Diagonale 45°", emoji: "◇", compatibleWith: ["ceramica", "gres_porcellanato", "marmo", "pietra_naturale", "cotto"] },
  { value: "cassero_irregolare", label: "Cassero irregolare", emoji: "▥", compatibleWith: ["parquet", "laminato", "vinile_lvt"] },
  { value: "opus_romanum", label: "Opus Romanum", emoji: "▣", compatibleWith: ["gres_porcellanato", "pietra_naturale", "cotto"] },
  { value: "opus_incertum", label: "Opus incertum", emoji: "⬡", compatibleWith: ["pietra_naturale", "cotto"] },
  { value: "doppia_fila", label: "Doppia fila", emoji: "║", compatibleWith: ["parquet", "laminato"] },
  { value: "modulare", label: "Modulare", emoji: "⊞", compatibleWith: ["ceramica", "gres_porcellanato", "pietra_naturale"] },
  { value: "esagonale", label: "Esagonale", emoji: "⬡", compatibleWith: ["ceramica", "gres_porcellanato", "cemento_resina"] },
];

const SEAMLESS_TYPES: TipoPavimento[] = ["cemento_resina", "moquette"];

export function PatternPosaPicker({ value, onChange, tipoPavimento }: Props) {
  if (SEAMLESS_TYPES.includes(tipoPavimento)) {
    return (
      <div className="rounded-xl border border-border bg-muted/30 p-4 text-center space-y-2">
        <p className="text-2xl">🔲</p>
        <p className="text-sm font-semibold text-foreground">Superficie continua (seamless)</p>
        <p className="text-xs text-muted-foreground">
          Questo materiale non ha fughe né pattern di posa — la superficie è uniforme e continua.
        </p>
      </div>
    );
  }

  const available = PATTERNS.filter(
    (p) => p.compatibleWith === "all" || p.compatibleWith.includes(tipoPavimento)
  );

  return (
    <div className="grid grid-cols-3 gap-2">
      {available.map((p) => {
        const isSelected = value === p.value;
        return (
          <button
            key={p.value}
            type="button"
            onClick={() => onChange(p.value)}
            className={`p-3 rounded-xl border-2 text-center transition-all ${
              isSelected
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/30 bg-card"
            }`}
          >
            <p className="text-lg mb-1">{p.emoji}</p>
            <p className="text-xs font-semibold text-foreground">{p.label}</p>
          </button>
        );
      })}
    </div>
  );
}
