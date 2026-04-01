import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { ModuleSub } from '@/hooks/useCredits';

interface Props {
  balanceConv: number;
  balanceEur: number;
  isBlocked: boolean;
  forecastDays: number | null;
  vocalSub: ModuleSub | null;
  onRecharge?: () => void;
}

export function CreditBalanceBar({
  balanceConv,
  balanceEur,
  isBlocked,
  forecastDays,
  vocalSub,
  onRecharge,
}: Props) {
  const monthlyUnits = vocalSub?.monthly_units ?? 100;
  const usedUnits = vocalSub
    ? vocalSub.units_used_month
    : 0;
  const pctRemaining = monthlyUnits > 0 ? (balanceConv / monthlyUnits) * 100 : 0;

  const barColor = isBlocked
    ? 'bg-red-500'
    : pctRemaining <= 10
    ? 'bg-red-400'
    : pctRemaining <= 30
    ? 'bg-amber-400'
    : 'bg-green-500';

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>
            {isBlocked ? '🔴 Agente bloccato' : '🎙️ Crediti Voce'}
          </CardTitle>
          {onRecharge && (
            <Button size="sm" onClick={onRecharge}>
              Ricarica
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Numero grande — conversazioni rimanenti */}
        <div className="flex items-baseline gap-3">
          <span className="text-5xl font-bold text-foreground">
            {balanceConv.toLocaleString('it-IT')}
          </span>
          <span className="text-muted-foreground">conversazioni rimanenti</span>
        </div>

        {/* Barra progresso colorata */}
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${Math.min(pctRemaining, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{usedUnits} usate questo mese</span>
          <span>{monthlyUnits} incluse nel piano</span>
        </div>

        {/* Forecast */}
        {forecastDays !== null && forecastDays < 999 && (
          <p className="text-sm text-muted-foreground">
            ⏱ Al ritmo attuale, il tuo agente può lavorare ancora
            <strong className="text-foreground"> ~{forecastDays} giorni</strong>
          </p>
        )}

        {/* Saldo euro in piccolo — trasparenza */}
        <p className="text-xs text-muted-foreground text-right">
          Saldo: €{balanceEur.toFixed(2)}
        </p>
      </CardContent>
    </Card>
  );
}
