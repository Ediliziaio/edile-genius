import { Check } from "lucide-react";
import type { ConfigCappotto } from "../lib/facciataPromptBuilder";
import { ColoreIntonacoSelector } from "./ColoreIntonacoSelector";

const SPESSORI = [
  { cm: 6, name: "6 cm", sub: "Minimo" },
  { cm: 8, name: "8 cm", sub: "Standard" },
  { cm: 10, name: "10 cm", sub: "Consigliato" },
  { cm: 12, name: "12 cm", sub: "Ottimale" },
  { cm: 14, name: "14 cm", sub: "Elevato" },
  { cm: 16, name: "16 cm", sub: "Massimo" },
];

const SISTEMI: { value: ConfigCappotto["sistema"]; label: string; sub: string; emoji: string }[] = [
  { value: "eps", label: "EPS / Polistirene", sub: "Il più diffuso — economico", emoji: "🟡" },
  { value: "lana_roccia", label: "Lana di Roccia", sub: "Alta traspirabilità + fonoassorbente", emoji: "🟤" },
  { value: "fibra_legno", label: "Fibra di Legno", sub: "Naturale — edifici in legno/bio", emoji: "🌲" },
];

interface Props {
  value: ConfigCappotto;
  onChange: (v: ConfigCappotto) => void;
  currentRevealDepth?: number;
}

export function CappottoConfigurator({ value, onChange, currentRevealDepth = 8 }: Props) {
  const revealTotale = currentRevealDepth + value.spessore_cm;

  return (
    <div className="space-y-5">
      <p className="text-sm font-semibold text-foreground">Configurazione cappotto termico</p>

      {/* Info cappotto */}
      <div className="p-3 rounded-xl bg-muted/50 border border-border text-xs text-muted-foreground space-y-1">
        <p className="font-medium text-foreground">ℹ️ Effetti visibili nel render:</p>
        <ul className="list-disc list-inside space-y-0.5">
          <li>Facciata completamente nuova e regolare</li>
          <li>Finestre più "incassate" di circa {value.spessore_cm}cm</li>
          <li>Profondità rivelazione stimata: ~{revealTotale}cm</li>
          <li>Colore e finitura del nuovo intonaco a tua scelta</li>
        </ul>
      </div>

      {/* Spessore */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">
          Spessore isolante: <span className="text-primary">{value.spessore_cm}cm</span>
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {SPESSORI.map((s) => {
            const isSelected = value.spessore_cm === s.cm;
            return (
              <button
                key={s.cm}
                onClick={() => onChange({ ...value, spessore_cm: s.cm })}
                className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition-all ${
                  isSelected
                    ? "border-primary ring-1 ring-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                {/* Visual thickness bar */}
                <div className="w-full flex justify-center">
                  <div
                    className="rounded bg-primary/60"
                    style={{ width: `${Math.max(8, s.cm * 2.5)}px`, height: "24px" }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground">{s.name}</span>
                <span className="text-[10px] text-muted-foreground">{s.sub}</span>
                {isSelected && <Check className="w-3 h-3 text-primary" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Sistema isolante */}
      <div className="space-y-2">
        <p className="text-sm font-medium text-foreground">Sistema isolante</p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {SISTEMI.map((s) => (
            <button
              key={s.value}
              onClick={() => onChange({ ...value, sistema: s.value })}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all ${
                value.sistema === s.value
                  ? "border-primary ring-1 ring-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span className="text-lg">{s.emoji}</span>
              <p className="text-xs font-medium text-foreground">{s.label}</p>
              <p className="text-[10px] text-muted-foreground">{s.sub}</p>
              {value.sistema === s.value && <Check className="w-3 h-3 text-primary" />}
            </button>
          ))}
        </div>
      </div>

      {/* Colore finale */}
      <div className="space-y-2">
        <ColoreIntonacoSelector
          label="Colore finale del cappotto"
          value={value.colore}
          onChange={(colore) => onChange({ ...value, colore })}
        />
      </div>
    </div>
  );
}
