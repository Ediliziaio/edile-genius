import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, HardHat, MapPin, Calendar, FileText, Users, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  operai_count: number;
  report_count: number;
  last_report_date: string | null;
}

const statoBadge: Record<string, { label: string; variant: "default" | "secondary" | "outline" }> = {
  attivo: { label: "Attivo", variant: "default" },
  sospeso: { label: "Sospeso", variant: "secondary" },
  completato: { label: "Completato", variant: "outline" },
};

// Simple email format check
const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function CantierePage() {
  const companyId = useCompanyId();
  const [cantieri, setCantieri] = useState<Cantiere[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ nome: "", indirizzo: "", committente: "", responsabile: "", data_inizio: "", data_fine_prevista: "", email_report: "" });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteTarget, setDeleteTarget] = useState<Cantiere | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCantieri = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      // Fetch cantieri
      const { data: cantieriData, error: cantieriError } = await (supabase.from("cantieri") as any)
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false });

      if (cantieriError) throw cantieriError;
      if (!cantieriData || cantieriData.length === 0) {
        setCantieri([]);
        setLoading(false);
        return;
      }

      const cantiereIds = cantieriData.map((c: any) => c.id);

      // Batch: operai counts + report counts in parallel
      const [operaiRes, reportsRes] = await Promise.all([
        (supabase.from("cantiere_operai") as any)
          .select("cantiere_id")
          .in("cantiere_id", cantiereIds),
        (supabase.from("agent_reports") as any)
          .select("cantiere_id, date")
          .in("cantiere_id", cantiereIds)
          .order("date", { ascending: false }),
      ]);

      // Count operai per cantiere
      const operaiCountMap: Record<string, number> = {};
      (operaiRes.data || []).forEach((o: any) => {
        operaiCountMap[o.cantiere_id] = (operaiCountMap[o.cantiere_id] || 0) + 1;
      });

      // Count reports per cantiere + last report date
      const reportCountMap: Record<string, number> = {};
      const lastReportMap: Record<string, string> = {};
      (reportsRes.data || []).forEach((r: any) => {
        reportCountMap[r.cantiere_id] = (reportCountMap[r.cantiere_id] || 0) + 1;
        if (!lastReportMap[r.cantiere_id]) lastReportMap[r.cantiere_id] = r.date;
      });

      const enriched: Cantiere[] = cantieriData.map((c: any) => ({
        ...c,
        operai_count: operaiCountMap[c.id] || 0,
        report_count: reportCountMap[c.id] || 0,
        last_report_date: lastReportMap[c.id] || null,
      }));

      setCantieri(enriched);
    } catch (err: any) {
      toast.error(`Errore nel caricamento cantieri: ${err.message || "Errore sconosciuto"}`);
      setCantieri([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCantieri(); }, [companyId]);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!form.nome.trim()) errors.nome = "Il nome è obbligatorio";
    if (form.data_inizio && form.data_fine_prevista && form.data_fine_prevista < form.data_inizio) {
      errors.data_fine_prevista = "La data di fine non può essere anteriore alla data di inizio";
    }
    if (form.email_report.trim()) {
      const emails = form.email_report.split(",").map(e => e.trim()).filter(Boolean);
      const invalid = emails.filter(e => !isValidEmail(e));
      if (invalid.length > 0) errors.email_report = `Email non valide: ${invalid.join(", ")}`;
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreate = async () => {
    if (!companyId || !validateForm()) return;
    const emails = form.email_report.split(",").map(e => e.trim()).filter(Boolean);
    const { error } = await (supabase.from("cantieri") as any).insert({
      company_id: companyId,
      nome: form.nome,
      indirizzo: form.indirizzo || null,
      committente: form.committente || null,
      responsabile: form.responsabile || null,
      data_inizio: form.data_inizio || null,
      data_fine_prevista: form.data_fine_prevista || null,
      email_report: emails.length > 0 ? emails : null,
    });
    if (error) { toast.error(`Errore nella creazione: ${error.message}`); return; }
    toast.success("Cantiere creato!");
    setDialogOpen(false);
    setForm({ nome: "", indirizzo: "", committente: "", responsabile: "", data_inizio: "", data_fine_prevista: "", email_report: "" });
    setFormErrors({});
    fetchCantieri();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error } = await (supabase.from("cantieri") as any).delete().eq("id", deleteTarget.id);
      if (error) throw error;
      toast.success("Cantiere eliminato");
      setDeleteTarget(null);
      fetchCantieri();
    } catch (err: any) {
      toast.error(`Errore: ${err.message}`);
    } finally {
      setDeleting(false);
    }
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
              <div>
                <Label>Nome cantiere *</Label>
                <Input value={form.nome} onChange={e => setForm(f => ({ ...f, nome: e.target.value }))} placeholder="Es. Via Roma 15" />
                {formErrors.nome && <p className="text-xs text-destructive mt-1">{formErrors.nome}</p>}
              </div>
              <div><Label>Indirizzo</Label><Input value={form.indirizzo} onChange={e => setForm(f => ({ ...f, indirizzo: e.target.value }))} placeholder="Via, città" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Committente</Label><Input value={form.committente} onChange={e => setForm(f => ({ ...f, committente: e.target.value }))} /></div>
                <div><Label>Responsabile</Label><Input value={form.responsabile} onChange={e => setForm(f => ({ ...f, responsabile: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Data inizio</Label><Input type="date" value={form.data_inizio} onChange={e => setForm(f => ({ ...f, data_inizio: e.target.value }))} /></div>
                <div>
                  <Label>Data fine prevista</Label>
                  <Input type="date" value={form.data_fine_prevista} onChange={e => setForm(f => ({ ...f, data_fine_prevista: e.target.value }))} min={form.data_inizio || undefined} />
                  {formErrors.data_fine_prevista && <p className="text-xs text-destructive mt-1">{formErrors.data_fine_prevista}</p>}
                </div>
              </div>
              <div>
                <Label>Email destinatari report</Label>
                <Input value={form.email_report} onChange={e => setForm(f => ({ ...f, email_report: e.target.value }))} placeholder="email1@test.com, email2@test.com" />
                {formErrors.email_report ? (
                  <p className="text-xs text-destructive mt-1">{formErrors.email_report}</p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-1">Separa più email con virgola</p>
                )}
              </div>
              <Button onClick={handleCreate} disabled={!form.nome.trim()} className="w-full">Crea Cantiere</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="p-5 space-y-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-5 w-32" />
              </div>
              <Skeleton className="h-3 w-48" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-3 w-16" />
              </div>
            </Card>
          ))}
        </div>
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
              <Card key={c.id} className="p-5 hover:shadow-md transition-shadow">
                <Link to={`/app/cantieri/${c.id}`} className="block cursor-pointer">
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
                </Link>
                <div className="flex justify-end mt-3 pt-3 border-t border-border">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
                    onClick={(e) => { e.preventDefault(); setDeleteTarget(c); }}
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Elimina
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
