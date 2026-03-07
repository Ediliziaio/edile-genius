import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import {
  Ban, CreditCard, Bot, Loader2, RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

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

const TOPUP_AMOUNTS = [10, 20, 50, 100];

export default function CreditsPage() {
  const companyId = useCompanyId();
  const navigate = useNavigate();
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

  const usagePct = credits.total_recharged_eur > 0 ? (credits.total_spent_eur / credits.total_recharged_eur) * 100 : 0;
  const balanceColor = credits.calls_blocked ? "text-destructive" : credits.balance_eur <= (credits.alert_threshold_eur || 5) ? "text-yellow-600" : "text-foreground";
  const barColor = usagePct > 80 ? "bg-destructive" : usagePct > 60 ? "bg-yellow-500" : "bg-primary";

  // Agent usage aggregation
  const agentUsageMap: Record<string, { name: string; cost: number; calls: number; mins: number }> = {};
  usage.forEach((u) => {
    const aid = u.agent_id || "unknown";
    if (!agentUsageMap[aid]) agentUsageMap[aid] = { name: agentNames[aid] || "Sconosciuto", cost: 0, calls: 0, mins: 0 };
    agentUsageMap[aid].cost += u.cost_billed_total;
    agentUsageMap[aid].calls += 1;
    agentUsageMap[aid].mins += u.duration_min;
  });
  const agentChartData = Object.values(agentUsageMap).sort((a, b) => b.cost - a.cost);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Crediti & Utilizzo</h1>
          <p className="text-sm text-muted-foreground mt-1">Gestisci il saldo, ricarica e monitora i consumi</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchAll}><RefreshCw className="h-4 w-4 mr-2" /> Aggiorna</Button>
      </div>

      {/* Hero Balance Card */}
      <Card className={`border-2 ${credits.calls_blocked ? "border-destructive" : credits.balance_eur <= credits.alert_threshold_eur ? "border-yellow-400" : "border-primary/30"}`}>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-semibold text-muted-foreground">Saldo Disponibile</p>
              <p className={`text-5xl font-extrabold mt-1 ${balanceColor}`}>€{credits.balance_eur.toFixed(2)}</p>

              <div className="mt-4">
                <p className="text-xs font-mono text-muted-foreground mb-1.5">
                  €{credits.total_spent_eur.toFixed(2)} spesi — €{credits.total_recharged_eur.toFixed(2)} ricaricati
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
                    <Button size="sm" variant="destructive" className="ml-auto" onClick={() => setConfirmModal(true)}>Ricarica Ora</Button>
                  </CardContent>
                </Card>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">Ricarica Automatica</p>
                <Switch checked={credits.auto_recharge_enabled} onCheckedChange={toggleAutoRecharge} />
              </div>
              {credits.auto_recharge_enabled ? (
                <Card className="mt-3 border-primary/20 bg-primary/5">
                  <CardContent className="p-4 space-y-3">
                    <p className="text-sm font-semibold text-primary">Ricarica automatica attiva ✅</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Soglia (€)</Label><Input type="number" defaultValue={credits.auto_recharge_threshold} className="mt-1" readOnly /></div>
                      <div><Label className="text-xs">Importo (€)</Label><Input type="number" defaultValue={credits.auto_recharge_amount} className="mt-1" readOnly /></div>
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

      {/* Manual Topup */}
      <div>
        <h2 className="text-lg font-bold text-foreground">Ricarica Manuale</h2>
        <p className="text-sm text-muted-foreground">Seleziona un importo o inseriscine uno personalizzato.</p>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
          {TOPUP_AMOUNTS.map((amt) => (
            <Card key={amt} className={`cursor-pointer transition-all hover:shadow-md ${selectedAmount === amt ? "border-2 border-primary bg-primary/5" : "border"}`} onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}>
              <CardContent className="p-5 text-center">
                <p className="text-3xl font-extrabold text-foreground">€{amt}</p>
                {amt === 20 && <Badge className="mt-2 bg-primary/10 text-primary border-0">Popolare</Badge>}
              </CardContent>
            </Card>
          ))}
          <Card className={`cursor-pointer transition-all hover:shadow-md ${selectedAmount === null && customAmount ? "border-2 border-primary bg-primary/5" : "border border-dashed"}`} onClick={() => setSelectedAmount(null)}>
            <CardContent className="p-5 text-center space-y-2">
              <p className="text-sm text-muted-foreground">Personalizzato</p>
              <Input type="number" min={5} max={500} placeholder="€" value={customAmount} onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }} className="text-center text-lg font-bold" />
              <p className="text-xs text-muted-foreground">Min €5</p>
            </CardContent>
          </Card>
        </div>
        <Button className="w-full mt-6" size="lg" disabled={topupAmount < 5} onClick={() => setConfirmModal(true)}>
          <CreditCard className="h-5 w-5 mr-2" /> Ricarica €{topupAmount.toFixed(2)}
        </Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="usage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="usage">Utilizzo per Agente</TabsTrigger>
          <TabsTrigger value="conversations">Ultime Conversazioni</TabsTrigger>
          <TabsTrigger value="topups">Storico Ricariche</TabsTrigger>
        </TabsList>

        <TabsContent value="usage">
          {agentChartData.length > 0 ? (
            <>
              <Card><CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Agente</TableHead><TableHead className="text-right">Chiamate</TableHead><TableHead className="text-right">Minuti</TableHead><TableHead className="text-right">Costo (€)</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {agentChartData.map((a, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium flex items-center gap-2"><Bot className="h-4 w-4 text-muted-foreground" /> {a.name}</TableCell>
                        <TableCell className="text-right">{a.calls}</TableCell>
                        <TableCell className="text-right font-mono">{a.mins.toFixed(1)}</TableCell>
                        <TableCell className="text-right font-mono font-semibold text-primary">€{a.cost.toFixed(4)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent></Card>
              <div className="h-[200px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agentChartData} layout="vertical" margin={{ left: 80 }}>
                    <XAxis type="number" tickFormatter={(v) => `€${v.toFixed(2)}`} />
                    <YAxis type="category" dataKey="name" width={80} tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v: number) => `€${v.toFixed(4)}`} />
                    <Bar dataKey="cost" radius={[0, 4, 4, 0]}>{agentChartData.map((_, i) => <Cell key={i} className="fill-primary" />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </>
          ) : <p className="text-muted-foreground text-center py-8">Nessun consumo registrato.</p>}
        </TabsContent>

        <TabsContent value="conversations">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data/Ora</TableHead><TableHead>Agente</TableHead><TableHead>Durata</TableHead><TableHead>LLM</TableHead><TableHead className="text-right">Costo €</TableHead><TableHead className="text-right">Saldo dopo</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {usage.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nessun consumo</TableCell></TableRow>
                ) : usage.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-xs">{format(new Date(u.created_at), "dd/MM HH:mm", { locale: it })}</TableCell>
                    <TableCell>{agentNames[u.agent_id || ""] || "—"}</TableCell>
                    <TableCell className="font-mono text-sm">{Math.floor(u.duration_sec / 60)}m {u.duration_sec % 60}s</TableCell>
                    <TableCell><Badge variant="secondary" className="text-xs">{u.llm_model}</Badge></TableCell>
                    <TableCell className="text-right font-mono font-semibold text-primary">€{u.cost_billed_total.toFixed(4)}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">€{u.balance_after.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="topups">
          <Card><CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Data</TableHead><TableHead>Tipo</TableHead><TableHead className="text-right">Importo</TableHead><TableHead>Metodo</TableHead><TableHead>N. Fattura</TableHead><TableHead>Stato</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {topups.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nessuna ricarica</TableCell></TableRow>
                ) : topups.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-mono text-xs">{format(new Date(t.created_at), "dd/MM/yy HH:mm", { locale: it })}</TableCell>
                    <TableCell><Badge variant={t.type === "manual" ? "default" : t.type === "auto" ? "secondary" : "outline"} className="text-xs">{t.type === "manual" ? "Manuale" : t.type === "auto" ? "Automatica" : t.type === "promotional" ? "Promo" : "Rettifica"}</Badge></TableCell>
                    <TableCell className="text-right font-mono font-semibold">€{t.amount_eur.toFixed(2)}</TableCell>
                    <TableCell className="text-sm">{t.payment_method || "—"}</TableCell>
                    <TableCell className="font-mono text-xs">{t.invoice_number || "—"}</TableCell>
                    <TableCell><Badge variant={t.status === "completed" ? "default" : "destructive"} className="text-xs">{t.status === "completed" ? "Completato" : t.status}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>
      </Tabs>

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
