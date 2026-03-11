import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, RefreshCw } from "lucide-react";
import CreditsBalanceCard from "@/components/credits/CreditsBalanceCard";
import TopupSelector from "@/components/credits/TopupSelector";
import CreditsUsageTabs from "@/components/credits/CreditsUsageTabs";

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

interface Topup {
  id: string;
  amount_eur: number;
  type: string;
  status: string;
  payment_method: string | null;
  invoice_number: string | null;
  created_at: string;
}

interface UsageRow {
  id: string;
  agent_id: string | null;
  duration_sec: number;
  duration_min: number;
  llm_model: string;
  tts_model: string;
  cost_billed_total: number;
  balance_after: number;
  created_at: string;
}

export default function CreditsPage() {
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [credits, setCredits] = useState<Credits | null>(null);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
  const [customAmount, setCustomAmount] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!companyId) return;
    const [creditsRes, topupsRes, usageRes, agentsRes] = await Promise.all([
      supabase.from("ai_credits").select("*").eq("company_id", companyId).single(),
      supabase.from("ai_credit_topups").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(20),
      supabase.from("ai_credit_usage").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(30),
      supabase.from("agents").select("id, name").eq("company_id", companyId),
    ]);

    if (creditsRes.data) setCredits(creditsRes.data as unknown as Credits);
    if (topupsRes.data) setTopups(topupsRes.data as unknown as Topup[]);
    if (usageRes.data) setUsage(usageRes.data as unknown as UsageRow[]);
    if (agentsRes.data) {
      const map: Record<string, string> = {};
      agentsRes.data.forEach((a: any) => { map[a.id] = a.name; });
      setAgentNames(map);
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const topupAmount = selectedAmount ?? (parseFloat(customAmount) || 0);

  const handleTopup = async () => {
    if (topupAmount < 5) { toast({ variant: "destructive", title: "Minimo €5" }); return; }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("topup-credits", {
        body: { companyId, amountEur: topupAmount, paymentMethod: "manual", type: "manual" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Ricarica completata", description: `Nuovo saldo: €${data.new_balance_eur?.toFixed(2)}` });
      setConfirmModal(false);
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore ricarica", description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const toggleAutoRecharge = async (enabled: boolean) => {
    if (!companyId) return;
    await supabase.from("ai_credits").update({ auto_recharge_enabled: enabled } as any).eq("company_id", companyId);
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  if (!credits) return <p className="text-muted-foreground p-8">Nessun record crediti trovato.</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Crediti & Utilizzo</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestisci il saldo, ricarica e monitora i consumi</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" /> Aggiorna</Button>
      </div>

      <CreditsBalanceCard credits={credits} onRechargeNow={() => setConfirmModal(true)} onToggleAutoRecharge={toggleAutoRecharge} />

      <TopupSelector
        selectedAmount={selectedAmount}
        customAmount={customAmount}
        onSelectAmount={setSelectedAmount}
        onCustomAmountChange={setCustomAmount}
        onConfirm={() => setConfirmModal(true)}
      />

      <CreditsUsageTabs usage={usage} topups={topups} agentNames={agentNames} />

      {/* Confirm Modal */}
      <Dialog open={confirmModal} onOpenChange={setConfirmModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conferma Ricarica</DialogTitle></DialogHeader>
          <Card className="bg-muted/50"><CardContent className="p-5 space-y-2">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Importo:</span><span className="font-bold">€{topupAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Saldo attuale:</span><span className="font-mono">€{credits.balance_eur.toFixed(2)}</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-sm font-semibold">Saldo dopo ricarica:</span><span className="font-bold text-primary">€{(credits.balance_eur + topupAmount).toFixed(2)}</span></div>
          </CardContent></Card>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal(false)}>Annulla</Button>
            <Button onClick={handleTopup} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Conferma e Ricarica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
