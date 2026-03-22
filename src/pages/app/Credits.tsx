import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2, RefreshCw, Package, Sparkles, Lock } from "lucide-react";
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

interface CreditPackage {
  id: string;
  name: string;
  price_eur: number;
  credits_eur: number;
  badge: string | null;
  sort_order: number;
}

interface PlatformConfig {
  crediti_per_euro: number;
}

const ERROR_MESSAGES: Record<string, string> = {
  stripe_auth_error: "Problema di configurazione pagamenti. Contatta il supporto.",
  stripe_unavailable: "Pagamenti temporaneamente non disponibili. Riprova tra qualche minuto.",
  stripe_invalid_request: "Richiesta non valida. Aggiorna la pagina e riprova.",
  stripe_not_configured: "Sistema di pagamento non ancora configurato. Contatta il supporto.",
  unknown_error: "Errore durante la creazione del pagamento. Riprova.",
};

export default function CreditsPage() {
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [credits, setCredits] = useState<Credits | null>(null);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [usage, setUsage] = useState<UsageRow[]>([]);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [creditRate, setCreditRate] = useState<number>(10); // default 10 crediti per €1
  const [loading, setLoading] = useState(true);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(20);
  const [customAmount, setCustomAmount] = useState("");
  const [confirmModal, setConfirmModal] = useState(false);
  const [confirmPackage, setConfirmPackage] = useState<CreditPackage | null>(null);
  const [processing, setProcessing] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!companyId) return;
    const [creditsRes, topupsRes, usageRes, agentsRes, packagesRes, platformRes] = await Promise.all([
      supabase.from("ai_credits").select("*").eq("company_id", companyId).single(),
      supabase.from("ai_credit_topups").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(20),
      supabase.from("ai_credit_usage").select("*").eq("company_id", companyId).order("created_at", { ascending: false }).limit(30),
      supabase.from("agents").select("id, name").eq("company_id", companyId),
      supabase.from("ai_credit_packages").select("*").eq("is_active", true).order("sort_order"),
      supabase.from("platform_config").select("crediti_per_euro").limit(1).single(),
    ]);

    if (creditsRes.data) setCredits(creditsRes.data as unknown as Credits);
    if (topupsRes.data) setTopups(topupsRes.data as unknown as Topup[]);
    if (usageRes.data) setUsage(usageRes.data as unknown as UsageRow[]);
    if (agentsRes.data) {
      const map: Record<string, string> = {};
      agentsRes.data.forEach((a: any) => { map[a.id] = a.name; });
      setAgentNames(map);
    }
    const pkgs = packagesRes.data as unknown as CreditPackage[] ?? [];
    if (pkgs.length > 0) setPackages(pkgs);

    // Deriva il tasso dalla platform_config. Se non configurato,
    // usa il tasso del pacchetto più economico come riferimento.
    const platformRate = platformRes.data?.crediti_per_euro ? Number(platformRes.data.crediti_per_euro) : null;
    if (platformRate && platformRate > 0) {
      setCreditRate(platformRate);
    } else if (pkgs.length > 0) {
      // Usa il tasso del primo pacchetto attivo (order by sort_order)
      const basePkg = pkgs[0];
      if (basePkg.price_eur > 0 && basePkg.credits_eur > 0) {
        setCreditRate(basePkg.credits_eur / basePkg.price_eur);
      }
    }
    setLoading(false);
  }, [companyId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Polling after Stripe payment — wait for webhook to process credits
  const pollForCredits = useCallback(async (previousBalance: number, maxAttempts = 12) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      await new Promise(r => setTimeout(r, 2500));
      const { data } = await supabase
        .from("ai_credits")
        .select("balance_eur")
        .eq("company_id", companyId!)
        .single();

      if (data && data.balance_eur > previousBalance) {
        await fetchAll();
        toast({
          title: "✅ Crediti aggiunti!",
          description: `Nuovo saldo: ${Math.round(data.balance_eur)} crediti`,
        });
        return;
      }
    }
    // After 30s without update, show patience message
    toast({
      title: "Pagamento ricevuto",
      description: "I crediti verranno aggiunti entro pochi minuti. Ricarica la pagina per aggiornare.",
      duration: 8000,
    });
  }, [companyId, fetchAll, toast]);

  // Handle Stripe redirect query params
  useEffect(() => {
    if (!companyId) return; // Wait for auth to load

    const params = new URLSearchParams(window.location.search);
    const payment = params.get("payment");
    if (payment === "success") {
      window.history.replaceState({}, "", window.location.pathname);
      supabase
        .from("ai_credits")
        .select("balance_eur")
        .eq("company_id", companyId)
        .single()
        .then(({ data }) => {
          const currentBalance = data?.balance_eur ?? 0;
          toast({
            title: "💳 Pagamento completato!",
            description: "Sto verificando l'accredito dei crediti...",
          });
          pollForCredits(currentBalance);
        });
    } else if (payment === "cancelled") {
      toast({ variant: "destructive", title: "Pagamento annullato", description: "Nessun addebito effettuato." });
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, [companyId, pollForCredits, toast]);

  const topupAmount = selectedAmount ?? (parseFloat(customAmount) || 0);

  const creditsToAdd = Math.round(topupAmount * creditRate);

  const handleTopup = async () => {
    if (topupAmount < 5) { toast({ variant: "destructive", title: "Minimo €5" }); return; }
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("topup-credits", {
        body: { companyId, amountEur: topupAmount, creditsToAdd, paymentMethod: "manual", type: "manual" },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "Ricarica completata", description: `Nuovo saldo: ${Math.round(Number(data.new_balance_eur))} crediti` });
      setConfirmModal(false);
      fetchAll();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore ricarica", description: err.message });
    } finally {
      setProcessing(false);
    }
  };

  const handlePackagePurchase = async () => {
    if (!confirmPackage) return;
    setProcessing(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-session", {
        body: {
          packageId: confirmPackage.id,
          companyId,
          successUrl: `${window.location.origin}/app/credits?payment=success`,
          cancelUrl: `${window.location.origin}/app/credits?payment=cancelled`,
        },
      });

      if (error || data?.error) {
        const code = data?.code || "unknown_error";
        toast({
          variant: "destructive",
          title: "Errore pagamento",
          description: ERROR_MESSAGES[code] || ERROR_MESSAGES.unknown_error,
        });
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL di pagamento non ricevuto");
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore di rete", description: "Controlla la connessione e riprova." });
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

      {/* Package Cards */}
      {packages.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Pacchetti Crediti</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {packages.map((pkg) => (
              <Card
                key={pkg.id}
                className={`relative cursor-pointer transition-all hover:shadow-lg hover:border-primary/50 ${pkg.badge ? "border-primary/30 shadow-md" : ""}`}
                onClick={() => setConfirmPackage(pkg)}
              >
                {pkg.badge && (
                  <Badge className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs px-3">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {pkg.badge}
                  </Badge>
                )}
                <CardContent className="p-6 text-center space-y-3 pt-6">
                  <p className="text-sm font-semibold text-muted-foreground">{pkg.name}</p>
                  <p className="text-4xl font-extrabold text-foreground">
                    {Number(pkg.credits_eur) > 0 ? Number(pkg.credits_eur).toFixed(0) : "—"}
                  </p>
                  <p className="text-xs text-muted-foreground">crediti conversazionali</p>
                  {Number(pkg.credits_eur) > 0 && Number(pkg.price_eur) > 0 && (
                    <p className="text-xs text-primary font-medium">
                      {(Number(pkg.credits_eur) / Number(pkg.price_eur)).toFixed(1)} crediti/€
                    </p>
                  )}
                  <p className="text-lg font-bold text-primary">€{Number(pkg.price_eur).toFixed(0)}</p>
                  <Button className="w-full" variant={pkg.badge ? "default" : "outline"} size="sm">
                    Acquista
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center gap-1">
            <Lock className="w-3 h-3" />
            Pagamento sicuro via Stripe — crediti accreditati automaticamente in pochi secondi
          </p>
        </div>
      )}

      <TopupSelector
        selectedAmount={selectedAmount}
        customAmount={customAmount}
        onSelectAmount={setSelectedAmount}
        onCustomAmountChange={setCustomAmount}
        onConfirm={() => setConfirmModal(true)}
        creditRate={creditRate}
      />

      <CreditsUsageTabs usage={usage} topups={topups} agentNames={agentNames} />

      {/* Confirm Manual Topup Modal */}
      <Dialog open={confirmModal} onOpenChange={setConfirmModal}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conferma Ricarica</DialogTitle></DialogHeader>
          <Card className="bg-muted/50"><CardContent className="p-5 space-y-2">
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Importo pagato:</span><span className="font-bold">€{topupAmount.toFixed(2)}</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Crediti aggiunti:</span><span className="font-bold text-primary">+{creditsToAdd} crediti</span></div>
            <div className="flex justify-between"><span className="text-sm text-muted-foreground">Saldo attuale:</span><span className="font-mono">{Math.round(credits.balance_eur)} crediti</span></div>
            <div className="flex justify-between border-t pt-2"><span className="text-sm font-semibold">Saldo dopo ricarica:</span><span className="font-bold text-primary">{Math.round(credits.balance_eur) + creditsToAdd} crediti</span></div>
          </CardContent></Card>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmModal(false)}>Annulla</Button>
            <Button onClick={handleTopup} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Conferma e Ricarica</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Package Purchase Modal */}
      <Dialog open={!!confirmPackage} onOpenChange={(open) => !open && setConfirmPackage(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Conferma Acquisto Pacchetto</DialogTitle></DialogHeader>
          {confirmPackage && (
            <Card className="bg-muted/50"><CardContent className="p-5 space-y-2">
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Pacchetto:</span><span className="font-bold">{confirmPackage.name}</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Crediti aggiunti:</span><span className="font-bold">{Math.round(Number(confirmPackage.credits_eur))} crediti</span></div>
              <div className="flex justify-between"><span className="text-sm text-muted-foreground">Prezzo:</span><span className="font-bold text-primary">€{Number(confirmPackage.price_eur).toFixed(0)}</span></div>
              <div className="flex justify-between border-t pt-2"><span className="text-sm font-semibold">Saldo dopo acquisto:</span><span className="font-bold text-primary">{Math.round(credits.balance_eur + Number(confirmPackage.credits_eur))} crediti</span></div>
            </CardContent></Card>
          )}
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <Lock className="w-3 h-3" />
            Verrai reindirizzato a Stripe per il pagamento sicuro. I crediti verranno aggiunti automaticamente.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPackage(null)}>Annulla</Button>
            <Button onClick={handlePackagePurchase} disabled={processing}>{processing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Conferma Acquisto</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
