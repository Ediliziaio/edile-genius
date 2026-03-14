import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  BarChart3, TrendingUp, Building2, Phone, DollarSign,
  ArrowUpRight, ArrowDownRight, Clock, Users, Palette, Download,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";

/* ── Types ──────────────────────────────────────────── */

interface KPI {
  totalRevenue: number;
  totalCost: number;
  totalMargin: number;
  marginPct: number;
  totalConversations: number;
  totalMinutes: number;
  activeCompanies: number;
  avgRevenuePerCompany: number;
  renderSessions: number;
  renderRevenue: number;
}

interface MonthlyRow {
  month: string;
  revenue: number;
  cost: number;
  margin: number;
  conversations: number;
}

interface CompanyRow {
  company_id: string;
  company_name: string;
  balance_eur: number;
  total_spent: number;
  conversations: number;
  agents: number;
  status: string;
}

interface AgentTypeRow {
  type: string;
  count: number;
}

/* ── Helpers ────────────────────────────────────────── */

const fmt = (n: number) => n.toLocaleString("it-IT", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n: number) => n.toLocaleString("it-IT");

const COLORS = [
  "hsl(var(--brand))",
  "hsl(var(--accent))",
  "hsl(142, 60%, 45%)",
  "hsl(38, 92%, 50%)",
  "hsl(0, 72%, 51%)",
];

/* ── Component ──────────────────────────────────────── */

