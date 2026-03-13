import { useState } from "react";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import type { ConfigColoreIntonaco, FinituraIntonaco } from "../lib/facciataPromptBuilder";
import { FINITURA_PROMPTS } from "../lib/facciataPromptBuilder";

// ── Preset colori statici ──────────────────────────────────────
const COLORI_INTONACO: Omit<ConfigColoreIntonaco, "finitura" | "finitura_prompt">[] = [
  { colore_id: "bianco_puro", colore_name: "Bianco Puro", colore_hex: "#F5F5F0", prompt_fragment: "pure bright white smooth plaster — clean neutral Scandinavian appearance, maximum brightness" },
  { colore_id: "bianco_antico", colore_name: "Bianco Antico", colore_hex: "#EDE8DC", prompt_fragment: "antique warm white plaster with slight cream undertone — classic Italian residential" },
  { colore_id: "bianco_calce", colore_name: "Bianco Calce", colore_hex: "#F0EDE4", prompt_fragment: "lime-white plaster — slightly chalky warm white, traditional Mediterranean" },
  { colore_id: "avorio_caldo", colore_name: "Avorio Caldo", colore_hex: "#F0E6D0", prompt_fragment: "warm ivory plaster — creamy warm white with golden undertone" },
  { colore_id: "beige_sabbia", colore_name: "Beige Sabbia", colore_hex: "#D4C4A8", prompt_fragment: "sandy beige plaster — warm neutral tone, very common on Italian single-family homes" },
  { colore_id: "beige_tortora", colore_name: "Beige Tortora", colore_hex: "#B0A090", prompt_fragment: "taupe beige plaster — warm grey-brown, elegant and modern" },
  { colore_id: "beige_rosa", colore_name: "Beige Rosa", colore_hex: "#D4B8A8", prompt_fragment: "rosy beige plaster — warm pinkish beige, delicate Mediterranean tone" },
  { colore_id: "beige_caldo", colore_name: "Beige Caldo", colore_hex: "#C8B89A", prompt_fragment: "warm beige plaster — golden undertone, sun-kissed Mediterranean look" },
  { colore_id: "sabbia_deserto", colore_name: "Sabbia Deserto", colore_hex: "#C8B078", prompt_fragment: "desert sand plaster — warm golden sand tone, sun-baked appearance" },
  { colore_id: "ocra_classica", colore_name: "Ocra Classica", colore_hex: "#C8922A", prompt_fragment: "classic ochre yellow plaster — warm saturated yellow-orange, typical Emilian and Venetian historic facades" },
  { colore_id: "ocra_pallida", colore_name: "Ocra Pallida", colore_hex: "#D8C080", prompt_fragment: "pale ochre plaster — soft warm golden yellow, subtle and elegant" },
  { colore_id: "giallo_paglierino", colore_name: "Giallo Paglierino", colore_hex: "#E8D88C", prompt_fragment: "straw yellow plaster — soft pale yellow, Emilian countryside farmhouse tone" },
  { colore_id: "giallo_siena", colore_name: "Giallo Siena", colore_hex: "#D4A030", prompt_fragment: "Siena yellow plaster — deep warm golden yellow, Tuscan Renaissance facades" },
  { colore_id: "giallo_limone", colore_name: "Giallo Limone", colore_hex: "#E8D060", prompt_fragment: "lemon yellow plaster — bright fresh yellow, Ligurian coastal buildings" },
  { colore_id: "terracotta", colore_name: "Terracotta", colore_hex: "#B86840", prompt_fragment: "terracotta plaster — warm earth-red, Tuscan and Umbrian hill town facades" },
  { colore_id: "arancio_veneziano", colore_name: "Arancio Veneziano", colore_hex: "#D87848", prompt_fragment: "Venetian orange plaster — warm burnt orange, iconic Venetian canal-side building color" },
  { colore_id: "rosa_antico", colore_name: "Rosa Antico", colore_hex: "#C8A098", prompt_fragment: "antique pink plaster — muted dusty rose, Ligurian and Venetian coastal buildings" },
  { colore_id: "rosso_pompeiano", colore_name: "Rosso Pompeiano", colore_hex: "#A04030", prompt_fragment: "Pompeian red plaster — deep earth red, ancient Roman and Pompeian villa aesthetic" },
  { colore_id: "grigio_perla", colore_name: "Grigio Perla", colore_hex: "#B8B4B0", prompt_fragment: "pearl grey plaster — neutral light grey with warm undertone" },
  { colore_id: "grigio_chiaro", colore_name: "Grigio Chiaro", colore_hex: "#D0CCC8", prompt_fragment: "light grey plaster — very pale neutral grey, clean modern appearance" },
  { colore_id: "grigio_cemento", colore_name: "Grigio Cemento", colore_hex: "#9A9A98", prompt_fragment: "concrete grey plaster — medium neutral grey, industrial modern aesthetic" },
  { colore_id: "grigio_tortora", colore_name: "Grigio Tortora", colore_hex: "#A09888", prompt_fragment: "taupe grey plaster — warm grey with brown undertone, contemporary elegance" },
  { colore_id: "grigio_antracite", colore_name: "Grigio Antracite", colore_hex: "#484848", prompt_fragment: "anthracite dark grey plaster — very dark grey, modern premium contemporary facades" },
  { colore_id: "verde_salvia", colore_name: "Verde Salvia", colore_hex: "#8A9878", prompt_fragment: "sage green plaster — muted grey-green, organic contemporary aesthetic" },
  { colore_id: "verde_bosco", colore_name: "Verde Bosco", colore_hex: "#5A7058", prompt_fragment: "forest green plaster — deep muted green, natural earthy appearance" },
  { colore_id: "azzurro_polvere", colore_name: "Azzurro Polvere", colore_hex: "#A0B8C8", prompt_fragment: "powder blue plaster — soft muted sky blue, coastal Mediterranean aesthetic" },
];

