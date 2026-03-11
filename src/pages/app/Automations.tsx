import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Bot, Zap, Brain, Megaphone, CreditCard, BarChart3, UserCheck,
  RefreshCw, Settings2, Clock, ArrowRight, CheckCircle2,
  PhoneCall, FileText, AlertTriangle, TrendingDown, Sparkles,
  ShieldCheck, CalendarCheck, HardHat,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";

// ── Agent Definitions ──
interface AgentDef {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  automationType: string | null;
  configFields?: { key: string; label: string; type: "number" }[];
  alwaysActive?: boolean;
  manualAction?: "recalculate";
}

const AGENTS: AgentDef[] = [
  {
    key: "followup",
    label: "Recupero Lead Dormienti",
    description: "Richiama automaticamente i lead qualificati senza contatto da giorni.",
    icon: PhoneCall,
    automationType: "followup_agent",
    configFields: [
      { key: "dormant_days", label: "Giorni inattività", type: "number" },
      { key: "max_per_run", label: "Max chiamate/run", type: "number" },
    ],
  },
  {
    key: "campaign",
    label: "Campagne Auto-Pilota",
    description: "Pausa automatica delle campagne con bassa conversione.",
    icon: Megaphone,
    automationType: "campaign_autopilot",
    configFields: [
      { key: "min_conversion_rate", label: "Conversione min. %", type: "number" },
    ],
  },
  {
    key: "pipeline",
    label: "Gestore Pipeline",
    description: "Aggiorna automaticamente lo stato dei contatti dopo ogni chiamata.",
    icon: UserCheck,
    automationType: null,
    alwaysActive: true,
  },
  {
    key: "briefing",
    label: "Consulente Mattutino",
    description: "Genera un briefing AI giornaliero con insight e azioni suggerite.",
    icon: Brain,
    automationType: null,
    alwaysActive: true,
  },
  {
    key: "sentinel",
    label: "Sentinella Crediti",
    description: "Monitora il burn rate e avvisa quando i crediti stanno per finire.",
    icon: CreditCard,
    automationType: null,
    alwaysActive: true,
  },
  {
    key: "scoring",
    label: "Qualificatore Intelligente",
    description: "Ricalcola i pesi del lead scoring in base allo storico conversioni.",
    icon: BarChart3,
    automationType: null,
    manualAction: "recalculate",
  },
];

// ── Smart Actions Rule Definitions ──
interface SmartActionRule {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  thresholds?: { key: string; label: string; unit: string; default: number; min: number; max: number }[];
}

const SMART_ACTION_RULES: SmartActionRule[] = [
  {
    key: "credits_low",
    label: "Crediti in esaurimento",
    description: "Avvisa quando il saldo scende sotto la soglia.",
    icon: CreditCard,
    thresholds: [{ key: "credits_low_eur", label: "Soglia", unit: "€", default: 2, min: 1, max: 50 }],
  },
  {
    key: "burn_rate_warning",
    label: "Burn rate critico",
    description: "Avvisa quando i crediti bastano per pochi giorni.",
    icon: AlertTriangle,
    thresholds: [{ key: "burn_rate_days", label: "Giorni minimi", unit: "gg", default: 3, min: 1, max: 14 }],
  },
  {
    key: "agent_inactive",
    label: "Agente inattivo",
    description: "Segnala agenti senza chiamate da troppo tempo.",
    icon: Bot,
    thresholds: [{ key: "agent_inactive_days", label: "Giorni", unit: "gg", default: 7, min: 3, max: 30 }],
  },
  {
    key: "callback_overdue",
    label: "Callback scaduti",
    description: "Mostra contatti con richiamata programmata non effettuata.",
    icon: PhoneCall,
  },
  {
    key: "preventivi_stale",
    label: "Preventivi senza risposta",
    description: "Evidenzia preventivi fermi da troppi giorni.",
    icon: FileText,
    thresholds: [{ key: "preventivi_stale_days", label: "Giorni", unit: "gg", default: 7, min: 3, max: 30 }],
  },
  {
    key: "docs_expiring",
    label: "Documenti in scadenza",
    description: "Avvisa per documenti prossimi alla scadenza.",
    icon: ShieldCheck,
    thresholds: [{ key: "docs_expiry_days", label: "Anticipo", unit: "gg", default: 15, min: 7, max: 60 }],
  },
  {
    key: "campaign_low_perf",
    label: "Campagne sotto soglia",
    description: "Segnala campagne con tasso appuntamenti basso.",
    icon: Megaphone,
    thresholds: [{ key: "campaign_min_pct", label: "% minima", unit: "%", default: 5, min: 1, max: 20 }],
  },
  {
    key: "dormant_leads",
    label: "Lead qualificati dormienti",
    description: "Opportunità da recuperare: lead senza contatto recente.",
    icon: CalendarCheck,
    thresholds: [{ key: "dormant_lead_days", label: "Giorni", unit: "gg", default: 5, min: 2, max: 30 }],
  },
];

