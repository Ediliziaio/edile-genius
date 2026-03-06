import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Bot, Phone, DollarSign, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/superadmin/StatsCard";

interface Stats {
  companies: number;
  activeAgents: number;
  callsThisMonth: number;
  estimatedMRR: number;
}

const planPricing: Record<string, number> = {
  starter: 49,
  professional: 149,
  enterprise: 499,
};

export default function SuperAdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<Stats>({ companies: 0, activeAgents: 0, callsThisMonth: 0, estimatedMRR: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [companiesRes, agentsRes, conversationsRes] = await Promise.all([
          supabase.from("companies").select("id, plan, status"),
          supabase.from("agents").select("id, status, calls_this_month"),
          supabase.from("conversations").select("id"),
        ]);

        const companies = companiesRes.data || [];
        const agents = agentsRes.data || [];

        const activeAgents = agents.filter((a) => a.status === "active").length;
        const callsThisMonth = agents.reduce((sum, a) => sum + (a.calls_this_month || 0), 0);
        const estimatedMRR = companies
          .filter((c) => c.status === "active")
          .reduce((sum, c) => sum + (planPricing[c.plan || "starter"] || 0), 0);

        setStats({
          companies: companies.length,
          activeAgents,
          callsThisMonth,
          estimatedMRR,
        });
      } catch (err) {
        console.error("Error fetching stats:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--app-text-primary))]">Dashboard</h1>
          <p className="text-sm text-[hsl(var(--app-text-secondary))] mt-1">
            Panoramica globale della piattaforma
          </p>
        </div>
        <Button
          onClick={() => navigate("/superadmin/companies")}
          className="bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent))]/90 text-white"
        >
          Gestisci Aziende <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          icon={Building2}
          value={loading ? "..." : stats.companies}
          label="Aziende Totali"
          delta="+2 questo mese"
          deltaType="positive"
        />
        <StatsCard
          icon={Bot}
          value={loading ? "..." : stats.activeAgents}
          label="Agenti Attivi"
          delta={`${loading ? "..." : stats.activeAgents} su ${loading ? "..." : stats.activeAgents}`}
          deltaType="neutral"
        />
        <StatsCard
          icon={Phone}
          value={loading ? "..." : stats.callsThisMonth.toLocaleString("it-IT")}
          label="Chiamate questo mese"
          delta="+12%"
          deltaType="positive"
        />
        <StatsCard
          icon={DollarSign}
          value={loading ? "..." : `€${stats.estimatedMRR.toLocaleString("it-IT")}`}
          label="MRR Stimato"
          delta="+€98"
          deltaType="positive"
        />
      </div>
    </div>
  );
}
