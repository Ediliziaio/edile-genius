import { useState, useRef } from 'react';
import { Download, Star, Eye, EyeOff, Droplets, Sun } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ConfigurazioneTetto, TipoManto } from '../types';

interface RenderTettoResultCardProps {
  id: string;
  resultUrl: string;
  originalUrl?: string;
  titoloSessione?: string;
  configJson?: ConfigurazioneTetto;
  createdAt?: string;
  isFeatured?: boolean;
  onToggleFeatured?: () => void;
  onClick?: () => void;
  className?: string;
}

const MANTO_EMOJI: Record<TipoManto, string> = {
  tegole_coppi: '🟤', tegole_marsigliesi: '🟠', tegole_portoghesi: '🔶',
  tegole_piane: '⬛', ardesia_naturale: '🪨', ardesia_sintetica: '🔲',
  lamiera_grecata: '▦', lamiera_aggraffata: '▧', lamiera_zinco_titanio: '🔘',
  guaina_bituminosa: '⬜', guaina_tpo: '⬛', tegole_fotovoltaiche: '☀️',
};

const MANTO_LABEL: Record<TipoManto, string> = {
  tegole_coppi: 'Coppi', tegole_marsigliesi: 'Marsigliesi', tegole_portoghesi: 'Portoghesi',
  tegole_piane: 'Piane', ardesia_naturale: 'Ardesia nat.', ardesia_sintetica: 'Ardesia sint.',
  lamiera_grecata: 'Lamiera grecata', lamiera_aggraffata: 'Lamiera aggr.', lamiera_zinco_titanio: 'Zinco titanio',
  guaina_bituminosa: 'Guaina bit.', guaina_tpo: 'Guaina TPO', tegole_fotovoltaiche: 'Fotovoltaico',
};

export function RenderTettoResultCard({
  id, resultUrl, originalUrl, titoloSessione, configJson,
  createdAt, isFeatured, onToggleFeatured, onClick, className,
}: RenderTettoResultCardProps) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [hovered, setHovered] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const handleDownload = async (e: React.MouseEvent) => {
    e.stopPropagation();
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    try {
      const res = await fetch(resultUrl, { signal: abortRef.current.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `render-tetto-${id.slice(0, 8)}.jpg`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      if ((err as Error).name !== 'AbortError') {
        console.error('Download failed:', err);
      }
    }
  };

  const chips: Array<{ icon: React.ReactNode; label: string; color: string }> = [];
  if (configJson?.manto.attivo) {
    chips.push({
      icon: <span>{MANTO_EMOJI[configJson.manto.tipo]}</span>,
      label: MANTO_LABEL[configJson.manto.tipo],
      color: 'bg-amber-100 text-amber-700',
    });
  }
  if (configJson?.gronde.attivo) {
    chips.push({ icon: <Droplets className="w-3 h-3" />, label: 'Gronde', color: 'bg-blue-100 text-blue-700' });
  }
  if (configJson?.lucernari.attivo) {
    chips.push({
      icon: <Sun className="w-3 h-3" />,
      label: `${configJson.lucernari.quantita} lucernar${configJson.lucernari.quantita === 1 ? 'io' : 'i'}`,
      color: 'bg-yellow-100 text-yellow-700',
    });
  }

  return (
    <div
      className={cn('rounded-xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all cursor-pointer', className)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Image */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={showOriginal && originalUrl ? originalUrl : resultUrl}
          alt={titoloSessione || 'Render tetto'}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover transition-transform duration-300"
          style={{ transform: hovered ? 'scale(1.03)' : 'scale(1)' }}
        />

        {/* Hover overlay */}
        <div className={cn('absolute inset-0 bg-black/0 transition-colors', hovered && 'bg-black/20')}>
          <div className={cn('absolute top-2 right-2 flex gap-1.5 transition-opacity', hovered ? 'opacity-100' : 'opacity-0')}>
            {onToggleFeatured && (
              <button
                onClick={(e) => { e.stopPropagation(); onToggleFeatured(); }}
                className={cn(
                  'p-1.5 rounded-lg backdrop-blur-sm transition-colors',
                  isFeatured ? 'bg-amber-500 text-white' : 'bg-black/40 text-white/80 hover:bg-amber-500/80'
                )}
              >
                <Star className="w-4 h-4" />
              </button>
            )}
            <button onClick={handleDownload} className="p-1.5 rounded-lg bg-black/40 text-white/80 hover:bg-black/60 backdrop-blur-sm">
              <Download className="w-4 h-4" />
            </button>
          </div>

          {originalUrl && (
            <button
              onClick={(e) => { e.stopPropagation(); setShowOriginal(!showOriginal); }}
              className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm flex items-center gap-1.5"
            >
              {showOriginal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showOriginal ? 'Mostra render' : 'Mostra prima'}
            </button>
          )}
        </div>

        {isFeatured && (
          <div className="absolute top-2 left-2">
            <span className="bg-amber-500 text-white text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3" /> In evidenza
            </span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 space-y-2">
        {titoloSessione && (
          <p className="text-sm font-semibold text-foreground truncate">{titoloSessione}</p>
        )}

        {chips.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {chips.map((chip, i) => (
              <span key={i} className={cn('inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full', chip.color)}>
                {chip.icon}
                {chip.label}
              </span>
            ))}
          </div>
        )}

        {configJson?.manto.attivo && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: configJson.manto.colore_hex }} />
            {configJson.manto.colore_hex}
          </div>
        )}

        {createdAt && (
          <p className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(createdAt), { addSuffix: true, locale: it })}
          </p>
        )}
      </div>
    </div>
  );
}
