import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";

interface StileConfig {
  tipo_operazione?: string;
  tipo_pavimento?: string;
  sottotipo?: string;
  finitura?: string;
  pattern_posa?: string;
  colore?: { mode?: string; code?: string; name?: string; hex?: string };
  dimensione_piastrella?: string;
  larghezza_listello_mm?: number;
  lunghezza_listello_mm?: number;
  larghezza_fuga_mm?: number;
  colore_fuga?: string;
}

interface StileProntoRow {
  id: string;
  nome: string;
  descrizione: string;
  emoji: string;
  config: StileConfig;
  preview_hex?: string;
}

interface Props {
  onApply: (config: StileConfig) => void;
}

const STILI_FALLBACK: Omit<StileProntoRow, "id">[] = [
  { nome: "Parquet rovere miele", descrizione: "Spina di pesce, prefinito, opaco", emoji: "🪵", preview_hex: "#C8913A", config: { tipo_pavimento: "parquet", finitura: "opaco", pattern_posa: "spina_di_pesce", colore: { mode: "palette", code: "miele", name: "Miele dorato", hex: "#C8913A" } } },
  { nome: "Gres effetto marmo", descrizione: "120×120, Calacatta, lucido", emoji: "🏛️", preview_hex: "#EDE8DC", config: { tipo_pavimento: "gres_porcellanato", finitura: "lucido", pattern_posa: "rettilineo_dritto", colore: { mode: "palette", code: "calacatta", name: "Calacatta oro", hex: "#EDE8DC" } } },
  { nome: "Ceramica antracite", descrizione: "80×80, opaco, posa dritta", emoji: "🔲", preview_hex: "#454545", config: { tipo_pavimento: "ceramica", finitura: "opaco", pattern_posa: "rettilineo_dritto", colore: { mode: "palette", code: "grigio_ant", name: "Grigio antracite", hex: "#454545" } } },
  { nome: "Marmo Carrara", descrizione: "Diagonale 45°, lucido", emoji: "🤍", preview_hex: "#F5F2EE", config: { tipo_pavimento: "marmo", finitura: "lucido", pattern_posa: "diagonale_45", colore: { mode: "palette", code: "bianco_carrara", name: "Bianco Carrara", hex: "#F5F2EE" } } },
  { nome: "Parquet wengé", descrizione: "A correre, massello, spazzolato", emoji: "🌑", preview_hex: "#3D2B1F", config: { tipo_pavimento: "parquet", finitura: "spazzolato", pattern_posa: "a_correre", colore: { mode: "palette", code: "wengé", name: "Wengé scuro", hex: "#3D2B1F" } } },
  { nome: "Cotto toscano", descrizione: "Terracotta, anticato", emoji: "🏺", preview_hex: "#C1693A", config: { tipo_pavimento: "cotto", finitura: "anticato", pattern_posa: "opus_incertum", colore: { mode: "palette", code: "terracotta", name: "Terracotta", hex: "#C1693A" } } },
  { nome: "Microcemento grigio", descrizione: "Seamless, satinato", emoji: "⬛", preview_hex: "#9E9E9E", config: { tipo_pavimento: "cemento_resina", finitura: "satinato", pattern_posa: "rettilineo_dritto", colore: { mode: "palette", code: "grigio_med", name: "Grigio medio", hex: "#9E9E9E" } } },
  { nome: "LVT rovere bianco", descrizione: "A correre, opaco", emoji: "🪣", preview_hex: "#F0EDE8", config: { tipo_pavimento: "vinile_lvt", finitura: "opaco", pattern_posa: "a_correre", colore: { mode: "palette", code: "bianco_neve", name: "Rovere bianco neve", hex: "#F0EDE8" } } },
];

export function StiliProntiPavimento({ onApply }: Props) {
  const { data: stiliDB, isLoading } = useQuery({
    queryKey: ["pavimento-stili-pronti"],
    queryFn: async () => {
      const { data, error } = await (supabase.from("render_pavimento_stili_pronti") as any)
        .select("*")
        .eq("attivo", true)
        .order("ordine", { ascending: true });
      if (error) throw error;
      return data as StileProntoRow[];
    },
  });

  const stili = stiliDB && stiliDB.length > 0 ? stiliDB : STILI_FALLBACK;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-foreground">⚡ Stili pronti</p>
        <p className="text-xs text-muted-foreground">Applica con un click</p>
      </div>

      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" /> Caricamento...
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {stili.map((stile, idx) => (
          <button
            key={("id" in stile ? stile.id : idx) as string | number}
            type="button"
            onClick={() => onApply(stile.config)}
            className="flex flex-col items-center p-3 rounded-xl border-2 border-border hover:border-primary/40 hover:bg-primary/5 bg-card transition-all text-center"
          >
            <div className="relative mb-2">
              <div className="w-8 h-8 rounded-full border border-border" style={{ backgroundColor: stile.preview_hex ?? "#ccc" }} />
              <span className="absolute -top-1 -right-1 text-sm">{stile.emoji}</span>
            </div>
            <p className="text-xs font-semibold text-foreground">{stile.nome}</p>
            <p className="text-[10px] text-muted-foreground">{stile.descrizione}</p>
            {stile.config.tipo_pavimento && (
              <Badge variant="secondary" className="text-[9px] mt-1">{stile.config.tipo_pavimento.replace(/_/g, " ")}</Badge>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
