import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ConfigColoreIntonaco, FinituraIntonaco } from "../lib/facciataPromptBuilder";
import { FINITURA_PROMPTS } from "../lib/facciataPromptBuilder";

interface Props {
  value: ConfigColoreIntonaco;
  onChange: (v: ConfigColoreIntonaco) => void;
}

const COLORI_INTONACO: Omit<ConfigColoreIntonaco, "finitura" | "finitura_prompt">[] = [
  { colore_id: "bianco_puro", colore_name: "Bianco Puro", colore_hex: "#F5F5F0", prompt_fragment: "pure bright white smooth plaster — clean neutral Scandinavian appearance, maximum brightness" },
  { colore_id: "bianco_antico", colore_name: "Bianco Antico", colore_hex: "#EDE8DC", prompt_fragment: "antique warm white plaster with slight cream undertone — classic Italian residential" },
  { colore_id: "bianco_calce", colore_name: "Bianco Calce", colore_hex: "#F0EDE4", prompt_fragment: "lime-white plaster — slightly chalky warm white, traditional Mediterranean" },
  { colore_id: "beige_sabbia", colore_name: "Beige Sabbia", colore_hex: "#D4C4A8", prompt_fragment: "sandy beige plaster — warm neutral tone, very common on Italian single-family homes" },
  { colore_id: "beige_caldo", colore_name: "Beige Caldo", colore_hex: "#C8B89A", prompt_fragment: "warm beige plaster — golden undertone, sun-kissed Mediterranean look" },
  { colore_id: "giallo_paglierino", colore_name: "Giallo Paglierino", colore_hex: "#E8D88C", prompt_fragment: "straw yellow plaster — soft pale yellow, Emilian countryside farmhouse tone" },
  { colore_id: "ocra_classica", colore_name: "Ocra Classica", colore_hex: "#C8922A", prompt_fragment: "classic ochre yellow plaster — warm saturated yellow-orange, typical Emilian and Venetian historic facades" },
  { colore_id: "rosa_antico", colore_name: "Rosa Antico", colore_hex: "#C8A098", prompt_fragment: "antique pink plaster — muted dusty rose, Ligurian and Venetian coastal buildings" },
  { colore_id: "terracotta", colore_name: "Terracotta", colore_hex: "#B86840", prompt_fragment: "terracotta plaster — warm earth-red, Tuscan and Umbrian hill town facades" },
  { colore_id: "grigio_perla", colore_name: "Grigio Perla", colore_hex: "#B8B4B0", prompt_fragment: "pearl grey plaster — neutral light grey with warm undertone" },
  { colore_id: "grigio_antracite", colore_name: "Grigio Antracite", colore_hex: "#484848", prompt_fragment: "anthracite dark grey plaster — very dark grey, modern premium contemporary facades" },
  { colore_id: "verde_salvia", colore_name: "Verde Salvia", colore_hex: "#8A9878", prompt_fragment: "sage green plaster — muted grey-green, organic contemporary aesthetic" },
  { colore_id: "azzurro_polvere", colore_name: "Azzurro Polvere", colore_hex: "#A0B8C8", prompt_fragment: "powder blue plaster — soft muted sky blue, coastal Mediterranean aesthetic" },
];

const FINITURE: { value: FinituraIntonaco; label: string }[] = [
  { value: "liscio", label: "Liscio" },
  { value: "rasato", label: "Rasato" },
  { value: "graffiato_fine", label: "Graffiato Fine" },
  { value: "graffiato_medio", label: "Graffiato Medio" },
  { value: "bucciato", label: "Bucciato" },
  { value: "strutturato_grosso", label: "Strutturato Grosso" },
  { value: "rustico", label: "Rustico" },
  { value: "veneziana", label: "Veneziana" },
  { value: "bugnato", label: "Bugnato" },
];

export function ColoreIntonacoSelector({ value, onChange }: Props) {
  const handleColorChange = (coloreId: string) => {
    const c = COLORI_INTONACO.find(x => x.colore_id === coloreId);
    if (c) onChange({ ...value, ...c });
  };

  const handleFinituraChange = (f: string) => {
    const finitura = f as FinituraIntonaco;
    onChange({ ...value, finitura, finitura_prompt: FINITURA_PROMPTS[finitura] });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-sm font-medium mb-2 block">Colore intonaco</Label>
        <div className="grid grid-cols-5 sm:grid-cols-7 gap-2">
          {COLORI_INTONACO.map(c => (
            <button
              key={c.colore_id}
              onClick={() => handleColorChange(c.colore_id)}
              className={`group flex flex-col items-center gap-1 p-1.5 rounded-lg border-2 transition-all ${
                value.colore_id === c.colore_id
                  ? "border-primary ring-1 ring-primary/30"
                  : "border-transparent hover:border-border"
              }`}
              title={c.colore_name}
            >
              <div
                className="w-8 h-8 rounded-full border border-border shadow-sm"
                style={{ backgroundColor: c.colore_hex }}
              />
              <span className="text-[10px] text-muted-foreground leading-tight text-center truncate w-full">
                {c.colore_name}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-medium mb-1.5 block">Finitura</Label>
        <Select value={value.finitura} onValueChange={handleFinituraChange}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FINITURE.map(f => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Preview swatch */}
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div
          className="w-10 h-10 rounded-lg border border-border shadow-sm"
          style={{ backgroundColor: value.colore_hex }}
        />
        <div className="text-sm">
          <p className="font-medium text-foreground">{value.colore_name}</p>
          <p className="text-xs text-muted-foreground">
            {value.finitura.replace(/_/g, " ")} · {value.colore_hex}
          </p>
        </div>
      </div>
    </div>
  );
}
