import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ConfigElementiArchitettonici, AnalysiFacciata } from "../lib/facciataPromptBuilder";

// Colori predefiniti per cornici e marcapiani
const COLORI_CORNICI = [
  { name: "Bianco Puro", hex: "#F5F5F0", prompt_fragment: "pure white cornice frames" },
  { name: "Bianco Antico", hex: "#EDE8DC", prompt_fragment: "antique warm white cornice frames" },
  { name: "Grigio Chiaro", hex: "#D8D4D0", prompt_fragment: "light grey cornice frames" },
  { name: "Grigio Perla", hex: "#C8C4C0", prompt_fragment: "pearl grey cornice frames" },
  { name: "Grigio Cemento", hex: "#9A9A98", prompt_fragment: "concrete grey cornice frames" },
  { name: "Travertino", hex: "#D4C4A0", prompt_fragment: "travertine-colored cornice frames" },
  { name: "Pietra Serena", hex: "#7A8080", prompt_fragment: "pietra serena grey cornice frames" },
  { name: "Terracotta", hex: "#C46840", prompt_fragment: "terracotta cornice frames" },
  { name: "Ocra", hex: "#C8922A", prompt_fragment: "ochre yellow cornice frames" },
  { name: "Nero", hex: "#2A2A2A", prompt_fragment: "matte black cornice frames" },
];

interface Props {
  analisi: AnalysiFacciata;
  value: ConfigElementiArchitettonici;
  onChange: (v: ConfigElementiArchitettonici) => void;
}

export function ElementiArchitettoniciPanel({ analisi, value, onChange }: Props) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasElements =
    analisi.presenza_cornici_finestre ||
    analisi.presenza_marcapiani ||
    analisi.presenza_zoccolatura;

  if (!hasElements) {
    return (
      <div className="p-3 rounded-xl bg-muted/50 border border-border">
        <p className="text-xs text-muted-foreground">
          Nessun elemento architettonico rilevato (cornici, marcapiani) — il configuratore non è disponibile.
        </p>
      </div>
    );
  }

  const detectedSummary = [
    analisi.presenza_cornici_finestre && "cornici finestre",
    analisi.presenza_marcapiani && "marcapiani",
    analisi.presenza_zoccolatura && "zoccolatura",
  ].filter(Boolean).join(" · ");

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span>🏛️</span>
          <div className="text-left">
            <p className="text-sm font-medium text-foreground">Elementi architettonici</p>
            <p className="text-[11px] text-muted-foreground">{detectedSummary} rilevati</p>
          </div>
        </div>
        {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-border pt-3">
          {/* ── CORNICI FINESTRE ── */}
          {analisi.presenza_cornici_finestre && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Cornici finestre</p>
                  <p className="text-[11px] text-muted-foreground">
                    Attuale: {analisi.colore_cornici || "non rilevato"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Cambia colore</span>
                  <button
                    onClick={() =>
                      onChange({
                        ...value,
                        cornici_finestre: { ...value.cornici_finestre, cambia: !value.cornici_finestre.cambia },
                      })
                    }
                    className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                      value.cornici_finestre.cambia ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
                        value.cornici_finestre.cambia ? "translate-x-5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {value.cornici_finestre.cambia && (
                <div className="grid grid-cols-5 gap-1.5">
                  {COLORI_CORNICI.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() =>
                        onChange({
                          ...value,
                          cornici_finestre: {
                            ...value.cornici_finestre,
                            colore_name: c.name,
                            colore_hex: c.hex,
                            prompt_fragment: c.prompt_fragment,
                          },
                        })
                      }
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                        value.cornici_finestre.colore_hex === c.hex
                          ? "ring-2 ring-primary ring-offset-1"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[9px] text-muted-foreground leading-tight text-center">
                        {c.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── MARCAPIANI ── */}
          {analisi.presenza_marcapiani && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">Fasce marcapiano</p>
                  <p className="text-[11px] text-muted-foreground">Bande orizzontali tra i piani</p>
                </div>
                <button
                  onClick={() =>
                    onChange({
                      ...value,
                      marcapiani: { ...value.marcapiani, cambia: !value.marcapiani.cambia },
                    })
                  }
                  className={`w-10 h-5 rounded-full transition-colors relative cursor-pointer ${
                    value.marcapiani.cambia ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-background shadow transition-transform ${
                      value.marcapiani.cambia ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>

              {value.marcapiani.cambia && (
                <div className="grid grid-cols-5 gap-1.5">
                  {COLORI_CORNICI.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() =>
                        onChange({
                          ...value,
                          marcapiani: { ...value.marcapiani, colore_name: c.name, colore_hex: c.hex },
                        })
                      }
                      className={`flex flex-col items-center gap-1 p-1.5 rounded-lg ${
                        value.marcapiani.colore_hex === c.hex
                          ? "ring-2 ring-primary ring-offset-1"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: c.hex }}
                      />
                      <span className="text-[9px] text-muted-foreground leading-tight text-center">
                        {c.name.split(" ")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
