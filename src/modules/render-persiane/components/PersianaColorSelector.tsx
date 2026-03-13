import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { MaterialePersiana } from "../lib/persianePromptBuilder";
import { RalColorPicker, type RalColor as RalPickerColor, type WoodEffect, type ColorMode } from "@/components/render/RalColorPicker";

export interface RalColorData {
  ral: string;
  name: string;
  hex: string;
}

export interface WoodData {
  id: string;
  name: string;
  name_en: string;
  prompt_fragment: string;
}

interface Props {
  mode: "ral" | "legno";
  onModeChange: (m: "ral" | "legno") => void;
  ralValue: RalColorData | null;
  onRalChange: (v: RalColorData | null) => void;
  woodValue: WoodData | null;
  onWoodChange: (v: WoodData | null) => void;
  materialePersiana: MaterialePersiana;
  label?: string;
}

// Quick pick RAL colors for shutters
const RAL_PERSIANE_QUICK: { ral: string; name: string; hex: string }[] = [
  { ral: "9016", name: "Bianco traffico", hex: "#F1F0EB" },
  { ral: "9010", name: "Bianco puro", hex: "#F4F4F4" },
  { ral: "9005", name: "Nero intenso", hex: "#0A0A0A" },
  { ral: "7016", name: "Grigio antracite", hex: "#383E42" },
  { ral: "7021", name: "Grigio nerastro", hex: "#2E3234" },
  { ral: "6005", name: "Verde muschio", hex: "#2F4538" },
  { ral: "6009", name: "Verde abete", hex: "#2B3D2A" },
  { ral: "3005", name: "Rosso vino", hex: "#5E2028" },
  { ral: "8017", name: "Marrone cioccolato", hex: "#3E2723" },
  { ral: "1013", name: "Bianco perla", hex: "#EAE0D0" },
  { ral: "5014", name: "Blu colomba", hex: "#637D96" },
  { ral: "5015", name: "Blu cielo", hex: "#2980B9" },
];

// Wood effects for shutters
const WOOD_EFFECTS_PERSIANE: WoodData[] = [
  { id: "larice_naturale", name: "Larice naturale", name_en: "Natural larch", prompt_fragment: "natural larch wood with visible grain, warm honey-golden tones, authentic alpine character" },
  { id: "pino_verniciato", name: "Pino verniciato", name_en: "Painted pine", prompt_fragment: "painted pine wood with light warm grain, creamy white base coat, traditional shutter appearance" },
  { id: "noce_scuro", name: "Noce scuro", name_en: "Dark walnut", prompt_fragment: "dark walnut wood finish with deep chocolate-brown tones and rich grain pattern" },
  { id: "iroko_tropicale", name: "Iroko tropicale", name_en: "Iroko tropical", prompt_fragment: "iroko tropical hardwood with medium-brown color, interlocked grain, weather-resistant appearance" },
  { id: "rovere_grigio", name: "Rovere grigio", name_en: "Grey oak", prompt_fragment: "grey washed oak wood with silver-grey tones, distinctive grain pattern, Nordic weathered look" },
  { id: "castagno_rustico", name: "Castagno rustico", name_en: "Rustic chestnut", prompt_fragment: "rustic chestnut wood with warm reddish-brown tones, traditional Italian countryside appearance" },
  { id: "abete_bianco", name: "Abete bianco", name_en: "White fir", prompt_fragment: "white fir wood with light cream color, fine straight grain, classic alpine shutter look" },
  { id: "teak_vintage", name: "Teak vintage", name_en: "Vintage teak", prompt_fragment: "vintage aged teak with golden-brown weathered tones, irregular grain, artisanal patina" },
];

const WOOD_SUGGESTIONS: Record<string, string[]> = {
  legno_naturale: ["larice_naturale", "pino_verniciato", "iroko_tropicale", "abete_bianco", "castagno_rustico"],
  legno_composito: ["rovere_grigio", "noce_scuro", "larice_naturale", "teak_vintage"],
  pvc: ["rovere_grigio", "noce_scuro", "larice_naturale"],
  alluminio: ["noce_scuro", "teak_vintage", "rovere_grigio"],
  acciaio: [],
  fibra_vetro: ["noce_scuro", "larice_naturale", "rovere_grigio"],
};

