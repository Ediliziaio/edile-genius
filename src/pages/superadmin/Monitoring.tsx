import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, Mail, MailX, Clock, ShieldAlert, Cpu, Zap,
  RefreshCw, AlertTriangle, CheckCircle2, XCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import StatsCard from "@/components/superadmin/StatsCard";
import { format, parseISO, subHours } from "date-fns";
import { it } from "date-fns/locale";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer,
} from "recharts";

/* ── Config ────────────────────────────────────── */

const MONITORING_CONFIG = {
  WEEKLY_REPORTS_LIMIT: 50,
  ORCHESTRATOR_LOGS_LIMIT: 200,
  LOGS_WINDOW_HOURS: 24,
  CREDITS_LOW_THRESHOLD: 5,
  STALE_TIME_MS: 5 * 60 * 1000,
} as const;

/* ── Types ─────────────────────────────────────── */

interface WeeklyReport {
  id: string;
  company_id: string;
  week_start: string;
  sent_at: string | null;
  status: string;
  error_message: string | null;
  retry_count: number;
}

interface OrchestratorLog {
  id: string;
  company_id: string;
  event_type: string;
  action_taken: string;
  created_at: string | null;
  action_details: Record<string, unknown> | null;
}

interface CreditRow {
  company_id: string;
  balance_eur: number;
  minutes_reserved: number;
  calls_blocked: boolean;
  total_spent_eur: number;
}

interface CompanyName {
  id: string;
  name: string;
}

/* ── Helpers ───────────────────────────────────── */

const sanitizeErrorMessage = (msg: string | null): string => {
  if (!msg) return "—";
  const sanitized = msg.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[email]");
  return sanitized.length > 80 ? sanitized.slice(0, 80) + "…" : sanitized;
};

/* ── Component ─────────────────────────────────── */

