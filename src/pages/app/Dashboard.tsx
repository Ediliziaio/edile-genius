import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { SMART_ACTIONS_DEFAULTS } from "./Automations";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import {
  Bot, ArrowRight, PhoneOff, CreditCard, Sparkles,
  MessageSquare, Zap, CheckCircle2, Circle, CalendarCheck,
  TrendingUp, TrendingDown, AlertTriangle, FileText, PhoneCall,
  ShieldAlert, Clock, Megaphone, Brain, RefreshCw
} from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { it } from "date-fns/locale";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface BriefingAction {
  label: string;
  href: string;
  priority: "high" | "medium" | "low";
}

interface BriefingData {
  briefing: string;
  actions?: BriefingAction[];
}

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

  // ── Credit usage history for burn rate ──
  const { data: creditUsageHistory } = useQuery({
    queryKey: ["credit-usage-history", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("ai_credit_usage")
        .select("cost_billed_total, created_at")
        .eq("company_id", companyId!)
        .gte("created_at", sevenDaysAgo);
      return data || [];
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

  // ── Company settings (smart_actions config) ──
  const { data: companySettings } = useQuery({
    queryKey: ["company-settings", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("companies").select("settings").eq("id", companyId!).single();
      return (data?.settings as Record<string, any>) || {};
    },
  });

  const sa = (companySettings?.smart_actions || {}) as Record<string, any>;
  const saVal = (key: string) => sa[key] ?? SMART_ACTIONS_DEFAULTS[key];
  const saEnabled = (key: string) => saVal(`${key}_enabled`) !== false;

  // ── Smart Actions data: preventivi, contacts callback, documenti ──
  const { data: stalePreventivi } = useQuery({
    queryKey: ["smart-preventivi", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("preventivi" as any)
        .select("id, numero_preventivo, oggetto, stato, cliente_nome, created_at, inviato_at")
        .eq("company_id", companyId!)
        .in("stato", ["bozza", "inviato"])
        .lt("created_at", sevenDaysAgo)
        .limit(5);
      return (data as any[]) || [];
    },
  });

  const { data: callbackContacts } = useQuery({
    queryKey: ["smart-callbacks", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("contacts")
        .select("id, full_name, next_call_at, status")
        .eq("company_id", companyId!)
        .eq("status", "callback")
        .lt("next_call_at", now)
        .order("next_call_at", { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  const { data: expiringDocs } = useQuery({
    queryKey: ["smart-docs", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const in15Days = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("documenti_azienda")
        .select("id, nome, tipo, data_scadenza")
        .eq("company_id", companyId!)
        .gte("data_scadenza", today)
        .lte("data_scadenza", in15Days)
        .order("data_scadenza", { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  const { data: staleCampaigns } = useQuery({
    queryKey: ["smart-campaigns", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("campaigns")
        .select("id, name, contacts_reached, appointments_set, status")
        .eq("company_id", companyId!)
        .eq("status", "active")
        .limit(10);
      return data || [];
    },
  });

  // Dormant qualified leads (qualified but no contact in 5+ days)
  const { data: dormantLeads } = useQuery({
    queryKey: ["smart-dormant-leads", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      const { data } = await supabase
        .from("contacts")
        .select("id, full_name, status, last_contact_at")
        .eq("company_id", companyId!)
        .eq("status", "qualified")
        .lt("last_contact_at", fiveDaysAgo)
        .order("last_contact_at", { ascending: true })
        .limit(5);
      return data || [];
    },
  });

  // ── AI Morning Briefing ──
  const { data: briefingData, isLoading: briefingLoading, refetch: refetchBriefing } = useQuery({
    queryKey: ["ai-briefing", companyId],
    enabled: !!companyId,
    staleTime: 1000 * 60 * 30, // cache 30 min
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("ai-morning-briefing", {
        body: { company_id: companyId },
      });
      if (error) throw error;
      return data as BriefingData;
    },
  });

  const [briefingExpanded, setBriefingExpanded] = useState(true);

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

  // ── Sentinella Crediti: Burn Rate ──
  const burnRateDaily = (() => {
    if (!creditUsageHistory || creditUsageHistory.length === 0) return 0;
    const totalUsage = creditUsageHistory.reduce((sum, u) => sum + Number(u.cost_billed_total || 0), 0);
    // Calculate actual days spanned
    const dates = creditUsageHistory.map(u => new Date(u.created_at!).getTime());
    const minDate = Math.min(...dates);
    const maxDate = Math.max(...dates);
    const daySpan = Math.max(1, (maxDate - minDate) / (24 * 60 * 60 * 1000));
    return totalUsage / daySpan;
  })();

  const daysRemaining = burnRateDaily > 0 ? Math.floor(balanceEur / burnRateDaily) : null;

  // ── Smart Actions Engine (using configurable thresholds from company settings) ──
  const smartActions: { type: "warning" | "danger" | "info"; label: string; description: string; href: string; icon: React.ElementType }[] = [];

  const creditsLowThreshold = Number(saVal("credits_low_eur")) || 2;
  const burnRateDaysThreshold = Number(saVal("burn_rate_days")) || 3;
  const agentInactiveDays = Number(saVal("agent_inactive_days")) || 7;
  const preventiviStaleDays = Number(saVal("preventivi_stale_days")) || 7;
  const docsExpiryDays = Number(saVal("docs_expiry_days")) || 15;
  const campaignMinPct = Number(saVal("campaign_min_pct")) || 5;
  const dormantLeadDays = Number(saVal("dormant_lead_days")) || 5;

  // Credits — enhanced with burn rate
  if (saEnabled("credits_low")) {
    if (callsBlocked) {
      smartActions.push({
        type: "danger",
        label: "Agenti bloccati — crediti esauriti",
        description: "Ricarica subito per riattivare gli agenti.",
        href: "/app/credits",
        icon: CreditCard,
      });
    } else if (saEnabled("burn_rate_warning") && daysRemaining !== null && daysRemaining <= burnRateDaysThreshold) {
      smartActions.push({
        type: "danger",
        label: `Crediti per ~${daysRemaining} giorn${daysRemaining === 1 ? "o" : "i"}`,
        description: `Al ritmo attuale (€${burnRateDaily.toFixed(2)}/giorno) i crediti finiranno presto. Ricarica.`,
        href: "/app/credits",
        icon: CreditCard,
      });
    } else if (balanceEur < creditsLowThreshold) {
      smartActions.push({
        type: "danger",
        label: "Crediti in esaurimento",
        description: `Saldo sotto €${creditsLowThreshold}. Ricarica per evitare il blocco.`,
        href: "/app/credits",
        icon: CreditCard,
      });
    }
  }

  // Agents draft (always on — not configurable)
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

    // Agents inactive
    if (saEnabled("agent_inactive")) {
      const inactiveCutoff = new Date(Date.now() - agentInactiveDays * 24 * 60 * 60 * 1000);
      const inactiveAgents = agents!.filter(a =>
        a.status === "active" && (!a.last_call_at || new Date(a.last_call_at) < inactiveCutoff)
      );
      if (inactiveAgents.length > 0) {
        smartActions.push({
          type: "info",
          label: `"${inactiveAgents[0].name}" è inattivo`,
          description: `Nessuna chiamata negli ultimi ${agentInactiveDays} giorni. Verifica la configurazione.`,
          href: `/app/agents/${inactiveAgents[0].id}`,
          icon: ShieldAlert,
        });
      }
    }
  }

  // Callback contacts overdue
  if (saEnabled("callback_overdue") && callbackContacts && callbackContacts.length > 0) {
    const c = callbackContacts[0];
    const overdueLabel = c.next_call_at
      ? `era da richiamare ${format(new Date(c.next_call_at), "dd MMM 'alle' HH:mm", { locale: it })}`
      : "da richiamare";
    smartActions.push({
      type: "warning",
      label: `Richiama ${c.full_name}`,
      description: overdueLabel,
      href: `/app/contacts`,
      icon: PhoneCall,
    });
    if (callbackContacts.length > 1) {
      smartActions.push({
        type: "info",
        label: `${callbackContacts.length - 1} altri contatti da richiamare`,
        description: "Hanno una chiamata pianificata scaduta.",
        href: "/app/contacts",
        icon: Clock,
      });
    }
  }

  // Stale preventivi
  if (saEnabled("preventivi_stale") && stalePreventivi && stalePreventivi.length > 0) {
    const p = stalePreventivi[0] as any;
    const daysSince = differenceInDays(new Date(), new Date(p.inviato_at || p.created_at));
    smartActions.push({
      type: "warning",
      label: p.stato === "inviato"
        ? `Follow-up preventivo ${p.numero_preventivo || ""}`
        : `Preventivo in bozza da ${daysSince}g`,
      description: p.stato === "inviato"
        ? `Inviato ${daysSince} giorni fa a ${p.cliente_nome || "cliente"} senza risposta.`
        : `"${p.oggetto || p.numero_preventivo || "Senza titolo"}" per ${p.cliente_nome || "cliente"}. Invia o archivia.`,
      href: `/app/preventivi/${p.id}`,
      icon: FileText,
    });
  }

  // Expiring documents
  if (saEnabled("docs_expiring") && expiringDocs && expiringDocs.length > 0) {
    smartActions.push({
      type: "warning",
      label: `${expiringDocs.length} documento/i in scadenza`,
      description: `"${expiringDocs[0].nome}" scade il ${format(new Date(expiringDocs[0].data_scadenza), "dd MMM", { locale: it })}`,
      href: "/app/documenti-scadenze",
      icon: ShieldAlert,
    });
  }

  // Low-performing campaigns
  if (saEnabled("campaign_low_perf")) {
    const lowPerfCampaigns = staleCampaigns?.filter(c => {
      const reached = c.contacts_reached ?? 0;
      const appts = c.appointments_set ?? 0;
      return reached >= 20 && (appts / reached) < (campaignMinPct / 100);
    }) || [];
    if (lowPerfCampaigns.length > 0) {
      smartActions.push({
        type: "info",
        label: `Campagna "${lowPerfCampaigns[0].name}" sotto il ${campaignMinPct}%`,
        description: "Tasso appuntamenti basso. Rivedi il prompt o il target.",
        href: `/app/campaigns/${lowPerfCampaigns[0].id}`,
        icon: Megaphone,
      });
    }
  }

  // Auto-pilot paused campaigns (always on)
  const pausedCampaigns = staleCampaigns?.filter(c => c.status === "paused") || [];
  if (pausedCampaigns.length > 0) {
    smartActions.push({
      type: "danger",
      label: `Campagna "${pausedCampaigns[0].name}" in pausa automatica`,
      description: "L'Auto-Pilota ha fermato la campagna per basso rendimento. Rivedi il prompt o cambia target.",
      href: `/app/campaigns/${pausedCampaigns[0].id}`,
      icon: Megaphone,
    });
  }

  // Dormant qualified leads — opportunity recovery
  if (saEnabled("dormant_leads") && dormantLeads && dormantLeads.length > 0) {
    const lead = dormantLeads[0];
    const daysSince = lead.last_contact_at
      ? differenceInDays(new Date(), new Date(lead.last_contact_at))
      : null;
    smartActions.push({
      type: "warning",
      label: `Proponi appuntamento a ${lead.full_name}`,
      description: `Lead qualificato senza contatto da ${daysSince ?? "diversi"} giorni.`,
      href: `/app/contacts`,
      icon: CalendarCheck,
    });
    if (dormantLeads.length > 1) {
      smartActions.push({
        type: "info",
        label: `${dormantLeads.length - 1} altri lead qualificati dormienti`,
        description: `Nessun follow-up da oltre ${dormantLeadDays} giorni. Azione consigliata.`,
        href: "/app/contacts",
        icon: TrendingDown,
      });
    }
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

      {/* ═══ AI BRIEFING with clickable actions ═══ */}
      {briefingExpanded && (
        <div className="rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-accent/30 p-5 relative overflow-hidden">
          <div className="absolute top-3 right-3 flex items-center gap-1">
            <button
              onClick={() => refetchBriefing()}
              disabled={briefingLoading}
              className="p-1.5 rounded-md hover:bg-accent transition-colors"
              title="Aggiorna briefing"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${briefingLoading ? "animate-spin" : ""}`} />
            </button>
            <button
              onClick={() => setBriefingExpanded(false)}
              className="p-1.5 rounded-md hover:bg-accent transition-colors text-muted-foreground text-xs"
              title="Nascondi"
            >
              ✕
            </button>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <Brain className="w-4.5 h-4.5 text-primary" />
            </div>
            <div className="min-w-0 flex-1 pr-16">
              <p className="text-xs font-semibold text-primary mb-1.5 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> Consulente AI
              </p>
              {briefingLoading ? (
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                  <div className="h-3 bg-muted rounded w-full animate-pulse" />
                  <div className="h-3 bg-muted rounded w-2/3 animate-pulse" />
                </div>
              ) : briefingData?.briefing ? (
                <>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {briefingData.briefing}
                  </p>
                  {/* Clickable actions from AI */}
                  {briefingData.actions && briefingData.actions.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {briefingData.actions.map((action, i) => (
                        <Link key={i} to={action.href}>
                          <Button
                            size="sm"
                            variant={action.priority === "high" ? "default" : "outline"}
                            className="text-xs h-7 gap-1"
                          >
                            <Zap className="w-3 h-3" />
                            {action.label}
                          </Button>
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground italic">Briefing non disponibile.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {!briefingExpanded && (
        <button
          onClick={() => setBriefingExpanded(true)}
          className="flex items-center gap-2 text-xs text-primary hover:underline"
        >
          <Brain className="w-3.5 h-3.5" /> Mostra consulente AI
        </button>
      )}

      {/* ═══ ZONA B — 4 KPI Cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Bot}
          label="Agenti Attivi"
          value={`${activeAgents} / ${totalAgents}`}
          sub={activeAgents === totalAgents && totalAgents > 0 ? "Tutti operativi" : totalAgents === 0 ? "Crea il primo agente" : `${totalAgents - activeAgents} da attivare`}
          accent={activeAgents === totalAgents && totalAgents > 0 ? "success" : "warning"}
          href="/app/agents"
        />
        <KpiCard
          icon={MessageSquare}
          label="Interazioni gestite"
          value={String(monthTotal)}
          delta={prevMonthTotal > 0 ? monthTotal - prevMonthTotal : undefined}
          deltaBase={prevMonthTotal}
          sub="questo mese"
          accent="info"
        />
        <KpiCard
          icon={CalendarCheck}
          label="Appuntamenti fissati"
          value={String(appointments)}
          delta={prevAppointments > 0 ? appointments - prevAppointments : undefined}
          deltaBase={prevAppointments}
          sub="questo mese"
          accent="primary"
        />
        {/* Credits Card with burn rate */}
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
          {/* Burn rate projection */}
          {daysRemaining !== null && (
            <p className={`text-[11px] font-medium ${
              daysRemaining <= 3 ? "text-destructive" : daysRemaining <= 7 ? "text-yellow-600" : "text-muted-foreground"
            }`}>
              ⏱ ~{daysRemaining} giorn{daysRemaining === 1 ? "o" : "i"} rimanent{daysRemaining === 1 ? "e" : "i"} al ritmo attuale
            </p>
          )}
          <Link to="/app/credits" className="text-xs text-primary hover:underline mt-auto">
            Gestisci crediti →
          </Link>
        </div>
      </div>

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
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Da fare adesso
            <span className="text-xs font-normal text-muted-foreground ml-1">({smartActions.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {smartActions.slice(0, 6).map((action, idx) => (
              <Link
                key={`${action.label}-${idx}`}
                to={action.href}
                className={`rounded-xl p-4 border flex items-start gap-4 transition-colors ${
                  action.type === "danger"
                    ? "border-destructive/30 bg-destructive/5 hover:bg-destructive/10"
                    : action.type === "warning"
                    ? "border-yellow-300 bg-yellow-50 hover:bg-yellow-100"
                    : "border-border bg-accent/50 hover:bg-accent"
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
      ) : hasAgents ? (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center">
          <CheckCircle2 className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">Tutto in ordine!</p>
          <p className="text-xs text-muted-foreground mt-1">Nessuna azione urgente al momento.</p>
        </div>
      ) : null}

      {/* ═══ Agenti Autonomi Card ═══ */}
      {hasAgents && (
        <Link
          to="/app/automations"
          className="flex items-center gap-4 rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-accent/30 p-5 hover:from-primary/10 transition-colors"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">Automazioni AI</p>
            <p className="text-xs text-muted-foreground">
              I tuoi agenti autonomi lavorano in background per recuperare lead, monitorare crediti e ottimizzare campagne.
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-primary shrink-0" />
        </Link>
      )}

      {/* ═══ ZONA D — Risultati del Mese ═══ */}
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
                        <div>
                          <span>{c.agents?.name || "—"}</span>
                          {c.summary && (
                            <p className="text-[11px] text-muted-foreground truncate max-w-[250px]">{c.summary}</p>
                          )}
                        </div>
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
