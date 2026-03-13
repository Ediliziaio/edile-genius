import { Layers, Droplets, Sun, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ConfigurazioneTetto, TipoManto } from '../types';

interface ModificheActiveBadgeProps {
  config: ConfigurazioneTetto;
  onScrollTo?: (section: 'manto' | 'gronde' | 'lucernari') => void;
  className?: string;
}

const MANTO_SHORT: Record<TipoManto, string> = {
  tegole_coppi: 'Coppi', tegole_marsigliesi: 'Marsigliesi', tegole_portoghesi: 'Portoghesi',
  tegole_piane: 'Piane', ardesia_naturale: 'Ardesia', ardesia_sintetica: 'Ardesia sint.',
  lamiera_grecata: 'Lamiera', lamiera_aggraffata: 'Aggraffata', lamiera_zinco_titanio: 'Zinco',
  guaina_bituminosa: 'Guaina', guaina_tpo: 'TPO', tegole_fotovoltaiche: 'Solare',
};

export function ModificheActiveBadge({ config, onScrollTo, className }: ModificheActiveBadgeProps) {
  const badges: React.ReactNode[] = [];

  if (config.manto.attivo) {
    badges.push(
      <button
        key="manto"
        onClick={() => onScrollTo?.('manto')}
        className="flex items-center gap-1.5 bg-amber-100 hover:bg-amber-200 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
      >
        <Layers className="w-3 h-3" />
        {MANTO_SHORT[config.manto.tipo]}
        <span className="w-3 h-3 rounded-full border border-amber-300" style={{ backgroundColor: config.manto.colore_hex }} />
      </button>
    );
  }

  if (config.gronde.attivo) {
    badges.push(
      <button
        key="gronde"
        onClick={() => onScrollTo?.('gronde')}
        className="flex items-center gap-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
      >
        <Droplets className="w-3 h-3" />
        Gronde
        <span className="w-3 h-3 rounded-full border border-blue-300" style={{ backgroundColor: config.gronde.colore_hex }} />
      </button>
    );
  }

  if (config.lucernari.attivo) {
    badges.push(
      <button
        key="lucernari"
        onClick={() => onScrollTo?.('lucernari')}
        className="flex items-center gap-1.5 bg-yellow-100 hover:bg-yellow-200 text-yellow-700 text-xs font-medium px-2.5 py-1 rounded-full transition-colors"
      >
        <Sun className="w-3 h-3" />
        {config.lucernari.quantita} lucernar{config.lucernari.quantita === 1 ? 'io' : 'i'}
      </button>
    );
  }

  if (config.note_libere?.trim()) {
    badges.push(
      <span key="note" className="flex items-center gap-1.5 bg-muted text-muted-foreground text-xs font-medium px-2.5 py-1 rounded-full">
        <FileText className="w-3 h-3" />
        Note
      </span>
    );
  }

  if (badges.length === 0) return null;

  return (
    <div className={cn('flex flex-wrap gap-1.5', className)}>
      {badges}
    </div>
  );
}
