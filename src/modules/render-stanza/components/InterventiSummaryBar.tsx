import { Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type InterventiState = Record<string, boolean>;

type InterventiMeta = Record<
  string,
  { label: string; icon: React.ElementType; color: string }
>;

interface InterventiSummaryBarProps {
  interventi: InterventiState;
  meta: InterventiMeta;
  onRemove: (key: string) => void;
  onGenerate: () => void;
  loading?: boolean;
}

export function InterventiSummaryBar({
  interventi,
  meta,
  onRemove,
  onGenerate,
  loading = false,
}: InterventiSummaryBarProps) {
  const attivi = Object.entries(interventi).filter(([, v]) => v);
  if (attivi.length === 0) return null;

  return (
    <div className="sticky bottom-0 z-40 border-t border-border bg-background/95 backdrop-blur-md px-4 py-3 -mx-4 mt-6 rounded-b-xl">
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary flex-shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>

        <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
          {attivi.map(([key]) => {
            const m = meta[key];
            if (!m) return null;
            const Icon = m.icon;
            return (
              <Badge
                key={key}
                variant="secondary"
                className="flex items-center gap-1 text-xs py-1 px-2"
              >
                <Icon className="w-3 h-3" />
                {m.label}
                <button
                  onClick={() => onRemove(key)}
                  className="ml-0.5 hover:text-destructive transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            );
          })}
        </div>

        <Button
          size="sm"
          onClick={onGenerate}
          disabled={loading}
          className="flex-shrink-0"
        >
          {loading ? 'Generando…' : `Genera (${attivi.length})`}
        </Button>
      </div>
    </div>
  );
}
