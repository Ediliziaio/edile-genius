import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Bot, Phone, CalendarCheck, TrendingUp, Plus, ArrowRight } from "lucide-react";

export default function AppDashboard() {
  const { profile } = useAuth();
  const companyId = profile?.company_id;

  const { data: agents } = useQuery({
    queryKey: ["company-agents", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("company_id", companyId!);
      return data || [];
    },
  });

  const { data: conversations } = useQuery({
    queryKey: ["company-conversations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("conversations").select("*").eq("company_id", companyId!).order("started_at", { ascending: false }).limit(5);
      return data || [];
    },
  });

  const activeAgents = agents?.filter((a) => a.status === "active").length ?? 0;
  const totalCalls = agents?.reduce((s, a) => s + ((a as any).calls_month ?? 0), 0) ?? 0;
  const appointments = conversations?.filter((c) => c.outcome === "appointment").length ?? 0;

  const stats = [
    { label: "Agenti Attivi", value: activeAgents, icon: Bot, colorClass: "text-status-success bg-status-success-light" },
    { label: "Chiamate / Mese", value: totalCalls, icon: Phone, colorClass: "text-brand bg-brand-light" },
    { label: "Appuntamenti", value: appointments, icon: CalendarCheck, colorClass: "text-status-info bg-status-info-light" },
    { label: "Lead Qualificati", value: conversations?.filter((c) => c.outcome === "qualified").length ?? 0, icon: TrendingUp, colorClass: "text-status-warning bg-status-warning-light" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            Buongiorno{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Ecco un riepilogo della tua attività.
          </p>
        </div>
        <Link
          to="/app/agents/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-btn text-sm font-medium bg-brand text-white hover:bg-brand-hover transition-colors shadow-card-brand"
        >
          <Plus className="w-4 h-4" /> Nuovo Agente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-card p-5 border border-ink-200 bg-white shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-btn flex items-center justify-center ${s.colorClass}`}>
                <s.icon className="w-4 h-4" />
              </div>
            </div>
            <p className="text-2xl font-bold text-ink-900">{s.value}</p>
            <p className="text-xs mt-1 text-ink-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Agents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-ink-900">Agenti Recenti</h2>
          <Link to="/app/agents" className="text-xs flex items-center gap-1 text-brand hover:text-brand-hover">
            Vedi tutti <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {(!agents || agents.length === 0) ? (
          <div className="rounded-card p-8 text-center border border-ink-200 bg-white shadow-card">
            <Bot className="w-10 h-10 mx-auto mb-3 text-ink-300" />
            <p className="text-sm mb-1 text-ink-500">Nessun agente creato</p>
            <Link to="/app/agents/new" className="text-sm font-medium text-brand">
              Crea il tuo primo agente →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-card p-4 border border-ink-200 bg-white flex items-center gap-3 shadow-card">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === "active" ? "bg-status-success" : "bg-ink-300"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-ink-900">{a.name}</p>
                  <p className="text-xs text-ink-400">{(a as any).calls_month ?? 0} chiamate/mese</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Conversations */}
      {conversations && conversations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4 text-ink-900">Conversazioni Recenti</h2>
          <div className="rounded-card border border-ink-200 overflow-hidden bg-white shadow-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-ink-50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-400">Agente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-400">Stato</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-400">Durata</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-ink-400">Esito</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr key={c.id} className="border-t border-ink-100">
                    <td className="px-4 py-3 text-ink-900">{c.agent_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3 text-ink-500">{c.status || "—"}</td>
                    <td className="px-4 py-3 text-ink-500">{c.duration_sec ? `${c.duration_sec}s` : "—"}</td>
                    <td className="px-4 py-3 text-ink-500">{c.outcome || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
