import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/hooks/use-toast";
import { useState, useCallback, useEffect } from "react";
import { ArrowLeft, Save, Loader2, Power, Phone, Clock, Bot, Mic, MessageSquare, BarChart3, BookOpen, Settings2, Plug, PhoneCall, PhoneOutgoing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import VoicePickerEnhanced from "@/components/agents/VoicePickerEnhanced";
import VoiceTestPanel from "@/components/agents/VoiceTestPanel";
import TranscriptViewer from "@/components/conversations/TranscriptViewer";
import AgentIntegrationTab from "@/components/agents/AgentIntegrationTab";
import AgentAnalyticsTab from "@/components/agents/AgentAnalyticsTab";
import AgentKnowledgeTab from "@/components/agents/AgentKnowledgeTab";
import AgentPhoneTab from "@/components/agents/AgentPhoneTab";
import AgentOutboundTab from "@/components/agents/AgentOutboundTab";
import { SECTORS, LANGUAGES } from "@/components/agents/PromptTemplates";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

/* ── LLM Models ──────────────────────────────────── */
const LLM_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

/* ── Tab config per type ───────────────────────────── */
interface TabDef { id: string; label: string; icon: React.ElementType; }

const TABS_VOCAL: TabDef[] = [
  { id: "agente", label: "Agente", icon: Bot },
  { id: "voce", label: "Voce & Test", icon: Mic },
  { id: "conversazioni", label: "Conversazioni", icon: MessageSquare },
  { id: "outbound", label: "Chiamate Uscenti", icon: PhoneOutgoing },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
  { id: "integrazioni", label: "Integrazioni", icon: Plug },
  { id: "telefono", label: "Telefono", icon: PhoneCall },
  { id: "avanzate", label: "Avanzate", icon: Settings2 },
];

const TABS_RENDER: TabDef[] = [
  { id: "agente", label: "Agente", icon: Bot },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

const TABS_WHATSAPP: TabDef[] = [
  { id: "agente", label: "Agente", icon: Bot },
  { id: "conversazioni", label: "Conversazioni", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "knowledge", label: "Knowledge Base", icon: BookOpen },
];

const TABS_MAP: Record<string, TabDef[]> = { vocal: TABS_VOCAL, render: TABS_RENDER, whatsapp: TABS_WHATSAPP };

/* ── Config data shape ─────────────────────────────── */
interface ConfigState {
  name: string; description: string; sector: string; language: string;
  voice_id: string; system_prompt: string; first_message: string;
  temperature: number; llm_model: string;
  turn_timeout_sec: number; turn_eagerness: string; max_duration_sec: number;
  interruptions_enabled: boolean; end_call_enabled: boolean; end_call_prompt: string;
  language_detection_enabled: boolean;
  voice_stability: number; voice_similarity: number; voice_speed: number;
  evaluation_criteria: string;
  webhook_url: string;
}

function buildConfigState(agent: any): ConfigState {
  const cfg = (agent.config && typeof agent.config === "object" && !Array.isArray(agent.config)) ? agent.config as Record<string, unknown> : {};
  return {
    name: agent.name, description: agent.description || "", sector: agent.sector || "",
    language: agent.language || "it", voice_id: agent.el_voice_id || "",
    system_prompt: agent.system_prompt || "", first_message: agent.first_message || "",
    temperature: typeof cfg.temperature === "number" ? cfg.temperature : 0.7,
    llm_model: (cfg.llm_model as string) || "gpt-4o-mini",
    turn_timeout_sec: (cfg.turn_timeout_sec as number) ?? 10,
    turn_eagerness: (cfg.turn_eagerness as string) || "normal",
    max_duration_sec: (cfg.max_duration_sec as number) ?? 600,
    interruptions_enabled: (cfg.interruptions_enabled as boolean) ?? true,
    end_call_enabled: (cfg.end_call_enabled as boolean) ?? false,
    end_call_prompt: (cfg.end_call_prompt as string) || "",
    language_detection_enabled: (cfg.language_detection_enabled as boolean) ?? false,
    voice_stability: (cfg.voice_stability as number) ?? 0.5,
    voice_similarity: (cfg.voice_similarity as number) ?? 0.75,
    voice_speed: (cfg.voice_speed as number) ?? 1.0,
    evaluation_criteria: (cfg.evaluation_criteria as string) || "",
    webhook_url: (cfg.webhook_url as string) || agent.webhook_url || "",
  };
}

/* ── Component ─────────────────────────────────────── */

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = useCompanyId() || "";

  const [saving, setSaving] = useState(false);
  const [cfg, setCfg] = useState<ConfigState | null>(null);
  const [viewTranscript, setViewTranscript] = useState<Tables<"conversations"> | null>(null);
  const [dirty, setDirty] = useState(false);

  const update = useCallback(<K extends keyof ConfigState>(key: K, value: ConfigState[K]) => {
    setCfg(prev => prev ? { ...prev, [key]: value } : prev);
    setDirty(true);
  }, []);

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", id], enabled: !!id,
    queryFn: async () => { const { data, error } = await supabase.from("agents").select("*").eq("id", id!).single(); if (error) throw error; return data; },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["agent-conversations", id], enabled: !!id,
    queryFn: async () => { const { data, error } = await supabase.from("conversations").select("*").eq("agent_id", id!).order("started_at", { ascending: false }).limit(50); if (error) throw error; return data; },
  });

  if (agent && !cfg) setCfg(buildConfigState(agent));

  const handleSave = async () => {
    if (!cfg || !id) return;
    setSaving(true);
    try {
      const config = {
        temperature: cfg.temperature, llm_model: cfg.llm_model,
        turn_timeout_sec: cfg.turn_timeout_sec, turn_eagerness: cfg.turn_eagerness,
        max_duration_sec: cfg.max_duration_sec, interruptions_enabled: cfg.interruptions_enabled,
        end_call_enabled: cfg.end_call_enabled, end_call_prompt: cfg.end_call_prompt,
        language_detection_enabled: cfg.language_detection_enabled,
        voice_stability: cfg.voice_stability, voice_similarity: cfg.voice_similarity,
        voice_speed: cfg.voice_speed, evaluation_criteria: cfg.evaluation_criteria,
        webhook_url: cfg.webhook_url,
      };
      const { error } = await supabase.functions.invoke("update-agent", {
        body: { id, name: cfg.name, description: cfg.description, sector: cfg.sector, language: cfg.language, el_voice_id: cfg.voice_id, system_prompt: cfg.system_prompt, first_message: cfg.first_message, config },
      });
      if (error) throw error;
      toast({ title: "Salvato", description: "Configurazione aggiornata." });
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally { setSaving(false); }
  };

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "draft" : "active";
    await supabase.functions.invoke("update-agent", { body: { id: agent.id, status: newStatus } });
    queryClient.invalidateQueries({ queryKey: ["agent", id] });
    toast({ title: newStatus === "active" ? "Agente attivato" : "Agente disattivato" });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  if (!agent) return <div className="p-8 text-center text-muted-foreground">Agente non trovato.</div>;

  const isActive = agent.status === "active";
  const agentType = agent.type || "vocal";
  const tabs = TABS_MAP[agentType] || TABS_VOCAL;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button onClick={() => navigate("/app/agents")} className="flex items-center gap-1 text-sm mb-4 hover:opacity-80 text-muted-foreground">
          <ArrowLeft className="w-4 h-4" /> Torna agli agenti
        </button>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-foreground">{agent.name}</h1>
              <Badge className={isActive ? "bg-status-success-light text-status-success border-none" : "bg-ink-100 text-ink-400 border-none"}>
                {isActive ? "Attivo" : agent.status}
              </Badge>
              {agent.type && (
                <Badge variant="outline" className="text-xs">
                  {agent.type === "vocal" ? "🎙️ Vocale" : agent.type === "whatsapp" ? "💬 WhatsApp" : agent.type === "render" ? "🎨 Render" : agent.type}
                </Badge>
              )}
            </div>
            {agent.description && <p className="text-sm text-muted-foreground">{agent.description}</p>}
          </div>
          <div className="flex items-center gap-2">
            {dirty && (
              <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-hover text-white">
                {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Salva
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={toggleStatus} className="border-border text-foreground hover:bg-muted">
              <Power className="w-4 h-4 mr-1" /> {isActive ? "Disattiva" : "Attiva"}
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="agente" className="space-y-6">
        <TabsList className="bg-muted border-none flex-wrap h-auto gap-1 p-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1.5 text-xs sm:text-sm">
              <tab.icon className="w-4 h-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ═══ TAB: Agente ═══ */}
        <TabsContent value="agente">
          {cfg && (
            <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
              <div className="space-y-6">
                {/* Identity */}
                <section className="rounded-card p-5 bg-card border border-border shadow-card space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Identità</h3>
                  <div className="space-y-2">
                    <Label>Nome agente</Label>
                    <Input value={cfg.name} onChange={e => update("name", e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Descrizione</Label>
                    <Textarea value={cfg.description} onChange={e => update("description", e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Settore</Label>
                      <Select value={cfg.sector} onValueChange={v => update("sector", v)}>
                        <SelectTrigger><SelectValue placeholder="Seleziona" /></SelectTrigger>
                        <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Lingua</Label>
                      <Select value={cfg.language} onValueChange={v => update("language", v)}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Modello LLM</Label>
                    <Select value={cfg.llm_model} onValueChange={v => update("llm_model", v)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LLM_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </section>

                {/* Prompt */}
                <section className="rounded-card p-5 bg-card border border-border shadow-card space-y-4">
                  <h3 className="text-sm font-semibold text-foreground">Prompt & Conversazione</h3>
                  <div className="space-y-2">
                    <Label>System Prompt</Label>
                    <Textarea value={cfg.system_prompt} onChange={e => update("system_prompt", e.target.value)} className="min-h-[200px] font-mono text-xs" />
                  </div>
                  <div className="space-y-2">
                    <Label>Primo messaggio</Label>
                    <Textarea value={cfg.first_message} onChange={e => update("first_message", e.target.value)} className="min-h-[80px]" />
                  </div>
                  <div className="space-y-2">
                    <Label>Temperatura: {cfg.temperature.toFixed(1)}</Label>
                    <Slider value={[cfg.temperature]} onValueChange={([v]) => update("temperature", v)} min={0} max={1} step={0.1} />
                    <div className="flex justify-between text-[10px] text-muted-foreground"><span>Preciso</span><span>Creativo</span></div>
                  </div>
                </section>
              </div>

              {/* Sidebar stats */}
              <div className="space-y-4">
                {[
                  { label: "Chiamate totali", value: agent.calls_total ?? 0, icon: Phone },
                  { label: "Questo mese", value: (agent as any).calls_month ?? 0, icon: Phone },
                  { label: "Durata media", value: `${agent.avg_duration_sec ?? 0}s`, icon: Clock },
                ].map(stat => (
                  <div key={stat.label} className="rounded-card p-4 bg-card border border-border shadow-card">
                    <div className="flex items-center gap-2 mb-1">
                      <stat.icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{stat.label}</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{stat.value}</p>
                  </div>
                ))}

                <div className="rounded-card p-4 bg-card border border-border shadow-card space-y-2">
                  <h4 className="text-xs font-semibold text-muted-foreground">DETTAGLI</h4>
                  {[
                    ["Use Case", agent.use_case],
                    ["Tipo", agent.type],
                    ["EL Agent ID", agent.el_agent_id],
                  ].map(([label, val]) => (
                    <div key={label as string} className="flex justify-between text-xs">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="text-foreground font-mono truncate max-w-[140px]">{(val as string) || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: Voce & Test ═══ */}
        <TabsContent value="voce">
          {cfg && (
            <div className="space-y-6">
              <section className="rounded-card p-5 bg-card border border-border shadow-card space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Selezione Voce</h3>
                <VoicePickerEnhanced
                  companyId={companyId}
                  selected={cfg.voice_id}
                  onSelect={v => update("voice_id", v)}
                  voiceSettings={{ stability: cfg.voice_stability, similarity: cfg.voice_similarity, speed: cfg.voice_speed }}
                  onSettingsChange={s => {
                    update("voice_stability", s.stability);
                    update("voice_similarity", s.similarity);
                    update("voice_speed", s.speed);
                  }}
                />
              </section>

              <section className="rounded-card p-5 bg-card border border-border shadow-card space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Test Vocale Live</h3>
                <VoiceTestPanel elevenlabsAgentId={agent.el_agent_id} companyId={companyId} />
              </section>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: Conversazioni ═══ */}
        <TabsContent value="conversazioni">
          {conversations.length === 0 ? (
            <div className="rounded-card border border-border bg-card p-12 text-center shadow-card">
              <MessageSquare className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nessuna conversazione per questo agente.</p>
            </div>
          ) : (
            <div className="rounded-card overflow-hidden border border-border bg-card shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted">
                    <TableHead>Data</TableHead>
                    <TableHead>Numero</TableHead>
                    <TableHead>Direzione</TableHead>
                    <TableHead>Durata</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Esito</TableHead>
                    <TableHead>Sentiment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map(conv => (
                    <TableRow key={conv.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setViewTranscript(conv)}>
                      <TableCell className="text-sm">{conv.started_at ? format(new Date(conv.started_at), "dd MMM HH:mm", { locale: it }) : "—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground font-mono">{conv.caller_number || conv.phone_number || "—"}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {conv.direction === "inbound" ? "📥 Inbound" : "📤 Outbound"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{conv.duration_sec ? `${Math.floor(conv.duration_sec / 60)}:${String(conv.duration_sec % 60).padStart(2, "0")}` : "—"}</TableCell>
                      <TableCell>
                        {conv.eval_score !== null && conv.eval_score !== undefined ? (
                          <Badge className={`text-xs ${Number(conv.eval_score) >= 70 ? "bg-green-100 text-green-700" : Number(conv.eval_score) >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
                            {conv.eval_score}
                          </Badge>
                        ) : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs ${conv.outcome === "appointment" ? "border-status-success text-status-success" : conv.outcome === "qualified" ? "border-brand text-brand" : ""}`}>
                          {conv.outcome || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {conv.sentiment === "positive" ? "😊" : conv.sentiment === "negative" ? "😞" : conv.sentiment === "neutral" ? "😐" : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ═══ TAB: Outbound ═══ */}
        <TabsContent value="outbound">
          <AgentOutboundTab agentId={agent.id} companyId={companyId} outboundEnabled={(agent as any).outbound_enabled ?? false} elAgentId={agent.el_agent_id} />
        </TabsContent>

        {/* ═══ TAB: Analytics ═══ */}
        <TabsContent value="analytics">
          <AgentAnalyticsTab conversations={conversations} />
        </TabsContent>

        {/* ═══ TAB: Knowledge Base ═══ */}
        <TabsContent value="knowledge">
          <AgentKnowledgeTab agentId={agent.id} companyId={companyId} />
        </TabsContent>

        {/* ═══ TAB: Integrazioni ═══ */}
        <TabsContent value="integrazioni">
          <div className="space-y-6">
            {/* Webhook */}
            {cfg && (
              <section className="rounded-card p-5 bg-card border border-border shadow-card space-y-4">
                <h3 className="text-sm font-semibold text-foreground">Webhook Post-Chiamata</h3>
                <p className="text-xs text-muted-foreground">Ricevi un payload JSON alla fine di ogni conversazione.</p>
                <div className="space-y-2">
                  <Label>URL Webhook</Label>
                  <Input value={cfg.webhook_url} onChange={e => update("webhook_url", e.target.value)} placeholder="https://tuoserver.com/webhook" className="font-mono text-sm" />
                </div>
              </section>
            )}
            <AgentIntegrationTab agentId={agent.id} elAgentId={agent.el_agent_id} agentName={agent.name} />
          </div>
        </TabsContent>

        {/* ═══ TAB: Telefono ═══ */}
        <TabsContent value="telefono">
          <AgentPhoneTab agentId={agent.id} companyId={companyId} />
        </TabsContent>

        {/* ═══ TAB: Avanzate ═══ */}
        <TabsContent value="avanzate">
          {cfg && (
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Conversation Flow */}
              <section className="rounded-card p-5 bg-card border border-border shadow-card space-y-5">
                <h3 className="text-sm font-semibold text-foreground">Flusso Conversazione</h3>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Turn Timeout: {cfg.turn_timeout_sec}s</Label>
                  <Slider value={[cfg.turn_timeout_sec]} onValueChange={([v]) => update("turn_timeout_sec", v)} min={1} max={30} step={1} />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Reattività turno</Label>
                  <Select value={cfg.turn_eagerness} onValueChange={v => update("turn_eagerness", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="eager">Eager — risponde subito</SelectItem>
                      <SelectItem value="normal">Normale</SelectItem>
                      <SelectItem value="patient">Paziente — aspetta di più</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Durata max: {Math.floor(cfg.max_duration_sec / 60)} min</Label>
                  <Slider value={[cfg.max_duration_sec]} onValueChange={([v]) => update("max_duration_sec", v)} min={60} max={1800} step={60} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Interruzioni utente</Label>
                  <Switch checked={cfg.interruptions_enabled} onCheckedChange={v => update("interruptions_enabled", v)} />
                </div>
              </section>

              {/* System Tools */}
              <section className="rounded-card p-5 bg-card border border-border shadow-card space-y-5">
                <h3 className="text-sm font-semibold text-foreground">Strumenti di Sistema</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">End Call automatico</Label>
                    <p className="text-xs text-muted-foreground">L'agente può chiudere la chiamata</p>
                  </div>
                  <Switch checked={cfg.end_call_enabled} onCheckedChange={v => update("end_call_enabled", v)} />
                </div>
                {cfg.end_call_enabled && (
                  <div className="space-y-2">
                    <Label className="text-xs text-muted-foreground">Prompt End Call</Label>
                    <Textarea value={cfg.end_call_prompt} onChange={e => update("end_call_prompt", e.target.value)} placeholder="Chiudi la chiamata quando..." className="min-h-[60px] text-sm" />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Language Detection</Label>
                    <p className="text-xs text-muted-foreground">Rileva e adatta lingua automaticamente</p>
                  </div>
                  <Switch checked={cfg.language_detection_enabled} onCheckedChange={v => update("language_detection_enabled", v)} />
                </div>
              </section>

              {/* Evaluation */}
              <section className="rounded-card p-5 bg-card border border-border shadow-card space-y-4 lg:col-span-2">
                <h3 className="text-sm font-semibold text-foreground">Valutazione Conversazioni</h3>
                <p className="text-xs text-muted-foreground">Definisci i criteri per valutare automaticamente le conversazioni.</p>
                <Textarea
                  value={cfg.evaluation_criteria}
                  onChange={e => update("evaluation_criteria", e.target.value)}
                  placeholder="Es: La conversazione è riuscita se il cliente ha prenotato un appuntamento o ha lasciato i propri dati di contatto..."
                  className="min-h-[120px] text-sm"
                />
              </section>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Floating save bar */}
      {dirty && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <div className="bg-card border border-border shadow-lg rounded-full px-6 py-3 flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Modifiche non salvate</span>
            <Button onClick={handleSave} disabled={saving} size="sm" className="bg-brand hover:bg-brand-hover text-white rounded-full">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salva
            </Button>
          </div>
        </div>
      )}

      <TranscriptViewer open={!!viewTranscript} onOpenChange={() => setViewTranscript(null)} transcript={viewTranscript?.transcript ?? null} agentName={agent.name} evalScore={viewTranscript?.eval_score ?? null} evalNotes={viewTranscript?.eval_notes ?? null} collectedData={viewTranscript?.collected_data ?? null} />
    </div>
  );
}
