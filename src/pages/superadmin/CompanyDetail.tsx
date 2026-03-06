import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatsCard from "@/components/superadmin/StatsCard";
import { ArrowLeft, Building2, Bot, Phone, MessageSquare, Eye, EyeOff, Save, Loader2 } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Company = Tables<"companies">;
type Agent = Tables<"agents">;

const statusColors: Record<string, string> = {
  active: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  inactive: "bg-red-500/20 text-red-400 border-red-500/30",
  trial: "bg-amber-500/20 text-amber-400 border-amber-500/30",
};

const planLabels: Record<string, string> = {
  starter: "Starter",
  professional: "Professional",
  enterprise: "Enterprise",
};

export default function CompanyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [company, setCompany] = useState<Company | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [conversationsCount, setConversationsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState("");
  const [editSector, setEditSector] = useState("");
  const [editPlan, setEditPlan] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const [compRes, agentsRes, convsRes] = await Promise.all([
        supabase.from("companies").select("*").eq("id", id).single(),
        supabase.from("agents").select("*").eq("company_id", id),
        supabase.from("conversations").select("id", { count: "exact", head: true }).eq("company_id", id),
      ]);
      if (compRes.data) {
        setCompany(compRes.data);
        setEditName(compRes.data.name);
        setEditSector(compRes.data.sector || "");
        setEditPlan(compRes.data.plan || "starter");
        setEditStatus(compRes.data.status || "active");
        setEditApiKey(compRes.data.elevenlabs_api_key || "");
      }
      setAgents(agentsRes.data || []);
      setConversationsCount(convsRes.count || 0);
      setLoading(false);
    };
    load();
  }, [id]);

  const activeAgents = agents.filter((a) => a.status === "active").length;
  const callsThisMonth = agents.reduce((s, a) => s + (a.calls_this_month || 0), 0);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      name: editName,
      sector: editSector || null,
      plan: editPlan,
      status: editStatus,
      elevenlabs_api_key: editApiKey || null,
    }).eq("id", id);
    setSaving(false);
    if (error) {
      toast({ title: "Errore", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Salvato", description: "Azienda aggiornata con successo." });
      setCompany((prev) => prev ? { ...prev, name: editName, sector: editSector || null, plan: editPlan, status: editStatus, elevenlabs_api_key: editApiKey || null } : prev);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--app-accent))]" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="p-6">
        <p className="text-[hsl(var(--app-text-secondary))]">Azienda non trovata.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin/companies")} className="text-[hsl(var(--app-text-secondary))] hover:text-[hsl(var(--app-text-primary))]">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-[hsl(var(--app-text-primary))]">{company.name}</h1>
          <p className="text-sm text-[hsl(var(--app-text-secondary))]">{company.slug}</p>
        </div>
        <Badge className={statusColors[company.status || "active"]}>{company.status || "active"}</Badge>
        <Badge variant="outline" className="border-[hsl(var(--app-border))] text-[hsl(var(--app-text-secondary))]">{planLabels[company.plan || "starter"] || company.plan}</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Bot} value={agents.length} label="Agenti totali" />
        <StatsCard icon={Bot} value={activeAgents} label="Agenti attivi" deltaType="positive" />
        <StatsCard icon={Phone} value={callsThisMonth} label="Chiamate questo mese" />
        <StatsCard icon={MessageSquare} value={conversationsCount} label="Conversazioni totali" />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="bg-[hsl(var(--app-elevated))] border border-[hsl(var(--app-border))]">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[hsl(var(--app-secondary))] data-[state=active]:text-[hsl(var(--app-text-primary))] text-[hsl(var(--app-text-secondary))]">Panoramica</TabsTrigger>
          <TabsTrigger value="agents" className="data-[state=active]:bg-[hsl(var(--app-secondary))] data-[state=active]:text-[hsl(var(--app-text-primary))] text-[hsl(var(--app-text-secondary))]">Agenti</TabsTrigger>
          <TabsTrigger value="config" className="data-[state=active]:bg-[hsl(var(--app-secondary))] data-[state=active]:text-[hsl(var(--app-text-primary))] text-[hsl(var(--app-text-secondary))]">Configurazione</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-6 space-y-4">
            <h3 className="text-lg font-semibold text-[hsl(var(--app-text-primary))]">Informazioni Azienda</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-[hsl(var(--app-text-secondary))]">Nome:</span> <span className="text-[hsl(var(--app-text-primary))] ml-2">{company.name}</span></div>
              <div><span className="text-[hsl(var(--app-text-secondary))]">Settore:</span> <span className="text-[hsl(var(--app-text-primary))] ml-2">{company.sector || "—"}</span></div>
              <div><span className="text-[hsl(var(--app-text-secondary))]">Piano:</span> <span className="text-[hsl(var(--app-text-primary))] ml-2">{planLabels[company.plan || "starter"]}</span></div>
              <div><span className="text-[hsl(var(--app-text-secondary))]">Stato:</span> <span className="text-[hsl(var(--app-text-primary))] ml-2">{company.status}</span></div>
              <div><span className="text-[hsl(var(--app-text-secondary))]">Slug:</span> <span className="text-[hsl(var(--app-text-primary))] ml-2">{company.slug}</span></div>
              <div><span className="text-[hsl(var(--app-text-secondary))]">Creata il:</span> <span className="text-[hsl(var(--app-text-primary))] ml-2">{company.created_at ? new Date(company.created_at).toLocaleDateString("it-IT") : "—"}</span></div>
            </div>
          </div>
          <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-6">
            <h3 className="text-lg font-semibold text-[hsl(var(--app-text-primary))] mb-2">ElevenLabs API Key</h3>
            <p className="text-sm text-[hsl(var(--app-text-secondary))]">
              {company.elevenlabs_api_key ? (
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">Configurata</Badge>
              ) : (
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Non configurata</Badge>
              )}
            </p>
          </div>
        </TabsContent>

        {/* Agents Tab */}
        <TabsContent value="agents">
          <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] overflow-hidden">
            {agents.length === 0 ? (
              <p className="p-6 text-[hsl(var(--app-text-secondary))] text-sm">Nessun agente per questa azienda.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="border-[hsl(var(--app-border))] hover:bg-transparent">
                    <TableHead className="text-[hsl(var(--app-text-secondary))]">Nome</TableHead>
                    <TableHead className="text-[hsl(var(--app-text-secondary))]">Stato</TableHead>
                    <TableHead className="text-[hsl(var(--app-text-secondary))]">Use Case</TableHead>
                    <TableHead className="text-[hsl(var(--app-text-secondary))]">Chiamate</TableHead>
                    <TableHead className="text-[hsl(var(--app-text-secondary))]">Ultima chiamata</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agents.map((agent) => (
                    <TableRow key={agent.id} className="border-[hsl(var(--app-border))] hover:bg-[hsl(var(--app-elevated))]/50 cursor-pointer" onClick={() => navigate(`/app/agents/${agent.id}`)}>
                      <TableCell className="text-[hsl(var(--app-text-primary))] font-medium">{agent.name}</TableCell>
                      <TableCell>
                        <Badge className={agent.status === "active" ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-500/20 text-zinc-400"}>{agent.status}</Badge>
                      </TableCell>
                      <TableCell className="text-[hsl(var(--app-text-secondary))]">{agent.use_case || "—"}</TableCell>
                      <TableCell className="text-[hsl(var(--app-text-primary))]">{agent.calls_total || 0}</TableCell>
                      <TableCell className="text-[hsl(var(--app-text-secondary))]">{agent.last_call_at ? new Date(agent.last_call_at).toLocaleDateString("it-IT") : "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        {/* Config Tab */}
        <TabsContent value="config">
          <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-6 space-y-5">
            <h3 className="text-lg font-semibold text-[hsl(var(--app-text-primary))]">Modifica Azienda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--app-text-secondary))]">Nome</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--app-text-secondary))]">Settore</Label>
                <Input value={editSector} onChange={(e) => setEditSector(e.target.value)} className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]" />
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--app-text-secondary))]">Piano</Label>
                <Select value={editPlan} onValueChange={setEditPlan}>
                  <SelectTrigger className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="starter">Starter</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--app-text-secondary))]">Stato</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Attivo</SelectItem>
                    <SelectItem value="inactive">Inattivo</SelectItem>
                    <SelectItem value="trial">Trial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-secondary))]">ElevenLabs API Key</Label>
              <div className="relative">
                <Input type={showApiKey ? "text" : "password"} value={editApiKey} onChange={(e) => setEditApiKey(e.target.value)} className="bg-[hsl(var(--app-elevated))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))] pr-10" />
                <button type="button" onClick={() => setShowApiKey(!showApiKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(var(--app-text-secondary))] hover:text-[hsl(var(--app-text-primary))]">
                  {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-[hsl(var(--app-brand))] hover:bg-[hsl(var(--app-brand))]/90 text-white">
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Salva modifiche
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
