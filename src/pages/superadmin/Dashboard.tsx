import { useEffect, useState, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Building2, Bot, Phone, DollarSign, ArrowRight, Plus, Users,
  AlertTriangle, TrendingUp, Coins, Image, BarChart3, Cpu, ArrowUpDown,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import StatsCard from "@/components/superadmin/StatsCard";
import { format, isAfter, isBefore, addDays, parseISO, subDays } from "date-fns";
import { it } from "date-fns/locale";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

/* ── Types ─────────────────────────────────────── */

interface Stats { companies: number; activeAgents: number; callsThisMonth: number; estimatedMRR: number; }
const planPricing: Record<string, number> = { starter: 49, professional: 149, enterprise: 499 };

interface CompanyRow {
  id: string; name: string; plan: string | null; status: string | null;
  trial_ends_at: string | null; calls_used_month: number; monthly_calls_limit: number;
  created_at: string | null; sector: string | null;
}

interface CreditRow {
  company_id: string; balance_eur: number; calls_blocked: boolean;
  auto_recharge_enabled: boolean; total_recharged_eur: number; total_spent_eur: number;
}

interface BillingSummary {
  company_name: string | null; company_id: string | null;
  total_cost_billed_eur: number | null; total_cost_real_eur: number | null;
  total_margin_eur: number | null; total_minutes: number | null;
  conversations_count: number | null;
}

interface UsageRow {
  created_at: string | null; cost_billed_total: number; cost_real_total: number;
  margin_total: number; llm_model: string; tts_model: string; duration_sec: number;
}

const PIE_COLORS = ["hsl(var(--brand))", "#3B82F6", "#F59E0B", "#EF4444", "#8B5CF6", "#06B6D4", "#84CC16"];

/* ── Component ─────────────────────────────────── */

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({ companies: 0, activeAgents: 0, callsThisMonth: 0, estimatedMRR: 0 });
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [companyCredits, setCompanyCredits] = useState<(CreditRow & { companyName: string })[]>([]);
  const [ecoStats, setEcoStats] = useState({ billed: 0, real: 0, margin: 0, marginPct: 0, totalMinutes: 0, totalConversations: 0 });
  const [renderStats, setRenderStats] = useState({ total: 0, revenue: 0, creditsUsed: 0 });
  const [usageData, setUsageData] = useState<UsageRow[]>([]);
  const [billingRows, setBillingRows] = useState<BillingSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockModal, setUnlockModal] = useState<{ companyId: string; companyName: string } | null>(null);
  const [unlockAmount, setUnlockAmount] = useState("10");
  const [unlockNotes, setUnlockNotes] = useState("");
  const [creditSort, setCreditSort] = useState<"balance" | "spent">("balance");

  useEffect(() => {
    async function fetchStats() {
      try {
        const [companiesRes, agentsRes, creditsRes, billingRes, renderSessionsRes, renderCreditsRes, usageRes] = await Promise.all([
          supabase.from("companies").select("id, name, plan, status, trial_ends_at, calls_used_month, monthly_calls_limit, created_at, sector"),
          supabase.from("agents").select("id, status, calls_month"),
          supabase.from("ai_credits").select("company_id, balance_eur, calls_blocked, auto_recharge_enabled, total_recharged_eur, total_spent_eur"),
          supabase.from("monthly_billing_summary").select("company_name, company_id, total_cost_billed_eur, total_cost_real_eur, total_margin_eur, total_minutes, conversations_count"),
          supabase.from("render_sessions").select("id, cost_billed, status"),
          supabase.from("render_credits").select("total_used"),
          supabase.from("ai_credit_usage").select("created_at, cost_billed_total, cost_real_total, margin_total, llm_model, tts_model, duration_sec").order("created_at", { ascending: false }).limit(500),
        ]);

        const comps = (companiesRes.data || []) as CompanyRow[];
        const agents = agentsRes.data || [];
        setCompanies(comps);
        setStats({
          companies: comps.length,
          activeAgents: agents.filter((a) => a.status === "active").length,
          callsThisMonth: agents.reduce((sum, a) => sum + (a.calls_month || 0), 0),
          estimatedMRR: comps.filter((c) => c.status === "active").reduce((sum, c) => sum + (planPricing[c.plan || "starter"] || 0), 0),
        });

        // Credits per company
        if (creditsRes.data) {
          const nameMap: Record<string, string> = {};
          comps.forEach(c => { nameMap[c.id] = c.name; });
          setCompanyCredits((creditsRes.data as unknown as CreditRow[]).map(cr => ({ ...cr, companyName: nameMap[cr.company_id] || "—" })));
        }

        // Billing
        if (billingRes.data) {
          const billing = billingRes.data as unknown as BillingSummary[];
          setBillingRows(billing);
          const billed = billing.reduce((s, b) => s + (b.total_cost_billed_eur || 0), 0);
          const real = billing.reduce((s, b) => s + (b.total_cost_real_eur || 0), 0);
          const margin = billed - real;
          const totalMinutes = billing.reduce((s, b) => s + (b.total_minutes || 0), 0);
          const totalConversations = billing.reduce((s, b) => s + (b.conversations_count || 0), 0);
          setEcoStats({ billed, real, margin, marginPct: billed > 0 ? (margin / billed) * 100 : 0, totalMinutes, totalConversations });
        }

        // Usage data
        if (usageRes.data) setUsageData(usageRes.data as unknown as UsageRow[]);

        // Render stats
        const rSessions = renderSessionsRes.data || [];
        const rCredits = renderCreditsRes.data || [];
        setRenderStats({
          total: rSessions.filter((s: any) => s.status === "completed").length,
          revenue: rSessions.reduce((s: number, r: any) => s + (r.cost_billed || 0), 0),
          creditsUsed: rCredits.reduce((s: number, r: any) => s + (r.total_used || 0), 0),
        });
      } catch (err) { console.error("Error fetching stats:", err); }
      finally { setLoading(false); }
    }
    fetchStats();
  }, []);

  /* ── Derived data ──────────────────────────────── */

  // Revenue over time (last 30 days)
  const revenueOverTime = useMemo(() => {
    const cutoff = subDays(new Date(), 30);
    const dayMap: Record<string, { billed: number; real: number }> = {};
    usageData.forEach(u => {
      if (!u.created_at || !isAfter(parseISO(u.created_at), cutoff)) return;
      const day = format(parseISO(u.created_at), "dd/MM");
      if (!dayMap[day]) dayMap[day] = { billed: 0, real: 0 };
      dayMap[day].billed += u.cost_billed_total || 0;
      dayMap[day].real += u.cost_real_total || 0;
    });
    return Object.entries(dayMap).map(([day, v]) => ({
      day, ricavi: +v.billed.toFixed(2), costi: +v.real.toFixed(2), margine: +(v.billed - v.real).toFixed(2),
    }));
  }, [usageData]);

  // LLM model breakdown
  const modelBreakdown = useMemo(() => {
    const map: Record<string, { cost: number; count: number }> = {};
    usageData.forEach(u => {
      const m = u.llm_model || "unknown";
      if (!map[m]) map[m] = { cost: 0, count: 0 };
      map[m].cost += u.cost_real_total || 0;
      map[m].count++;
    });
    return Object.entries(map)
      .map(([name, v]) => ({ name, value: +v.cost.toFixed(2), count: v.count }))
      .sort((a, b) => b.value - a.value);
  }, [usageData]);

  // Per-company revenue
  const companyRevenue = useMemo(() => {
    return billingRows
      .filter(b => b.company_name)
      .map(b => ({
        name: b.company_name || "—",
        ricavi: +(b.total_cost_billed_eur || 0).toFixed(2),
        costi: +(b.total_cost_real_eur || 0).toFixed(2),
        margine: +(b.total_margin_eur || 0).toFixed(2),
        conversazioni: b.conversations_count || 0,
        minuti: +(b.total_minutes || 0).toFixed(1),
      }))
      .sort((a, b) => b.ricavi - a.ricavi);
  }, [billingRows]);

  // Sorted credits
  const sortedCredits = useMemo(() => {
    return [...companyCredits].sort((a, b) => {
      if (creditSort === "balance") return (a.balance_eur || 0) - (b.balance_eur || 0);
      return (b.total_spent_eur || 0) - (a.total_spent_eur || 0);
    });
  }, [companyCredits, creditSort]);

  const handleUnlock = async () => {
    if (!unlockModal) return;
    const amt = parseInt(unlockAmount);
    if (amt <= 0) return;
    try {
      await supabase.functions.invoke("topup-credits", {
        body: { companyId: unlockModal.companyId, amountEur: 0, creditsToAdd: amt, paymentMethod: "manual_admin", type: "adjustment" },
      });
      toast({ title: "Crediti accreditati", description: `${amt} crediti aggiunti a ${unlockModal.companyName}` });
      setUnlockModal(null);
      setUnlockAmount("10");
      setUnlockNotes("");
      window.location.reload();
    } catch {
      toast({ variant: "destructive", title: "Errore" });
    }
  };

  const recentCompanies = [...companies].sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()).slice(0, 5);
  const trialExpiring = companies.filter((c) => {
    if (!c.trial_ends_at) return false;
    const d = new Date(c.trial_ends_at);
    return isAfter(d, new Date()) && isBefore(d, addDays(new Date(), 7));
  });

  const planDistribution: Record<string, number> = {};
  companies.forEach((c) => { const p = c.plan || "starter"; planDistribution[p] = (planDistribution[p] || 0) + 1; });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-500 mt-1">Panoramica globale della piattaforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/superadmin/companies")} className="border-ink-200 text-ink-700">
            <span className="hidden sm:inline">Gestisci Aziende</span>
            <span className="sm:hidden">Aziende</span>
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/superadmin/companies/new")} className="bg-brand hover:bg-brand-hover text-white">
            <Plus className="mr-2 h-4 w-4" /> <span className="hidden sm:inline">Nuova Azienda</span><span className="sm:hidden">Nuova</span>
          </Button>
        </div>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Building2} value={loading ? "..." : stats.companies} label="Aziende Totali" deltaType="neutral" />
        <StatsCard icon={Bot} value={loading ? "..." : stats.activeAgents} label="Agenti Attivi" deltaType="neutral" />
        <StatsCard icon={Phone} value={loading ? "..." : stats.callsThisMonth.toLocaleString("it-IT")} label="Chiamate questo mese" deltaType="positive" />
        <StatsCard icon={DollarSign} value={loading ? "..." : `€${stats.estimatedMRR.toLocaleString("it-IT")}`} label="MRR Stimato" deltaType="positive" />
      </div>

      {/* Trial Alert */}
      {trialExpiring.length > 0 && (
        <div className="rounded-card p-4 border border-status-warning bg-status-warning-light flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink-900">Trial in scadenza ({trialExpiring.length})</p>
            <div className="mt-1 space-y-1">
              {trialExpiring.map((c) => (
                <p key={c.id} className="text-xs text-ink-600">
                  <Link to={`/superadmin/companies/${c.id}`} className="font-medium text-brand hover:underline">{c.name}</Link>
                  {" — scade il "}{format(new Date(c.trial_ends_at!), "d MMM yyyy", { locale: it })}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ═══ ECONOMICS ═══ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-brand" /> Revenue & Margini
        </h2>

        {/* Economics KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: "Ricavi totali", value: `€${ecoStats.billed.toFixed(2)}`, color: "text-brand" },
            { label: "Costi reali", value: `€${ecoStats.real.toFixed(2)}`, color: "text-ink-700" },
            { label: "Margine lordo", value: `€${ecoStats.margin.toFixed(2)}`, color: "text-status-success" },
            { label: "Margine %", value: `${ecoStats.marginPct.toFixed(0)}%`, color: "text-status-success" },
            { label: "Minuti totali", value: ecoStats.totalMinutes.toFixed(0), color: "text-ink-700" },
            { label: "Conversazioni", value: ecoStats.totalConversations, color: "text-ink-700" },
          ].map(kpi => (
            <div key={kpi.label} className="rounded-card border border-border bg-card p-4 shadow-card">
              <p className="text-[10px] font-mono uppercase text-muted-foreground tracking-wide">{kpi.label}</p>
              <p className={`text-xl font-bold mt-1 ${kpi.color}`}>{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Revenue Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 rounded-card p-5 border border-border bg-card shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Ricavi vs Costi (30gg)</h3>
            {revenueOverTime.length === 0 ? (
              <p className="text-sm text-muted-foreground py-12 text-center">Nessun dato disponibile</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <AreaChart data={revenueOverTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                  <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} tickFormatter={v => `€${v}`} />
                  <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} />
                  <Area type="monotone" dataKey="ricavi" stroke="hsl(var(--brand))" fill="hsl(var(--brand))" fillOpacity={0.15} strokeWidth={2} name="Ricavi" />
                  <Area type="monotone" dataKey="costi" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.08} strokeWidth={1.5} name="Costi" />
                  <Legend />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* LLM Model Breakdown */}
          <div className="rounded-card p-5 border border-border bg-card shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-4">Costi per Modello LLM</h3>
            {modelBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground py-8 text-center">Nessun dato</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={modelBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                      {modelBreakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => `€${v.toFixed(2)}`} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 mt-2">
                  {modelBreakdown.slice(0, 5).map((m, i) => (
                    <div key={m.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                        <span className="text-muted-foreground">{m.name}</span>
                      </div>
                      <span className="font-mono font-medium text-foreground">€{m.value.toFixed(2)} ({m.count})</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Per-Company Revenue Table */}
        {companyRevenue.length > 0 && (
          <div className="rounded-card border border-border bg-card shadow-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Revenue per Azienda</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-xs">Azienda</TableHead>
                    <TableHead className="text-xs text-right">Ricavi €</TableHead>
                    <TableHead className="text-xs text-right hidden md:table-cell">Costi €</TableHead>
                    <TableHead className="text-xs text-right">Margine €</TableHead>
                    <TableHead className="text-xs text-right hidden md:table-cell">Conv.</TableHead>
                    <TableHead className="text-xs text-right hidden md:table-cell">Minuti</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {companyRevenue.map(r => (
                    <TableRow key={r.name}>
                      <TableCell className="text-sm font-medium">{r.name}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-brand font-semibold">€{r.ricavi}</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground hidden md:table-cell">€{r.costi}</TableCell>
                      <TableCell className="text-right font-mono text-sm font-semibold text-status-success">€{r.margine}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground hidden md:table-cell">{r.conversazioni}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground hidden md:table-cell">{r.minuti}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* ═══ RENDER AI ═══ */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-ink-900 flex items-center gap-2"><Image className="h-5 w-5 text-brand" /> Render AI</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard icon={Image} value={renderStats.total} label="Render Completati" deltaType="neutral" />
          <StatsCard icon={DollarSign} value={`€${renderStats.revenue.toFixed(2)}`} label="Revenue Render" deltaType="positive" />
          <StatsCard icon={Coins} value={renderStats.creditsUsed} label="Crediti Utilizzati" deltaType="neutral" />
        </div>
      </div>

      {/* ═══ COMPANIES ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Companies */}
        <div className="rounded-card p-5 border border-border bg-card shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-foreground">Aziende Recenti</h3>
            <Link to="/superadmin/companies" className="text-xs text-brand hover:underline flex items-center gap-1">
              Tutte <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recentCompanies.map((c) => (
              <Link key={c.id} to={`/superadmin/companies/${c.id}`} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-btn bg-brand-light flex items-center justify-center">
                  <Building2 className="w-4 h-4 text-brand-text" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground group-hover:text-brand truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground">{c.sector || "—"} · {c.plan}</p>
                </div>
                <Badge variant={c.status === "active" ? "default" : "secondary"} className={c.status === "active" ? "bg-status-success-light text-status-success border-none text-xs" : "text-xs"}>
                  {c.status}
                </Badge>
              </Link>
            ))}
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="rounded-card p-5 border border-border bg-card shadow-card">
          <h3 className="text-sm font-semibold text-foreground mb-4">Distribuzione Piani</h3>
          <div className="space-y-3">
            {Object.entries(planDistribution).map(([plan, count]) => {
              const pct = companies.length > 0 ? (count / companies.length) * 100 : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-foreground capitalize">{plan}</span>
                    <span className="text-sm font-semibold text-foreground">{count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-muted">
                    <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-xs text-muted-foreground">MRR stimato: <span className="font-bold text-foreground">€{stats.estimatedMRR.toLocaleString("it-IT")}</span></p>
          </div>
        </div>
      </div>

      {/* ═══ CREDIT HEALTH ═══ */}
      {sortedCredits.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-ink-900">Saldo Crediti per Azienda</h2>
            <Button variant="ghost" size="sm" onClick={() => setCreditSort(s => s === "balance" ? "spent" : "balance")} className="text-xs text-muted-foreground">
              <ArrowUpDown className="w-3 h-3 mr-1" />
              {creditSort === "balance" ? "Ordina per spesa" : "Ordina per saldo"}
            </Button>
          </div>
          <div className="rounded-card border border-border bg-card shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead className="text-xs">Azienda</TableHead>
                    <TableHead className="text-xs text-right">Saldo crediti</TableHead>
                    <TableHead className="text-xs text-right hidden md:table-cell">Usati</TableHead>
                    <TableHead className="text-xs text-right hidden lg:table-cell">Ricaricati</TableHead>
                    <TableHead className="text-xs">Stato</TableHead>
                    <TableHead className="text-xs hidden lg:table-cell">Auto-Ricarica</TableHead>
                    <TableHead className="text-xs text-right">Azione</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedCredits.map((cr) => (
                    <TableRow key={cr.company_id}>
                      <TableCell className="font-medium text-sm">{cr.companyName}</TableCell>
                      <TableCell className={`text-right font-mono text-sm font-semibold ${cr.calls_blocked ? "text-destructive" : (cr.balance_eur || 0) <= 50 ? "text-yellow-600" : "text-foreground"}`}>
                        {Math.round(cr.balance_eur || 0)} cr
                      </TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground hidden md:table-cell">{Math.round(cr.total_spent_eur || 0)} cr</TableCell>
                      <TableCell className="text-right font-mono text-sm text-muted-foreground hidden lg:table-cell">{Math.round(cr.total_recharged_eur || 0)} cr</TableCell>
                      <TableCell>
                        {cr.calls_blocked ? (
                          <Badge variant="destructive" className="text-xs">🚫 Bloccato</Badge>
                        ) : (cr.balance_eur || 0) <= 50 ? (
                          <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300 text-xs">⚠ Basso</Badge>
                        ) : (
                          <Badge className="bg-status-success-light text-status-success border-none text-xs">✓ OK</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground hidden lg:table-cell">{cr.auto_recharge_enabled ? "✅" : "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant={cr.calls_blocked ? "destructive" : "outline"}
                          className="text-xs"
                          onClick={() => setUnlockModal({ companyId: cr.company_id, companyName: cr.companyName })}
                        >
                          {cr.calls_blocked ? "Sblocca" : "+ Crediti"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      )}

      {/* Unlock Modal */}
      <Dialog open={!!unlockModal} onOpenChange={() => setUnlockModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Aggiungi crediti a {unlockModal?.companyName}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Crediti da aggiungere</Label>
              <Input type="number" min="1" step="1" value={unlockAmount} onChange={e => setUnlockAmount(e.target.value)} placeholder="Es. 100" />
            </div>
            <div className="space-y-2">
              <Label>Note interne</Label>
              <Input placeholder="Es. Credito promozionale" value={unlockNotes} onChange={e => setUnlockNotes(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUnlockModal(null)}>Annulla</Button>
            <Button className="bg-brand hover:bg-brand-hover text-white" onClick={handleUnlock}>Accredita</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