export default function GlobalAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [kpi, setKpi] = useState<KPI>({
    totalRevenue: 0, totalCost: 0, totalMargin: 0, marginPct: 0,
    totalConversations: 0, totalMinutes: 0, activeCompanies: 0,
    avgRevenuePerCompany: 0, renderSessions: 0, renderRevenue: 0,
  });
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [agentTypes, setAgentTypes] = useState<AgentTypeRow[]>([]);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    await Promise.all([fetchKPIs(), fetchMonthly(), fetchCompanyBreakdown(), fetchAgentTypes()]);
    setLoading(false);
  }

  async function fetchKPIs() {
    const [usageRes, convsRes, companiesRes, renderRes] = await Promise.all([
      supabase.from("ai_credit_usage").select("cost_billed_total, cost_real_total, margin_total, duration_min"),
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase.from("companies").select("id, status"),
      supabase.from("render_sessions").select("cost_billed, status"),
    ]);

    const usage = usageRes.data || [];
    const totalRevenue = usage.reduce((s, r) => s + Number(r.cost_billed_total), 0);
    const totalCost = usage.reduce((s, r) => s + Number(r.cost_real_total), 0);
    const totalMargin = usage.reduce((s, r) => s + Number(r.margin_total), 0);
    const totalMinutes = usage.reduce((s, r) => s + Number(r.duration_min), 0);
    const activeCompanies = (companiesRes.data || []).filter(c => c.status === "active").length;

    const renders = renderRes.data || [];
    const renderRevenue = renders.reduce((s, r) => s + Number(r.cost_billed || 0), 0);
    const renderSessions = renders.filter(r => r.status === "completed").length;

    setKpi({
      totalRevenue: totalRevenue + renderRevenue,
      totalCost,
      totalMargin,
      marginPct: totalRevenue > 0 ? (totalMargin / totalRevenue) * 100 : 0,
      totalConversations: convsRes.count || 0,
      totalMinutes,
      activeCompanies,
      avgRevenuePerCompany: activeCompanies > 0 ? totalRevenue / activeCompanies : 0,
      renderSessions,
      renderRevenue,
    });
  }

  async function fetchMonthly() {
    const { data } = await supabase
      .from("monthly_billing_summary")
      .select("month, total_cost_billed_eur, total_cost_real_eur, total_margin_eur, conversations_count")
      .order("month", { ascending: true })
      .limit(12);

    setMonthly(
      (data || []).map(r => ({
        month: r.month ? new Date(r.month).toLocaleDateString("it-IT", { month: "short", year: "2-digit" }) : "—",
        revenue: Number(r.total_cost_billed_eur || 0),
        cost: Number(r.total_cost_real_eur || 0),
        margin: Number(r.total_margin_eur || 0),
        conversations: Number(r.conversations_count || 0),
      }))
    );
  }

  async function fetchCompanyBreakdown() {
    const [companiesRes, creditsRes, agentsRes, convsRes] = await Promise.all([
      supabase.from("companies").select("id, name, status"),
      supabase.from("ai_credits").select("company_id, balance_eur, total_spent_eur"),
      supabase.from("agents").select("company_id"),
      supabase.from("conversations").select("company_id"),
    ]);

    const creditsMap = new Map((creditsRes.data || []).map(c => [c.company_id, c]));
    const agentCounts = new Map<string, number>();
    (agentsRes.data || []).forEach(a => agentCounts.set(a.company_id, (agentCounts.get(a.company_id) || 0) + 1));
    const convCounts = new Map<string, number>();
    (convsRes.data || []).forEach(c => convCounts.set(c.company_id, (convCounts.get(c.company_id) || 0) + 1));

    setCompanies(
      (companiesRes.data || []).map(co => ({
        company_id: co.id,
        company_name: co.name,
        balance_eur: Number(creditsMap.get(co.id)?.balance_eur || 0),
        total_spent: Number(creditsMap.get(co.id)?.total_spent_eur || 0),
        conversations: convCounts.get(co.id) || 0,
        agents: agentCounts.get(co.id) || 0,
        status: co.status || "active",
      })).sort((a, b) => b.total_spent - a.total_spent)
    );
  }

  async function fetchAgentTypes() {
    const { data } = await supabase.from("agents").select("type");
    const counts = new Map<string, number>();
    (data || []).forEach(a => {
      const t = a.type || "vocal";
      counts.set(t, (counts.get(t) || 0) + 1);
    });
    setAgentTypes(Array.from(counts, ([type, count]) => ({ type, count })));
  }

  const typeLabel = (t: string) => {
    switch (t) {
      case "vocal": return "Vocale";
      case "render": return "Render";
      case "whatsapp": return "WhatsApp";
      default: return t;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 w-56 bg-ink-100 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-28 rounded-card bg-ink-100" />)}
        </div>
        <div className="h-80 rounded-card bg-ink-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Analytics Globali</h1>
          <p className="text-sm text-ink-400 mt-0.5">Panoramica economica e operativa della piattaforma</p>
        </div>
        <button
          onClick={() => {
            const csv = [
              ["Azienda", "Saldo €", "Speso €", "Conversazioni", "Agenti", "Stato"],
              ...companies.map(c => [c.company_name, c.balance_eur, c.total_spent, c.conversations, c.agents, c.status]),
            ].map(r => r.join(";")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url; a.download = "analytics-export.csv"; a.click();
            URL.revokeObjectURL(url);
          }}
          className="flex items-center gap-2 px-3 md:px-4 py-2 rounded-btn text-sm font-medium bg-ink-100 text-ink-600 hover:bg-ink-200 transition-colors"
        >
          <Download className="w-4 h-4" /> <span className="hidden sm:inline">Esporta CSV</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard icon={DollarSign} label="Ricavi Totali" value={`€${fmt(kpi.totalRevenue)}`} sub={`Costi: €${fmt(kpi.totalCost)}`} trend={kpi.marginPct} color="text-brand" />
        <KPICard icon={TrendingUp} label="Margine Lordo" value={`€${fmt(kpi.totalMargin)}`} sub={`${kpi.marginPct.toFixed(1)}% margine`} trend={kpi.marginPct} color="text-emerald-600" />
        <KPICard icon={Phone} label="Conversazioni" value={fmtInt(kpi.totalConversations)} sub={`${fmt(kpi.totalMinutes)} minuti`} color="text-brand" />
        <KPICard icon={Building2} label="Aziende Attive" value={fmtInt(kpi.activeCompanies)} sub={`Avg €${fmt(kpi.avgRevenuePerCompany)}/az.`} color="text-ink-700" />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <KPICard icon={Palette} label="Render AI" value={fmtInt(kpi.renderSessions)} sub={`€${fmt(kpi.renderRevenue)} ricavi`} color="text-amber-600" small />
        <KPICard icon={Clock} label="Minuti Totali" value={fmt(kpi.totalMinutes)} sub="Vocale + WA" color="text-ink-500" small />
        <KPICard icon={Users} label="Media per Azienda" value={`€${fmt(kpi.avgRevenuePerCompany)}`} sub="Ricavo medio" color="text-ink-500" small />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <div className="lg:col-span-2 rounded-card border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink-700 mb-4">Trend Ricavi & Margini (Mensile)</h3>
          {monthly.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ink-100))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--ink-300))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--ink-300))" tickFormatter={v => `€${v}`} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }}
                  formatter={(v: number, name: string) => [`€${fmt(v)}`, name === "revenue" ? "Ricavi" : name === "cost" ? "Costi" : "Margine"]}
                />
                <Area type="monotone" dataKey="revenue" stroke="hsl(var(--brand))" fill="hsl(var(--brand) / 0.15)" strokeWidth={2} name="revenue" />
                <Area type="monotone" dataKey="margin" stroke="hsl(142, 60%, 45%)" fill="hsl(142, 60%, 45%, 0.1)" strokeWidth={2} name="margin" />
                <Area type="monotone" dataKey="cost" stroke="hsl(0, 72%, 51%)" fill="hsl(0, 72%, 51%, 0.08)" strokeWidth={1.5} strokeDasharray="4 4" name="cost" />
                <Legend formatter={k => k === "revenue" ? "Ricavi" : k === "cost" ? "Costi" : "Margine"} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Nessun dato di billing disponibile" />
          )}
        </div>

        {/* Agent Types Pie */}
        <div className="rounded-card border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink-700 mb-4">Agenti per Tipo</h3>
          {agentTypes.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={agentTypes} dataKey="count" nameKey="type" cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={4} label={({ type, count }) => `${typeLabel(type)} (${count})`}>
                  {agentTypes.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, typeLabel(name)]} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="Nessun agente creato" />
          )}
        </div>
      </div>

      {/* Conversations Trend */}
      {monthly.length > 0 && (
        <div className="rounded-card border border-border bg-card p-5 shadow-card">
          <h3 className="text-sm font-semibold text-ink-700 mb-4">Volume Conversazioni (Mensile)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthly}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--ink-100))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--ink-300))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--ink-300))" />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Bar dataKey="conversations" fill="hsl(var(--brand))" radius={[4, 4, 0, 0]} name="Conversazioni" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Company Breakdown Table */}
      <div className="rounded-card border border-border bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-ink-700">Breakdown per Azienda</h3>
          <p className="text-xs text-ink-400 mt-0.5">Ordinato per spesa totale decrescente</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-ink-50/50 text-left">
                <th className="px-4 md:px-5 py-3 font-medium text-ink-500">Azienda</th>
                <th className="px-4 md:px-5 py-3 font-medium text-ink-500 text-right">Saldo €</th>
                <th className="px-4 md:px-5 py-3 font-medium text-ink-500 text-right">Speso €</th>
                <th className="px-4 md:px-5 py-3 font-medium text-ink-500 text-right hidden md:table-cell">Conversazioni</th>
                <th className="px-4 md:px-5 py-3 font-medium text-ink-500 text-right hidden md:table-cell">Agenti</th>
                <th className="px-4 md:px-5 py-3 font-medium text-ink-500 hidden sm:table-cell">Stato</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {companies.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-ink-400">Nessuna azienda registrata</td></tr>
              ) : (
                companies.map(co => (
                  <tr key={co.company_id} className="hover:bg-ink-50/40 transition-colors">
                    <td className="px-5 py-3 font-medium text-ink-800">{co.company_name}</td>
                    <td className={`px-5 py-3 text-right font-mono text-xs ${co.balance_eur <= 5 ? "text-destructive font-semibold" : "text-ink-600"}`}>
                      €{fmt(co.balance_eur)}
                    </td>
                    <td className="px-5 py-3 text-right font-mono text-xs text-ink-600">€{fmt(co.total_spent)}</td>
                    <td className="px-5 py-3 text-right text-ink-600">{fmtInt(co.conversations)}</td>
                    <td className="px-5 py-3 text-right text-ink-600">{co.agents}</td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        co.status === "active" ? "bg-emerald-50 text-emerald-700" :
                        co.status === "trial" ? "bg-amber-50 text-amber-700" :
                        "bg-ink-100 text-ink-500"
                      }`}>
                        {co.status === "active" ? "Attiva" : co.status === "trial" ? "Trial" : co.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────── */

function KPICard({ icon: Icon, label, value, sub, trend, color, small }: {
  icon: any; label: string; value: string; sub: string; trend?: number; color: string; small?: boolean;
}) {
  return (
    <div className={`rounded-card border border-border bg-card shadow-card ${small ? "p-4" : "p-5"}`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-ink-400 uppercase tracking-wide">{label}</span>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className={`font-bold ${color} ${small ? "text-lg" : "text-2xl"}`}>{value}</p>
      <p className="text-xs text-ink-400 mt-1">{sub}</p>
    </div>
  );
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center h-[280px]">
      <div className="text-center">
        <BarChart3 className="w-8 h-8 mx-auto mb-2 text-ink-200" />
        <p className="text-sm text-ink-400">{label}</p>
      </div>
    </div>
  );
}
