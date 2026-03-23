import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, PhoneOff, Clock, Bot, Activity } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

/* ─── Types ──────────────────────────────────────────── */
interface ActiveCall {
  id: string;
  conversation_id: string | null;
  contact_id: string | null;
  status: string;
  started_at: string;
  to_number: string;
  agent_id: string;
  dynamic_variables: Record<string, string> | null;
  contact_name: string | null;
  contact_company: string | null;
  agent_name: string | null;
}

interface RecentCall {
  id: string;
  status: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  to_number: string;
  outcome: string | null;
  sentiment: string | null;
  contact_name: string | null;
  agent_name: string | null;
}

/* ─── Status helpers ─────────────────────────────────── */
const StatusColors: Record<string, string> = {
  initiated: "bg-yellow-100 text-yellow-800 border-yellow-200",
  ringing: "bg-blue-100 text-blue-800 border-blue-200",
  in_progress: "bg-green-100 text-green-800 border-green-200",
};
const StatusLabels: Record<string, string> = {
  initiated: "Avvio",
  ringing: "In chiamata",
  in_progress: "Conversazione",
};

/* ─── Active Call Card ───────────────────────────────── */
function ActiveCallCard({ call }: { call: ActiveCall }) {
  const [elapsed, setElapsed] = useState(
    Math.floor((Date.now() - new Date(call.started_at).getTime()) / 1000)
  );

  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  return (
    <Card className="border-l-4" style={{ borderLeftColor: call.status === "in_progress" ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))" }}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-full ${call.status === "in_progress" ? "bg-primary/10" : "bg-muted"}`}>
              <Phone size={18} className={call.status === "in_progress" ? "text-primary animate-pulse" : "text-muted-foreground"} />
            </div>
            <div className="min-w-0">
              <p className="font-semibold truncate">{call.contact_name || call.to_number}</p>
              {call.contact_company && <p className="text-xs text-muted-foreground">{call.contact_company}</p>}
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Clock size={12} /> {mm}:{ss}</span>
                {call.agent_name && <span className="flex items-center gap-1"><Bot size={12} /> {call.agent_name}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge variant="outline" className={StatusColors[call.status] || ""}>{StatusLabels[call.status] || call.status}</Badge>
            <span className="text-[10px] text-muted-foreground">{call.to_number}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ─── Page ───────────────────────────────────────────── */
export default function CallMonitorPage() {
  const companyId = useCompanyId();
  const queryClient = useQueryClient();

  const { data: activeCalls = [], isLoading: loadingActive } = useQuery({
    queryKey: ["call-monitor-active", companyId],
    queryFn: async () => {
      const freshTwoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from("outbound_call_log")
        .select("id, conversation_id, contact_id, status, started_at, to_number, agent_id, dynamic_variables, contacts(full_name, company_name), agents(name)")
        .eq("company_id", companyId!)
        .in("status", ["initiated", "ringing", "in_progress"])
        .gte("started_at", freshTwoHoursAgo)
        .order("started_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        contact_name: r.contacts?.full_name ?? null,
        contact_company: r.contacts?.company_name ?? null,
        agent_name: r.agents?.name ?? null,
      })) as ActiveCall[];
    },
    enabled: !!companyId,
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const { data: recentCalls = [], isLoading: loadingRecent } = useQuery({
    queryKey: ["call-monitor-recent", companyId],
    queryFn: async () => {
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from("outbound_call_log")
        .select("id, status, started_at, ended_at, duration_sec, to_number, outcome, sentiment, contacts(full_name), agents(name)")
        .eq("company_id", companyId!)
        .gte("started_at", startOfDay.toISOString())
        .not("status", "in", "(initiated,ringing,in_progress)")
        .order("started_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []).map((r: any) => ({
        ...r,
        contact_name: r.contacts?.full_name ?? null,
        agent_name: r.agents?.name ?? null,
      })) as RecentCall[];
    },
    enabled: !!companyId,
    staleTime: 30_000,
  });

  // Realtime subscription
  useEffect(() => {
    if (!companyId) return;
    const channel = supabase
      .channel(`call-monitor-${companyId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "outbound_call_log", filter: `company_id=eq.${companyId}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["call-monitor-active", companyId] });
        queryClient.invalidateQueries({ queryKey: ["call-monitor-recent", companyId] });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [companyId, queryClient]);

  const sentimentIcons: Record<string, string> = { positive: "😊", neutral: "😐", negative: "😔" };
  const outcomeColors: Record<string, string> = {
    answered: "bg-green-100 text-green-700",
    no_answer: "bg-red-100 text-red-600",
    busy: "bg-yellow-100 text-yellow-700",
    voicemail: "bg-blue-100 text-blue-700",
    failed: "bg-destructive/10 text-destructive",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Activity size={24} /> Monitor Chiamate</h1>
          <p className="text-sm text-muted-foreground">Chiamate in corso e storico di oggi — aggiornamento automatico</p>
        </div>
        <Badge variant={activeCalls.length > 0 ? "default" : "secondary"} className="text-sm px-3 py-1">
          {activeCalls.length > 0
            ? `${activeCalls.length} chiamat${activeCalls.length === 1 ? "a" : "e"} attiv${activeCalls.length === 1 ? "a" : "e"}`
            : "Nessuna chiamata attiva"}
        </Badge>
      </div>

      {/* Active calls */}
      <div>
        <h2 className="text-lg font-semibold mb-3">In corso</h2>
        {loadingActive ? (
          <div className="grid gap-3 md:grid-cols-2">{[1, 2].map((i) => <Skeleton key={i} className="h-24 rounded-lg" />)}</div>
        ) : activeCalls.length === 0 ? (
          <Card><CardContent className="flex flex-col items-center justify-center py-10 text-muted-foreground"><PhoneOff size={32} className="mb-2" /><p>Nessuna chiamata in corso</p></CardContent></Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">{activeCalls.map((c) => <ActiveCallCard key={c.id} call={c} />)}</div>
        )}
      </div>

      {/* Recent calls */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Oggi — Ultime {recentCalls.length} chiamate</h2>
        {loadingRecent ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-10 rounded" />)}</div>
        ) : recentCalls.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nessuna chiamata completata oggi</p>
        ) : (
          <Card>
            <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Contatto</TableHead>
                  <TableHead>Orario</TableHead>
                  <TableHead>Durata</TableHead>
                  <TableHead>Esito</TableHead>
                  <TableHead>Sentiment</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentCalls.map((call) => {
                  const dur = call.duration_sec
                    ? `${Math.floor(call.duration_sec / 60)}m ${call.duration_sec % 60}s`
                    : "—";
                  return (
                    <TableRow key={call.id}>
                      <TableCell>
                        <span className="font-medium">{call.contact_name ?? call.to_number}</span>
                        {call.agent_name && <span className="text-xs text-muted-foreground ml-1">· {call.agent_name}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{format(new Date(call.started_at), "HH:mm")}</TableCell>
                      <TableCell className="text-sm">{dur}</TableCell>
                      <TableCell>
                        {call.outcome ? (
                          <Badge variant="outline" className={outcomeColors[call.outcome] || ""}>{call.outcome.replace(/_/g, " ")}</Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>{sentimentIcons[call.sentiment ?? ""] ?? "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
