import { cn } from '@/lib/utils';
import type { TipoManto } from '../types';

interface MantoQuickSelectProps {
  selected: TipoManto;
  onSelect: (tipo: TipoManto) => void;
  tipoTetto?: string;
  className?: string;
}

const QUICK_OPTIONS: Array<{
  value: TipoManto;
  emoji: string;
  label: string;
  onlyPiano?: boolean;
  notPiano?: boolean;
}> = [
  { value: 'tegole_coppi',          emoji: '🟤', label: 'Coppi',         notPiano: true },
  { value: 'tegole_marsigliesi',    emoji: '🟠', label: 'Marsigliesi',   notPiano: true },
  { value: 'tegole_portoghesi',     emoji: '🔶', label: 'Portoghesi',    notPiano: true },
  { value: 'tegole_piane',          emoji: '⬛', label: 'Piane',         notPiano: true },
  { value: 'ardesia_naturale',      emoji: '🪨', label: 'Ardesia',       notPiano: true },
  { value: 'lamiera_grecata',       emoji: '▦',  label: 'Grecata',       notPiano: true },
  { value: 'lamiera_aggraffata',    emoji: '▧',  label: 'Aggraffata',    notPiano: true },
  { value: 'lamiera_zinco_titanio', emoji: '🔘', label: 'Zinco',         notPiano: true },
  { value: 'guaina_bituminosa',     emoji: '⬜', label: 'Guaina',        onlyPiano: true },
  { value: 'guaina_tpo',            emoji: '⬛', label: 'TPO',           onlyPiano: true },
  { value: 'ardesia_sintetica',     emoji: '🔲', label: 'Ardesia sint.' },
  { value: 'tegole_fotovoltaiche',  emoji: '☀️', label: 'Solare' },
];

export function MantoQuickSelect({ selected, onSelect, tipoTetto, className }: MantoQuickSelectProps) {
  const isPiano = tipoTetto === 'piano';

  const opzioni = QUICK_OPTIONS.filter(o => {
    if (o.onlyPiano && !isPiano) return false;
    if (o.notPiano && isPiano) return false;
    return true;
  });

  return (
    <div className={cn('grid grid-cols-4 sm:grid-cols-6 gap-2', className)}>
      {opzioni.map(opt => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className={cn(
            'flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all hover:shadow-sm',
            selected === opt.value
              ? 'border-amber-500 bg-amber-50 shadow-md scale-105'
              : 'border-border hover:border-amber-300 bg-card'
          )}
        >
          <span className="text-xl">{opt.emoji}</span>
          <span className="text-[10px] font-medium text-foreground leading-tight text-center">
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}
