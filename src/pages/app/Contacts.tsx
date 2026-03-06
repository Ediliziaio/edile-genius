import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Plus, Search, Phone, Mail, Filter, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { it } from "date-fns/locale";

const STATUS_OPTIONS = [
  { value: "lead", label: "Lead", color: "bg-status-info-light text-status-info" },
  { value: "qualified", label: "Qualificato", color: "bg-status-warning-light text-status-warning" },
  { value: "customer", label: "Cliente", color: "bg-status-success-light text-status-success" },
  { value: "lost", label: "Perso", color: "bg-status-error-light text-status-error" },
];

const SOURCE_OPTIONS = ["Manuale", "Importazione", "Sito web", "Chiamata", "Referral"];

interface ContactForm {
  full_name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  notes: string;
}

const emptyForm: ContactForm = { full_name: "", phone: "", email: "", source: "", status: "lead", notes: "" };

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
      if (!c.full_name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q) && !c.phone?.includes(q)) return false;
    }
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    return true;
  });

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
        email: form.email.trim() || null,
        source: form.source || null,
        status: form.status,
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
        <Button onClick={() => setShowCreate(true)} className="bg-brand hover:bg-brand-hover text-white">
          <Plus className="w-4 h-4 mr-2" /> Nuovo Contatto
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Cerca per nome, email o telefono..."
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
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
            ))}
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
        <div className="rounded-card border border-ink-200 bg-white overflow-hidden shadow-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-ink-50">
                <TableHead className="text-ink-500">Nome</TableHead>
                <TableHead className="text-ink-500">Telefono</TableHead>
                <TableHead className="text-ink-500">Email</TableHead>
                <TableHead className="text-ink-500">Stato</TableHead>
                <TableHead className="text-ink-500">Fonte</TableHead>
                <TableHead className="text-ink-500">Creato</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c: any) => (
                <TableRow key={c.id} className="hover:bg-ink-50">
                  <TableCell className="font-medium text-ink-900">{c.full_name}</TableCell>
                  <TableCell className="text-ink-500">
                    {c.phone ? (
                      <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell className="text-ink-500">
                    {c.email ? (
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                    ) : "—"}
                  </TableCell>
                  <TableCell>{statusBadge(c.status)}</TableCell>
                  <TableCell className="text-ink-500">{c.source || "—"}</TableCell>
                  <TableCell className="text-ink-400 text-xs">
                    {c.created_at ? format(new Date(c.created_at), "dd MMM yyyy", { locale: it }) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-white border-ink-200 max-w-md">
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
                <Label className="text-ink-600">Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="email@..." />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
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
                <Label className="text-ink-600">Fonte</Label>
                <Select value={form.source} onValueChange={(v) => setForm({ ...form, source: v })}>
                  <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Note</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="Note opzionali..." />
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
