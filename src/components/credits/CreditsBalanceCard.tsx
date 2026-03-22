import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Ban, AlertTriangle } from "lucide-react";

interface Credits {
  balance_eur: number;
  total_recharged_eur: number;
  total_spent_eur: number;
  auto_recharge_enabled: boolean;
  auto_recharge_threshold: number;
  auto_recharge_amount: number;
  alert_threshold_eur: number;
  calls_blocked: boolean;
  blocked_reason: string | null;
}

interface CreditsBalanceCardProps {
  credits: Credits;
  onRechargeNow: () => void;
  onToggleAutoRecharge: (enabled: boolean) => void;
}

export default function CreditsBalanceCard({ credits, onRechargeNow, onToggleAutoRecharge }: CreditsBalanceCardProps) {
  const usagePct = credits.total_recharged_eur > 0 ? (credits.total_spent_eur / credits.total_recharged_eur) * 100 : 0;
  const balanceColor = credits.calls_blocked ? "text-destructive" : credits.balance_eur <= (credits.alert_threshold_eur || 5) ? "text-yellow-600" : "text-primary";
  const barColor = usagePct > 80 ? "bg-destructive" : usagePct > 60 ? "bg-yellow-500" : "bg-primary";

  return (
    <Card className={`border-2 ${credits.calls_blocked ? "border-destructive" : credits.balance_eur <= credits.alert_threshold_eur ? "border-yellow-400" : "border-primary/30"}`}>
      <CardContent className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-semibold text-muted-foreground">Saldo Disponibile</p>
            <p className={`text-5xl font-extrabold mt-1 ${balanceColor}`}>{Math.round(credits.balance_eur)}</p>
            <p className="text-sm text-muted-foreground -mt-1">crediti</p>

            <div className="mt-4">
              <p className="text-xs font-mono text-muted-foreground mb-1.5">
                {Math.round(credits.total_spent_eur)} usati — {Math.round(credits.total_recharged_eur)} ricaricati
              </p>
              <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(usagePct, 100)}%` }} />
              </div>
            </div>

            {credits.calls_blocked && (
              <Card className="mt-4 border-destructive bg-destructive/5">
                <CardContent className="p-3 flex items-center gap-3">
                  <Ban className="h-5 w-5 text-destructive shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-destructive">Chiamate bloccate — Saldo esaurito</p>
                    <p className="text-xs text-muted-foreground">Ricarica subito per riattivare gli agenti.</p>
                  </div>
                  <Button size="sm" variant="destructive" className="ml-auto" onClick={onRechargeNow}>Ricarica Ora</Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Ricarica Automatica</p>
              <Switch checked={credits.auto_recharge_enabled} onCheckedChange={onToggleAutoRecharge} />
            </div>
            {credits.auto_recharge_enabled ? (
              <Card className="mt-3 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 shrink-0" />
                    <p className="text-sm font-semibold text-yellow-700 dark:text-yellow-400">Ricarica automatica temporaneamente disabilitata</p>
                  </div>
                  <p className="text-xs text-muted-foreground">Il pagamento automatico via carta salvata è in fase di integrazione. Ricarica manualmente quando il saldo è basso.</p>
                  <div className="grid grid-cols-2 gap-3 opacity-50">
                    <div><Label className="text-xs">Soglia (crediti)</Label><Input type="number" defaultValue={credits.auto_recharge_threshold} className="mt-1" readOnly /></div>
                    <div><Label className="text-xs">Importo (crediti)</Label><Input type="number" defaultValue={credits.auto_recharge_amount} className="mt-1" readOnly /></div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <p className="text-sm text-muted-foreground mt-3">Con la ricarica automatica non perdi mai una chiamata.</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
