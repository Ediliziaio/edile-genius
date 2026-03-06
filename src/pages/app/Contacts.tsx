import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Search, Phone, Mail, Loader2, Download, Trash2, ListChecks, Bot, ArrowUpDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import ContactDetailPanel from "@/components/contacts/ContactDetailPanel";

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

const SECTOR_OPTIONS = [
  "Edilizia", "Immobiliare", "Tecnologia", "Finanza", "Commercio", "Servizi",
  "Manifattura", "Sanità", "Ristorazione", "Trasporti", "Altro",
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
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [sectorFilter, setSectorFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState<ContactForm>({ ...emptyForm });
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(25);

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showBulkDelete, setShowBulkDelete] = useState(false);
  const [showBulkStatus, setShowBulkStatus] = useState(false);
  const [bulkStatus, setBulkStatus] = useState("to_call");
  const [showBulkList, setShowBulkList] = useState(false);
  const [bulkListId, setBulkListId] = useState("");

  // Detail panel
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [detailOpen, setDetailOpen] = useState(false);

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

  // Contact lists for bulk "add to list"
  const { data: contactLists = [] } = useQuery({
    queryKey: ["contact-lists-simple", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("contact_lists")
        .select("id, name")
        .eq("company_id", companyId!)
        .order("name");
      return data || [];
    },
  });

  // Agents for bulk assign
  const { data: agents = [] } = useQuery({
    queryKey: ["company-agents-list", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("agents")
        .select("id, name")
        .eq("company_id", companyId!)
        .order("name");
      return data || [];
    },
  });

  // Unique sectors from contacts
  const uniqueSectors = [...new Set(contacts.map((c: any) => c.sector).filter(Boolean))].sort();

  const filtered = contacts.filter((c: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !c.full_name?.toLowerCase().includes(q) &&
        !c.email?.toLowerCase().includes(q) &&
        !c.phone?.includes(q) &&
        !c.company_name?.toLowerCase().includes(q)
      ) return false;
    }
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (priorityFilter !== "all" && c.priority !== priorityFilter) return false;
    if (sectorFilter !== "all" && c.sector !== sectorFilter) return false;
    return true;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice(page * perPage, (page + 1) * perPage);

  const allPageSelected = paginated.length > 0 && paginated.every((c: any) => selectedIds.has(c.id));
  const someSelected = selectedIds.size > 0;

  const toggleAll = () => {
    if (allPageSelected) {
      const newSet = new Set(selectedIds);
      paginated.forEach((c: any) => newSet.delete(c.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      paginated.forEach((c: any) => newSet.add(c.id));
      setSelectedIds(newSet);
    }
  };

  const toggleOne = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
  };

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["contacts", companyId] });

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
      invalidate();
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

  // Bulk actions
  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("contacts").delete().in("id", ids);
      if (error) throw error;
      toast({ title: `${ids.length} contatti eliminati` });
      setSelectedIds(new Set());
      setShowBulkDelete(false);
      invalidate();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkStatusChange = async () => {
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("contacts").update({ status: bulkStatus }).in("id", ids);
      if (error) throw error;
      toast({ title: `Stato aggiornato per ${ids.length} contatti` });
      setSelectedIds(new Set());
      setShowBulkStatus(false);
      invalidate();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkAddToList = async () => {
    if (!bulkListId) return;
    try {
      const ids = Array.from(selectedIds);
      const inserts = ids.map(contact_id => ({ list_id: bulkListId, contact_id }));
      const { error } = await supabase.from("contact_list_members").upsert(inserts, { onConflict: "list_id,contact_id", ignoreDuplicates: true });
      if (error) throw error;
      toast({ title: `${ids.length} contatti aggiunti alla lista` });
      setSelectedIds(new Set());
      setShowBulkList(false);
      setBulkListId("");
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  const handleBulkAssignAgent = async (agentId: string) => {
    try {
      const ids = Array.from(selectedIds);
      const { error } = await supabase.from("contacts").update({ assigned_agent: agentId }).in("id", ids);
      if (error) throw error;
      toast({ title: `Agente assegnato a ${ids.length} contatti` });
      setSelectedIds(new Set());
      invalidate();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  const statusBadge = (status: string) => {
    const s = STATUS_OPTIONS.find((o) => o.value === status);
    return <Badge className={`${s?.color || "bg-ink-100 text-ink-500"} border-none text-xs`}>{s?.label || status}</Badge>;
  };

  const openDetail = (contact: any) => {
    setSelectedContact(contact);
    setDetailOpen(true);
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

      {/* Bulk action bar */}
      {someSelected && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-brand-light border border-brand/20">
          <span className="text-sm font-medium text-brand-text">{selectedIds.size} selezionati</span>
          <div className="flex gap-2 ml-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-ink-200 text-ink-700">
                  <ArrowUpDown className="w-3.5 h-3.5 mr-1.5" /> Cambia Stato
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {STATUS_OPTIONS.map(s => (
                  <DropdownMenuItem key={s.value} onClick={() => { setBulkStatus(s.value); setShowBulkStatus(true); }}>
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="border-ink-200 text-ink-700">
                  <Bot className="w-3.5 h-3.5 mr-1.5" /> Assegna Agente
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {agents.length === 0 ? (
                  <DropdownMenuItem disabled>Nessun agente</DropdownMenuItem>
                ) : agents.map((a: any) => (
                  <DropdownMenuItem key={a.id} onClick={() => handleBulkAssignAgent(a.id)}>
                    {a.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" size="sm" onClick={() => setShowBulkList(true)} className="border-ink-200 text-ink-700">
              <ListChecks className="w-3.5 h-3.5 mr-1.5" /> Aggiungi a Lista
            </Button>
            <Button variant="outline" size="sm" onClick={() => setShowBulkDelete(true)} className="border-status-error text-status-error hover:bg-status-error hover:text-white">
              <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Elimina
            </Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input placeholder="Cerca per nome, email, telefono o azienda..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} className="pl-10 bg-white border-ink-200 text-ink-900 placeholder:text-ink-300" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] bg-white border-ink-200 text-ink-900"><SelectValue placeholder="Stato" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti gli stati</SelectItem>
            {STATUS_OPTIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={(v) => { setPriorityFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[140px] bg-white border-ink-200 text-ink-900"><SelectValue placeholder="Priorità" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutte le priorità</SelectItem>
            {PRIORITY_OPTIONS.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sectorFilter} onValueChange={(v) => { setSectorFilter(v); setPage(0); }}>
          <SelectTrigger className="w-[160px] bg-white border-ink-200 text-ink-900"><SelectValue placeholder="Settore" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i settori</SelectItem>
            {uniqueSectors.map((s) => <SelectItem key={s as string} value={s as string}>{s as string}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(0); }}>
          <SelectTrigger className="w-[90px] bg-white border-ink-200 text-ink-900"><SelectValue /></SelectTrigger>
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
                  <TableHead className="w-[40px]">
                    <Checkbox
                      checked={allPageSelected}
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
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
                  <TableRow
                    key={c.id}
                    className={`hover:bg-ink-50 cursor-pointer ${selectedIds.has(c.id) ? "bg-brand-light/30" : ""}`}
                    onClick={() => openDetail(c)}
                  >
                    <TableCell onClick={e => e.stopPropagation()}>
                      <Checkbox
                        checked={selectedIds.has(c.id)}
                        onCheckedChange={() => toggleOne(c.id)}
                      />
                    </TableCell>
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

      {/* Contact Detail Side Panel */}
      <ContactDetailPanel
        contact={selectedContact}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onUpdated={() => { invalidate(); }}
        onDeleted={() => { invalidate(); setSelectedIds(new Set()); }}
      />

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

      {/* Bulk Delete Confirm */}
      <AlertDialog open={showBulkDelete} onOpenChange={setShowBulkDelete}>
        <AlertDialogContent className="bg-white border-ink-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink-900">Elimina {selectedIds.size} contatti</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-500">
              Questa azione non può essere annullata. Tutti i contatti selezionati verranno eliminati.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-ink-200 text-ink-700">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-status-error hover:bg-status-error/90 text-white">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Change Status */}
      <AlertDialog open={showBulkStatus} onOpenChange={setShowBulkStatus}>
        <AlertDialogContent className="bg-white border-ink-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink-900">Cambia stato a {selectedIds.size} contatti</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-500">
              Stato selezionato: <strong>{STATUS_OPTIONS.find(s => s.value === bulkStatus)?.label}</strong>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-ink-200 text-ink-700">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkStatusChange} className="bg-brand hover:bg-brand-hover text-white">
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Add to List */}
      <Dialog open={showBulkList} onOpenChange={setShowBulkList}>
        <DialogContent className="bg-white border-ink-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-ink-900">Aggiungi a lista</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-ink-500">{selectedIds.size} contatti selezionati</p>
            <Select value={bulkListId} onValueChange={setBulkListId}>
              <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue placeholder="Seleziona lista..." /></SelectTrigger>
              <SelectContent>
                {contactLists.map((l: any) => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkList(false)} className="border-ink-200 text-ink-700">Annulla</Button>
            <Button onClick={handleBulkAddToList} disabled={!bulkListId} className="bg-brand hover:bg-brand-hover text-white">
              Aggiungi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