// ── Gruppi cromatici ───────────────────────────────────────────
const COLOR_GROUPS = [
  { key: "popolari", label: "⭐ Più usati", tags: ["bianco_puro", "bianco_antico", "beige_sabbia", "grigio_perla", "beige_tortora", "ocra_classica", "terracotta", "grigio_antracite"] },
  { key: "bianchi", label: "Bianchi / Avori", tags: ["bianco_puro", "bianco_antico", "bianco_calce", "avorio_caldo"] },
  { key: "beige", label: "Beige / Sabbia", tags: ["beige_sabbia", "beige_tortora", "beige_rosa", "beige_caldo", "sabbia_deserto"] },
  { key: "ocra", label: "Ocra / Giallo", tags: ["ocra_classica", "ocra_pallida", "giallo_paglierino", "giallo_siena", "giallo_limone"] },
  { key: "caldi", label: "Caldi / Terracotta", tags: ["terracotta", "arancio_veneziano", "rosa_antico", "rosso_pompeiano"] },
  { key: "grigi", label: "Grigi", tags: ["grigio_chiaro", "grigio_perla", "grigio_cemento", "grigio_tortora", "grigio_antracite"] },
  { key: "verdi", label: "Verdi / Naturali", tags: ["verde_salvia", "verde_bosco", "azzurro_polvere"] },
];

// ── Finiture ───────────────────────────────────────────────────
const FINITURE: { value: FinituraIntonaco; label: string; sub: string; emoji: string }[] = [
  { value: "liscio", label: "Liscio", sub: "Superficie piatta, no texture", emoji: "▬" },
  { value: "rasato", label: "Rasato", sub: "Quasi liscio, 0.3-0.5mm", emoji: "◌" },
  { value: "graffiato_fine", label: "Graffiato Fine", sub: "1.0-1.5mm — il più diffuso", emoji: "≋" },
  { value: "graffiato_medio", label: "Graffiato Medio", sub: "2.0-2.5mm — più pronunciato", emoji: "≡" },
  { value: "bucciato", label: "Bucciato", sub: "Buccia d'arancia — anni '70-'90", emoji: "🟠" },
  { value: "strutturato_grosso", label: "Strutturato", sub: "3.0-4.0mm — rustico/grezzo", emoji: "🪨" },
  { value: "rustico", label: "Rustico", sub: "Irregolare, cascine e ville", emoji: "🏡" },
  { value: "bugnato", label: "Bugnato", sub: "Blocchi a rilievo — neoclassico", emoji: "⊞" },
  { value: "veneziana", label: "Veneziana", sub: "Stucco lucidato — prestigioso", emoji: "✨" },
];

interface Props {
  value: ConfigColoreIntonaco;
  onChange: (v: ConfigColoreIntonaco) => void;
  label?: string;
}

