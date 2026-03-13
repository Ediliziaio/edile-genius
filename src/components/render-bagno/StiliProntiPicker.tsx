import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Zap } from "lucide-react";

interface StilePronto {
  id: string;
  nome: string;
  descrizione: string | null;
  icon: string | null;
  preview_hex: string[] | null;
  configurazione: Record<string, any>;
}

interface StiliProntiProps {
  onApply: (cfg: Record<string, any>) => void;
}

export function StiliProntiPicker({ onApply }: StiliProntiProps) {
  const [stili, setStili] = useState<StilePronto[]>([]);

  useEffect(() => {
    (supabase.from("render_bagno_stili_pronti") as any)
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }: any) => {
        if (data) setStili(data);
      });
  }, []);

  if (!stili.length) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Zap className="h-4 w-4 text-primary" />
        <p className="font-semibold text-sm text-foreground">Stili Pronti — applica in 1 click</p>
      </div>
      <p className="text-xs text-muted-foreground">
        Seleziona uno stile pre-configurato e personalizza in seguito.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stili.map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => onApply(s.configurazione)}
            className="flex flex-col gap-2 p-3 rounded-2xl border border-border hover:border-primary/50 hover:bg-accent/30 text-left transition-all group"
          >
            {/* Palette colori */}
            <div className="flex gap-1">
              {(s.preview_hex || []).map((hex, i) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border border-border"
                  style={{ backgroundColor: hex }}
                />
              ))}
            </div>
            <div>
              <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {s.icon} {s.nome}
              </p>
              {s.descrizione && (
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                  {s.descrizione}
                </p>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
