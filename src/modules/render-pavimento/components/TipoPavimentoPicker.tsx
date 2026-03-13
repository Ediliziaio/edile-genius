import { type TipoPavimento } from "../lib/pavimentoPromptBuilder";

interface Props {
  value: TipoPavimento;
  onChange: (v: TipoPavimento) => void;
}

const CATEGORIE = [
  {
    label: "Legno & derivati",
    items: [
      { value: "parquet" as TipoPavimento, label: "Parquet", emoji: "🪵", desc: "Massello, prefinito, ingegnerizzato" },
      { value: "laminato" as TipoPavimento, label: "Laminato", emoji: "📋", desc: "AC3–AC5, effetto legno HD" },
    ],
  },
  {
    label: "Ceramiche & pietre",
    items: [
      { value: "ceramica" as TipoPavimento, label: "Ceramica", emoji: "⬜", desc: "Smaltata, classica, versatile" },
      { value: "gres_porcellanato" as TipoPavimento, label: "Gres porcellanato", emoji: "🔲", desc: "Rettificato, formato lastra" },
      { value: "marmo" as TipoPavimento, label: "Marmo", emoji: "🤍", desc: "Venature uniche, lusso" },
      { value: "pietra_naturale" as TipoPavimento, label: "Pietra naturale", emoji: "🪨", desc: "Ardesia, basalto, travertino" },
    ],
  },
  {
    label: "Moderni",
    items: [
      { value: "vinile_lvt" as TipoPavimento, label: "Vinile LVT", emoji: "💧", desc: "100% impermeabile" },
      { value: "cemento_resina" as TipoPavimento, label: "Microcemento / Resina", emoji: "⬛", desc: "Seamless, minimal" },
    ],
  },
  {
    label: "Tradizionali & tessili",
    items: [
      { value: "cotto" as TipoPavimento, label: "Cotto / Terracotta", emoji: "🏺", desc: "Artigianale, mediterraneo" },
      { value: "moquette" as TipoPavimento, label: "Moquette", emoji: "🟫", desc: "Tessile, fonoassorbente" },
    ],
  },
];

export function TipoPavimentoPicker({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      {CATEGORIE.map((cat) => (
        <div key={cat.label}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">{cat.label}</p>
          <div className="grid grid-cols-2 gap-2">
            {cat.items.map((item) => {
              const isSelected = value === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onChange(item.value)}
                  className={`flex items-start gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30 bg-card"
                  }`}
                >
                  <span className="text-xl mt-0.5">{item.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground leading-tight">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
