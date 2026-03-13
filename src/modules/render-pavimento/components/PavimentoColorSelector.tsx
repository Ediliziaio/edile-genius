import { useState } from "react";
import { type TipoPavimento, type ColoreMode, type PavimentoColore } from "../lib/pavimentoPromptBuilder";
import { RalColorPicker, type RalColor } from "@/components/render/RalColorPicker";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface Props {
  value: PavimentoColore;
  onChange: (v: PavimentoColore) => void;
  tipoPavimento: TipoPavimento;
}

interface PaletteColor {
  code: string;
  name: string;
  hex: string;
}

const PALETTE_PER_TIPO: Partial<Record<TipoPavimento, PaletteColor[]>> = {
  parquet: [
    { code: "miele", name: "Miele dorato", hex: "#C8913A" },
    { code: "rovere_ch", name: "Rovere chiaro", hex: "#D4BA8A" },
    { code: "noce", name: "Noce", hex: "#6B4226" },
    { code: "wengé", name: "Wengé scuro", hex: "#3D2B1F" },
    { code: "grigio", name: "Grigio cenere", hex: "#A0998E" },
    { code: "bianco", name: "Bianco sbiancato", hex: "#E8DFD0" },
  ],
  ceramica: [
    { code: "bianco", name: "Bianco", hex: "#F5F5F5" },
    { code: "grigio_ch", name: "Grigio chiaro", hex: "#C8C8C8" },
    { code: "grigio_ant", name: "Grigio antracite", hex: "#454545" },
    { code: "beige", name: "Beige", hex: "#D4BA8A" },
    { code: "nero", name: "Nero", hex: "#1A1A1A" },
    { code: "azzurro", name: "Azzurro", hex: "#7EB8D4" },
  ],
  gres_porcellanato: [
    { code: "bianco", name: "Bianco assoluto", hex: "#F0F0F0" },
    { code: "calacatta", name: "Calacatta oro", hex: "#EDE8DC" },
    { code: "statuario", name: "Statuario", hex: "#F5F2EE" },
    { code: "grigio_ant", name: "Antracite", hex: "#454545" },
    { code: "effetto_legno", name: "Effetto legno", hex: "#B8956A" },
    { code: "nero", name: "Nero", hex: "#1A1A1A" },
  ],
  marmo: [
    { code: "bianco_carrara", name: "Bianco Carrara", hex: "#F5F2EE" },
    { code: "calacatta", name: "Calacatta", hex: "#EDE8DC" },
    { code: "travertino", name: "Travertino", hex: "#D4C4A8" },
    { code: "nero_marquina", name: "Nero Marquina", hex: "#1C1C1C" },
    { code: "verde_alpi", name: "Verde Alpi", hex: "#2E4E3E" },
    { code: "rosa_portogallo", name: "Rosa Portogallo", hex: "#D4A0A0" },
  ],
  cotto: [
    { code: "terracotta", name: "Terracotta", hex: "#C1693A" },
    { code: "rosa", name: "Rosa antico", hex: "#C4907A" },
    { code: "giallo", name: "Giallo Siena", hex: "#C8A060" },
    { code: "rosso", name: "Rosso toscano", hex: "#8B3A2A" },
  ],
  cemento_resina: [
    { code: "grigio_ch", name: "Grigio chiaro", hex: "#C0C0C0" },
    { code: "grigio_med", name: "Grigio medio", hex: "#9E9E9E" },
    { code: "tortora", name: "Tortora", hex: "#B0A090" },
    { code: "antracite", name: "Antracite", hex: "#404040" },
    { code: "bianco", name: "Bianco", hex: "#E8E8E8" },
  ],
};

const WOOD_TYPES = ["parquet", "laminato", "gres_porcellanato", "vinile_lvt"];

const WOOD_EFFECTS = [
  { id: "rovere_naturale", name: "Rovere naturale", hex: "#C8A870" },
  { id: "noce_scuro", name: "Noce scuro", hex: "#5A3A1E" },
  { id: "frassino_biondo", name: "Frassino biondo", hex: "#D4C4A0" },
  { id: "teak", name: "Teak", hex: "#8B6B3C" },
  { id: "larice_grigio", name: "Larice grigio", hex: "#A09888" },
  { id: "wengé", name: "Wengé", hex: "#3D2B1F" },
];

const TABS: { value: ColoreMode; label: string; emoji: string }[] = [
  { value: "palette", label: "Palette", emoji: "🎨" },
  { value: "ral", label: "RAL", emoji: "🔢" },
  { value: "legno", label: "Legno", emoji: "🪵" },
  { value: "libero", label: "Libero", emoji: "✏️" },
];

export function PavimentoColorSelector({ value, onChange, tipoPavimento }: Props) {
  const palette = PALETTE_PER_TIPO[tipoPavimento] ?? PALETTE_PER_TIPO.ceramica!;
  const canUseLegno = WOOD_TYPES.includes(tipoPavimento);
  const visibleTabs = TABS.filter((t) => t.value !== "legno" || canUseLegno);

  return (
    <div className="space-y-3">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
        {visibleTabs.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange({ ...value, mode: tab.value })}
            className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              value.mode === tab.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab.emoji} {tab.label}
          </button>
        ))}
      </div>

      {/* Palette tab */}
      {value.mode === "palette" && (
        <div className="grid grid-cols-3 gap-2">
          {palette.map((c) => {
            const isSelected = value.code === c.code;
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => onChange({ mode: "palette", code: c.code, name: c.name, hex: c.hex })}
                className={`flex items-center gap-2 p-2.5 rounded-xl border-2 text-left transition-all ${
                  isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30 bg-card"
                }`}
              >
                <div className="w-6 h-6 rounded-full border border-border flex-shrink-0" style={{ backgroundColor: c.hex }} />
                <span className="text-xs font-medium text-foreground truncate">{c.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* RAL tab */}
      {value.mode === "ral" && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="text-sm font-medium text-primary hover:underline">
            Apri selettore RAL completo
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <RalColorPicker
              value={value.ral_code ? { ral: value.ral_code, name: value.name ?? "", hex: value.hex ?? "#fff", group: "" } : null}
              onChange={(ral: RalColor | null) => {
                if (ral) onChange({ mode: "ral", ral_code: ral.ral, name: ral.name, hex: ral.hex });
              }}
            />
          </CollapsibleContent>
        </Collapsible>
      )}

      {/* Legno tab */}
      {value.mode === "legno" && canUseLegno && (
        <div className="grid grid-cols-2 gap-2">
          {WOOD_EFFECTS.map((w) => {
            const isSelected = value.wood_id === w.id;
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => onChange({ mode: "legno", wood_id: w.id, wood_name: w.name, hex: w.hex })}
                className={`flex items-center gap-2.5 p-3 rounded-xl border-2 text-left transition-all ${
                  isSelected ? "border-amber-500 bg-amber-50" : "border-border hover:border-amber-300 bg-card"
                }`}
              >
                <div className="w-8 h-8 rounded-lg border border-border flex-shrink-0" style={{ backgroundColor: w.hex }} />
                <span className="text-xs font-semibold text-foreground">{w.name}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Libero tab */}
      {value.mode === "libero" && (
        <div className="space-y-2">
          <Label className="text-xs">Descrivi il colore desiderato</Label>
          <Textarea
            placeholder="Es. grigio perla con riflessi madreperla..."
            value={value.free_text ?? ""}
            onChange={(e) => onChange({ mode: "libero", free_text: e.target.value })}
            rows={3}
            className="text-sm"
          />
        </div>
      )}
    </div>
  );
}