export default function Monitoring() {
  const { data: companies, error: companiesError } = useQuery({
    queryKey: ["sa-monitoring-companies"],
    queryFn: async () => {
      const { data, error } = await supabase.from("companies").select("id, name").order("name");
      if (error) throw error;
      return (data || []) as CompanyName[];
    },
    staleTime: MONITORING_CONFIG.STALE_TIME_MS,
  });

  const nameMap = useMemo(() => {
    const m: Record<string, string> = {};
    companies?.forEach((c) => (m[c.id] = c.name));
    return m;
  }, [companies]);

  /* ── Weekly Reports ── */
  const { data: weeklyReports, isLoading: loadingReports, error: reportsError, refetch: refetchReports } = useQuery({
    queryKey: ["sa-weekly-reports"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("weekly_reports_log")
        .select("*")
        .order("week_start", { ascending: false })
        .limit(MONITORING_CONFIG.WEEKLY_REPORTS_LIMIT);
      if (error) throw error;
      return (data || []) as WeeklyReport[];
    },
    staleTime: MONITORING_CONFIG.STALE_TIME_MS,
  });

  const reportStats = useMemo(() => {
    if (!weeklyReports) return { total: 0, sent: 0, failed: 0, pending: 0 };
    return {
      total: weeklyReports.length,
      sent: weeklyReports.filter((r) => r.status === "sent").length,
      failed: weeklyReports.filter((r) => r.status === "failed").length,
      pending: weeklyReports.filter((r) => r.status === "pending").length,
    };
  }, [weeklyReports]);

  /* ── Orchestrator Backpressure ── */
  const { data: orchestratorLogs, isLoading: loadingOrch, error: logsError, refetch: refetchOrch } = useQuery({
    queryKey: ["sa-orchestrator-logs"],
    queryFn: async () => {
      const cutoff = subHours(new Date(), MONITORING_CONFIG.LOGS_WINDOW_HOURS).toISOString();
      const { data, error } = await supabase
        .from("ai_orchestrator_log")
        .select("*")
        .gte("created_at", cutoff)
        .order("created_at", { ascending: false })
        .limit(MONITORING_CONFIG.ORCHESTRATOR_LOGS_LIMIT);
      if (error) throw error;
      return (data || []) as OrchestratorLog[];
    },
    staleTime: MONITORING_CONFIG.STALE_TIME_MS,
  });

  const orchStats = useMemo(() => {
    if (!orchestratorLogs) return { total: 0, throttled: 0, perCompany: [] as { company: string; count: number; lastAction: string }[] };
    const throttled = orchestratorLogs.filter((l) => l.action_taken === "throttled" || l.action_taken === "skipped_backpressure").length;
    const compMap: Record<string, { count: number; lastAction: string }> = {};
    orchestratorLogs.forEach((l) => {
      if (!compMap[l.company_id]) compMap[l.company_id] = { count: 0, lastAction: l.action_taken };
      compMap[l.company_id].count++;
    });
    const perCompany = Object.entries(compMap)
      .map(([id, v]) => ({ company: nameMap[id] || id.slice(0, 8), count: v.count, lastAction: v.lastAction }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
    return { total: orchestratorLogs.length, throttled, perCompany };
  }, [orchestratorLogs, nameMap]);

  const orchTimeline = useMemo(() => {
    if (!orchestratorLogs) return [];
    const hourMap: Record<string, number> = {};
    orchestratorLogs.forEach((l) => {
      if (!l.created_at) return;
      const hour = format(parseISO(l.created_at), "HH:00");
      hourMap[hour] = (hourMap[hour] || 0) + 1;
    });
    return Object.entries(hourMap)
      .map(([hour, count]) => ({ hour, azioni: count }))
      .sort((a, b) => a.hour.localeCompare(b.hour));
  }, [orchestratorLogs]);

  /* ── Credits / Reserved ── */
  const { data: credits, isLoading: loadingCredits, error: creditsError, refetch: refetchCredits } = useQuery({
    queryKey: ["sa-monitoring-credits"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_credits")
        .select("company_id, balance_eur, minutes_reserved, calls_blocked, total_spent_eur");
      if (error) throw error;
      return (data || []) as CreditRow[];
    },
    staleTime: MONITORING_CONFIG.STALE_TIME_MS,
  });

  const creditStats = useMemo(() => {
    if (!credits) return { totalBalance: 0, totalReserved: 0, blocked: 0, lowBalance: 0 };
    return {
      totalBalance: credits.reduce((s, c) => s + (c.balance_eur || 0), 0),
      totalReserved: credits.reduce((s, c) => s + (c.minutes_reserved || 0), 0),
      blocked: credits.filter((c) => c.calls_blocked).length,
      lowBalance: credits.filter((c) => (c.balance_eur || 0) > 0 && (c.balance_eur || 0) <= MONITORING_CONFIG.CREDITS_LOW_THRESHOLD).length,
    };
  }, [credits]);

  const reservedCredits = useMemo(() => {
    if (!credits) return [];
    return credits
      .filter((c) => (c.minutes_reserved || 0) > 0)
      .map((c) => ({
        company: nameMap[c.company_id] || c.company_id.slice(0, 8),
        reserved: c.minutes_reserved || 0,
        balance: c.balance_eur || 0,
        blocked: c.calls_blocked,
      }))
      .sort((a, b) => b.reserved - a.reserved);
  }, [credits, nameMap]);

  const isLoading = loadingReports || loadingOrch || loadingCredits;

  const handleRefreshAll = () => {
    refetchReports();
    refetchOrch();
    refetchCredits();
  };

  // Error state
  const hasError = companiesError || reportsError || logsError || creditsError;
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center py-20 space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive" />
        <h2 className="text-lg font-bold text-foreground">Errore nel caricamento dati di monitoraggio</h2>
        <p className="text-sm text-muted-foreground max-w-md text-center">{(hasError as Error).message}</p>
        <Button variant="outline" onClick={handleRefreshAll} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Riprova
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Monitoraggio Sistema</h1>
          <p className="text-sm text-muted-foreground mt-1">Weekly Reports, AI Orchestrator e Crediti in tempo reale</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefreshAll} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Aggiorna
        </Button>
      </div>

      {/* ═══ TOP KPIs ═══ */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 rounded-lg" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard icon={Mail} value={reportStats.sent} label="Report Inviati" delta={`${reportStats.failed} falliti`} deltaType={reportStats.failed > 0 ? "negative" : "positive"} />
          <StatsCard icon={Cpu} value={orchStats.total} label="Azioni Orchestrator (24h)" delta={`${orchStats.throttled} throttled`} deltaType={orchStats.throttled > 0 ? "negative" : "neutral"} />
          <StatsCard icon={Zap} value={`€${creditStats.totalBalance.toFixed(0)}`} label="Saldo Totale Piattaforma" delta={`${creditStats.blocked} bloccati`} deltaType={creditStats.blocked > 0 ? "negative" : "positive"} />
          <StatsCard icon={Clock} value={creditStats.totalReserved.toFixed(0)} label="Minuti Riservati" delta={`${creditStats.lowBalance} saldo basso`} deltaType={creditStats.lowBalance > 0 ? "negative" : "neutral"} />
        </div>
      )}

      {/* ═══ WEEKLY REPORTS ═══ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Mail className="h-5 w-5 text-brand" /> Weekly Reports Log
        </h2>

        {loadingReports ? (
          <Skeleton className="h-64 rounded-lg" />
        ) : weeklyReports && weeklyReports.length > 0 ? (
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">Azienda</TableHead>
                  <TableHead className="text-xs hidden md:table-cell">Settimana</TableHead>
                  <TableHead className="text-xs">Stato</TableHead>
                  <TableHead className="text-xs hidden sm:table-cell">Inviato il</TableHead>
                  <TableHead className="text-xs text-right hidden md:table-cell">Tentativi</TableHead>
                  <TableHead className="text-xs hidden lg:table-cell">Errore</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weeklyReports.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="text-sm font-medium">{nameMap[r.company_id] || r.company_id.slice(0, 8)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{r.week_start}</TableCell>
                    <TableCell>
                      {r.status === "sent" && <Badge className="bg-emerald-100 text-emerald-700 border-none text-xs gap-1"><CheckCircle2 className="h-3 w-3" /> Inviato</Badge>}
                      {r.status === "failed" && <Badge variant="destructive" className="text-xs gap-1"><XCircle className="h-3 w-3" /> Fallito</Badge>}
                      {r.status === "pending" && <Badge variant="secondary" className="text-xs gap-1"><Clock className="h-3 w-3" /> In attesa</Badge>}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground hidden sm:table-cell">
                      {r.sent_at ? format(parseISO(r.sent_at), "dd MMM HH:mm", { locale: it }) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm hidden md:table-cell">{r.retry_count}</TableCell>
                    <TableCell className="text-xs text-destructive max-w-[200px] truncate hidden lg:table-cell" title={r.error_message || undefined}>
                      {sanitizeErrorMessage(r.error_message)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nessun report settimanale registrato
          </div>
        )}
      </div>

      {/* ═══ ORCHESTRATOR ═══ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <Cpu className="h-5 w-5 text-brand" /> AI Orchestrator — Backpressure ({MONITORING_CONFIG.LOGS_WINDOW_HOURS}h)
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Timeline chart */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Azioni per Ora</h3>
            {loadingOrch ? (
              <Skeleton className="h-48" />
            ) : orchTimeline.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={orchTimeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="hour" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <Tooltip />
                  <Bar dataKey="azioni" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} name="Azioni" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Nessuna attività nelle ultime {MONITORING_CONFIG.LOGS_WINDOW_HOURS}h</p>
            )}
          </div>

          {/* Per-company breakdown */}
          <div className="rounded-lg border border-border bg-card shadow-sm p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Attività per Azienda</h3>
            {loadingOrch ? (
              <Skeleton className="h-48" />
            ) : orchStats.perCompany.length > 0 ? (
              <div className="space-y-2">
                {orchStats.perCompany.map((c) => (
                  <div key={c.company} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm font-medium text-foreground truncate">{c.company}</span>
                      <span className="text-xs text-muted-foreground">· {c.lastAction}</span>
                    </div>
                    <Badge variant={c.count > 20 ? "destructive" : "secondary"} className="text-xs font-mono">
                      {c.count}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">Nessuna attività</p>
            )}

            {orchStats.throttled > 0 && (
              <div className="mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/20 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <p className="text-xs text-destructive">
                  <strong>{orchStats.throttled}</strong> azioni throttled nelle ultime {MONITORING_CONFIG.LOGS_WINDOW_HOURS}h — possibile sovraccarico.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ RESERVED CREDITS ═══ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <ShieldAlert className="h-5 w-5 text-brand" /> Crediti Riservati in Tempo Reale
        </h2>

        {loadingCredits ? (
          <Skeleton className="h-48 rounded-lg" />
        ) : reservedCredits.length > 0 ? (
          <div className="rounded-lg border border-border bg-card shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted">
                  <TableHead className="text-xs">Azienda</TableHead>
                  <TableHead className="text-xs text-right">Min. Riservati</TableHead>
                  <TableHead className="text-xs text-right">Saldo €</TableHead>
                  <TableHead className="text-xs">Stato</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservedCredits.map((c) => (
                  <TableRow key={c.company}>
                    <TableCell className="text-sm font-medium">{c.company}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-semibold text-brand">{c.reserved}</TableCell>
                    <TableCell className={`text-right font-mono text-sm ${c.balance <= MONITORING_CONFIG.CREDITS_LOW_THRESHOLD ? "text-destructive" : "text-foreground"}`}>
                      €{c.balance.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      {c.blocked ? (
                        <Badge variant="destructive" className="text-xs">🚫 Bloccato</Badge>
                      ) : (
                        <Badge className="bg-emerald-100 text-emerald-700 border-none text-xs">Attivo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="rounded-lg border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nessun credito attualmente riservato
          </div>
        )}

        {/* Credit health summary */}
        {!loadingCredits && credits && credits.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Aziende con crediti", value: credits.filter((c) => (c.balance_eur || 0) > 0).length, icon: CheckCircle2, color: "text-emerald-600" },
              { label: `Saldo basso (< €${MONITORING_CONFIG.CREDITS_LOW_THRESHOLD})`, value: creditStats.lowBalance, icon: AlertTriangle, color: creditStats.lowBalance > 0 ? "text-yellow-600" : "text-muted-foreground" },
              { label: "Chiamate bloccate", value: creditStats.blocked, icon: XCircle, color: creditStats.blocked > 0 ? "text-destructive" : "text-muted-foreground" },
              { label: "Spesa totale", value: `€${credits.reduce((s, c) => s + (c.total_spent_eur || 0), 0).toFixed(0)}`, icon: Zap, color: "text-brand" },
            ].map((kpi) => (
              <div key={kpi.label} className="rounded-lg border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                  <span className="text-[10px] font-mono uppercase text-muted-foreground tracking-wide">{kpi.label}</span>
                </div>
                <p className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
