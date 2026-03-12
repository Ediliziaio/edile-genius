import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarClock, Clock, Phone, Trash2, RefreshCw, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, isPast, addMonths, subMonths,
} from "date-fns";
import { it } from "date-fns/locale";

/* ─── Types ──────────────────────────────────────────── */
interface ScheduledCall {
  id: string;
  contact_id: string;
  scheduled_at: string;
  status: string;
  notes: string | null;
  rescheduled_at: string | null;
  contact_name: string | null;
  contact_phone: string | null;
  contact_company: string | null;
  agent_name: string | null;
}

/* ─── Mini Calendar ──────────────────────────────────── */
function MiniCalendar({
  calls, onSelectDay, selectedDay,
}: {
  calls: ScheduledCall[];
  onSelectDay: (d: Date | null) => void;
  selectedDay: Date | null;
}) {
  const [viewMonth, setViewMonth] = useState(new Date());
  const days = eachDayOfInterval({ start: startOfMonth(viewMonth), end: endOfMonth(viewMonth) });
  const busyDays = new Set(
    calls.filter((c) => c.status === "pending").map((c) => format(new Date(c.scheduled_at), "yyyy-MM-dd"))
  );
  const firstDay = startOfMonth(viewMonth).getDay();
  const offset = firstDay === 0 ? 6 : firstDay - 1;

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setViewMonth((m) => subMonths(m, 1))}>‹</Button>
          <span className="text-sm font-medium capitalize">{format(viewMonth, "MMMM yyyy", { locale: it })}</span>
          <Button variant="ghost" size="sm" onClick={() => setViewMonth((m) => addMonths(m, 1))}>›</Button>
        </div>
        <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground mt-1">
          {["Lu", "Ma", "Me", "Gi", "Ve", "Sa", "Do"].map((d) => <span key={d}>{d}</span>)}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-7 gap-0.5">
          {Array.from({ length: offset }).map((_, i) => <div key={`o${i}`} />)}
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const hasCalls = busyDays.has(key);
            const isSelected = selectedDay && isSameDay(day, selectedDay);
            return (
              <button
                key={key}
                onClick={() => onSelectDay(isSelected ? null : day)}
                className={`relative h-8 w-8 rounded-full text-xs font-medium transition-colors mx-auto flex items-center justify-center
                  ${isSelected ? "bg-primary text-primary-foreground" : ""}
                  ${isToday(day) && !isSelected ? "border-2 border-primary text-primary" : ""}
                  ${isPast(day) && !isToday(day) ? "text-muted-foreground/50" : "hover:bg-muted"}
                `}
              >
                {format(day, "d")}
                {hasCalls && !isSelected && (
                  <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
        {selectedDay && (
          <button onClick={() => onSelectDay(null)} className="mt-3 text-xs text-primary hover:underline w-full text-center">
            Mostra tutte
          </button>
        )}
      </CardContent>
    </Card>
  );
}

/* ─── Reschedule Dialog ──────────────────────────────── */
function RescheduleDialog({
  call, open, onClose, onReschedule,
}: {
  call: ScheduledCall | null;
  open: boolean;
  onClose: () => void;
  onReschedule: (id: string, newDate: string) => void;
}) {
  const [newDateTime, setNewDateTime] = useState("");
  if (!call) return null;
  const minDT = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Riprogramma chiamata</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Stai riprogrammando la chiamata a <strong>{call.contact_name ?? call.contact_phone}</strong>
          </p>
          <div>
            <Label>Nuova data e ora</Label>
            <Input type="datetime-local" min={minDT} value={newDateTime} onChange={(e) => setNewDateTime(e.target.value)} className="mt-1" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Annulla</Button>
          <Button disabled={!newDateTime} onClick={() => { onReschedule(call.id, new Date(newDateTime).toISOString()); onClose(); }}>
            Riprogramma
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─── Status badge ───────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: "In attesa", cls: "bg-blue-100 text-blue-700" },
    calling: { label: "In corso", cls: "bg-green-100 text-green-700 animate-pulse" },
    completed: { label: "Completata", cls: "bg-muted text-muted-foreground" },
    failed: { label: "Fallita", cls: "bg-destructive/10 text-destructive" },
    cancelled: { label: "Cancellata", cls: "bg-muted text-muted-foreground line-through" },
  };
  const s = map[status] ?? { label: status, cls: "bg-muted text-muted-foreground" };
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
}

