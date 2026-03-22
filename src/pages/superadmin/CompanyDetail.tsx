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
import { ArrowLeft, Bot, Phone, MessageSquare, Save, Loader2, UserCheck, Lock, Unlock } from "lucide-react";
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
      const [compRes, agentsRes, convsRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", id).single(),
        supabase.from("agents").select("*").eq("company_id", id),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", id),
      ]);
      if (compRes.data) { setCompany(compRes.data); setEditName(compRes.data.name); setEditSector(compRes.data.sector || ""); setEditPlan(compRes.data.plan || "starter"); setEditStatus(compRes.data.status || "active"); }
      setAgents(agentsRes.data || []);
      setConversationsCount(convsRes.count || 0);
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

        <TabsContent value="config">
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
