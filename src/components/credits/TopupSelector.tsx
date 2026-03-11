import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CreditCard } from "lucide-react";

const TOPUP_AMOUNTS = [10, 20, 50, 100];

interface TopupSelectorProps {
  selectedAmount: number | null;
  customAmount: string;
  onSelectAmount: (amt: number | null) => void;
  onCustomAmountChange: (val: string) => void;
  onConfirm: () => void;
}

export default function TopupSelector({ selectedAmount, customAmount, onSelectAmount, onCustomAmountChange, onConfirm }: TopupSelectorProps) {
  const topupAmount = selectedAmount ?? (parseFloat(customAmount) || 0);

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground">Ricarica Manuale</h2>
      <p className="text-sm text-muted-foreground">Seleziona un importo o inseriscine uno personalizzato.</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
        {TOPUP_AMOUNTS.map((amt) => (
          <Card key={amt} className={`cursor-pointer transition-all hover:shadow-md ${selectedAmount === amt ? "border-2 border-primary bg-primary/5" : "border"}`} onClick={() => { onSelectAmount(amt); onCustomAmountChange(""); }}>
            <CardContent className="p-5 text-center">
              <p className="text-3xl font-extrabold text-foreground">€{amt}</p>
              {amt === 20 && <Badge className="mt-2 bg-primary/10 text-primary border-0">Popolare</Badge>}
            </CardContent>
          </Card>
        ))}
        <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedAmount === null && customAmount ? "border-2 border-primary bg-primary/5" : "border border-dashed"}`} onClick={() => onSelectAmount(null)}>
          <CardContent className="p-5 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Personalizzato</p>
            <Input type="number" min={5} max={500} placeholder="€" value={customAmount} onChange={(e) => { onCustomAmountChange(e.target.value); onSelectAmount(null); }} className="text-center text-lg font-bold" />
            <p className="text-xs text-muted-foreground">Min €5</p>
          </CardContent>
        </Card>
      </div>
      <Button className="w-full mt-6" size="lg" disabled={topupAmount < 5} onClick={onConfirm}>
        <CreditCard className="h-5 w-5 mr-2" /> Ricarica €{topupAmount.toFixed(2)}
      </Button>
    </div>
  );
}