// ── Orchestrator Log Metadata ──
const EVENT_ICONS: Record<string, { icon: LucideIcon; color: string }> = {
  credits_critical: { icon: CreditCard, color: "text-destructive" },
  callback_overdue: { icon: PhoneCall, color: "text-yellow-600" },
  lead_dormant: { icon: Bot, color: "text-primary" },
  preventivo_stale: { icon: FileText, color: "text-yellow-600" },
  campaign_low_perf: { icon: TrendingDown, color: "text-destructive" },
};

const EVENT_LABELS: Record<string, string> = {
  credits_critical: "Crediti critici",
  callback_overdue: "Callback scaduto",
  lead_dormant: "Lead dormiente",
  preventivo_stale: "Preventivo senza risposta",
  campaign_low_perf: "Campagna sotto soglia",
};

const ACTION_LABELS: Record<string, string> = {
  outbound_call: "Chiamata automatica",
  followup_suggested: "Follow-up suggerito",
  alert: "Alert generato",
  skipped: "Già gestito",
  outbound_call_failed: "Chiamata fallita",
};

// ── Defaults for smart_actions config ──
import { SMART_ACTIONS_DEFAULTS } from "@/lib/automation-defaults";
export { SMART_ACTIONS_DEFAULTS };

export default function Automations() {
  const companyId = useCompanyId();
  const qc = useQueryClient();

  // ── Fetch automations config ──
  const { data: automations } = useQuery({
    queryKey: ["automations", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("agent_automations")
        .select("*")
        .eq("company_id", companyId!);
      return data || [];
    },
  });

  // ── Fetch company settings (for smart_actions) ──
  const { data: companySettings } = useQuery({
    queryKey: ["company-settings", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("companies")
        .select("settings")
        .eq("id", companyId!)
        .single();
      return (data?.settings as Record<string, any>) || {};
    },
  });

  const smartActionsConfig = (companySettings?.smart_actions || {}) as Record<string, any>;

  const getSmartVal = (key: string): any => {
    if (key in smartActionsConfig) return smartActionsConfig[key];
    return SMART_ACTIONS_DEFAULTS[key];
  };

  // ── Fetch orchestrator log (paginated) ──
  const [logLimit, setLogLimit] = useState(50);
  const { data: logEntries } = useQuery({
    queryKey: ["orchestrator-log", companyId, logLimit],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from("ai_orchestrator_log" as any)
        .select("*")
        .eq("company_id", companyId!)
        .order("created_at", { ascending: false })
        .limit(logLimit);
      return (data as any[]) || [];
    },
  });

  // ── Toggle automation ──
  const toggleMutation = useMutation({
    mutationFn: async ({ type, enabled }: { type: string; enabled: boolean }) => {
      const existing = automations?.find((a: any) => a.automation_type === type);
      if (existing) {
        await supabase.from("agent_automations").update({ is_enabled: enabled }).eq("id", existing.id);
      } else {
        await supabase.from("agent_automations").insert({
          company_id: companyId!, automation_type: type, is_enabled: enabled, config: {} as any,
        } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["automations", companyId] });
      toast({ title: "Automazione aggiornata" });
    },
  });

  // ── Update agent config field ──
  const updateConfig = useMutation({
    mutationFn: async ({ type, key, value }: { type: string; key: string; value: number }) => {
      const existing = automations?.find((a: any) => a.automation_type === type);
      const currentConfig = (existing?.config as Record<string, unknown>) || {};
      const newConfig = { ...currentConfig, [key]: value };
      if (existing) {
        await supabase.from("agent_automations").update({ config: newConfig as any }).eq("id", existing.id);
      } else {
        await supabase.from("agent_automations").insert({
          company_id: companyId!, automation_type: type, is_enabled: false, config: newConfig as any,
        } as any);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["automations", companyId] }),
  });

  // ── Update smart_actions in company settings ──
  const updateSmartActions = useMutation({
    mutationFn: async (patch: Record<string, any>) => {
      const currentSettings = companySettings || {};
      const currentSA = (currentSettings.smart_actions || {}) as Record<string, any>;
      const newSA = { ...currentSA, ...patch };
      const newSettings = { ...currentSettings, smart_actions: newSA };
      const { error } = await supabase
        .from("companies")
        .update({ settings: newSettings as any })
        .eq("id", companyId!);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["company-settings", companyId] });
      toast({ title: "Regola aggiornata" });
    },
  });

  // ── Recalculate lead weights ──
  const [recalculating, setRecalculating] = useState(false);
  const handleRecalculate = async () => {
    setRecalculating(true);
    try {
      const { error } = await supabase.functions.invoke("recalculate-lead-weights");
      if (error) throw error;
      toast({ title: "Pesi ricalcolati", description: "Il lead scoring è stato aggiornato." });
    } catch {
      toast({ title: "Errore", description: "Impossibile ricalcolare i pesi.", variant: "destructive" });
    } finally {
      setRecalculating(false);
    }
  };

  // ── Run orchestrator ──
  const [orchestrating, setOrchestrating] = useState(false);
  const handleRunOrchestrator = async () => {
    setOrchestrating(true);
    try {
      const { error } = await supabase.functions.invoke("ai-orchestrator", {
        body: { company_id: companyId },
      });
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["orchestrator-log", companyId] });
      toast({ title: "Orchestrator eseguito", description: "Controlla l'attività recente." });
    } catch {
      toast({ title: "Errore", description: "Impossibile eseguire l'orchestrator.", variant: "destructive" });
    } finally {
      setOrchestrating(false);
    }
  };

  const getAutomation = (type: string) => automations?.find((a: any) => a.automation_type === type);
  const getAgentConfigValue = (type: string, key: string, fallback: number) => {
    const config = (getAutomation(type)?.config as Record<string, unknown>) || {};
    return Number(config[key]) || fallback;
  };

  const activeCount = AGENTS.filter((a) => {
    if (a.alwaysActive) return true;
    if (a.automationType) return getAutomation(a.automationType)?.is_enabled;
    return false;
  }).length;

  const todayActions = logEntries?.filter((l: any) => {
    return new Date(l.created_at).toDateString() === new Date().toDateString();
  }).length ?? 0;

  return (
    <div className="space-y-8 max-w-5xl">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Zap className="w-6 h-6 text-primary" />
            Automazioni AI
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {activeCount} agent{activeCount !== 1 ? "i" : "e"} attiv{activeCount !== 1 ? "i" : "o"} · {todayActions} azion{todayActions !== 1 ? "i" : "e"} oggi
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRunOrchestrator} disabled={orchestrating} className="gap-2">
          <RefreshCw className={`w-4 h-4 ${orchestrating ? "animate-spin" : ""}`} />
          Esegui ora
        </Button>
      </div>

      {/* ── Agent Cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">I tuoi agenti autonomi</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AGENTS.map((agent) => {
            const automation = agent.automationType ? getAutomation(agent.automationType) : null;
            const isActive = agent.alwaysActive || (automation?.is_enabled ?? false);
            return (
              <div key={agent.key} className={`rounded-xl border p-5 transition-colors ${isActive ? "border-primary/30 bg-primary/5" : "border-border bg-card"}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isActive ? "bg-primary/10" : "bg-muted"}`}>
                      <agent.icon className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{agent.label}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{agent.description}</p>
                    </div>
                  </div>
                  {agent.alwaysActive ? (
                    <span className="text-[10px] font-semibold bg-primary/10 text-primary px-2 py-1 rounded-full whitespace-nowrap">Sempre attivo</span>
                  ) : agent.automationType ? (
                    <Switch checked={isActive} disabled={toggleMutation.isPending} onCheckedChange={(checked) => toggleMutation.mutate({ type: agent.automationType!, enabled: checked })} />
                  ) : null}
                </div>
                {automation && (
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                    {automation.last_run_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Ultimo run: {format(new Date(automation.last_run_at), "d MMM HH:mm", { locale: it })}
                      </span>
                    )}
                    <span>{automation.total_actions ?? 0} azioni totali</span>
                  </div>
                )}
                {agent.configFields && agent.automationType && (
                  <div className="flex flex-wrap gap-3 mt-2">
                    {agent.configFields.map((field) => {
                      const defaults: Record<string, number> = { dormant_days: 5, max_per_run: 10, min_conversion_rate: 3 };
                      const val = getAgentConfigValue(agent.automationType!, field.key, defaults[field.key] ?? 5);
                      return (
                        <div key={field.key} className="flex items-center gap-2">
                          <Settings2 className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">{field.label}:</span>
                          <Input type="number" className="w-16 h-7 text-xs" value={val}
                            onChange={(e) => updateConfig.mutate({ type: agent.automationType!, key: field.key, value: Number(e.target.value) })} />
                        </div>
                      );
                    })}
                  </div>
                )}
                {agent.manualAction === "recalculate" && (
                  <Button size="sm" variant="outline" className="mt-3 gap-2 text-xs" onClick={handleRecalculate} disabled={recalculating}>
                    <RefreshCw className={`w-3 h-3 ${recalculating ? "animate-spin" : ""}`} /> Ricalcola pesi
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Smart Actions Rules ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-1 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          Regole Smart Actions
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Personalizza quali suggerimenti appaiono nella dashboard e le soglie di attivazione.
        </p>
        <div className="rounded-xl border border-border bg-card divide-y divide-border">
          {SMART_ACTION_RULES.map((rule) => {
            const enabledKey = `${rule.key}_enabled`;
            const isEnabled = getSmartVal(enabledKey) ?? true;
            const RuleIcon = rule.icon;

            return (
              <div key={rule.key} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  <RuleIcon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{rule.label}</p>
                  <p className="text-xs text-muted-foreground">{rule.description}</p>
                </div>
                {rule.thresholds && (
                  <div className="flex items-center gap-2 shrink-0">
                    {rule.thresholds.map((t) => (
                      <div key={t.key} className="flex items-center gap-1">
                        <Input
                          type="number"
                          className="w-16 h-7 text-xs"
                          min={t.min}
                          max={t.max}
                          value={getSmartVal(t.key) ?? t.default}
                          disabled={!isEnabled}
                          onChange={(e) => {
                            const v = Math.min(t.max, Math.max(t.min, Number(e.target.value) || t.default));
                            updateSmartActions.mutate({ [t.key]: v });
                          }}
                        />
                        <span className="text-[10px] text-muted-foreground">{t.unit}</span>
                      </div>
                    ))}
                  </div>
                )}
                <Switch
                  checked={isEnabled}
                  onCheckedChange={(checked) => updateSmartActions.mutate({ [enabledKey]: checked })}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Activity log ── */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Attività recente</h2>
        {logEntries && logEntries.length > 0 ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="divide-y divide-border">
              {logEntries.map((entry: any) => {
                const evtMeta = EVENT_ICONS[entry.event_type] || { icon: Zap, color: "text-muted-foreground" };
                const EvtIcon = evtMeta.icon;
                const details = entry.action_details || {};
                return (
                  <div key={entry.id} className="flex items-center gap-4 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                      <EvtIcon className={`w-4 h-4 ${evtMeta.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">
                        {EVENT_LABELS[entry.event_type] || entry.event_type}
                        {details.name && <span className="text-muted-foreground font-normal"> — {details.name}</span>}
                        {details.numero && <span className="text-muted-foreground font-normal"> #{details.numero}</span>}
                      </p>
                      <p className="text-xs text-muted-foreground">{ACTION_LABELS[entry.action_taken] || entry.action_taken}</p>
                    </div>
                    <span className="text-[11px] text-muted-foreground whitespace-nowrap">
                      {format(new Date(entry.created_at), "d MMM HH:mm", { locale: it })}
                    </span>
                    {entry.entity_type === "contact" && entry.entity_id && (
                      <Link to={`/app/contacts/${entry.entity_id}`}>
                        <ArrowRight className="w-4 h-4 text-muted-foreground hover:text-primary" />
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-8 text-center">
            <CheckCircle2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">Nessuna attività registrata ancora.</p>
            <p className="text-xs text-muted-foreground mt-1">Premi "Esegui ora" per analizzare la tua azienda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
