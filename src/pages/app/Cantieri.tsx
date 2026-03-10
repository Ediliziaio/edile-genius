import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, HardHat, MapPin, Calendar, FileText, Users } from "lucide-react";
import { toast } from "sonner";

interface Cantiere {
  id: string;
  nome: string;
  indirizzo: string | null;
  committente: string | null;
  responsabile: string | null;
  stato: string;
  data_inizio: string | null;
  data_fine_prevista: string | null;
  created_at: string;
  operai_count?: number;
  report_count?: number;
  last_report_date?: string | null;
}

const statoBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  attivo: { label: "Attivo", variant: "default" },
  sospeso: { label: "Sospeso", variant: "secondary" },
  completato: { label: "Completato", variant: "outline" },
};

export default function CantierePage() {
  const companyId = useCompanyId();
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", indirizzo: "", committente: "", responsabile: "", data_inizio: "", data_fine_prevista: "", email_report: "" });

  const fetchCantieri = async () => {
    if (!companyId) return;
    setLoading(true);
    const { data } = await supabase.from("cantieri").select("*").eq("company_id", companyId).order("created_at", { ascending: false });
    if (data) {
      // Get counts
      const enriched = await Promise.all(data.map(async (c: any) => {
        const { count: operaiCount } = await supabase.from("cantiere_operai").select("id", { count: "exact", head: true }).eq("cantiere_id", c.id);
        const { data: reports } = await supabase.from("agent_reports").select("date").eq("cantiere_id" as any, c.id).order("date", { ascending: false }).limit(1);
        return { ...c, operai_count: operaiCount || 0, report_count: 0, last_report_date: reports?.[0]?.date || null };
      }));
      setCantieri(enriched);
    }
    setLoading(false);
  };

  useEffect(() => { fetchCantieri(); }, [companyId]);

  const handleCreate = async () => {
    if (!companyId || !form.nome.trim()) return;
    const emails = form.email_report.split(",").map(e => e.trim()).filter(Boolean);
    const { error } = await supabase.from("cantieri").insert({
      company_id: companyId,
      nome: form.nome,
      indirizzo: form.indirizzo || null,
      committente: form.committente || null,
      responsabile: form.responsabile || null,
      data_inizio: form.data_inizio || null,
      data_fine_prevista: form.data_fine_prevista || null,
      email_report: emails.length > 0 ? emails : null,
    } as any);
    if (error) { toast.error("Errore nella creazione"); return; }
    toast.success("Cantiere creato!");
    setDialogOpen(false);
    setForm({ nome: "", indirizzo: "", committente: "", responsabile: "", data_inizio: "", data_fine_prevista: "", email_report: "" });
    fetchCantieri();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cantieri</h1>
          <p className="text-sm text-muted-foreground">Gestisci i tuoi cantieri e i report giornalieri</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> Nuovo Cantiere</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nuovo Cantiere</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div><Label>Nome cantiere *</Label><Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Es. Via Roma 15" /></div>
              <div><Label>Indirizzo</Label><Input value={form.indirizzo} onChange={e => setForm(f => ({ ...f, indirizzo: e.target.value }))} placeholder="Via, città" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Committente</Label><Input value={form.committente} onChange={e => setForm(f => ({ ...f, committente: e.target.value }))} /></div>
                <div><Label>Responsabile</Label><Input value={form.responsabile} onChange={e => setForm(f => ({ ...f, responsabile: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data inizio</Label><Input type="date" value={form.data_inizio} onChange={e => setForm(f => ({ ...f, data_inizio: e.target.value }))} /></div>
                <div><Label>Data fine prevista</Label><Input type="date" value={form.data_fine_prevista} onChange={e => setForm(f => ({ ...f, data_fine_prevista: e.target.value }))} /></div>
              </div>
              <div><Label>Email destinatari report</Label><Input value={form.email_report} onChange={e => setForm(f => ({ ...f, email_report: e.target.value }))} placeholder="email1@test.com, email2@test.com" /><p className="text-xs text-muted-foreground mt-1">Separa più email con virgola</p></div>
              <Button onClick={handleCreate} disabled={!form.nome.trim()} className="w-full">Crea Cantiere</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Caricamento...</div>
      ) : cantieri.length === 0 ? (
        <Card className="p-12 text-center">
          <HardHat className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">Nessun cantiere ancora</p>
          <p className="text-xs text-muted-foreground mt-1">Crea il tuo primo cantiere per iniziare a ricevere report</p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {cantieri.map(c => {
            const sb = statoBadge[c.stato] || statoBadge.attivo;
            return (
              <Link key={c.id} to={`/app/cantieri/${c.id}`}>
                <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <HardHat className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-foreground">{c.nome}</h3>
                    </div>
                    <Badge variant={sb.variant}>{sb.label}</Badge>
                  </div>
                  {c.indirizzo && (
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mb-3">
                      <MapPin className="h-3 w-3" /> {c.indirizzo}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {c.operai_count} operai</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" /> {c.report_count} report</span>
                    {c.last_report_date && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.last_report_date}</span>}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
