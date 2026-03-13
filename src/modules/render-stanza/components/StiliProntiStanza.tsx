import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import {
  STANZA_STILI_PRONTI_FALLBACK,
  type ConfigurazioneStanza,
} from '@/modules/render-stanza/lib/stanzaPromptBuilder';

interface Stile {
  id: string;
  nome: string;
  descrizione: string;
  emoji: string;
  tags: string[];
  config: Partial<ConfigurazioneStanza>;
  preview_hex?: string;
  stile?: string;
}

interface StiliProntiStanzaProps {
  onApply: (stile: Stile) => void;
  tipoStanza?: string;
  className?: string;
}

export function StiliProntiStanza({ onApply, tipoStanza, className = '' }: StiliProntiStanzaProps) {
  const { data: dbStili, isLoading } = useQuery({
    queryKey: ['render_stanza_stili', tipoStanza],
    queryFn: async () => {
      try {
        const baseQuery = supabase.from('render_stanza_stili_pronti' as any).select('*');
        let query = (baseQuery as any).eq('attivo', true).order('ordine', { ascending: true });

        if (tipoStanza && tipoStanza !== 'altro') {
          query = query.or(`tipo_stanza.eq.${tipoStanza},tipo_stanza.eq.universale`);
        }

        const { data, error } = await query;
        if (error) return []; // table may not exist yet
        return (data || []).map((row: any) => ({
          id: row.id,
          nome: row.nome,
        descrizione: row.descrizione || '',
        emoji: row.emoji || '✨',
        tags: row.tags || [],
        config: row.config as Partial<ConfigurazioneStanza>,
        preview_hex: row.preview_hex,
        stile: row.stile,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });

  const stili: Stile[] = (dbStili && dbStili.length > 0)
    ? dbStili
    : STANZA_STILI_PRONTI_FALLBACK.map(s => ({
        id: s.nome,
        nome: s.nome,
        descrizione: s.desc,
        emoji: s.emoji,
        tags: [],
        config: s.config,
        preview_hex: s.preview_hex,
        stile: s.stile,
      }));

  if (isLoading) {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 ${className}`}>
        {Array(8).fill(0).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Stili pronti</p>
        <span className="text-xs text-muted-foreground">— clicca per applicare</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {stili.map(stile => {
          const interventions = Object.values(stile.config).filter(
            v => typeof v === 'object' && v !== null && 'attivo' in v && (v as any).attivo
          ).length;

          return (
            <button
              key={stile.id}
              type="button"
              onClick={() => onApply(stile)}
              className="group relative p-3 bg-card border-2 border-border rounded-xl text-left hover:border-primary/40 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center gap-2 mb-1.5">
                {stile.preview_hex && (
                  <div
                    className="w-5 h-5 rounded-full border border-border flex-shrink-0"
                    style={{ backgroundColor: stile.preview_hex }}
                  />
                )}
                <span className="text-base">{stile.emoji}</span>
              </div>
              <p className="text-xs font-semibold text-foreground">{stile.nome}</p>
              {stile.descrizione && (
                <p className="text-[10px] text-muted-foreground line-clamp-2 mt-0.5">{stile.descrizione}</p>
              )}
              <div className="mt-1.5">
                <Badge variant="secondary" className="text-[9px]">
                  {interventions} interventi
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
