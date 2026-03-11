import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Bot, ArrowRight, PhoneOff, CreditCard, Sparkles,
  MessageSquare, Zap
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import AgentCard from "@/components/agents/AgentCard";

export default function AppDashboard() {
  const { profile } = useAuth();
  const companyId = useCompanyId();

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
      const { data } = await supabase
        .from("conversations")
        .select("*, agents(name)")
        .eq("company_id", companyId!)
        .order("started_at", { ascending: false })
        .limit(5);
      return data || [];
    },
  });

  const { data: monthConversations } = useQuery({
    queryKey: ["month-conversations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const { data } = await supabase
        .from("conversations")
        .select("outcome")
        .eq("company_id", companyId!)
        .gte("started_at", startOfMonth.toISOString());
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

  const { data: credits } = useQuery({
    queryKey: ["company-credits", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_credits")
        .select("balance_eur, calls_blocked")
        .eq("company_id", companyId!)
        .single();
      return data;
    },
  });

  const activeAgents = agents?.filter((a) => a.status === "active").length ?? 0;
  const monthTotal = monthConversations?.length ?? 0;
  const balanceEur = Number(credits?.balance_eur ?? 0);
  const callsBlocked = credits?.calls_blocked ?? false;
  const agentsWithoutPhone = agents?.filter((a) => !a.phone_number_id) || [];

  const balanceColor = balanceEur > 5
    ? "text-primary"
    : balanceEur >= 1
      ? "text-yellow-600"
      : "text-destructive";

  // --- Smart Actions ---
  const smartActions: { type: "cta" | "warning" | "danger"; label: string; description: string; href: string; icon: React.ElementType }[] = [];

  if (agents && agents.length > 0) {
    const drafts = agents.filter(a => a.status === "draft");
    if (drafts.length > 0) {
      smartActions.push({
        type: "warning",
        label: `Completa "${drafts[0].name}"`,
        description: "Questo agente è in bozza. Completa la configurazione per attivarlo.",
        href: `/app/agents/${drafts[0].id}`,
        icon: Bot,
      });
    }
    if (agentsWithoutPhone.length > 0) {
      smartActions.push({
        type: "warning",
        label: "Assegna un numero di telefono",
        description: `${agentsWithoutPhone.length} agente/i senza numero. Assegna un numero per ricevere chiamate.`,
        href: "/app/phone-numbers",
        icon: PhoneOff,
      });
    }
  }
  if (balanceEur < 2) {
    smartActions.push({
      type: "danger",
      label: "Crediti in esaurimento",
      description: "Ricarica per evitare il blocco degli agenti.",
      href: "/app/credits",
      icon: CreditCard,
    });
  }

  const actionStyles = {
    cta: "border-primary/30 bg-primary/5 hover:bg-primary/10",
    warning: "border-yellow-300 bg-yellow-50 hover:bg-yellow-100",
    danger: "border-destructive/30 bg-destructive/5 hover:bg-destructive/10",
  };

  const hasAgents = agents && agents.length > 0;

  return (
    <div className="space-y-8 max-w-6xl">

      {/* ═══ ZONE A — Hero Welcome + Status Pills ═══ */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Buongiorno{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
        </h1>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <StatusPill
            label={`${activeAgents} agenti attivi`}
            variant={activeAgents > 0 ? "success" : "muted"}
          />
          <StatusPill
            label={`${monthTotal} conversazioni questo mese`}
            variant={monthTotal > 0 ? "info" : "muted"}
          />
          <StatusPill
            label={`€${balanceEur.toFixed(2)} crediti`}
            variant={callsBlocked ? "danger" : balanceEur < 2 ? "warning" : "success"}
          />
        </div>

        {callsBlocked && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <CreditCard className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">
              Agenti bloccati — crediti esauriti.{" "}
              <Link to="/app/credits" className="underline">Ricarica ora</Link>
            </p>
          </div>
        )}
      </div>

      {/* ═══ ZONE B — Onboarding or Smart Actions ═══ */}
      {!hasAgents ? (
        /* Empty state — Onboarding */
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Benvenuto in Edile Genius</h2>
          <p className="text-muted-foreground mb-8 max-w-md mx-auto">
            Crea il tuo primo agente AI in 3 minuti. Scegli un template, configura la voce e attivalo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
            {[
              { step: "1", label: "Scegli un template" },
              { step: "2", label: "Configura la voce" },
              { step: "3", label: "Attiva e ricevi chiamate" },
            ].map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                  {s.step}
                </span>
                <span className="text-sm font-medium text-foreground">{s.label}</span>
                {i < 2 && <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block" />}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/app/agents/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Crea il Primo Agente
            </Link>
            <Link
              to="/app/agents/new"
              className="text-sm font-medium text-primary hover:underline"
            >
              Scopri i Template →
            </Link>
          </div>
        </div>
      ) : smartActions.length > 0 ? (
        /* Smart action cards */
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Da Fare Adesso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartActions.map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className={`rounded-xl p-4 border flex items-start gap-4 transition-colors ${actionStyles[action.type]}`}
              >
                <div className="w-9 h-9 rounded-lg bg-card flex items-center justify-center shrink-0 border border-border">
                  <action.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{action.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{action.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {/* ═══ ZONE C — I Tuoi Agenti ═══ */}
      {hasAgents && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">I Tuoi Agenti</h2>
            <Link to="/app/agents" className="text-xs flex items-center gap-1 text-primary hover:underline">
              Vedi tutti <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agents!.map((a) => (
              <AgentCard key={a.id} agent={a} />
            ))}
          </div>
        </div>
      )}

      {/* ═══ ZONE D — Attività Recente ═══ */}
      {conversations && conversations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Attività Recente</h2>
            <Link to="/app/conversations" className="text-xs flex items-center gap-1 text-primary hover:underline">
              Tutte le conversazioni <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Agente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Durata</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Esito</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground hidden sm:table-cell">Quando</th>
                </tr>
              </thead>
              <tbody>
                {conversations.map((c: any) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
                        {c.agents?.name || "—"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{c.duration_sec ? `${c.duration_sec}s` : "—"}</td>
                    <td className="px-4 py-3">
                      <OutcomeBadge outcome={c.outcome} />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">
                      {c.started_at ? format(new Date(c.started_at), "d MMM, HH:mm", { locale: it }) : "—"}
                    </td>
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

/* ── Helper components ── */

function StatusPill({ label, variant }: { label: string; variant: "success" | "info" | "warning" | "danger" | "muted" }) {
  const styles: Record<string, string> = {
    success: "bg-primary/10 text-primary",
    info: "bg-accent text-accent-foreground",
    warning: "bg-yellow-100 text-yellow-700",
    danger: "bg-destructive/10 text-destructive",
    muted: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${styles[variant]}`}>
      {label}
    </span>
  );
}

function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-muted-foreground">—</span>;
  const map: Record<string, { label: string; cls: string }> = {
    appointment: { label: "Appuntamento", cls: "bg-primary/10 text-primary" },
    qualified: { label: "Qualificato", cls: "bg-accent text-accent-foreground" },
    not_interested: { label: "Non interessato", cls: "bg-muted text-muted-foreground" },
    voicemail: { label: "Segreteria", cls: "bg-muted text-muted-foreground" },
    callback: { label: "Richiamata", cls: "bg-yellow-100 text-yellow-700" },
  };
  const m = map[outcome] || { label: outcome, cls: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${m.cls}`}>{m.label}</span>;
}
