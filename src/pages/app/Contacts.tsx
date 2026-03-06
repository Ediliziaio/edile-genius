import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Phone, Mail, Loader2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_OPTIONS = [
  { value: "new", label: "Nuovo", color: "bg-ink-100 text-ink-600" },
  { value: "to_call", label: "Da chiamare", color: "bg-status-info-light text-status-info" },
  { value: "called", label: "Chiamato", color: "bg-blue-100 text-blue-700" },
  { value: "qualified", label: "Qualificato", color: "bg-status-warning-light text-status-warning" },
  { value: "not_qualified", label: "Non qualificato", color: "bg-ink-100 text-ink-500" },
  { value: "appointment", label: "Appuntamento", color: "bg-status-success-light text-status-success" },
  { value: "callback", label: "Richiamare", color: "bg-violet-100 text-violet-700" },
  { value: "do_not_call", label: "Non chiamare", color: "bg-status-error-light text-status-error" },
  { value: "invalid", label: "Non valido", color: "bg-red-100 text-red-400" },
];

const SOURCE_OPTIONS = [
  { value: "manual", label: "Manuale" },
  { value: "import_csv", label: "Import CSV" },
  { value: "import_excel", label: "Import Excel" },
  { value: "api", label: "API" },
  { value: "web_form", label: "Sito web" },
  { value: "referral", label: "Referral" },
  { value: "cold_outreach", label: "Cold outreach" },
];

