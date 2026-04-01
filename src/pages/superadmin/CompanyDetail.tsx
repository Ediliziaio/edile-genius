import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatsCard from "@/components/superadmin/StatsCard";
import { ArrowLeft, Bot, Phone, MessageSquare, Save, Loader2, UserCheck, Lock, Unlock, Coins, Gift, RefreshCw } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { useImpersonation } from "@/context/ImpersonationContext";
import type { Tables } from "@/integrations/supabase/types";

const CATEGORIE_LABEL: Record<string, string> = {
  render: "Render AI", preventivi: "Preventivi", agenti_ai: "Agenti AI",
  automazioni: "Automazioni", crm: "CRM",
};

type Company = Tables<"companies">;
type Agent = Tables<"agents">;

const statusColors: Record<string, string> = {
  active: "bg-status-success-light text-status-success",
  inactive: "bg-status-error-light text-status-error",
  trial: "bg-status-warning-light text-status-warning",
};
const planLabels: Record<string, string> = { starter: "Starter", professional: "Professional", enterprise: "Enterprise" };

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { startImpersonation } = useImpersonation();

  const [company, setCompany] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversationsCount, setConversationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Crediti
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [creditTopups, setCreditTopups] = useState<any[]>([]);
  const [creditAmount, setCreditAmount] = useState("100");
  const [creditNote, setCreditNote] = useState("");
  const [addingCredits, setAddingCredits] = useState(false);

  const [editName, setEditName] = useState("");
  const [editSector, setEditSector] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");

  // Feature management
  const [allFeatures, setAllFeatures] = useState<any[]>([]);
  const [unlockedFeatures, setUnlockedFeatures] = useState<Record<string, boolean>>({});
  const [featuresLoading, setFeaturesLoading] = useState(false);
  const [featuresSaving, setFeaturesSaving] = useState<Record<string, boolean>>({});



  const loadFeatures = useCallback(async () => {
    if (!id) return;
    setFeaturesLoading(true);
    const [allRes, unlockedRes] = await Promise.all([
      (supabase as any).from("piattaforma_features").select("*").order("categoria").order("nome"),
      (supabase as any).from("azienda_features_sbloccate").select("feature_id, attivo").eq("company_id", id),
    ]);
    setAllFeatures(allRes.data || []);
    const map: Record<string, boolean> = {};
    for (const f of (unlockedRes.data || [])) map[f.feature_id] = f.attivo;
    setUnlockedFeatures(map);
    setFeaturesLoading(false);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [compRes, agentsRes, convsRes, creditsRes, topupsRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", id).single(),
        supabase.from("agents").select("*").eq("company_id", id),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", id),
        supabase.from("ai_credits").select("balance_eur").eq("company_id", id).maybeSingle(),
        supabase.from("ai_credit_topups").select("amount_eur, type, created_at, notes, invoice_number").eq("company_id", id).order("created_at", { ascending: false }).limit(5),
      ]);
      if (compRes.data) { setCompany(compRes.data); setEditName(compRes.data.name); setEditSector(compRes.data.sector || ""); setEditPlan(compRes.data.plan || "starter"); setEditStatus(compRes.data.status || "active"); }
      setAgents(agentsRes.data || []);
      setConversationsCount(convsRes.count || 0);
      if (creditsRes.data) setCreditBalance(Number(creditsRes.data.balance_eur));
      if (topupsRes.data) setCreditTopups(topupsRes.data);
      setLoading(false);
    };
    load();
    loadFeatures();
  }, [id, loadFeatures]);

  const toggleFeature = async (featureId: string, enabled: boolean) => {
    if (!id) return;
    setFeaturesSaving(prev => ({ ...prev, [featureId]: true }));
    await (supabase as any).rpc("set_company_feature", {
      _company_id: id,
      _feature_id: featureId,
      _attivo: enabled,
    });
    setUnlockedFeatures(prev => ({ ...prev, [featureId]: enabled }));
    setFeaturesSaving(prev => ({ ...prev, [featureId]: false }));
    toast({ title: enabled ? "Feature abilitata" : "Feature disabilitata", description: featureId });
  };

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const callsThisMonth = agents.reduce((s, a) => s + ((a as any).calls_month || 0), 0);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({ name: editName, sector: editSector || null, plan: editPlan, status: editStatus }).eq("id", id);
    setSaving(false);
    if (error) toast({ title: "Errore", description: error.message, variant: "destructive" });
    else { toast({ title: "Salvato", description: "Azienda aggiornata con successo." }); setCompany((prev) => prev ? { ...prev, name: editName, sector: editSector || null, plan: editPlan, status: editStatus } : prev); }
  };

  const handleAddCredits = async () => {
    if (!id) return;
    const amt = parseInt(creditAmount);
    if (!amt || amt <= 0) { toast({ variant: "destructive", title: "Inserisci un numero di crediti valido" }); return; }
    setAddingCredits(true);
    try {
      const { data, error } = await supabase.functions.invoke("topup-credits", {
        body: {
          companyId: id,
          amountEur: amt,   // 1:1 → amt crediti aggiunti al saldo
          creditsToAdd: amt, // usato dalla versione aggiornata della edge function
          paymentMethod: "manual_admin",
          type: "adjustment",
          paymentRef: creditNote || null,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message);
      toast({ title: "✅ Crediti aggiunti", description: `${amt} crediti aggiunti a ${company?.name}` });
      // Fix 6.1: ricarica saldo da DB (non ottimismo rischioso)
      const { data: refreshed } = await supabase
        .from('ai_credits')
        .select('balance_eur')
        .eq('company_id', id)
        .single();
      if (refreshed) setCreditBalance(Number(refreshed.balance_eur));
      setCreditAmount("100");
      setCreditNote("");
      // Ricarica topups
      const { data: newTopups } = await supabase.from("ai_credit_topups").select("amount_eur, type, created_at, notes, invoice_number").eq("company_id", id).order("created_at", { ascending: false }).limit(5);
      if (newTopups) setCreditTopups(newTopups);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally {
      setAddingCredits(false);
    }
  };

  // Fix 6.3: sblocco temporaneo azienda (override SA)
  const handleOverride = async (hours = 24) => {
    if (!id) return;
    const overrideUntil = new Date(Date.now() + hours * 3600000).toISOString();
    const { error } = await supabase
      .from('ai_credits')
      .update({
        override_until: overrideUntil,
        override_reason: `SA override ${hours}h — ${new Date().toLocaleDateString('it-IT')}`,
        calls_blocked: false,
      } as Parameters<typeof supabase.from>[0] extends 'ai_credits' ? never : Record<string, unknown>)
      .eq('company_id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Errore', description: error.message });
    } else {
      toast({ title: '✅ Override attivato', description: `${company?.name} sbloccata per ${hours}h` });
    }
  };

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>;
  if (!company) return <div className="p-6"><p className="text-ink-500">Azienda non trovata.</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin/companies")} className="text-ink-500 hover:text-ink-900 hover:bg-ink-50 self-start"><ArrowLeft className="h-5 w-5" /></Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-ink-900 truncate">{company.name}</h1>
          <p className="text-sm text-ink-500">{company.slug}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge className={statusColors[company.status || "active"]}>{company.status || "active"}</Badge>
          <Badge variant="outline" className="border-ink-200 text-ink-500">{planLabels[company.plan || "starter"] || company.plan}</Badge>
          <Button variant="outline" size="sm" className="border-accent-blue text-accent-blue hover:bg-status-info-light" onClick={() => { startImpersonation(company.id, company.name); navigate("/app"); }}>
            <UserCheck className="w-4 h-4 mr-1" /> Impersona
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Bot} value={agents.length} label="Agenti totali" />
        <StatsCard icon={Bot} value={activeAgents} label="Agenti attivi" deltaType="positive" />
        <StatsCard icon={Phone} value={callsThisMonth} label="Chiamate questo mese" />
        <StatsCard icon={MessageSquare} value={conversationsCount} label="Conversazioni totali" />
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-ink-100 border-none w-full sm:w-auto overflow-x-auto">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="agents">Agenti</TabsTrigger>
          <TabsTrigger value="features">Funzionalità</TabsTrigger>
          <TabsTrigger value="config">Configurazione</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="rounded-card border border-ink-200 bg-white p-6 space-y-4 shadow-card">
            <h3 className="text-lg font-semibold text-ink-900">Informazioni Azienda</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {[["Nome", company.name], ["Settore", company.sector || "—"], ["Piano", planLabels[company.plan || "starter"]], ["Stato", company.status], ["Slug", company.slug], ["Creata il", company.created_at ? new Date(company.created_at).toLocaleDateString("it-IT") : "—"]].map(([l, v]) => (
                <div key={l as string}><span className="text-ink-400">{l}:</span> <span className="text-ink-900 ml-2">{v}</span></div>
              ))}
            </div>
          </div>


        </TabsContent>

        <TabsContent value="agents">
          <div className="rounded-card border border-ink-200 bg-white overflow-hidden shadow-card">
            {agents.length === 0 ? (
              <p className="p-6 text-ink-500 text-sm">Nessun agente per questa azienda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-ink-50 hover:bg-ink-50">
                    <TableHead className="text-ink-500">Nome</TableHead>
                    <TableHead className="text-ink-500">Stato</TableHead>
                    <TableHead className="text-ink-500">Use Case</TableHead>
                    <TableHead className="text-ink-500">Chiamate</TableHead>
                    <TableHead className="text-ink-500">Ultima chiamata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id} className="hover:bg-ink-50 cursor-pointer" onClick={() => navigate(`/app/agents/${agent.id}`)}>
                      <TableCell className="text-ink-900 font-medium">{agent.name}</TableCell>
                      <TableCell><Badge className={agent.status === "active" ? "bg-status-success-light text-status-success" : "bg-ink-100 text-ink-400"}>{agent.status}</Badge></TableCell>
                      <TableCell className="text-ink-500">{agent.use_case || "—"}</TableCell>
                      <TableCell className="text-ink-900">{agent.calls_total || 0}</TableCell>
                      <TableCell className="text-ink-500">{agent.last_call_at ? new Date(agent.last_call_at).toLocaleDateString("it-IT") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="features" className="space-y-4">
          <div className="rounded-card border border-ink-200 bg-white p-6 shadow-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-ink-900">Gestione Funzionalità</h3>
              {featuresLoading && <Loader2 className="h-4 w-4 animate-spin text-brand" />}
            </div>
            {Object.entries(
              allFeatures.reduce((acc: Record<string, any[]>, f: any) => {
                (acc[f.categoria] = acc[f.categoria] || []).push(f);
                return acc;
              }, {})
            ).map(([cat, features]) => (
              <div key={cat} className="mb-6">
                <h4 className="text-sm font-semibold text-ink-500 uppercase tracking-wide mb-3">
                  {CATEGORIE_LABEL[cat] || cat}
                </h4>
                <div className="space-y-2">
                  {(features as any[]).map((f: any) => {
                    const isOn = !!unlockedFeatures[f.id];
                    const isSaving = !!featuresSaving[f.id];
                    return (
                      <div key={f.id} className="flex items-center justify-between p-3 rounded-lg border border-ink-100 hover:bg-ink-50">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{f.icona}</span>
                          <div>
                            <p className="text-sm font-medium text-ink-900">{f.nome}</p>
                            <p className="text-xs text-ink-400">{f.descrizione}</p>
                          </div>
                          {f.crediti_per_uso > 0 && (
                            <Badge variant="outline" className="text-xs border-ink-200 text-ink-500 ml-2">
                              {f.crediti_per_uso} credito/uso
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {isOn
                            ? <Unlock className="h-4 w-4 text-status-success" />
                            : <Lock className="h-4 w-4 text-ink-300" />
                          }
                          {isSaving
                            ? <Loader2 className="h-4 w-4 animate-spin text-brand" />
                            : <Switch checked={isOn} onCheckedChange={(v) => toggleFeature(f.id, v)} />
                          }
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="space-y-4">

          {/* ── SEZIONE CREDITI ───────────────────────── */}
          <div className="rounded-card border border-ink-200 bg-white p-6 space-y-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold text-ink-900">Crediti</h3>
              </div>
              {creditBalance !== null && (
                <div className="text-right">
                  <p className="text-2xl font-extrabold text-primary">{Math.round(creditBalance)}</p>
                  <p className="text-xs text-muted-foreground">crediti disponibili</p>
                </div>
              )}
            </div>

            {/* Form ricarica */}
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Gift className="h-4 w-4" />
                Aggiungi crediti gratuiti
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-ink-600">Crediti da aggiungere</Label>
                  <Input
                    type="number"
                    min="1"
                    step="1"
                    value={creditAmount}
                    onChange={e => setCreditAmount(e.target.value)}
                    placeholder="Es. 100"
                    className="text-lg font-bold"
                  />
                </div>
                <div className="flex gap-2 items-end">
                  {[100, 250, 500, 1000].map(n => (
                    <Button key={n} variant="outline" size="sm" className="flex-1 text-xs" onClick={() => setCreditAmount(String(n))}>
                      {n}
                    </Button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-ink-600">Nota interna (opzionale)</Label>
                <Textarea
                  value={creditNote}
                  onChange={e => setCreditNote(e.target.value)}
                  placeholder="Es. Credito promozionale onboarding, rimborso, ecc."
                  rows={2}
                  className="resize-none text-sm"
                />
              </div>
              <Button
                onClick={handleAddCredits}
                disabled={addingCredits || !creditAmount || parseInt(creditAmount) <= 0}
                className="w-full"
              >
                {addingCredits
                  ? <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  : <Gift className="h-4 w-4 mr-2" />}
                Aggiungi {creditAmount || "0"} crediti a {company?.name}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleOverride(24)}
                className="w-full border-amber-300 text-amber-700 hover:bg-amber-50"
              >
                🔓 Sblocca 24h
              </Button>
            </div>

            {/* Ultimi movimenti */}
            {creditTopups.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                  <RefreshCw className="h-3 w-3" /> Ultime ricariche
                </p>
                <div className="space-y-1.5">
                  {creditTopups.map((t, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1.5 border-b last:border-0">
                      <div>
                        <span className="font-mono font-semibold">+{Math.round(t.amount_eur)} cr</span>
                        {t.notes && <span className="text-muted-foreground ml-2">— {t.notes}</span>}
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="capitalize">{t.type}</span>
                        <span>{new Date(t.created_at).toLocaleDateString("it-IT")}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── MODIFICA AZIENDA ─────────────────────── */}
          <div className="rounded-card border border-ink-200 bg-white p-6 space-y-5 shadow-card">
            <h3 className="text-lg font-semibold text-ink-900">Modifica Azienda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label className="text-ink-600">Nome</Label><Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900" /></div>
              <div className="space-y-2"><Label className="text-ink-600">Settore</Label><Input value={editSector} onChange={(e) => setEditSector(e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900" /></div>
              <div className="space-y-2"><Label className="text-ink-600">Piano</Label><Select value={editPlan} onValueChange={setEditPlan}><SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="starter">Starter</SelectItem><SelectItem value="professional">Professional</SelectItem><SelectItem value="enterprise">Enterprise</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label className="text-ink-600">Stato</Label><Select value={editStatus} onValueChange={setEditStatus}><SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="active">Attivo</SelectItem><SelectItem value="inactive">Inattivo</SelectItem><SelectItem value="trial">Trial</SelectItem></SelectContent></Select></div>
            </div>


            <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-hover text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva modifiche
            </Button>
          </div>

        </TabsContent>
      </Tabs>
    </div>
  );
}
