import {
  Paintbrush, LayoutGrid, Sofa, Layers, Lightbulb,
  Wallpaper, BookOpen, Home, UtensilsCrossed, Bath
} from 'lucide-react';

type InterventiState = {
  verniciatura: boolean;
  pavimento: boolean;
  arredo: boolean;
  soffitto: boolean;
  illuminazione: boolean;
  carta_da_parati: boolean;
  rivestimento_pareti: boolean;
  tende: boolean;
  restyling_cucina: boolean;
  restyling_bagno: boolean;
};

const QUICK_META: Array<{
  key: keyof InterventiState;
  label: string;
  icon: React.ElementType;
  emoji: string;
  onlyFor?: string[];
}> = [
  { key: 'verniciatura',        label: 'Pareti',       icon: Paintbrush,       emoji: '🎨' },
  { key: 'pavimento',           label: 'Pavimento',    icon: LayoutGrid,       emoji: '⬜' },
  { key: 'arredo',              label: 'Arredo',       icon: Sofa,             emoji: '🛋️' },
  { key: 'soffitto',            label: 'Soffitto',     icon: Layers,           emoji: '🏠' },
  { key: 'illuminazione',       label: 'Luci',         icon: Lightbulb,        emoji: '💡' },
  { key: 'carta_da_parati',     label: 'Carta parati', icon: Wallpaper,        emoji: '🌸' },
  { key: 'rivestimento_pareti', label: 'Rivestimento', icon: BookOpen,         emoji: '🧱' },
  { key: 'tende',               label: 'Tende',        icon: Home,             emoji: '🪟' },
  { key: 'restyling_cucina',    label: 'Cucina',       icon: UtensilsCrossed,  emoji: '🍳', onlyFor: ['cucina', 'soggiorno', 'sala_da_pranzo'] },
  { key: 'restyling_bagno',     label: 'Bagno',        icon: Bath,             emoji: '🚿', onlyFor: ['bagno'] },
];

interface InterventiQuickSelectProps {
  value: InterventiState;
  onChange: (key: keyof InterventiState, val: boolean) => void;
  tipoStanza?: string;
  className?: string;
}

export function InterventiQuickSelect({
  value,
  onChange,
  tipoStanza = 'soggiorno',
  className = '',
}: InterventiQuickSelectProps) {
  const filtered = QUICK_META.filter(
    item => !item.onlyFor || item.onlyFor.includes(tipoStanza)
  );

  return (
    <div className={`grid grid-cols-4 sm:grid-cols-5 gap-2 ${className}`}>
      {filtered.map(item => {
        const isOn = value[item.key];
        return (
          <button
            key={item.key}
            type="button"
            onClick={() => onChange(item.key, !isOn)}
            className={`
              flex flex-col items-center gap-1.5 p-2.5 rounded-xl border-2 transition-all relative
              ${isOn
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border bg-card text-muted-foreground hover:border-primary/30 hover:bg-primary/5'}
            `}
          >
            <span className="text-lg">{item.emoji}</span>
            <span className="text-[10px] font-medium leading-tight text-center">{item.label}</span>
            {isOn && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full border-2 border-background" />
            )}
          </button>
        );
      })}
    </div>
  );
}
