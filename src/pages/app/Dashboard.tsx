import { useAuth } from "@/context/AuthContext";
import { useImpersonation } from "@/context/ImpersonationContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Bot, Phone, CalendarCheck, TrendingUp, Plus, ArrowRight,
  Upload, Users, Megaphone, PhoneCall, Clock
} from "lucide-react";
import { format, isAfter, subDays } from "date-fns";
import { it } from "date-fns/locale";

export default function AppDashboard() {
  const { profile } = useAuth();
  const { impersonatingCompanyId } = useImpersonation();
  const companyId = impersonatingCompanyId || profile?.company_id;

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

  const { data: company } = useQuery({
    queryKey: ["my-company", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("*").eq("id", companyId!).single();
      return data;
    },
  });

  const { data: contactsByStatus } = useQuery({
    queryKey: ["contacts-by-status", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("status").eq("company_id", companyId!);
      const counts: Record<string, number> = {};
      (data || []).forEach((c) => { counts[c.status] = (counts[c.status] || 0) + 1; });
      return counts;
    },
  });

  const { data: upcomingCalls } = useQuery({
    queryKey: ["upcoming-calls", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("contacts").select("id, full_name, phone, next_call_at").eq("company_id", companyId!).not("next_call_at", "is", null).order("next_call_at", { ascending: true }).limit(5);
      return data || [];
    },
  });

  const activeAgents = agents?.filter((a) => a.status === "active").length ?? 0;
  const totalCalls = agents?.reduce((s, a) => s + (a.calls_month ?? 0), 0) ?? 0;
  const appointments = conversations?.filter((c) => c.outcome === "appointment").length ?? 0;

  const stats = [
    { label: "Agenti Attivi", value: activeAgents, icon: Bot, colorClass: "text-status-success bg-status-success-light" },
    { label: "Chiamate / Mese", value: totalCalls, icon: Phone, colorClass: "text-brand bg-brand-light" },
    { label: "Appuntamenti", value: appointments, icon: CalendarCheck, colorClass: "text-status-info bg-status-info-light" },
    { label: "Lead Qualificati", value: conversations?.filter((c) => c.outcome === "qualified").length ?? 0, icon: TrendingUp, colorClass: "text-status-warning bg-status-warning-light" },
  ];

  const quickActions = [
    { label: "Nuovo Agente", icon: Plus, href: "/app/agents/new", color: "bg-brand text-white" },
    { label: "Importa Contatti", icon: Upload, href: "/app/contacts/import", color: "bg-status-info text-white" },
    { label: "Nuova Campagna", icon: Megaphone, href: "/app/campaigns/new", color: "bg-status-warning text-white" },
    { label: "Rubrica", icon: Users, href: "/app/contacts", color: "bg-ink-700 text-white" },
  ];

  const statusLabels: Record<string, string> = { new: "Nuovo", contacted: "Contattato", qualified: "Qualificato", appointment: "Appuntamento", converted: "Convertito", lost: "Perso" };
  const statusColors: Record<string, string> = { new: "bg-status-info", contacted: "bg-status-warning", qualified: "bg-brand", appointment: "bg-accent-blue", converted: "bg-status-success", lost: "bg-status-error" };

  const trialEndsAt = company?.trial_ends_at ? new Date(company.trial_ends_at) : null;
  const trialActive = trialEndsAt && isAfter(trialEndsAt, new Date());
  const callsUsed = company?.calls_used_month ?? 0;
  const callsLimit = company?.monthly_calls_limit ?? 500;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">
            Buongiorno{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
          </h1>
          <p className="mt-1 text-sm text-ink-500">Ecco un riepilogo della tua attività.</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <Link key={a.label} to={a.href} className={`${a.color} rounded-card p-4 flex items-center gap-3 shadow-card hover:shadow-card-hover transition-shadow`}>
            <a.icon className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm font-medium">{a.label}</span>
          </Link>
        ))}
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

      {/* Trial / Usage Info */}
      {company && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-card p-5 border border-ink-200 bg-white shadow-card">
            <p className="text-xs font-medium text-ink-400 mb-2">Utilizzo Chiamate</p>
            <div className="flex items-end gap-2 mb-2">
              <span className="text-2xl font-bold text-ink-900">{callsUsed}</span>
              <span className="text-sm text-ink-400">/ {callsLimit}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-ink-100">
              <div className="h-2 rounded-full bg-brand transition-all" style={{ width: `${Math.min((callsUsed / callsLimit) * 100, 100)}%` }} />
            </div>
            <p className="text-xs text-ink-400 mt-2">Piano: <span className="font-medium text-ink-700 capitalize">{company.plan}</span></p>
          </div>
          <div className="rounded-card p-5 border border-ink-200 bg-white shadow-card">
            <p className="text-xs font-medium text-ink-400 mb-2">Trial</p>
            {trialActive ? (
              <>
                <p className="text-lg font-bold text-status-warning">Trial Attivo</p>
                <p className="text-sm text-ink-500 mt-1">Scade il {format(trialEndsAt!, "d MMMM yyyy", { locale: it })}</p>
              </>
            ) : trialEndsAt ? (
              <>
                <p className="text-lg font-bold text-status-success">Piano Attivo</p>
                <p className="text-sm text-ink-500 mt-1">Trial scaduto il {format(trialEndsAt, "d MMMM yyyy", { locale: it })}</p>
              </>
            ) : (
              <p className="text-lg font-bold text-ink-700">Nessun trial</p>
            )}
          </div>
        </div>
      )}

      {/* Contacts by Status + Upcoming Calls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contacts by Status */}
        <div className="rounded-card p-5 border border-ink-200 bg-white shadow-card">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Contatti per Status</h3>
          {contactsByStatus && Object.keys(contactsByStatus).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(contactsByStatus).sort(([, a], [, b]) => b - a).map(([status, count]) => (
                <div key={status} className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusColors[status] || "bg-ink-300"}`} />
                  <span className="text-sm text-ink-600 flex-1">{statusLabels[status] || status}</span>
                  <span className="text-sm font-semibold text-ink-900">{count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">Nessun contatto</p>
          )}
        </div>

        {/* Upcoming Calls */}
        <div className="rounded-card p-5 border border-ink-200 bg-white shadow-card">
          <h3 className="text-sm font-semibold text-ink-900 mb-4">Prossime Chiamate</h3>
          {upcomingCalls && upcomingCalls.length > 0 ? (
            <div className="space-y-3">
              {upcomingCalls.map((c) => (
                <div key={c.id} className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-ink-400 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-ink-900 truncate">{c.full_name}</p>
                    <p className="text-xs text-ink-400">{c.phone}</p>
                  </div>
                  <span className="text-xs text-ink-500 whitespace-nowrap">
                    {c.next_call_at ? format(new Date(c.next_call_at), "d MMM HH:mm", { locale: it }) : "—"}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink-400">Nessuna chiamata programmata</p>
          )}
        </div>
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
            <Link to="/app/agents/new" className="text-sm font-medium text-brand">Crea il tuo primo agente →</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {agents.slice(0, 3).map((a) => (
              <div key={a.id} className="rounded-card p-4 border border-ink-200 bg-white flex items-center gap-3 shadow-card">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${a.status === "active" ? "bg-status-success" : "bg-ink-300"}`} />
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate text-ink-900">{a.name}</p>
                  <p className="text-xs text-ink-400">{a.calls_month ?? 0} chiamate/mese</p>
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
