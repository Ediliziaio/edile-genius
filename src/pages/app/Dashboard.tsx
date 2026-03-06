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
  const totalCalls = agents?.reduce((s, a) => s + (a.calls_this_month ?? 0), 0) ?? 0;
  const appointments = conversations?.filter((c) => c.outcome === "appointment").length ?? 0;

  const stats = [
    { label: "Agenti Attivi", value: activeAgents, icon: Bot, color: "var(--app-success)" },
    { label: "Chiamate / Mese", value: totalCalls, icon: Phone, color: "var(--app-brand)" },
    { label: "Appuntamenti", value: appointments, icon: CalendarCheck, color: "var(--app-info)" },
    { label: "Lead Qualificati", value: conversations?.filter((c) => c.outcome === "qualified").length ?? 0, icon: TrendingUp, color: "var(--app-warning)" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>
            Buongiorno{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
          </h1>
          <p className="mt-1 text-sm" style={{ color: "hsl(var(--app-text-secondary))" }}>
            Ecco un riepilogo della tua attività.
          </p>
        </div>
        <Link
          to="/app/agents/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: "hsl(var(--app-brand))", color: "#fff" }}
        >
          <Plus className="w-4 h-4" /> Nuovo Agente
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-5 border"
            style={{ backgroundColor: "hsl(var(--app-bg-secondary))", borderColor: "hsl(var(--app-border-subtle))" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `hsl(${s.color} / 0.12)` }}>
                <s.icon className="w-4 h-4" style={{ color: `hsl(${s.color})` }} />
              </div>
            </div>
            <p className="text-2xl font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>{s.value}</p>
            <p className="text-xs mt-1" style={{ color: "hsl(var(--app-text-tertiary))" }}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recent Agents */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold" style={{ color: "hsl(var(--app-text-primary))" }}>Agenti Recenti</h2>
          <Link to="/app/agents" className="text-xs flex items-center gap-1" style={{ color: "hsl(var(--app-brand))" }}>
            Vedi tutti <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {(!agents || agents.length === 0) ? (
          <div className="rounded-xl p-8 text-center border" style={{ backgroundColor: "hsl(var(--app-bg-secondary))", borderColor: "hsl(var(--app-border-subtle))" }}>
            <Bot className="w-10 h-10 mx-auto mb-3" style={{ color: "hsl(var(--app-text-tertiary))" }} />
            <p className="text-sm mb-1" style={{ color: "hsl(var(--app-text-secondary))" }}>Nessun agente creato</p>
            <Link to="/app/agents/new" className="text-sm font-medium" style={{ color: "hsl(var(--app-brand))" }}>
              Crea il tuo primo agente →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.slice(0, 3).map((a) => (
              <div
                key={a.id}
                className="rounded-xl p-4 border flex items-center gap-3"
                style={{ backgroundColor: "hsl(var(--app-bg-secondary))", borderColor: "hsl(var(--app-border-subtle))" }}
              >
                <span
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: a.status === "active" ? "hsl(var(--app-success))" : "hsl(var(--app-text-tertiary))" }}
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate" style={{ color: "hsl(var(--app-text-primary))" }}>{a.name}</p>
                  <p className="text-xs" style={{ color: "hsl(var(--app-text-tertiary))" }}>{a.calls_this_month ?? 0} chiamate/mese</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Conversations */}
      {conversations && conversations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: "hsl(var(--app-text-primary))" }}>Conversazioni Recenti</h2>
          <div className="rounded-xl border overflow-hidden" style={{ borderColor: "hsl(var(--app-border-subtle))" }}>
            <table className="w-full text-sm">
              <thead>
                <tr style={{ backgroundColor: "hsl(var(--app-bg-elevated))" }}>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "hsl(var(--app-text-tertiary))" }}>Agente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "hsl(var(--app-text-tertiary))" }}>Stato</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "hsl(var(--app-text-tertiary))" }}>Durata</th>
                  <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: "hsl(var(--app-text-tertiary))" }}>Esito</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c) => (
                  <tr key={c.id} className="border-t" style={{ borderColor: "hsl(var(--app-border-subtle))" }}>
                    <td className="px-4 py-3" style={{ color: "hsl(var(--app-text-primary))" }}>{c.agent_id.slice(0, 8)}…</td>
                    <td className="px-4 py-3" style={{ color: "hsl(var(--app-text-secondary))" }}>{c.status || "—"}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(var(--app-text-secondary))" }}>{c.duration_sec ? `${c.duration_sec}s` : "—"}</td>
                    <td className="px-4 py-3" style={{ color: "hsl(var(--app-text-secondary))" }}>{c.outcome || "—"}</td>
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