export function PersianaColorSelector({
  mode, onModeChange,
  ralValue, onRalChange,
  woodValue, onWoodChange,
  materialePersiana,
  label = "Colore persiana",
}: Props) {
  const [showAllWoods, setShowAllWoods] = useState(false);
  const [showFullRalPicker, setShowFullRalPicker] = useState(false);

  const canUseLegno = materialePersiana !== "acciaio" && materialePersiana !== "ferro_battuto";
  const suggestedWoodIds = WOOD_SUGGESTIONS[materialePersiana] ?? [];
  const displayedWoods = showAllWoods
    ? WOOD_EFFECTS_PERSIANE
    : WOOD_EFFECTS_PERSIANE.filter((w) => suggestedWoodIds.includes(w.id));

  return (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">{label}</Label>

      {/* Tab RAL / Legno */}
      <div className="flex rounded-xl border border-border overflow-hidden">
        <button
          onClick={() => onModeChange("ral")}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "ral"
              ? "bg-primary text-primary-foreground"
              : "bg-background text-muted-foreground hover:bg-muted/50"
          }`}
        >
          🎨 Colore RAL
        </button>
        <button
          onClick={() => canUseLegno && onModeChange("legno")}
          disabled={!canUseLegno}
          className={`flex-1 py-2 text-sm font-medium transition-colors ${
            mode === "legno"
              ? "bg-primary text-primary-foreground"
              : canUseLegno
              ? "bg-background text-muted-foreground hover:bg-muted/50"
              : "bg-muted text-muted-foreground/50 cursor-not-allowed"
          }`}
        >
          🪵 Effetto legno
          {!canUseLegno && <span className="text-[10px] block">(N/D)</span>}
        </button>
      </div>

      {/* TAB RAL */}
      {mode === "ral" && (
        <div className="space-y-3">
          {/* Quick picks */}
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Colori più scelti per persiane:</p>
            <div className="grid grid-cols-6 gap-2">
              {RAL_PERSIANE_QUICK.map((ral) => (
                <button
                  key={ral.ral}
                  onClick={() => onRalChange(ral)}
                  title={`RAL ${ral.ral} — ${ral.name}`}
                  className={`aspect-square rounded-lg border-2 transition-all relative ${
                    ralValue?.ral === ral.ral
                      ? "border-primary scale-110 shadow-md ring-1 ring-primary/30"
                      : "border-transparent hover:border-muted-foreground/30 hover:scale-105"
                  }`}
                  style={{ backgroundColor: ral.hex }}
                >
                  {ralValue?.ral === ral.ral && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Check className="w-3 h-3 text-primary-foreground drop-shadow-md" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {ralValue && (
              <p className="text-xs text-foreground font-medium flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm border border-border inline-block" style={{ backgroundColor: ralValue.hex }} />
                RAL {ralValue.ral} — {ralValue.name}
              </p>
            )}
          </div>

          {/* Full picker collapsible */}
          <Collapsible open={showFullRalPicker} onOpenChange={setShowFullRalPicker}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm text-primary hover:text-primary/80">
              {showFullRalPicker ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              Tutti i colori RAL →
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <RalColorPicker
                colorMode="ral"
                onColorModeChange={() => {}}
                ralValue={ralValue?.ral ?? null}
                onRalChange={(c: RalPickerColor) => onRalChange({ ral: c.ral, name: c.name, hex: c.hex })}
                woodValue={null}
                onWoodChange={() => {}}
              />
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}

      {/* TAB LEGNO */}
      {mode === "legno" && canUseLegno && (
        <div className="space-y-3">
          {suggestedWoodIds.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Legni consigliati per persiane in {materialePersiana.replace(/_/g, " ")}:
            </p>
          )}

          <div className="grid grid-cols-2 gap-2">
            {displayedWoods.map((wood) => {
              const isSelected = woodValue?.id === wood.id;
              const isSuggested = suggestedWoodIds.includes(wood.id);
              return (
                <button
                  key={wood.id}
                  onClick={() => onWoodChange(wood)}
                  className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    isSelected
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <span className="text-xl flex-shrink-0">🪵</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-foreground">{wood.name}</span>
                      {isSuggested && !showAllWoods && (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0">✓</Badge>
                      )}
                    </div>
                    <p className="text-[10px] text-muted-foreground">"{wood.name_en}"</p>
                  </div>
                  {isSelected && <Check className="w-3.5 h-3.5 text-primary flex-shrink-0 ml-auto" />}
                </button>
              );
            })}
          </div>

          {suggestedWoodIds.length > 0 && WOOD_EFFECTS_PERSIANE.length > suggestedWoodIds.length && (
            <button
              onClick={() => setShowAllWoods(!showAllWoods)}
              className="text-sm text-primary hover:text-primary/80"
            >
              {showAllWoods ? "Mostra solo consigliati" : `Mostra tutti (${WOOD_EFFECTS_PERSIANE.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
