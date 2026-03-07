import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Building2, Bot, Phone, DollarSign, ArrowRight, Plus, Users, AlertTriangle, TrendingUp, Coins } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import StatsCard from "@/components/superadmin/StatsCard";
import { format, isAfter, isBefore, addDays } from "date-fns";
import { it } from "date-fns/locale";

interface Stats { companies: number; activeAgents: number; callsThisMonth: number; estimatedMRR: number; }
const planPricing: Record<string, number> = { starter: 49, professional: 149, enterprise: 499 };

interface CompanyRow {
  id: string; name: string; plan: string | null; status: string | null;
  trial_ends_at: string | null; calls_used_month: number; monthly_calls_limit: number;
  created_at: string | null; sector: string | null;
}

interface CreditRow {
  company_id: string;
  balance_eur: number;
  calls_blocked: boolean;
  auto_recharge_enabled: boolean;
  total_recharged_eur: number;
}

interface BillingSummary {
  company_name: string | null;
  total_cost_billed_eur: number | null;
  total_cost_real_eur: number | null;
  total_margin_eur: number | null;
}

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats>({ companies: 0, activeAgents: 0, callsThisMonth: 0, estimatedMRR: 0 });
  const [companies, setCompanies] = useState<CompanyRow[]>([]);
  const [companyCredits, setCompanyCredits] = useState<(CreditRow & { companyName: string })[]>([]);
  const [ecoStats, setEcoStats] = useState({ billed: 0, real: 0, margin: 0, marginPct: 0 });
  const [loading, setLoading] = useState(true);
  const [unlockModal, setUnlockModal] = useState<{ companyId: string; companyName: string } | null>(null);
  const [unlockAmount, setUnlockAmount] = useState("10");
  const [unlockNotes, setUnlockNotes] = useState("");

  useEffect(() => {
    async function fetchStats() {
      try {
        const [companiesRes, agentsRes] = await Promise.all([
          supabase.from("companies").select("id, name, plan, status, trial_ends_at, calls_used_month, monthly_calls_limit, created_at, sector"),
          supabase.from("agents").select("id, status, calls_month"),
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
      } catch (err) { console.error("Error fetching stats:", err); }
      finally { setLoading(false); }
    }
    fetchStats();
  }, []);

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Dashboard</h1>
          <p className="text-sm text-ink-500 mt-1">Panoramica globale della piattaforma</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate("/superadmin/companies")} className="border-ink-200 text-ink-700">
            Gestisci Aziende <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={() => navigate("/superadmin/companies/new")} className="bg-brand hover:bg-brand-hover text-white">
            <Plus className="mr-2 h-4 w-4" /> Nuova Azienda
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard icon={Building2} value={loading ? "..." : stats.companies} label="Aziende Totali" delta="+2 questo mese" deltaType="positive" />
        <StatsCard icon={Bot} value={loading ? "..." : stats.activeAgents} label="Agenti Attivi" deltaType="neutral" />
        <StatsCard icon={Phone} value={loading ? "..." : stats.callsThisMonth.toLocaleString("it-IT")} label="Chiamate questo mese" delta="+12%" deltaType="positive" />
        <StatsCard icon={DollarSign} value={loading ? "..." : `€${stats.estimatedMRR.toLocaleString("it-IT")}`} label="MRR Stimato" delta="+€98" deltaType="positive" />
      </div>

      {/* Trial Expiring Alert */}
      {trialExpiring.length > 0 && (
        <div className="rounded-card p-4 border border-status-warning bg-status-warning-light flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-status-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-ink-900">Trial in scadenza ({trialExpiring.length})</p>
            <div className="mt-1 space-y-1">
              {trialExpiring.map((c) => (
                <p key={c.id} className="text-xs text-ink-600">
                  <Link to={`/superadmin/companies/${c.id}`} className="font-medium text-brand hover:underline">{c.name}</Link>
                  {" — scade il "}
                  {format(new Date(c.trial_ends_at!), "d MMM yyyy", { locale: it })}
                </p>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent Companies */}
        <div className="rounded-card p-5 border border-ink-200 bg-white shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-ink-900">Aziende Recenti</h3>
            <Link to="/superadmin/companies" className="text-xs text-brand hover:underline flex items-center gap-1">
              Tutte <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {recentCompanies.length === 0 ? (
            <p className="text-sm text-ink-400">Nessuna azienda</p>
          ) : (
            <div className="space-y-3">
              {recentCompanies.map((c) => (
                <Link key={c.id} to={`/superadmin/companies/${c.id}`} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-btn bg-brand-light flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-brand-text" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 group-hover:text-brand truncate">{c.name}</p>
                    <p className="text-xs text-ink-400">{c.sector || "—"} · {c.plan}</p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-pill ${c.status === "active" ? "bg-status-success-light text-status-success" : "bg-ink-100 text-ink-500"}`}>
                    {c.status}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Plan Distribution */}
        <div className="rounded-card p-5 border border-ink-200 bg-white shadow-card">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Distribuzione Piani</h3>
          <div className="space-y-3">
            {Object.entries(planDistribution).map(([plan, count]) => {
              const pct = companies.length > 0 ? (count / companies.length) * 100 : 0;
              return (
                <div key={plan}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-ink-700 capitalize">{plan}</span>
                    <span className="text-sm font-semibold text-ink-900">{count}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-ink-100">
                    <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="mt-4 pt-3 border-t border-ink-100">
            <p className="text-xs text-ink-400">MRR stimato: <span className="font-bold text-ink-900">€{stats.estimatedMRR.toLocaleString("it-IT")}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
