import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfigurazioneTetto } from '../types';

interface StiliProntiTettoProps {
  tipoTetto?: string;
  onApply: (config: Partial<ConfigurazioneTetto>) => void;
  className?: string;
}

interface StilePronto {
  id: string;
  nome: string;
  descrizione: string | null;
  preview_url: string | null;
  preview_hex: string | null;
  emoji: string | null;
  tipo_tetto: string[] | null;
  config: Partial<ConfigurazioneTetto>;
  tags: string[] | null;
}

export function StiliProntiTetto({ tipoTetto, onApply, className }: StiliProntiTettoProps) {
  const { data: stili, isLoading } = useQuery({
    queryKey: ['render_tetto_stili_pronti', tipoTetto],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('render_tetto_stili_pronti')
        .select('*')
        .eq('attivo', true)
        .order('ordine');
      if (error) throw error;
      return (data || []) as unknown as StilePronto[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const stiliFiltrati = stili?.filter(s =>
    !s.tipo_tetto ||
    s.tipo_tetto.length === 0 ||
    (tipoTetto && s.tipo_tetto.includes(tipoTetto))
  ) || [];

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-2 sm:grid-cols-3 gap-3', className)}>
        {[1, 2, 3].map(i => (
          <div key={i} className="h-32 rounded-xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (stiliFiltrati.length === 0) return null;

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <Sparkles className="w-4 h-4 text-amber-500" />
        Stili pronti
        <span className="text-xs text-muted-foreground font-normal">({stiliFiltrati.length})</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {stiliFiltrati.map(stile => {
          const cfg = stile.config as any;
          const count = [cfg?.manto?.attivo, cfg?.gronde?.attivo, cfg?.lucernari?.attivo].filter(Boolean).length;

          return (
            <button
              key={stile.id}
              onClick={() => onApply(stile.config)}
              className="relative rounded-xl overflow-hidden border-2 border-transparent hover:border-amber-400 hover:shadow-md transition-all group text-left"
            >
              {stile.preview_url ? (
                <img src={stile.preview_url} alt={stile.nome} className="w-full h-24 object-cover" />
              ) : (
                <div
                  className="w-full h-24 flex items-center justify-center text-3xl"
                  style={{ backgroundColor: stile.preview_hex || '#F5F0EB' }}
                >
                  {stile.emoji || '🏠'}
                </div>
              )}

              {count > 0 && (
                <span className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}

              <div className="p-2 bg-card">
                <p className="text-xs font-semibold text-foreground truncate">{stile.nome}</p>
                {stile.descrizione && (
                  <p className="text-[10px] text-muted-foreground truncate">{stile.descrizione}</p>
                )}
              </div>

              <div className="absolute inset-0 bg-amber-500/0 group-hover:bg-amber-500/10 transition-colors flex items-center justify-center">
                <span className="opacity-0 group-hover:opacity-100 transition-opacity bg-amber-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
                  Applica
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
