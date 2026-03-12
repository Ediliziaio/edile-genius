import { useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import {
  Phone, Mail, Loader2, MessageSquare, StickyNote, Activity,
  User, Building2, MapPin, Calendar, Clock, Tag, Trash2, Edit3,
  FileText, Sparkles, Copy, BarChart2
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
import LeadScoreBadge from "@/components/contacts/LeadScoreBadge";

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

function CallHistorySection({ contactId, nextCallAt }: { contactId: string; nextCallAt?: string }) {
  const { data: callHistory = [], isLoading: loadingCalls } = useQuery({
    queryKey: ["contact-call-history", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data } = await supabase
        .from("outbound_call_log")
        .select("id, started_at, ended_at, duration_sec, outcome, sentiment, ai_summary, status, agents(name)")
        .eq("contact_id", contactId)
        .order("started_at", { ascending: false })
        .limit(20);
      return (data as any[]) || [];
    },
  });

  const outcomeBadge = (outcome: string | null) => {
    const map: Record<string, { label: string; cls: string }> = {
      answered: { label: "✅ Risposto", cls: "bg-status-success-light text-status-success" },
      no_answer: { label: "📵 Non risposto", cls: "bg-ink-100 text-ink-500" },
      voicemail: { label: "📮 Segreteria", cls: "bg-status-warning-light text-status-warning" },
      busy: { label: "🔴 Occupato", cls: "bg-status-error-light text-status-error" },
      failed: { label: "❌ Fallita", cls: "bg-status-error-light text-status-error" },
    };
    const m = outcome ? map[outcome] : null;
    return m ? <Badge className={`${m.cls} border-none text-[10px]`}>{m.label}</Badge> : null;
  };

  if (loadingCalls) {
    return <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-brand" /></div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-sm font-medium text-ink-700">
        <Phone className="w-4 h-4" />
        Storico chiamate ({callHistory.length})
      </div>
      {callHistory.length === 0 ? (
        <div className="text-center py-8">
          <Phone className="w-8 h-8 text-ink-200 mx-auto mb-2" />
          <p className="text-sm text-ink-400">Nessuna chiamata ancora</p>
        </div>
      ) : (
        <div className="space-y-2">
          {callHistory.map((call: any) => (
            <div key={call.id} className="rounded-lg border border-ink-100 p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-ink-500">
                  {call.started_at ? format(new Date(call.started_at), "dd/MM/yy HH:mm", { locale: it }) : "—"}
                </span>
                <div className="flex items-center gap-1.5">
                  {outcomeBadge(call.outcome)}
                  {call.sentiment && call.sentiment !== "unknown" && (
                    <span className="text-xs">{call.sentiment === "positive" ? "😊" : call.sentiment === "negative" ? "😕" : "😐"}</span>
                  )}
                  {call.duration_sec != null && (
                    <span className="text-[10px] text-ink-400">
                      {Math.floor(call.duration_sec / 60)}:{String(call.duration_sec % 60).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
              {call.ai_summary && (
                <p className="text-xs text-ink-600 mt-1.5 bg-ink-50 rounded p-2">💬 {call.ai_summary}</p>
              )}
              {call.agents?.name && (
                <p className="text-[10px] text-ink-400 mt-1">Agente: {call.agents.name}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {nextCallAt && new Date(nextCallAt) > new Date() && (
        <div className="rounded-lg border border-brand/20 bg-brand-light/30 p-3">
          <div className="flex items-center gap-2 text-xs font-medium text-brand">
            <Calendar className="w-3.5 h-3.5" />
            Prossima chiamata schedulata
          </div>
          <p className="text-sm text-ink-700 mt-1">
            {format(new Date(nextCallAt), "EEEE d MMMM, HH:mm", { locale: it })}
          </p>
        </div>
      )}
    </div>
  );
}

function CallAnalyticsSection({ contactId }: { contactId: string }) {
  const { data: callLogs = [] } = useQuery({
    queryKey: ["contact-call-analytics", contactId],
    enabled: !!contactId,
    queryFn: async () => {
      const { data } = await supabase
        .from("outbound_call_log")
        .select("id, started_at, duration_sec, outcome, sentiment")
        .eq("contact_id", contactId)
        .order("started_at", { ascending: false })
        .limit(500);
      return (data as any[]) || [];
    },
    staleTime: 2 * 60 * 1000,
  });

  if (callLogs.length === 0) return null;

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const totalCalls = callLogs.length;
  const calls30d = callLogs.filter((c: any) => new Date(c.started_at) > thirtyDaysAgo).length;
  const durations = callLogs.filter((c: any) => c.duration_sec != null).map((c: any) => c.duration_sec as number);
  const avgDuration = durations.length > 0 ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : null;
  const maxDuration = durations.length > 0 ? Math.max(...durations) : null;

  const outcomes: Record<string, number> = {};
  const sentiments: Record<string, number> = { positive: 0, neutral: 0, negative: 0 };
  const positiveHours: number[] = [];

  callLogs.forEach((c: any) => {
    if (c.outcome) outcomes[c.outcome] = (outcomes[c.outcome] || 0) + 1;
    if (c.sentiment && sentiments[c.sentiment] !== undefined) sentiments[c.sentiment]++;
    if (c.sentiment === "positive" && c.started_at) positiveHours.push(new Date(c.started_at).getHours());
  });

  const interested = (outcomes["interested"] || 0) + (outcomes["appointment_set"] || 0) + (outcomes["answered"] || 0);
  const conversionRate = totalCalls > 0 ? Math.round((interested / totalCalls) * 100) : null;

  // Best hour (frequency map — O(n))
  const bestHour = (() => {
    if (positiveHours.length === 0) return null;
    const freq: Record<number, number> = {};
    let maxCount = 0;
    let maxHour = 0;
    for (const h of positiveHours) {
      freq[h] = (freq[h] || 0) + 1;
      if (freq[h] > maxCount) { maxCount = freq[h]; maxHour = h; }
    }
    return maxHour;
  })();
  const bestHourLabel = bestHour != null
    ? `${String(bestHour).padStart(2, "0")}:00–${String(bestHour + 1).padStart(2, "0")}:00`
    : null;

  const fmtDuration = (s: number | null) => {
    if (!s) return "—";
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return m > 0 ? `${m}m ${sec}s` : `${sec}s`;
  };

  const outcomeEntries = [
    { label: "Interessato", key: "interested", color: "bg-status-success" },
    { label: "Appuntamento", key: "appointment_set", color: "bg-status-info" },
    { label: "Risposto", key: "answered", color: "bg-brand" },
    { label: "Richiama", key: "callback", color: "bg-status-warning" },
    { label: "Non risponde", key: "no_answer", color: "bg-ink-300" },
    { label: "Non interessato", key: "not_interested", color: "bg-status-error" },
  ].filter(e => (outcomes[e.key] || 0) > 0);

  return (
    <section className="mt-6">
      <h3 className="text-sm font-semibold text-ink-400 uppercase tracking-wide mb-3 flex items-center gap-2">
        <BarChart2 className="w-4 h-4" />
        Statistiche Chiamate
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-ink-50 rounded-xl p-3">
          <p className="text-xs text-ink-400 mb-1">Totale chiamate</p>
          <p className="text-2xl font-bold text-ink-900">{totalCalls}</p>
          <p className="text-xs text-ink-300 mt-0.5">{calls30d} ultimi 30gg</p>
        </div>
        <div className="bg-ink-50 rounded-xl p-3">
          <p className="text-xs text-ink-400 mb-1">Tasso conversione</p>
          <p className="text-2xl font-bold text-status-success">{conversionRate !== null ? `${conversionRate}%` : "—"}</p>
          <p className="text-xs text-ink-300 mt-0.5">{interested} positivi</p>
        </div>
        <div className="bg-ink-50 rounded-xl p-3">
          <p className="text-xs text-ink-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Durata media</p>
          <p className="text-xl font-bold text-ink-900">{fmtDuration(avgDuration)}</p>
          <p className="text-xs text-ink-300 mt-0.5">Max: {fmtDuration(maxDuration)}</p>
        </div>
        <div className="bg-ink-50 rounded-xl p-3">
          <p className="text-xs text-ink-400 mb-1">Orario ottimale</p>
          <p className="text-lg font-bold text-brand">{bestHourLabel ?? "—"}</p>
          <p className="text-xs text-ink-300 mt-0.5">basato su risposte positive</p>
        </div>
      </div>

      {outcomeEntries.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-medium text-ink-400 mb-2">Distribuzione esiti</p>
          <div className="space-y-1.5">
            {outcomeEntries.map(({ label, key, color }) => {
              const count = outcomes[key] || 0;
              const pct = Math.round((count / totalCalls) * 100);
              return (
                <div key={key} className="flex items-center gap-2">
                  <span className="text-xs text-ink-500 w-28 flex-shrink-0">{label}</span>
                  <div className="flex-1 bg-ink-100 rounded-full h-2 overflow-hidden">
                    <div className={`h-2 rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs text-ink-400 w-8 text-right">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <p className="text-xs font-medium text-ink-400 mb-2">Sentiment complessivo</p>
        <div className="flex gap-3">
          {[
            { icon: "😊", label: "Positivo", count: sentiments.positive, color: "text-status-success bg-status-success-light" },
            { icon: "😐", label: "Neutro", count: sentiments.neutral, color: "text-ink-500 bg-ink-50" },
            { icon: "😔", label: "Negativo", count: sentiments.negative, color: "text-status-error bg-status-error-light" },
          ].map(({ icon, label, count, color }) => (
            <div key={label} className={`flex-1 rounded-lg p-2 text-center ${color}`}>
              <p className="text-lg">{icon}</p>
              <p className="text-xs font-semibold">{count}</p>
              <p className="text-xs opacity-70">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
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

  // Preventivi linked (by contact phone/name match — simple heuristic)
  const { data: preventivi = [] } = useQuery({
    queryKey: ["contact-preventivi", contact?.id, contact?.full_name],
    enabled: !!contact?.id && open && !!companyId,
    queryFn: async () => {
      // Try matching by cliente_nome or phone
      const { data } = await supabase
        .from("preventivi" as any)
        .select("id, numero, titolo, stato, totale_finale, created_at, inviato_at, accettato_at, rifiutato_at, cliente_nome")
        .eq("company_id", companyId!)
        .or(`cliente_nome.ilike.%${contact.full_name}%${contact.phone ? `,cliente_telefono.eq.${contact.phone}` : ""}`)
        .order("created_at", { ascending: false })
        .limit(10);
      return (data as any[]) || [];
    },
  });

  // ── Unified Timeline ──
  const timeline = useMemo(() => {
    const items: { type: "conversation" | "note" | "preventivo" | "event"; date: string; data: any }[] = [];

    conversations.forEach((c: any) => {
      items.push({ type: "conversation", date: c.started_at || c.ended_at || "", data: c });
    });

    notes.forEach((n: any) => {
      items.push({ type: "note", date: n.created_at || "", data: n });
    });

    preventivi.forEach((p: any) => {
      items.push({ type: "preventivo", date: p.created_at || "", data: p });
    });

    // Event: contact created
    if (contact?.created_at) {
      items.push({ type: "event", date: contact.created_at, data: { label: "Contatto creato" } });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [conversations, notes, preventivi, contact]);

  // Lead score signals from conversations
  const leadScoreInput = useMemo(() => {
    const hasQualifiedOrAppointment = conversations.some((c: any) => c.outcome === "qualified" || c.outcome === "appointment");
    const hasPositiveSentiment = conversations.some((c: any) => c.sentiment === "positive");
    const latestOutcome = conversations.length > 0 ? (conversations[0] as any).outcome : null;

    return {
      status: contact?.status || "new",
      priority: contact?.priority,
      phone: contact?.phone,
      email: contact?.email,
      source: contact?.source,
      call_attempts: contact?.call_attempts,
      last_contact_at: contact?.last_contact_at,
      hasQualifiedOrAppointment,
      hasPositiveSentiment,
      latestOutcome,
      conversationCount: conversations.length,
      hasPreventivo: preventivi.length > 0,
    };
  }, [contact, conversations, preventivi]);

  const [newNote, setNewNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [followUpMsg, setFollowUpMsg] = useState("");
  const [generatingFollowUp, setGeneratingFollowUp] = useState(false);

  const handleGenerateFollowUp = async () => {
    setGeneratingFollowUp(true);
    setFollowUpMsg("");
    try {
      const lastConv = conversations.length > 0 ? conversations[0] : null;
      const daysSince = contact.last_contact_at
        ? differenceInDays(new Date(), new Date(contact.last_contact_at))
        : null;

      const { data, error } = await supabase.functions.invoke("generate-followup", {
        body: {
          context_type: "contact",
          context: {
            name: contact.full_name,
            last_conversation_summary: (lastConv as any)?.summary || null,
            outcome: (lastConv as any)?.outcome || null,
            days_since: daysSince,
            notes: contact.notes || null,
          },
        },
      });
      if (error) throw error;
      setFollowUpMsg(data?.data?.message || data?.message || "Errore nella generazione.");
    } catch (err: any) {
      toast({ title: "Errore", description: err.message || "Impossibile generare il messaggio.", variant: "destructive" });
    } finally {
      setGeneratingFollowUp(false);
    }
  };

  const copyFollowUp = () => {
    navigator.clipboard.writeText(followUpMsg);
    toast({ title: "Copiato negli appunti ✓" });
  };

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
            <div className="flex gap-2 mt-3 flex-wrap">
              <Badge className={`${statusObj?.color || "bg-ink-100 text-ink-500"} border-none text-xs`}>
                {statusObj?.label || contact.status}
              </Badge>
              <Badge className="bg-ink-50 text-ink-600 border-none text-xs capitalize">
                {PRIORITY_OPTIONS.find(p => p.value === contact.priority)?.label || contact.priority || "Media"}
              </Badge>
            </div>

            {/* Lead Score */}
            <div className="mt-3">
              <LeadScoreBadge input={leadScoreInput} />
            </div>

            {/* Quick contact actions */}
            <div className="flex gap-2 mt-4 flex-wrap">
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
              <Button
                variant="outline"
                size="sm"
                className="border-brand/30 text-brand hover:bg-brand-light"
                onClick={handleGenerateFollowUp}
                disabled={generatingFollowUp}
              >
                {generatingFollowUp ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                Genera Follow-up
              </Button>
            </div>

            {/* Follow-up AI message */}
            {(followUpMsg || generatingFollowUp) && (
              <div className="mt-3 bg-brand-light/50 border border-brand/20 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-medium text-brand flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Messaggio suggerito
                  </p>
                  {followUpMsg && (
                    <Button variant="ghost" size="sm" className="h-6 text-xs text-brand" onClick={copyFollowUp}>
                      <Copy className="w-3 h-3 mr-1" /> Copia
                    </Button>
                  )}
                </div>
                {generatingFollowUp ? (
                  <div className="flex items-center gap-2 py-2">
                    <Loader2 className="w-4 h-4 animate-spin text-brand" />
                    <span className="text-sm text-ink-500">Generazione in corso...</span>
                  </div>
                ) : (
                  <p className="text-sm text-ink-800 whitespace-pre-wrap">{followUpMsg}</p>
                )}
              </div>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="timeline" className="flex-1">
            <TabsList className="w-full justify-start rounded-none border-b border-ink-100 bg-transparent px-6 h-auto py-0">
              <TabsTrigger value="timeline" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none text-ink-500 px-3 py-2.5 text-sm">
                <Activity className="w-3.5 h-3.5 mr-1.5" /> Timeline
              </TabsTrigger>
              <TabsTrigger value="calls" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none text-ink-500 px-3 py-2.5 text-sm">
                <Phone className="w-3.5 h-3.5 mr-1.5" /> Chiamate
              </TabsTrigger>
              <TabsTrigger value="info" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none text-ink-500 px-3 py-2.5 text-sm">
                <User className="w-3.5 h-3.5 mr-1.5" /> Info
              </TabsTrigger>
              <TabsTrigger value="notes" className="rounded-none border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:text-brand data-[state=active]:shadow-none text-ink-500 px-3 py-2.5 text-sm">
                <StickyNote className="w-3.5 h-3.5 mr-1.5" /> Note
              </TabsTrigger>
            </TabsList>

            {/* Timeline Tab — Unified */}
            <TabsContent value="timeline" className="px-6 py-4 mt-0">
              {timeline.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-ink-200 mx-auto mb-2" />
                  <p className="text-sm text-ink-400">Nessuna attività registrata</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical line */}
                  <div className="absolute left-[7px] top-3 bottom-3 w-px bg-ink-100" />

                  <div className="space-y-4">
                    {timeline.map((item, idx) => (
                      <div key={`${item.type}-${idx}`} className="flex items-start gap-3 relative">
                        {/* Dot */}
                        <div className={`w-[15px] h-[15px] rounded-full border-2 shrink-0 mt-0.5 z-10 ${
                          item.type === "conversation"
                            ? "border-brand bg-brand-light"
                            : item.type === "note"
                            ? "border-amber-400 bg-amber-50"
                            : item.type === "preventivo"
                            ? "border-emerald-500 bg-emerald-50"
                            : "border-ink-300 bg-ink-50"
                        }`} />

                        <div className="flex-1 min-w-0">
                          {item.type === "conversation" && (
                            <div className="rounded-lg border border-ink-100 p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <MessageSquare className="w-3.5 h-3.5 text-brand" />
                                  <span className="text-xs font-semibold text-ink-700">
                                    Chiamata {item.data.direction === "inbound" ? "in entrata" : "in uscita"}
                                  </span>
                                </div>
                                <span className="text-[10px] text-ink-400">
                                  {item.date ? format(new Date(item.date), "dd MMM HH:mm", { locale: it }) : ""}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-ink-500 mt-1">
                                {item.data.duration_sec && (
                                  <span>{Math.floor(item.data.duration_sec / 60)}:{String(item.data.duration_sec % 60).padStart(2, "0")}</span>
                                )}
                                {item.data.outcome && (
                                  <Badge className="bg-ink-50 text-ink-600 border-none text-[10px]">{item.data.outcome}</Badge>
                                )}
                                {item.data.sentiment && (
                                  <Badge className="bg-ink-50 text-ink-600 border-none text-[10px]">{item.data.sentiment}</Badge>
                                )}
                              </div>
                              {item.data.summary && (
                                <p className="text-xs text-ink-600 mt-2 bg-ink-50 rounded p-2">{item.data.summary}</p>
                              )}
                            </div>
                          )}

                          {item.type === "note" && (
                            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <StickyNote className="w-3.5 h-3.5 text-amber-600" />
                                  <span className="text-xs font-semibold text-ink-700">Nota</span>
                                </div>
                                <span className="text-[10px] text-ink-400">
                                  {item.date ? format(new Date(item.date), "dd MMM HH:mm", { locale: it }) : ""}
                                </span>
                              </div>
                              <p className="text-sm text-ink-800 whitespace-pre-wrap mt-1">{item.data.content}</p>
                            </div>
                          )}

                          {item.type === "preventivo" && (
                            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                  <FileText className="w-3.5 h-3.5 text-emerald-600" />
                                  <span className="text-xs font-semibold text-ink-700">
                                    Preventivo {item.data.numero || ""}
                                  </span>
                                </div>
                                <span className="text-[10px] text-ink-400">
                                  {item.date ? format(new Date(item.date), "dd MMM", { locale: it }) : ""}
                                </span>
                              </div>
                              <p className="text-xs text-ink-600 mt-1">
                                {item.data.titolo || "Senza titolo"}
                                {item.data.totale_finale ? ` — €${Number(item.data.totale_finale).toFixed(2)}` : ""}
                              </p>
                              <Badge className={`mt-1 text-[10px] border-none ${
                                item.data.stato === "accettato" ? "bg-emerald-100 text-emerald-700"
                                : item.data.stato === "rifiutato" ? "bg-red-50 text-red-600"
                                : item.data.stato === "inviato" ? "bg-blue-50 text-blue-600"
                                : "bg-ink-100 text-ink-500"
                              }`}>
                                {item.data.stato || "bozza"}
                              </Badge>
                            </div>
                          )}

                          {item.type === "event" && (
                            <div className="py-1">
                              <p className="text-xs text-ink-500">{item.data.label}</p>
                              <p className="text-[10px] text-ink-400">
                                {item.date ? format(new Date(item.date), "dd MMM yyyy HH:mm", { locale: it }) : ""}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* Calls Tab — Call History from outbound_call_log */}
            <TabsContent value="calls" className="px-6 py-4 mt-0">
              <CallHistorySection contactId={contact.id} nextCallAt={contact.next_call_at} />
              <CallAnalyticsSection contactId={contact.id} />
            </TabsContent>

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
