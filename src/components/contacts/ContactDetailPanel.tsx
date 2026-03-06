import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  Phone, Mail, Loader2, MessageSquare, StickyNote, Activity,
  User, Building2, MapPin, Calendar, Clock, Tag, Trash2, Edit3
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

const PRIORITY_OPTIONS = [
  { value: "low", label: "Bassa" },
  { value: "medium", label: "Media" },
  { value: "high", label: "Alta" },
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

interface ContactDetailPanelProps {
  contact: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  onDeleted: () => void;
}

export default function ContactDetailPanel({ contact, open, onOpenChange, onUpdated, onDeleted }: ContactDetailPanelProps) {
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id;

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});

  // Conversations for this contact
  const { data: conversations = [] } = useQuery({
    queryKey: ["contact-conversations", contact?.id],
    enabled: !!contact?.id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("*")
        .eq("contact_id", contact.id)
        .order("started_at", { ascending: false })
        .limit(20);
      return data || [];
    },
  });

  // Notes for this contact
  const { data: notes = [] } = useQuery({
    queryKey: ["contact-notes", contact?.id],
    enabled: !!contact?.id && open,
    queryFn: async () => {
      const { data } = await supabase
        .from("notes")
        .select("*")
        .eq("contact_id", contact.id)
        .order("created_at", { ascending: false })
        .limit(50);
      return data || [];
    },
  });

  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  if (!contact) return null;

  const startEdit = () => {
    setForm({
      full_name: contact.full_name || "",
      phone: contact.phone || "",
      phone_alt: contact.phone_alt || "",
      email: contact.email || "",
      company_name: contact.company_name || "",
      city: contact.city || "",
      sector: contact.sector || "",
      source: contact.source || "manual",
      status: contact.status || "new",
      priority: contact.priority || "medium",
      notes: contact.notes || "",
    });
    setEditing(true);
  };

  const handleSave = async () => {
    if (!form.full_name?.trim()) {
      toast({ title: "Nome obbligatorio", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase
        .from("contacts")
        .update({
          full_name: form.full_name.trim(),
          phone: form.phone?.trim() || null,
          phone_alt: form.phone_alt?.trim() || null,
          email: form.email?.trim() || null,
          company_name: form.company_name?.trim() || null,
          city: form.city?.trim() || null,
          sector: form.sector?.trim() || null,
          source: form.source || null,
          status: form.status,
          priority: form.priority,
          notes: form.notes?.trim() || null,
        })
        .eq("id", contact.id);
      if (error) throw error;
      toast({ title: "Contatto aggiornato" });
      setEditing(false);
      onUpdated();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", contact.id);
      if (error) throw error;
      toast({ title: "Contatto eliminato" });
      setShowDelete(false);
      onOpenChange(false);
      onDeleted();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim() || !profile) return;
    setAddingNote(true);
    try {
      const { error } = await supabase.from("notes").insert({
        contact_id: contact.id,
        company_id: companyId!,
        author_id: profile.id,
        content: newNote.trim(),
      });
      if (error) throw error;
      setNewNote("");
      queryClient.invalidateQueries({ queryKey: ["contact-notes", contact.id] });
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setAddingNote(false);
    }
  };

  const statusObj = STATUS_OPTIONS.find(s => s.value === contact.status);

  const InfoField = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | null }) => (
    value ? (
      <div className="flex items-start gap-3 py-2">
        <Icon className="w-4 h-4 text-ink-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-ink-400">{label}</p>
          <p className="text-sm text-ink-900">{value}</p>
        </div>
      </div>
    ) : null
  );

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-lg p-0 bg-white border-ink-200 overflow-y-auto">
          {/* Header */}
          <div className="p-6 border-b border-ink-100">
            <SheetHeader className="mb-0">
              <div className="flex items-start justify-between">
                <div>
                  <SheetTitle className="text-ink-900 text-lg">{contact.full_name}</SheetTitle>
                  <SheetDescription className="text-ink-500 text-sm mt-1">
                    {contact.company_name || "Nessuna azienda"}
                  </SheetDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={startEdit} className="text-ink-500 hover:text-ink-900">
                    <Edit3 className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => setShowDelete(true)} className="text-ink-500 hover:text-status-error">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </SheetHeader>
            <div className="flex gap-2 mt-3">
              <Badge className={`${statusObj?.color || "bg-ink-100 text-ink-500"} border-none text-xs`}>
                {statusObj?.label || contact.status}
              </Badge>
              <Badge className="bg-ink-50 text-ink-600 border-none text-xs capitalize">
                {PRIORITY_OPTIONS.find(p => p.value === contact.priority)?.label || contact.priority || "Media"}
              </Badge>
            </div>
            {/* Quick contact actions */}
            <div className="flex gap-2 mt-4">
              {contact.phone && (
                <Button variant="outline" size="sm" asChild className="border-ink-200 text-ink-700">
                  <a href={`tel:${contact.phone}`}><Phone className="w-3.5 h-3.5 mr-1.5" /> Chiama</a>
                </Button>
              )}
              {contact.email && (
                <Button variant="outline" size="sm" asChild className="border-ink-200 text-ink-700">
                  <a href={`mailto:${contact.email}`}><Mail className="w-3.5 h-3.5 mr-1.5" /> Email</a>
                </Button>
              )}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="info" className="flex-1">
            <TabsList className="w-full justify-start rounded-none border-b border-ink-100 bg-transparent px-6 h-auto py-0">
              <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none text-ink-500 px-3 py-2.5 text-sm">
                <User className="w-3.5 h-3.5 mr-1.5" /> Info
              </TabsTrigger>
              <TabsTrigger value="calls" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none text-ink-500 px-3 py-2.5 text-sm">
                <Phone className="w-3.5 h-3.5 mr-1.5" /> Chiamate
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none text-ink-500 px-3 py-2.5 text-sm">
                <StickyNote className="w-3.5 h-3.5 mr-1.5" /> Note
              </TabsTrigger>
              <TabsTrigger value="activity" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none text-ink-500 px-3 py-2.5 text-sm">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> Attività
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value="info" className="px-6 py-4 space-y-1 mt-0">
              {editing ? (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-ink-600 text-xs">Nome completo *</Label>
                    <Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-ink-600 text-xs">Telefono</Label>
                      <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-ink-600 text-xs">Tel. alt.</Label>
                      <Input value={form.phone_alt} onChange={e => setForm({ ...form, phone_alt: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-ink-600 text-xs">Email</Label>
                    <Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-ink-600 text-xs">Azienda</Label>
                      <Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-ink-600 text-xs">Città</Label>
                      <Input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-ink-600 text-xs">Stato</Label>
                      <Select value={form.status} onValueChange={v => setForm({ ...form, status: v })}>
                        <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{STATUS_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-ink-600 text-xs">Priorità</Label>
                      <Select value={form.priority} onValueChange={v => setForm({ ...form, priority: v })}>
                        <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{PRIORITY_OPTIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-ink-600 text-xs">Fonte</Label>
                      <Select value={form.source} onValueChange={v => setForm({ ...form, source: v })}>
                        <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>{SOURCE_OPTIONS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-ink-600 text-xs">Settore</Label>
                    <Input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-ink-600 text-xs">Note</Label>
                    <Textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="bg-ink-50 border-ink-200 text-ink-900 min-h-[60px]" />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => setEditing(false)} className="border-ink-200 text-ink-700">Annulla</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-hover text-white">
                      {saving && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />} Salva
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-ink-50">
                  <InfoField icon={Phone} label="Telefono" value={contact.phone} />
                  <InfoField icon={Phone} label="Telefono alt." value={contact.phone_alt} />
                  <InfoField icon={Mail} label="Email" value={contact.email} />
                  <InfoField icon={Building2} label="Azienda" value={contact.company_name} />
                  <InfoField icon={MapPin} label="Città" value={contact.city} />
                  <InfoField icon={Tag} label="Settore" value={contact.sector} />
                  <InfoField icon={Tag} label="Fonte" value={SOURCE_OPTIONS.find(s => s.value === contact.source)?.label || contact.source} />
                  <InfoField icon={Calendar} label="Creato il" value={contact.created_at ? format(new Date(contact.created_at), "dd MMM yyyy HH:mm", { locale: it }) : null} />
                  <InfoField icon={Clock} label="Ultimo contatto" value={contact.last_contact_at ? format(new Date(contact.last_contact_at), "dd MMM yyyy HH:mm", { locale: it }) : null} />
                  <InfoField icon={Phone} label="Tentativi chiamata" value={contact.call_attempts ? String(contact.call_attempts) : null} />
                  {contact.notes && (
                    <div className="py-3">
                      <p className="text-xs text-ink-400 mb-1">Note</p>
                      <p className="text-sm text-ink-700 whitespace-pre-wrap">{contact.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>

            {/* Calls Tab */}
            <TabsContent value="calls" className="px-6 py-4 mt-0">
              {conversations.length === 0 ? (
                <div className="text-center py-8">
                  <Phone className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-sm text-ink-400">Nessuna conversazione registrata</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {conversations.map((conv: any) => (
                    <div key={conv.id} className="rounded-lg border border-ink-100 p-3">
                      <div className="flex items-center justify-between mb-1">
                        <Badge className="bg-ink-100 text-ink-600 border-none text-xs">{conv.direction || "outbound"}</Badge>
                        <span className="text-xs text-ink-400">
                          {conv.started_at ? format(new Date(conv.started_at), "dd MMM HH:mm", { locale: it }) : "—"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-ink-500 mt-1">
                        <span>Durata: {conv.duration_sec ? `${Math.floor(conv.duration_sec / 60)}:${String(conv.duration_sec % 60).padStart(2, "0")}` : "—"}</span>
                        {conv.outcome && <Badge className="bg-ink-50 text-ink-600 border-none text-xs">{conv.outcome}</Badge>}
                        {conv.sentiment && <Badge className="bg-ink-50 text-ink-600 border-none text-xs">{conv.sentiment}</Badge>}
                      </div>
                      {conv.summary && <p className="text-xs text-ink-500 mt-2">{conv.summary}</p>}
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Notes Tab */}
            <TabsContent value="notes" className="px-6 py-4 mt-0">
              <div className="flex gap-2 mb-4">
                <Input
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  placeholder="Aggiungi una nota..."
                  className="bg-ink-50 border-ink-200 text-ink-900 text-sm"
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && handleAddNote()}
                />
                <Button size="sm" onClick={handleAddNote} disabled={addingNote || !newNote.trim()} className="bg-brand hover:bg-brand-hover text-white shrink-0">
                  {addingNote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Aggiungi"}
                </Button>
              </div>
              {notes.length === 0 ? (
                <div className="text-center py-8">
                  <StickyNote className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-sm text-ink-400">Nessuna nota</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note: any) => (
                    <div key={note.id} className="rounded-lg border border-ink-100 p-3">
                      <p className="text-sm text-ink-800 whitespace-pre-wrap">{note.content}</p>
                      <p className="text-xs text-ink-400 mt-2">
                        {note.created_at ? format(new Date(note.created_at), "dd MMM yyyy HH:mm", { locale: it }) : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity" className="px-6 py-4 mt-0">
              <div className="space-y-3">
                {contact.created_at && (
                  <div className="flex items-start gap-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-brand mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-ink-700">Contatto creato</p>
                      <p className="text-xs text-ink-400">{format(new Date(contact.created_at), "dd MMM yyyy HH:mm", { locale: it })}</p>
                    </div>
                  </div>
                )}
                {contact.last_contact_at && (
                  <div className="flex items-start gap-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-status-info mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-ink-700">Ultimo contatto</p>
                      <p className="text-xs text-ink-400">{format(new Date(contact.last_contact_at), "dd MMM yyyy HH:mm", { locale: it })}</p>
                    </div>
                  </div>
                )}
                {conversations.map((conv: any) => (
                  <div key={conv.id} className="flex items-start gap-3 py-2">
                    <div className="w-2 h-2 rounded-full bg-ink-300 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-sm text-ink-700">
                        Chiamata {conv.direction === "inbound" ? "in entrata" : "in uscita"}
                        {conv.outcome ? ` — ${conv.outcome}` : ""}
                      </p>
                      <p className="text-xs text-ink-400">
                        {conv.started_at ? format(new Date(conv.started_at), "dd MMM yyyy HH:mm", { locale: it }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
                {!contact.last_contact_at && conversations.length === 0 && (
                  <div className="text-center py-8">
                    <Activity className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                    <p className="text-sm text-ink-400">Nessuna attività registrata</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </SheetContent>
      </Sheet>

      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-white border-ink-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink-900">Elimina contatto</AlertDialogTitle>
            <AlertDialogDescription className="text-ink-500">
              Sei sicuro di voler eliminare <strong>{contact.full_name}</strong>? Questa azione non può essere annullata.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-ink-200 text-ink-700">Annulla</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-status-error hover:bg-status-error/90 text-white">
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