export function ColoreIntonacoSelector({ value, onChange, label = "Colore e finitura intonaco" }: Props) {
  const [openGroup, setOpenGroup] = useState("popolari");
  const [showFinitura, setShowFinitura] = useState(false);

  const getGroupPresets = (group: typeof COLOR_GROUPS[number]) => {
    return group.tags.map(tag => COLORI_INTONACO.find(c => c.colore_id === tag)).filter(Boolean) as typeof COLORI_INTONACO;
  };

  const handleSelectColor = (preset: typeof COLORI_INTONACO[number]) => {
    onChange({
      ...value,
      colore_id: preset.colore_id,
      colore_name: preset.colore_name,
      colore_hex: preset.colore_hex,
      prompt_fragment: preset.prompt_fragment,
    });
  };

  const handleSelectFinitura = (fin: FinituraIntonaco) => {
    onChange({ ...value, finitura: fin, finitura_prompt: FINITURA_PROMPTS[fin] });
  };

  return (
    <div className="space-y-3">
      {label && <p className="text-sm font-semibold text-foreground">{label}</p>}

      {/* ── Colore selezionato (anteprima) ── */}
      {value.colore_id && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border">
          <div
            className="w-10 h-10 rounded-lg border border-border shadow-sm flex-shrink-0"
            style={{ backgroundColor: value.colore_hex }}
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground">{value.colore_name}</p>
            <p className="text-xs text-muted-foreground">
              {value.colore_hex} · Finitura: {value.finitura.replace(/_/g, " ")}
            </p>
          </div>
          <Check className="w-4 h-4 text-primary flex-shrink-0" />
        </div>
      )}

      {/* ── Gruppi colori espandibili ── */}
      <div className="border border-border rounded-xl overflow-hidden divide-y divide-border">
        {COLOR_GROUPS.map((group) => {
          const groupPresets = getGroupPresets(group);
          if (!groupPresets.length) return null;
          const isOpen = openGroup === group.key;

          return (
            <div key={group.key}>
              <button
                onClick={() => setOpenGroup(isOpen ? "" : group.key)}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2 text-sm">
                  {/* Mini swatches */}
                  <div className="flex -space-x-1">
                    {groupPresets.slice(0, 5).map((p) => (
                      <div
                        key={p.colore_id}
                        className="w-4 h-4 rounded-full border border-background"
                        style={{ backgroundColor: p.colore_hex }}
                      />
                    ))}
                  </div>
                  <span className="font-medium text-foreground">{group.label}</span>
                  <span className="text-xs text-muted-foreground">({groupPresets.length})</span>
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>

              {isOpen && (
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 px-3 pb-3">
                  {groupPresets.map((preset) => (
                    <button
                      key={preset.colore_id}
                      onClick={() => handleSelectColor(preset)}
                      className={`group relative flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all ${
                        value.colore_id === preset.colore_id
                          ? "ring-2 ring-primary ring-offset-1"
                          : "hover:bg-muted/60"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full border border-border shadow-sm"
                        style={{ backgroundColor: preset.colore_hex }}
                      />
                      {value.colore_id === preset.colore_id && (
                        <div className="absolute top-1 right-1">
                          <Check className="w-3 h-3 text-primary" />
                        </div>
                      )}
                      <span className="text-[10px] text-muted-foreground leading-tight text-center truncate w-full">
                        {preset.colore_name.split(" ").slice(0, 2).join(" ")}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Selettore finitura ── */}
      <div className="border border-border rounded-xl overflow-hidden">
        <button
          onClick={() => setShowFinitura(!showFinitura)}
          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/50 transition-colors"
        >
          <div className="flex items-center gap-2 text-sm">
            <span>{FINITURE.find(f => f.value === value.finitura)?.emoji}</span>
            <span className="font-medium text-foreground">
              Finitura: {FINITURE.find(f => f.value === value.finitura)?.label || "Seleziona"}
            </span>
          </div>
          {showFinitura ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
        </button>

        {showFinitura && (
          <div className="grid grid-cols-3 gap-1.5 px-3 pb-3">
            {FINITURE.map((fin) => (
              <button
                key={fin.value}
                onClick={() => { handleSelectFinitura(fin.value); setShowFinitura(false); }}
                className={`flex flex-col items-center gap-1.5 p-2.5 rounded-xl border text-center transition-all ${
                  value.finitura === fin.value
                    ? "border-primary ring-1 ring-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <span className="text-lg">{fin.emoji}</span>
                <p className="text-xs font-medium text-foreground">{fin.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight">{fin.sub}</p>
                {value.finitura === fin.value && <Check className="w-3 h-3 text-primary" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