/* ─── Page ───────────────────────────────────────────── */
export default function ScheduledCallsPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [filterStatus, setFilterStatus] = useState("pending");
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [rescheduleTarget, setRescheduleTarget] = useState<ScheduledCall | null>(null);

  const { data: calls = [], isLoading } = useQuery({
    queryKey: ["scheduled-calls", companyId, filterStatus],
    queryFn: async () => {
      let q = supabase
        .from("scheduled_calls")
        .select("id, contact_id, scheduled_at, status, notes, rescheduled_at, cancelled_reason, contacts(full_name, phone, company_name), agents(name)")
        .eq("company_id", companyId!);
      if (filterStatus !== "all") q = q.eq("status", filterStatus);
      const { data, error } = await q.order("scheduled_at", { ascending: true }).limit(100);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        contact_name: r.contacts?.full_name ?? null,
        contact_phone: r.contacts?.phone ?? null,
        contact_company: r.contacts?.company_name ?? null,
        agent_name: r.agents?.name ?? null,
      })) as ScheduledCall[];
    },
    enabled: !!companyId,
    staleTime: 30_000,
  });

  const filtered = selectedDay
    ? calls.filter((c) => isSameDay(new Date(c.scheduled_at), selectedDay))
    : calls;

  const cancelMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const { error } = await supabase.rpc("cancel_scheduled_call", { p_call_id: id, p_reason: reason ?? null });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Chiamata cancellata" }); queryClient.invalidateQueries({ queryKey: ["scheduled-calls"] }); },
    onError: (err: Error) => { toast({ title: "Errore", description: err.message, variant: "destructive" }); },
  });

  const rescheduleMutation = useMutation({
    mutationFn: async ({ id, newDate }: { id: string; newDate: string }) => {
      const { error } = await supabase.rpc("reschedule_call", { p_call_id: id, p_new_scheduled_at: newDate });
      if (error) throw error;
    },
    onSuccess: () => { toast({ title: "Chiamata riprogrammata" }); queryClient.invalidateQueries({ queryKey: ["scheduled-calls"] }); },
    onError: (err: Error) => { toast({ title: "Errore", description: err.message, variant: "destructive" }); },
  });

  const pendingCount = calls.filter((c) => c.status === "pending").length;
  const completedCount = calls.filter((c) => c.status === "completed").length;
  const failedCount = calls.filter((c) => c.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><CalendarClock size={24} /> Chiamate Programmate</h1>
          <p className="text-sm text-muted-foreground">Gestisci le chiamate schedulate verso i tuoi contatti</p>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">In attesa</SelectItem>
            <SelectItem value="all">Tutte</SelectItem>
            <SelectItem value="completed">Completate</SelectItem>
            <SelectItem value="failed">Fallite</SelectItem>
            <SelectItem value="cancelled">Cancellate</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sidebar: calendar + stats */}
        <div className="space-y-4">
          <MiniCalendar calls={calls} onSelectDay={setSelectedDay} selectedDay={selectedDay} />
          <Card>
            <CardContent className="grid grid-cols-3 gap-2 p-4 text-center">
              {[
                { label: "In attesa", count: pendingCount, color: "text-primary" },
                { label: "Completate", count: completedCount, color: "text-green-600" },
                { label: "Fallite", count: failedCount, color: "text-destructive" },
              ].map(({ label, count, color }) => (
                <div key={label}>
                  <p className="text-[10px] text-muted-foreground uppercase">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{count}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* List */}
        <div>
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)}</div>
          ) : filtered.length === 0 ? (
            <Card><CardContent className="flex flex-col items-center py-10 text-muted-foreground"><AlertCircle size={32} className="mb-2" /><p>{selectedDay ? `Nessuna chiamata il ${format(selectedDay, "d MMMM", { locale: it })}` : "Nessuna chiamata programmata"}</p></CardContent></Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((call) => {
                const schedDate = new Date(call.scheduled_at);
                const isOverdue = call.status === "pending" && isPast(schedDate);
                return (
                  <Card key={call.id}>
                    <CardContent className="flex items-center justify-between p-4 gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold">{call.contact_name ?? call.contact_phone}</span>
                          <StatusBadge status={call.status} />
                          {isOverdue && <Badge variant="destructive" className="text-[10px]">⚠️ In ritardo</Badge>}
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                          <span className="flex items-center gap-1"><Clock size={12} />{format(schedDate, "d MMM 'alle' HH:mm", { locale: it })}</span>
                          {call.contact_company && <span>· {call.contact_company}</span>}
                          {call.agent_name && <span>· {call.agent_name}</span>}
                        </div>
                        {call.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{call.notes}"</p>}
                      </div>
                      {call.status === "pending" && (
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="outline" size="sm" onClick={() => setRescheduleTarget(call)} className="gap-1">
                            <RefreshCw size={14} /> Riprogramma
                          </Button>
                          <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => { if (confirm(`Cancellare la chiamata a ${call.contact_name ?? call.contact_phone}?`)) cancelMutation.mutate({ id: call.id }); }}>
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <RescheduleDialog
        call={rescheduleTarget}
        open={!!rescheduleTarget}
        onClose={() => setRescheduleTarget(null)}
        onReschedule={(id, newDate) => rescheduleMutation.mutate({ id, newDate })}
      />
    </div>
  );
}