const PRIORITY_OPTIONS = [
  { value: "low", label: "Bassa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
];

interface ContactForm {
  full_name: string;
  phone: string;
  phone_alt: string;
  email: string;
  company_name: string;
  city: string;
  sector: string;
  source: string;
  status: string;
  priority: string;
  notes: string;
}

const emptyForm: ContactForm = {
  full_name: "", phone: "", phone_alt: "", email: "",
  company_name: "", city: "", sector: "", source: "manual",
  status: "new", priority: "medium", notes: "",
};

export default function ContactsPage() {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ContactForm>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  const { data: contacts = [], isLoading } = useQuery({
    queryKey: ["contacts", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = contacts.filter((c: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (!c.full_name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q) && !c.phone?.includes(q) && !c.company_name?.toLowerCase().includes(q)) return false;
    }
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);

  const handleCreate = async () => {
    if (!form.full_name.trim()) {
      toast({ title: "Nome obbligatorio", variant: "destructive" });
      return;
    }
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      toast({ title: "Email non valida", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.from("contacts").insert({
        company_id: companyId!,
        full_name: form.full_name.trim(),
        phone: form.phone.trim() || null,
        phone_alt: form.phone_alt.trim() || null,
        email: form.email.trim() || null,
        company_name: form.company_name.trim() || null,
        city: form.city.trim() || null,
        sector: form.sector.trim() || null,
        source: form.source || null,
        status: form.status,
        priority: form.priority,
        notes: form.notes.trim() || null,
      });
      if (error) throw error;
      toast({ title: "Contatto creato" });
      setShowCreate(false);
      setForm({ ...emptyForm });
      queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Nome", "Telefono", "Email", "Azienda", "Città", "Stato", "Fonte", "Priorità"];
    const rows = filtered.map((c: any) => [
      c.full_name, c.phone || "", c.email || "", c.company_name || "",
      c.city || "", c.status, c.source || "", c.priority || "",
    ]);
    const csv = [headers, ...rows].map(r => r.map((v: string) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "contatti.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status: string) => {
    const s = STATUS_OPTIONS.find((o) => o.value === status);
    return <Badge className={`${s?.color || "bg-ink-100 text-ink-500"} border-none text-xs`}>{s?.label || status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Rubrica</h1>
          <p className="text-sm text-ink-500 mt-1">{contacts.length} contatti totali</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV} className="border-ink-200 text-ink-700">
            <Download className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={() => setShowCreate(true)} className="bg-brand hover:bg-brand-hover text-white">
            <Plus className="w-4 h-4 mr-2" /> Nuovo Contatto
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input placeholder="Cerca per nome, email, telefono o azienda..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10 bg-white border-ink-200 text-ink-900 placeholder:text-ink-300" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[180px] bg-white border-ink-200 text-ink-900"><SelectValue placeholder="Stato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(0); }}>
          <SelectTrigger className="w-[100px] bg-white border-ink-200 text-ink-900"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>
      ) : filtered.length === 0 ? (
        <div className="rounded-card border border-ink-200 bg-white p-12 text-center shadow-card">
          <p className="text-ink-500 mb-2">Nessun contatto trovato</p>
          <Button variant="outline" onClick={() => setShowCreate(true)} className="border-ink-200 text-ink-700">
            <Plus className="w-4 h-4 mr-2" /> Aggiungi il primo contatto
          </Button>
        </div>
      ) : (
        <>
          <div className="rounded-card border border-ink-200 bg-white overflow-hidden shadow-card">
            <Table>
              <TableHeader>
                <TableRow className="bg-ink-50">
                  <TableHead className="text-ink-500">Nome</TableHead>
                  <TableHead className="text-ink-500">Azienda</TableHead>
                  <TableHead className="text-ink-500">Telefono</TableHead>
                  <TableHead className="text-ink-500">Email</TableHead>
                  <TableHead className="text-ink-500">Stato</TableHead>
                  <TableHead className="text-ink-500">Priorità</TableHead>
                  <TableHead className="text-ink-500">Fonte</TableHead>
                  <TableHead className="text-ink-500">Creato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginated.map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-ink-50">
                    <TableCell className="font-medium text-ink-900">{c.full_name}</TableCell>
                    <TableCell className="text-ink-500">{c.company_name || "—"}</TableCell>
                    <TableCell className="text-ink-500">
                      {c.phone ? <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span> : "—"}
                    </TableCell>
                    <TableCell className="text-ink-500">
                      {c.email ? <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span> : "—"}
                    </TableCell>
                    <TableCell>{statusBadge(c.status)}</TableCell>
                    <TableCell className="text-ink-500 capitalize">{PRIORITY_OPTIONS.find(p => p.value === c.priority)?.label || c.priority || "—"}</TableCell>
                    <TableCell className="text-ink-500">{SOURCE_OPTIONS.find(s => s.value === c.source)?.label || c.source || "—"}</TableCell>
                    <TableCell className="text-ink-400 text-xs">
                      {c.created_at ? format(new Date(c.created_at), "dd MMM yyyy", { locale: it }) : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between text-sm text-ink-500">
              <span>Pagina {page + 1} di {totalPages} ({filtered.length} risultati)</span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-ink-200">Precedente</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="border-ink-200">Successiva</Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white border-ink-200 max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-ink-900">Nuovo Contatto</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-ink-600">Nome completo *</Label>
              <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="Mario Rossi" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-ink-600">Telefono</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="+39 333..." />
              </div>
              <div className="space-y-1">
                <Label className="text-ink-600">Telefono alt.</Label>
                <Input value={form.phone_alt} onChange={(e) => setForm({ ...form, phone_alt: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="+39 06..." />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="email@azienda.it" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-ink-600">Azienda</Label>
                <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="Nome azienda" />
              </div>
              <div className="space-y-1">
                <Label className="text-ink-600">Città</Label>
                <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="Milano" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label className="text-ink-600">Stato</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-ink-600">Priorità</Label>
                <Select value={form.priority} onValueChange={(v) => setForm({ ...form, priority: v })}>
                  <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-ink-600">Fonte</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Settore</Label>
              <Input value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="es. Tecnologia, Finanza..." />
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Note</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900 min-h-[60px]" placeholder="Note opzionali..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} className="border-ink-200 text-ink-700">Annulla</Button>
            <Button onClick={handleCreate} disabled={submitting} className="bg-brand hover:bg-brand-hover text-white">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
              Crea contatto
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
