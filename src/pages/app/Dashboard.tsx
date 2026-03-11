import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Bot, ArrowRight, PhoneOff, CreditCard, Sparkles,
  MessageSquare, Zap, CheckCircle2, Circle, CalendarCheck,
  TrendingUp, TrendingDown, AlertTriangle
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";

export default function AppDashboard() {
  const { profile } = useAuth();
  const companyId = useCompanyId();

  // ── Agents ──
  const { data: agents } = useQuery({
    queryKey: ["company-agents", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("*").eq("company_id", companyId!);
      return data || [];
    },
  });

  // ── Recent conversations (5) ──
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

  // ── Month conversations (current) ──
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { data: monthConversations } = useQuery({
    queryKey: ["month-conversations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("outcome")
        .eq("company_id", companyId!)
        .gte("started_at", startOfMonth.toISOString());
      return data || [];
    },
  });

  // ── Previous month conversations (for delta) ──
  const startOfPrevMonth = new Date(startOfMonth);
  startOfPrevMonth.setMonth(startOfPrevMonth.getMonth() - 1);

  const { data: prevMonthConversations } = useQuery({
    queryKey: ["prev-month-conversations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("conversations")
        .select("outcome")
        .eq("company_id", companyId!)
        .gte("started_at", startOfPrevMonth.toISOString())
        .lt("started_at", startOfMonth.toISOString());
      return data || [];
    },
  });

  // ── Credits ──
  const { data: credits } = useQuery({
    queryKey: ["company-credits", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_credits")
        .select("balance_eur, calls_blocked, total_spent_eur, total_recharged_eur")
        .eq("company_id", companyId!)
        .single();
      return data;
    },
  });

  // ── Integration check (for onboarding) ──
  const { data: hasIntegration } = useQuery({
    queryKey: ["has-integration", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const [phones, integrations] = await Promise.all([
        supabase.from("ai_phone_numbers").select("id", { count: "exact", head: true }).eq("company_id", companyId!).eq("status", "active"),
        supabase.from("company_integrations").select("id").eq("company_id", companyId!).eq("is_active", true).limit(1),
      ]);
      return (phones.count ?? 0) > 0 || (integrations.data?.length ?? 0) > 0;
    },
  });

  // ── Derived data ──
  const totalAgents = agents?.length ?? 0;
  const activeAgents = agents?.filter((a) => a.status === "active").length ?? 0;
  const hasAgents = totalAgents > 0;

  const monthTotal = monthConversations?.length ?? 0;
  const prevMonthTotal = prevMonthConversations?.length ?? 0;

  // Outcome breakdown
  const outcomeCount = (outcome: string) =>
    monthConversations?.filter((c) => c.outcome === outcome).length ?? 0;
  const appointments = outcomeCount("appointment");
  const qualified = outcomeCount("qualified");
  const callback = outcomeCount("callback");
  const notInterested = outcomeCount("not_interested");
  const voicemail = outcomeCount("voicemail");

  const prevAppointments = prevMonthConversations?.filter((c) => c.outcome === "appointment").length ?? 0;

  const balanceEur = Number(credits?.balance_eur ?? 0);
  const totalRecharged = Number(credits?.total_recharged_eur ?? 0);
  const totalSpent = Number(credits?.total_spent_eur ?? 0);
  const callsBlocked = credits?.calls_blocked ?? false;

  const agentsWithoutPhone = agents?.filter((a) => !a.phone_number_id) || [];

  // ── Smart Actions ──
  const smartActions: { type: "warning" | "danger"; label: string; description: string; href: string; icon: React.ElementType }[] = [];

  if (hasAgents) {
    const drafts = agents!.filter(a => a.status === "draft");
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

  // ── Onboarding checklist (only when 0 agents) ──
  const checklistSteps = [
    { label: "Scegli cosa automatizzare", description: "Esplora i template e scegli il tuo primo agente AI", href: "/app/agents/new", done: hasAgents },
    { label: "Attiva il primo agente", description: "Configura la voce, il prompt e attiva l'agente", href: "/app/agents/new", done: activeAgents > 0 },
    { label: "Collega i tuoi sistemi", description: "Telefonia, CRM, WhatsApp — tutto in un unico hub", href: "/app/integrations", done: hasIntegration ?? false },
  ];

  // ── Credits usage bar ──
  const creditUsagePercent = totalRecharged > 0
    ? Math.min(100, Math.round((totalSpent / totalRecharged) * 100))
    : 0;

  return (
    <div className="space-y-8 max-w-6xl">

      {/* ═══ ZONA A — Hero Greeting ═══ */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Buongiorno{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ecco come stanno andando i tuoi agenti AI questo mese.
        </p>

        {callsBlocked && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive font-medium">
              Agenti bloccati — crediti esauriti.{" "}
              <Link to="/app/credits" className="underline">Ricarica ora</Link>
            </p>
          </div>
        )}
      </div>

      {/* ═══ ZONA B — 4 KPI Cards (only when has agents) ═══ */}
      {hasAgents && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Agenti Attivi */}
          <KpiCard
            icon={Bot}
            label="Agenti Attivi"
            value={`${activeAgents} / ${totalAgents}`}
            sub={activeAgents === totalAgents ? "Tutti operativi" : `${totalAgents - activeAgents} da attivare`}
            accent={activeAgents === totalAgents ? "success" : "warning"}
            href="/app/agents"
          />

          {/* Card 2: Interazioni Questo Mese */}
          <KpiCard
            icon={MessageSquare}
            label="Interazioni gestite"
            value={String(monthTotal)}
            delta={prevMonthTotal > 0 ? monthTotal - prevMonthTotal : undefined}
            deltaBase={prevMonthTotal}
            sub="questo mese"
            accent="info"
          />

          {/* Card 3: Appuntamenti Fissati */}
          <KpiCard
            icon={CalendarCheck}
            label="Appuntamenti fissati"
            value={String(appointments)}
            delta={prevAppointments > 0 ? appointments - prevAppointments : undefined}
            deltaBase={prevAppointments}
            sub="questo mese"
            accent="primary"
          />

          {/* Card 4: Crediti */}
          <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                balanceEur > 5 ? "bg-primary/10" : balanceEur >= 1 ? "bg-yellow-100" : "bg-destructive/10"
              }`}>
                <CreditCard className={`w-4 h-4 ${
                  balanceEur > 5 ? "text-primary" : balanceEur >= 1 ? "text-yellow-600" : "text-destructive"
                }`} />
              </div>
              <span className="text-xs font-medium text-muted-foreground">Crediti disponibili</span>
            </div>
            <p className={`text-2xl font-bold ${
              balanceEur > 5 ? "text-primary" : balanceEur >= 1 ? "text-yellow-600" : "text-destructive"
            }`}>
              €{balanceEur.toFixed(2)}
            </p>
            {totalRecharged > 0 && (
              <div className="space-y-1">
                <Progress value={100 - creditUsagePercent} className="h-1.5" />
                <p className="text-[11px] text-muted-foreground">
                  €{totalSpent.toFixed(2)} spesi su €{totalRecharged.toFixed(2)} ricaricati
                </p>
              </div>
            )}
            <Link to="/app/credits" className="text-xs text-primary hover:underline mt-auto">
              Gestisci crediti →
            </Link>
          </div>
        </div>
      )}

      {/* ═══ ZONA C — Smart Actions OR Onboarding ═══ */}
      {!hasAgents ? (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-8 md:p-12">
          <div className="flex flex-col items-center text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
              <Sparkles className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Benvenuto in Edile Genius</h2>
            <p className="text-muted-foreground max-w-md">
              Completa questi 3 passi per attivare il tuo primo agente AI e iniziare a ricevere risultati.
            </p>
          </div>

          <div className="max-w-lg mx-auto space-y-3 mb-8">
            {checklistSteps.map((step, i) => (
              <Link
                key={i}
                to={step.href}
                className="flex items-start gap-3 rounded-lg border border-border bg-card p-4 hover:bg-accent/50 transition-colors"
              >
                {step.done ? (
                  <CheckCircle2 className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div className="min-w-0">
                  <p className={`text-sm font-semibold ${step.done ? "text-primary line-through" : "text-foreground"}`}>
                    {i + 1}. {step.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{step.description}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground mt-0.5 ml-auto shrink-0" />
              </Link>
            ))}
          </div>

          <div className="flex justify-center">
            <Link
              to="/app/agents/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
            >
              <Zap className="w-4 h-4" />
              Crea il Primo Agente
            </Link>
          </div>
        </div>
      ) : smartActions.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">Da fare adesso</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartActions.slice(0, 3).map((action) => (
              <Link
                key={action.label}
                to={action.href}
                className={`rounded-xl p-4 border flex items-start gap-4 transition-colors ${
                  action.type === "danger"
                    ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                    : "border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
                }`}
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

      {/* ═══ ZONA D — Risultati del Mese ═══ */}
      {hasAgents && monthTotal > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-foreground mb-4">Risultati del mese</h2>
          <div className="flex flex-wrap gap-3">
            <OutcomePill label="Appuntamenti" count={appointments} accent="primary" />
            <OutcomePill label="Lead qualificati" count={qualified} accent="info" />
            <OutcomePill label="Da richiamare" count={callback} accent="warning" />
            <OutcomePill label="Non interessati" count={notInterested} accent="muted" />
            <OutcomePill label="Segreteria" count={voicemail} accent="muted" />
          </div>
        </div>
      )}

      {hasAgents && monthTotal === 0 && (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <p className="text-sm text-muted-foreground">
            I tuoi agenti non hanno ancora gestito interazioni questo mese. Verifica che siano attivi.
          </p>
          <Link to="/app/agents" className="text-xs text-primary hover:underline mt-2 inline-block">
            Vedi agenti →
          </Link>
        </div>
      )}

      {/* ═══ ZONA E — Attività Recente ═══ */}
      {conversations && conversations.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-foreground">Attività recente</h2>
            <Link to="/app/conversations" className="text-xs flex items-center gap-1 text-primary hover:underline">
              Tutte le interazioni <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="rounded-xl border border-border overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Agente</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Risultato</th>
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

/* ── KPI Card ── */
function KpiCard({
  icon: Icon, label, value, sub, accent, delta, deltaBase, href,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  sub: string;
  accent: "primary" | "success" | "warning" | "info";
  delta?: number;
  deltaBase?: number;
  href?: string;
}) {
  const bgMap = { primary: "bg-primary/10", success: "bg-primary/10", warning: "bg-yellow-100", info: "bg-accent" };
  const iconColorMap = { primary: "text-primary", success: "text-primary", warning: "text-yellow-600", info: "text-accent-foreground" };

  const deltaPercent = delta !== undefined && deltaBase && deltaBase > 0
    ? Math.round((delta / deltaBase) * 100)
    : null;

  const content = (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3 h-full">
      <div className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bgMap[accent]}`}>
          <Icon className={`w-4 h-4 ${iconColorMap[accent]}`} />
        </div>
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
      </div>
      <div className="flex items-end gap-2">
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {deltaPercent !== null && (
          <span className={`inline-flex items-center gap-0.5 text-xs font-medium mb-1 ${
            deltaPercent >= 0 ? "text-primary" : "text-destructive"
          }`}>
            {deltaPercent >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {deltaPercent >= 0 ? "+" : ""}{deltaPercent}%
          </span>
        )}
      </div>
      <p className="text-[11px] text-muted-foreground">{sub}</p>
    </div>
  );

  if (href) {
    return <Link to={href} className="hover:ring-1 hover:ring-primary/20 rounded-xl transition-shadow">{content}</Link>;
  }
  return content;
}

/* ── Outcome Pill ── */
function OutcomePill({ label, count, accent }: { label: string; count: number; accent: "primary" | "info" | "warning" | "muted" }) {
  const styles = {
    primary: "bg-primary/10 text-primary border-primary/20",
    info: "bg-accent text-accent-foreground border-border",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    muted: "bg-muted text-muted-foreground border-border",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border ${styles[accent]}`}>
      {label}
      <span className="font-bold">{count}</span>
    </span>
  );
}

/* ── Outcome Badge (table) ── */
function OutcomeBadge({ outcome }: { outcome: string | null }) {
  if (!outcome) return <span className="text-muted-foreground">—</span>;
  const map: Record<string, { label: string; cls: string }> = {
    appointment: { label: "Appuntamento fissato", cls: "bg-primary/10 text-primary" },
    qualified: { label: "Lead qualificato", cls: "bg-accent text-accent-foreground" },
    not_interested: { label: "Non interessato", cls: "bg-muted text-muted-foreground" },
    voicemail: { label: "Segreteria", cls: "bg-muted text-muted-foreground" },
    callback: { label: "Da richiamare", cls: "bg-yellow-100 text-yellow-700" },
  };
  const m = map[outcome] || { label: outcome, cls: "bg-muted text-muted-foreground" };
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium ${m.cls}`}>{m.label}</span>;
}
