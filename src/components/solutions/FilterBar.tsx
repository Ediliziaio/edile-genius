import { settoreConfig, type Settore } from "@/data/solutions";

const filters: { key: string; label: string; emoji?: string }[] = [
  { key: 'tutte', label: 'Tutte' },
  { key: 'infissi', label: 'Infissi', emoji: '🪟' },
  { key: 'fotovoltaico', label: 'Fotovoltaico', emoji: '☀️' },
  { key: 'ristrutturazioni', label: 'Ristrutturazioni', emoji: '🏠' },
  { key: 'edilizia', label: 'Edilizia', emoji: '🏢' },
  { key: 'render', label: 'Render AI', emoji: '🎨' },
];

interface FilterBarProps {
  activeFilter: string;
  onFilterChange: (filter: string) => void;
  totalShown: number;
  total: number;
}

const FilterBar = ({ activeFilter, onFilterChange, totalShown, total }: FilterBarProps) => {
  return (
    <div className="sticky top-[68px] z-40 bg-white/95 backdrop-blur-sm border-b border-neutral-200 shadow-[0_4px_16px_rgba(0,0,0,0.05)]">
      <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 overflow-x-auto whitespace-nowrap scrollbar-hide">
          <span className="hidden md:inline font-mono text-[11px] text-neutral-400 uppercase tracking-wider shrink-0">
            Filtra per settore:
          </span>
          <div className="flex items-center gap-2">
            {filters.map((f) => {
              const isActive = activeFilter === f.key;
              const color = f.key === 'tutte'
                ? (isActive ? '#3ECF6E' : undefined)
                : settoreConfig[f.key as Settore]?.color;

              return (
                <button
                  key={f.key}
                  onClick={() => onFilterChange(f.key)}
                  role="button"
                  aria-pressed={isActive}
                  className="px-4 py-2 rounded-full text-sm font-semibold font-display transition-all duration-200 shrink-0"
                  style={isActive ? {
                    backgroundColor: color,
                    color: f.key === 'fotovoltaico' ? '#78350F' : '#fff',
                    boxShadow: `0 4px 12px ${color}40`,
                  } : {
                    backgroundColor: 'hsl(var(--neutral-100))',
                    color: 'hsl(var(--neutral-500))',
                    border: '1px solid hsl(var(--neutral-200))',
                  }}
                >
                  {f.emoji && <span className="mr-1">{f.emoji}</span>}
                  {f.label}
                </button>
              );
            })}
          </div>
        </div>
        <span className="font-mono text-xs text-neutral-400 shrink-0 hidden sm:inline">
          Mostrando {totalShown} di {total} soluzioni
        </span>
      </div>
    </div>
  );
};

export default FilterBar;
