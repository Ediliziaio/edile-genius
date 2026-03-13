import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ConfigRivestimento, TipoRivestimento, ZonaApplicazione } from "../lib/facciataPromptBuilder";
import { RIVESTIMENTO_PROMPTS, ZONA_PROMPTS } from "../lib/facciataPromptBuilder";

interface Props {
  value: ConfigRivestimento | null;
  onChange: (v: ConfigRivestimento) => void;
}

const MATERIALI: { tipo: TipoRivestimento; name: string; emoji: string; cat: "pietra" | "laterizio" }[] = [
  { tipo: "pietra_serena", name: "Pietra Serena", emoji: "🪨", cat: "pietra" },
  { tipo: "travertino", name: "Travertino", emoji: "🏛️", cat: "pietra" },
  { tipo: "arenaria_beige", name: "Arenaria Beige", emoji: "🏖️", cat: "pietra" },
  { tipo: "luserna", name: "Luserna", emoji: "💎", cat: "pietra" },
  { tipo: "marmo_bianco", name: "Marmo Bianco", emoji: "⬜", cat: "pietra" },
  { tipo: "porfido", name: "Porfido", emoji: "🟤", cat: "pietra" },
  { tipo: "splitface_grigio", name: "Splitface Grigio", emoji: "🧱", cat: "pietra" },
  { tipo: "pietra_rustica", name: "Pietra Rustica", emoji: "🪨", cat: "pietra" },
  { tipo: "cotto_rosso", name: "Cotto Rosso", emoji: "🧱", cat: "laterizio" },
  { tipo: "clinker_rosso", name: "Clinker Rosso", emoji: "🟥", cat: "laterizio" },
  { tipo: "clinker_grigio", name: "Clinker Grigio", emoji: "⬛", cat: "laterizio" },
  { tipo: "clinker_beige", name: "Clinker Beige", emoji: "🟨", cat: "laterizio" },
  { tipo: "cotto_mattone", name: "Cotto Mattone", emoji: "🧱", cat: "laterizio" },
  { tipo: "laterizio_bianco", name: "Laterizio Bianco", emoji: "⬜", cat: "laterizio" },
];

const ZONE: { value: ZonaApplicazione; label: string }[] = [
  { value: "tutta", label: "Tutta la facciata" },
  { value: "piano_terra", label: "Solo piano terra" },
  { value: "piani_sup", label: "Solo piani superiori" },
  { value: "zoccolatura", label: "Zoccolatura (base 80-120cm)" },
  { value: "cantonali", label: "Cantonali (angoli)" },
];

export function RivestimentoPicker({ value, onChange }: Props) {
  const handleMaterialChange = (tipo: TipoRivestimento) => {
    const mat = MATERIALI.find(m => m.tipo === tipo)!;
    const prompt = RIVESTIMENTO_PROMPTS[tipo] || tipo;
    const zona = value?.zona || "tutta";
    onChange({
      tipo,
      tipo_name: mat.name,
      tipo_prompt: prompt,
      zona,
      zona_prompt: ZONA_PROMPTS[zona],
    });
  };

  const handleZonaChange = (zona: string) => {
    const z = zona as ZonaApplicazione;
    if (value) {
      onChange({ ...value, zona: z, zona_prompt: ZONA_PROMPTS[z] });
    }
  };

  return (
    <div className="space-y-4">
      {/* Pietra */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Pietra naturale</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MATERIALI.filter(m => m.cat === "pietra").map(m => (
            <button
              key={m.tipo}
              onClick={() => handleMaterialChange(m.tipo)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-left text-sm transition-all ${
                value?.tipo === m.tipo
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span>{m.emoji}</span>
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Laterizio */}
      <div>
        <Label className="text-sm font-medium mb-2 block">Laterizio / Clinker</Label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {MATERIALI.filter(m => m.cat === "laterizio").map(m => (
            <button
              key={m.tipo}
              onClick={() => handleMaterialChange(m.tipo)}
              className={`flex items-center gap-2 p-2.5 rounded-lg border-2 text-left text-sm transition-all ${
                value?.tipo === m.tipo
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30"
              }`}
            >
              <span>{m.emoji}</span>
              <span className="truncate">{m.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Zona applicazione */}
      {value && (
        <div>
          <Label className="text-sm font-medium mb-1.5 block">Zona di applicazione</Label>
          <Select value={value.zona} onValueChange={handleZonaChange}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ZONE.map(z => (
                <SelectItem key={z.value} value={z.value}>{z.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
