import { useState } from "react";
import { Check } from "lucide-react";
import type { ConfigRivestimento, ZonaApplicazione, TipoRivestimento } from "../lib/facciataPromptBuilder";
import { RIVESTIMENTO_PROMPTS, ZONA_PROMPTS } from "../lib/facciataPromptBuilder";

// ── CSS pattern per anteprima materiale ──────────────────────────
function getMaterialPattern(tipo: string): React.CSSProperties {
  const patterns: Record<string, React.CSSProperties> = {
    pietra_serena:    { background: "repeating-linear-gradient(0deg, #7A8080 0px, #7A8080 12px, #696969 12px, #696969 14px), repeating-linear-gradient(90deg, transparent 0px, transparent 18px, #696969 18px, #696969 20px)" },
    travertino:       { background: "repeating-linear-gradient(5deg, #D4C4A0 0px, #D4C4A0 8px, #C0AA80 8px, #C0AA80 9px, #D4C4A0 9px, #D4C4A0 20px)" },
    arenaria_beige:   { background: "repeating-linear-gradient(2deg, #C8A870 0px, #C8A870 10px, #B89860 10px, #B89860 11px, #C8A870 11px, #C8A870 24px)" },
    luserna:          { backgroundColor: "#686870" },
    marmo_bianco:     { backgroundColor: "#F0EEEC" },
    porfido:          { backgroundColor: "#7A5858" },
    splitface_grigio: { background: "repeating-linear-gradient(80deg, #888890 0px, #888890 4px, #6A6A72 4px, #6A6A72 5px, #888890 5px, #888890 9px)" },
    pietra_rustica:   { background: "linear-gradient(135deg, #A09070 25%, #8A7A60 25%, #8A7A60 50%, #A09070 50%, #A09070 75%, #8A7A60 75%)", backgroundSize: "8px 8px" },
    cotto_rosso:      { background: "repeating-linear-gradient(0deg, #A84030 0px, #A84030 14px, #8A3020 14px, #8A3020 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 30px, #8A3020 30px, #8A3020 32px)" },
    clinker_rosso:    { background: "repeating-linear-gradient(0deg, #9A3828 0px, #9A3828 15px, #7A2818 15px, #7A2818 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 26px, #7A2818 26px, #7A2818 28px)" },
    clinker_grigio:   { background: "repeating-linear-gradient(0deg, #707070 0px, #707070 15px, #505050 15px, #505050 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 26px, #505050 26px, #505050 28px)" },
    clinker_beige:    { background: "repeating-linear-gradient(0deg, #C0A878 0px, #C0A878 15px, #A08858 15px, #A08858 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 26px, #A08858 26px, #A08858 28px)" },
    cotto_mattone:    { background: "repeating-linear-gradient(0deg, #B85838 0px, #B85838 14px, #983828 14px, #983828 16px), repeating-linear-gradient(90deg, transparent 0px, transparent 28px, #983828 28px, #983828 30px)" },
    laterizio_bianco: { backgroundColor: "#E0D8D0" },
  };
  return patterns[tipo] || { backgroundColor: "#C0A878" };
}

// ── Materiali statici ────────────────────────────────────────────
const MATERIALI: { tipo: TipoRivestimento; name: string; cat: "pietra" | "laterizio" }[] = [
  { tipo: "pietra_serena", name: "Pietra Serena", cat: "pietra" },
  { tipo: "travertino", name: "Travertino", cat: "pietra" },
  { tipo: "arenaria_beige", name: "Arenaria Beige", cat: "pietra" },
  { tipo: "luserna", name: "Luserna", cat: "pietra" },
  { tipo: "marmo_bianco", name: "Marmo Bianco", cat: "pietra" },
  { tipo: "porfido", name: "Porfido", cat: "pietra" },
  { tipo: "splitface_grigio", name: "Splitface Grigio", cat: "pietra" },
  { tipo: "pietra_rustica", name: "Pietra Rustica", cat: "pietra" },
  { tipo: "cotto_rosso", name: "Cotto Rosso", cat: "laterizio" },
  { tipo: "clinker_rosso", name: "Clinker Rosso", cat: "laterizio" },
  { tipo: "clinker_grigio", name: "Clinker Grigio", cat: "laterizio" },
  { tipo: "clinker_beige", name: "Clinker Beige", cat: "laterizio" },
  { tipo: "cotto_mattone", name: "Cotto Mattone", cat: "laterizio" },
  { tipo: "laterizio_bianco", name: "Laterizio Bianco", cat: "laterizio" },
];

