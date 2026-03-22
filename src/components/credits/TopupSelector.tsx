import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Coins } from "lucide-react";

const TOPUP_AMOUNTS = [10, 20, 50, 100];

interface TopupSelectorProps {
  selectedAmount: number | null;
  customAmount: string;
  onSelectAmount: (amt: number | null) => void;
  onCustomAmountChange: (val: string) => void;
  onConfirm: () => void;
  creditRate: number; // crediti per ogni €1 pagato
}

export default function TopupSelector({
  selectedAmount,
  customAmount,
  onSelectAmount,
  onCustomAmountChange,
  onConfirm,
  creditRate,
}: TopupSelectorProps) {
  const topupAmount = selectedAmount ?? (parseFloat(customAmount) || 0);
  const creditsToReceive = Math.round(topupAmount * creditRate);

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">Ricarica Manuale</h2>
      <p className="text-sm text-muted-foreground">
        Seleziona un importo o inseriscine uno personalizzato.{" "}
        <span className="font-medium text-primary">1€ = {creditRate} crediti</span>
      </p>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        {TOPUP_AMOUNTS.map((amt) => {
          const credits = Math.round(amt * creditRate);
          return (
            <Card
              key={amt}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedAmount === amt ? "border-2 border-primary bg-primary/5" : "border"
              }`}
              onClick={() => { onSelectAmount(amt); onCustomAmountChange(""); }}
            >
              <CardContent className="p-5 text-center space-y-1">
                <p className="text-2xl font-extrabold text-foreground">€{amt}</p>
                <div className="flex items-center justify-center gap-1 text-primary">
                  <Coins className="h-3.5 w-3.5" />
                  <p className="text-sm font-bold">{credits} crediti</p>
                </div>
                {amt === 20 && <Badge className="mt-1 bg-primary/10 text-primary border-0 text-xs">Popolare</Badge>}
              </CardContent>
            </Card>
          );
        })}

        <Card
          className={`cursor-pointer transition-all hover:shadow-md ${
            selectedAmount === null && customAmount
              ? "border-2 border-primary bg-primary/5"
              : "border border-dashed"
          }`}
          onClick={() => onSelectAmount(null)}
        >
          <CardContent className="p-5 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Personalizzato</p>
            <Input
              type="number"
              min={5}
              max={500}
              placeholder="€"
              value={customAmount}
              onChange={(e) => { onCustomAmountChange(e.target.value); onSelectAmount(null); }}
              className="text-center text-lg font-bold"
            />
            <p className="text-xs text-muted-foreground">Min €5</p>
          </CardContent>
        </Card>
      </div>

      {topupAmount >= 5 && (
        <div className="mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Riceverai</span>
          <div className="flex items-center gap-1.5 text-primary font-bold">
            <Coins className="h-4 w-4" />
            <span className="text-lg">{creditsToReceive} crediti</span>
          </div>
        </div>
      )}

      <Button
        className="w-full mt-4"
        size="lg"
        disabled={topupAmount < 5}
        onClick={onConfirm}
      >
        <CreditCard className="h-5 w-5 mr-2" />
        Ricarica €{topupAmount.toFixed(2)} → {creditsToReceive > 0 ? `${creditsToReceive} crediti` : "—"}
      </Button>
    </div>
  );
}
