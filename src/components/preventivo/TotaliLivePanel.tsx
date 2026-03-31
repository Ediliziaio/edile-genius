import { memo } from 'react';
import type { PreventivoVoce } from '@/lib/preventivo-pdf';
import { computeTotals, formatEuro } from '@/lib/computedTotals';
import { cn } from '@/lib/utils';

interface TotaliLivePanelProps {
  voci: PreventivoVoce[];
  ivaPercentuale?: number;
  className?: string;
}

export const TotaliLivePanel = memo(function TotaliLivePanel({
  voci,
  ivaPercentuale = 22,
  className,
}: TotaliLivePanelProps) {
  const totals = computeTotals(voci, ivaPercentuale);

  return (
    <div className={cn('rounded-xl border bg-card p-4 space-y-2 text-sm', className)}>
      <div className="font-semibold text-xs text-muted-foreground uppercase tracking-wide mb-3">
        Riepilogo importi
      </div>

      <Row label="Subtotale lordo" value={totals.subtotale} />

      {totals.scontoTotale > 0 && (
        <Row label="Sconti voce" value={-totals.scontoTotale} negative />
      )}

      <Row label="Imponibile" value={totals.imponibile} bold />

      <div className="border-t pt-2 mt-2">
        <Row label={`IVA ${ivaPercentuale}%`} value={totals.iva} />
      </div>

      <div className="border-t pt-2 mt-1">
        <Row label="Totale" value={totals.totale} bold large />
      </div>

      <div className="text-xs text-muted-foreground pt-1">
        {totals.voceCount} {totals.voceCount === 1 ? 'voce' : 'voci'}
      </div>
    </div>
  );
});

function Row({
  label,
  value,
  bold,
  large,
  negative,
}: {
  label: string;
  value: number;
  bold?: boolean;
  large?: boolean;
  negative?: boolean;
}) {
  return (
    <div className={cn('flex justify-between', bold && 'font-semibold')}>
      <span className={cn('text-muted-foreground', bold && 'text-foreground')}>{label}</span>
      <span className={cn(large && 'text-base', negative && 'text-red-500')}>
        {negative ? '−' : ''}{formatEuro(Math.abs(value))}
      </span>
    </div>
  );
}
