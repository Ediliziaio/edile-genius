import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Megaphone, Loader2, Play, Pause, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  draft: { label: "Bozza", color: "bg-ink-100 text-ink-500", icon: null },
  running: { label: "In corso", color: "bg-status-success-light text-status-success", icon: Play },
  paused: { label: "In pausa", color: "bg-status-warning-light text-status-warning", icon: Pause },
  completed: { label: "Completata", color: "bg-status-info-light text-status-info", icon: CheckCircle2 },
};

interface CampaignForm {
  name: string;
  agent_id: string;
  contact_list_id: string;
}

export default function CampaignsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<CampaignForm>({ name: "", agent_id: "", contact_list_id: "" });
  const [submitting, setSubmitting] = useState(false);

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: agents = [] } = useQuery({
    queryKey: ["company-agents-list", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("id, name").eq("company_id", companyId!);
      return data || [];
    },
  });

  const { data: lists = [] } = useQuery({
    queryKey: ["contact-lists-simple", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("contact_lists").select("id, name").eq("company_id", companyId!);
      return data || [];
    },
  });

  const agentMap = Object.fromEntries(agents.map((a: any) => [a.id, a.name]));
  const listMap = Object.fromEntries(lists.map((l: any) => [l.id, l.name]));

  const filtered = campaigns.filter((c: any) => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const handleCreate = async () => {
    if (!form.name.trim()) {
      toast({ title: "Nome obbligatorio", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("campaigns").insert({
        company_id: companyId!,
        name: form.name.trim(),
        agent_id: form.agent_id || null,
        contact_list_id: form.contact_list_id || null,
        status: "draft",
        type: "outbound",
      });
      if (error) throw error;
      toast({ title: "Campagna creata" });
      setShowCreate(false);
      setForm({ name: "", agent_id: "", contact_list_id: "" });
      queryClient.invalidateQueries({ queryKey: ["campaigns", companyId] });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Campagne</h1>
          <p className="text-sm text-ink-500 mt-1">Gestisci le tue campagne outbound</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-brand hover:bg-brand-hover text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuova Campagna
        </Button>
      </div>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Cerca campagne..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-white border-ink-200 text-ink-900 placeholder:text-ink-300"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px] bg-white border-ink-200 text-ink-900">
            <SelectValue placeholder="Stato" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card">
          <Megaphone className="w-10 h-10 mx-auto mb-3 text-ink-300" />
          <p className="text-ink-500 mb-2">Nessuna campagna creata</p>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="border-ink-200 text-ink-700">
            <Plus className="w-4 h-4 mr-2" /> Crea la prima campagna
          </Button>
        </div>
      ) : (
        <div className="rounded-card border border-ink-200 bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-ink-50">
                <TableHead className="text-ink-500">Nome</TableHead>
                <TableHead className="text-ink-500">Stato</TableHead>
                <TableHead className="text-ink-500">Agente</TableHead>
                <TableHead className="text-ink-500">Lista</TableHead>
                <TableHead className="text-ink-500">Tipo</TableHead>
                <TableHead className="text-ink-500">Creata</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => {
                const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
                return (
                  <TableRow key={c.id} className="hover:bg-ink-50">
                    <TableCell className="font-medium text-ink-900">{c.name}</TableCell>
                    <TableCell><Badge className={`${st.color} border-none text-xs`}>{st.label}</Badge></TableCell>
                    <TableCell className="text-ink-500">{agentMap[c.agent_id] || "—"}</TableCell>
                    <TableCell className="text-ink-500">{listMap[c.contact_list_id] || "—"}</TableCell>
                    <TableCell className="text-ink-500 capitalize">{c.type}</TableCell>
                    <TableCell className="text-ink-400 text-xs">
                      {c.created_at ? format(new Date(c.created_at), "dd MMM yyyy", { locale: it }) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white border-ink-200 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-ink-900">Nuova Campagna</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-ink-600">Nome campagna *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="es. Campagna Q1 2026" />
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Agente AI</Label>
              <Select value={form.agent_id} onValueChange={(v) => setForm({ ...form, agent_id: v })}>
                <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue placeholder="Seleziona agente..." /></SelectTrigger>
                <SelectContent>
                  {agents.map((a: any) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Lista contatti</Label>
              <Select value={form.contact_list_id} onValueChange={(v) => setForm({ ...form, contact_list_id: v })}>
                <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue placeholder="Seleziona lista..." /></SelectTrigger>
                <SelectContent>
                  {lists.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-ink-200 text-ink-700">Annulla</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-brand hover:bg-brand-hover text-white">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Crea campagna
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