const ZONE_OPZIONI: { value: ZonaApplicazione; label: string; sub: string; emoji: string }[] = [
  { value: "tutta", label: "Tutta la facciata", sub: "Dal suolo al tetto", emoji: "🏠" },
  { value: "piano_terra", label: "Piano terra", sub: "Solo piano inferiore", emoji: "⬇️" },
  { value: "piani_sup", label: "Piani superiori", sub: "Dal primo piano in su", emoji: "⬆️" },
  { value: "zoccolatura", label: "Zoccolatura", sub: "Fascia bassa 80-120cm", emoji: "▁" },
  { value: "cantonali", label: "Cantonali", sub: "Solo angoli edificio", emoji: "◤" },
  { value: "marcapiano", label: "Fascia marcapiano", sub: "Banda orizzontale tra piani", emoji: "═" },
];

interface Props {
  value: ConfigRivestimento | null;
  onChange: (v: ConfigRivestimento) => void;
  showZona?: boolean;
  defaultZona?: ZonaApplicazione;
}

export function RivestimentoPicker({ value, onChange, showZona = true, defaultZona = "tutta" }: Props) {
  const [activeCat, setActiveCat] = useState<"pietra" | "laterizio">("pietra");

  const activePresets = MATERIALI.filter(m => m.cat === activeCat);

  const handleSelectMateriale = (mat: typeof MATERIALI[number]) => {
    onChange({
      tipo: mat.tipo,
      tipo_name: mat.name,
      tipo_prompt: RIVESTIMENTO_PROMPTS[mat.tipo] || "",
      zona: value?.zona || defaultZona,
      zona_prompt: ZONA_PROMPTS[value?.zona || defaultZona],
    });
  };

  const handleSelectZona = (zona: ZonaApplicazione) => {
    if (!value) return;
    onChange({ ...value, zona, zona_prompt: ZONA_PROMPTS[zona] });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-foreground">Tipo di rivestimento</p>

      {/* ── Tab categoria ── */}
      <div className="flex rounded-lg border border-border overflow-hidden">
        {(["pietra", "laterizio"] as const).map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCat(cat)}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeCat === cat
                ? "bg-primary text-primary-foreground"
                : "bg-background text-muted-foreground hover:bg-muted/50"
            }`}
          >
            {cat === "pietra" ? "🪨 Pietra / Marmo" : "🧱 Laterizio / Clinker"}
          </button>
        ))}
      </div>

      {/* ── Materiale selezionato (anteprima) ── */}
      {value?.tipo && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
          <div
            className="w-10 h-10 rounded-lg border border-border shadow-sm flex-shrink-0"
            style={getMaterialPattern(value.tipo)}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{value.tipo_name}</p>
            <p className="text-xs text-muted-foreground">
              {activeCat === "pietra" ? "Pietra" : "Laterizio"} · Zona: {value.zona.replace(/_/g, " ")}
            </p>
          </div>
          <Check className="w-4 h-4 text-primary flex-shrink-0" />
        </div>
      )}

      {/* ── Grid materiali ── */}
      <div className="space-y-2">
        {activePresets.map((mat) => (
          <button
            key={mat.tipo}
            onClick={() => handleSelectMateriale(mat)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
              value?.tipo === mat.tipo
                ? "border-primary ring-1 ring-primary bg-primary/5"
                : "border-border hover:border-primary/30"
            }`}
          >
            <div
              className="w-10 h-10 rounded-lg border border-border shadow-sm flex-shrink-0"
              style={getMaterialPattern(mat.tipo)}
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-foreground">{mat.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">
                {(RIVESTIMENTO_PROMPTS[mat.tipo] || "").slice(0, 60)}...
              </p>
            </div>
            {value?.tipo === mat.tipo && <Check className="w-4 h-4 text-primary flex-shrink-0" />}
          </button>
        ))}
      </div>

      {/* ── Zona applicazione ── */}
      {showZona && value?.tipo && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-foreground">Zona di applicazione</p>
          <div className="grid grid-cols-2 gap-2">
            {ZONE_OPZIONI.map((z) => (
              <button
                key={z.value}
                onClick={() => handleSelectZona(z.value)}
                className={`flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                  value?.zona === z.value
                    ? "border-primary ring-1 ring-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span>{z.emoji}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground">{z.label}</p>
                  <p className="text-[10px] text-muted-foreground">{z.sub}</p>
                </div>
                {value?.zona === z.value && <Check className="w-3 h-3 text-primary flex-shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
