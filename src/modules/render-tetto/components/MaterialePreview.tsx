import { cn } from '@/lib/utils';
import type { TipoManto } from '../types';

interface MaterialePreviewProps {
  tipoManto: TipoManto;
  coloreHex: string;
  finitura: 'opaco' | 'semi_lucido' | 'lucido';
  className?: string;
}

function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.min(255, (num >> 16) + amount));
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0xff) + amount));
  const b = Math.max(0, Math.min(255, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

const MANTO_PATTERN: Record<TipoManto, (c: string) => React.CSSProperties> = {
  tegole_coppi: (c) => ({
    background: `repeating-linear-gradient(160deg, ${c} 0px, ${c} 8px, ${adjustColor(c, -20)} 8px, ${adjustColor(c, -20)} 12px)`,
  }),
  tegole_marsigliesi: (c) => ({
    background: `repeating-linear-gradient(175deg, ${c} 0px, ${c} 10px, ${adjustColor(c, -15)} 10px, ${adjustColor(c, -15)} 14px)`,
  }),
  tegole_portoghesi: (c) => ({
    background: `repeating-conic-gradient(${c} 0% 25%, ${adjustColor(c, -10)} 0% 50%)`,
    backgroundSize: '14px 14px',
  }),
  tegole_piane: (c) => ({
    background: `repeating-linear-gradient(90deg, ${c} 0px, ${c} 20px, ${adjustColor(c, -8)} 20px, ${adjustColor(c, -8)} 22px)`,
  }),
  ardesia_naturale: (c) => ({
    background: `repeating-linear-gradient(135deg, ${c} 0px, ${c} 6px, ${adjustColor(c, 10)} 6px, ${adjustColor(c, 10)} 7px)`,
  }),
  ardesia_sintetica: (c) => ({ backgroundColor: c }),
  lamiera_grecata: (c) => ({
    background: `repeating-linear-gradient(0deg, ${c} 0px, ${c} 6px, ${adjustColor(c, -25)} 6px, ${adjustColor(c, -25)} 8px, ${c} 8px, ${c} 14px, ${adjustColor(c, 15)} 14px, ${adjustColor(c, 15)} 16px)`,
  }),
  lamiera_aggraffata: (c) => ({
    background: `repeating-linear-gradient(0deg, ${c} 0px, ${c} 18px, ${adjustColor(c, -30)} 18px, ${adjustColor(c, -30)} 20px)`,
  }),
  lamiera_zinco_titanio: (c) => ({
    background: `linear-gradient(135deg, ${adjustColor(c, 10)}, ${c}, ${adjustColor(c, -10)})`,
  }),
  guaina_bituminosa: (c) => ({
    background: `radial-gradient(circle at 2px 2px, ${adjustColor(c, 10)} 1px, transparent 1px)`,
    backgroundSize: '6px 6px',
    backgroundColor: c,
  }),
  guaina_tpo: (c) => ({ backgroundColor: c }),
  tegole_fotovoltaiche: (c) => ({
    background: `repeating-linear-gradient(90deg, ${c} 0px, ${c} 22px, ${adjustColor(c, 15)} 22px, ${adjustColor(c, 15)} 24px), repeating-linear-gradient(0deg, transparent 0px, transparent 14px, ${adjustColor(c, 10)} 14px, ${adjustColor(c, 10)} 16px)`,
    backgroundColor: c,
  }),
};

const MANTO_LABEL: Record<TipoManto, string> = {
  tegole_coppi: 'Tegole coppo', tegole_marsigliesi: 'Marsigliesi', tegole_portoghesi: 'Portoghesi',
  tegole_piane: 'Tegole piane', ardesia_naturale: 'Ardesia naturale', ardesia_sintetica: 'Ardesia sintetica',
  lamiera_grecata: 'Lamiera grecata', lamiera_aggraffata: 'Lamiera aggraffata', lamiera_zinco_titanio: 'Zinco titanio',
  guaina_bituminosa: 'Guaina bituminosa', guaina_tpo: 'Guaina TPO', tegole_fotovoltaiche: 'Fotovoltaico',
};

export function MaterialePreview({ tipoManto, coloreHex, finitura, className }: MaterialePreviewProps) {
  const patternFn = MANTO_PATTERN[tipoManto];
  const style: React.CSSProperties = {
    ...(patternFn ? patternFn(coloreHex) : { backgroundColor: coloreHex }),
    filter: finitura === 'lucido' ? 'brightness(1.15) contrast(1.1)' : undefined,
    opacity: finitura === 'opaco' ? 0.9 : 1,
  };

  return (
    <div className={cn('rounded-xl overflow-hidden border border-border', className)}>
      <div className="h-20 w-full" style={style} />
      <div className="px-3 py-2 bg-card flex items-center justify-between">
        <span className="text-xs font-medium text-foreground">{MANTO_LABEL[tipoManto]}</span>
        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="w-3 h-3 rounded-full border border-border" style={{ backgroundColor: coloreHex }} />
          {coloreHex}
        </span>
      </div>
    </div>
  );
}
