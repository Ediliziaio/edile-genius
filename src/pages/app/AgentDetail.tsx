import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ArrowLeft, Save, Loader2, Power, Phone, Clock, Plug, BarChart3, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentConfigForm, { type AgentConfigData } from "@/components/agents/AgentConfigForm";
import VoiceTestPanel from "@/components/agents/VoiceTestPanel";
import TranscriptViewer from "@/components/conversations/TranscriptViewer";
import AgentIntegrationTab from "@/components/agents/AgentIntegrationTab";
import AgentAnalyticsTab from "@/components/agents/AgentAnalyticsTab";
import AgentKnowledgeTab from "@/components/agents/AgentKnowledgeTab";
import AgentPhoneTab from "@/components/agents/AgentPhoneTab";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = useCompanyId() || "";

  const [saving, setSaving] = useState(false);
  const [configData, setConfigData] = useState<AgentConfigData | null>(null);
  const [viewTranscript, setViewTranscript] = useState<Tables<"conversations"> | null>(null);

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", id], enabled: !!id,
    queryFn: async () => { const { data, error } = await supabase.from("agents").select("*").eq("id", id!).single(); if (error) throw error; return data; },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["agent-conversations", id], enabled: !!id,
    queryFn: async () => { const { data, error } = await supabase.from("conversations").select("*").eq("agent_id", id!).order("started_at", { ascending: false }).limit(50); if (error) throw error; return data; },
  });

  if (agent && !configData) {
    const cfg = (agent.config && typeof agent.config === "object" && !Array.isArray(agent.config)) ? agent.config as Record<string, unknown> : {};
    setConfigData({
      name: agent.name, description: agent.description || "", sector: agent.sector || "",
      language: agent.language || "it", voice_id: (agent as any).el_voice_id || "",
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
    });
  }

  const updateConfig = <K extends keyof AgentConfigData>(key: K, value: AgentConfigData[K]) => setConfigData(prev => prev ? { ...prev, [key]: value } : prev);

  const handleSave = async () => {
    if (!configData || !id) return;
    setSaving(true);
    try {
      const config = {
        temperature: configData.temperature, llm_model: configData.llm_model,
        turn_timeout_sec: configData.turn_timeout_sec, turn_eagerness: configData.turn_eagerness,
        max_duration_sec: configData.max_duration_sec, interruptions_enabled: configData.interruptions_enabled,
        end_call_enabled: configData.end_call_enabled, end_call_prompt: configData.end_call_prompt,
        language_detection_enabled: configData.language_detection_enabled,
        voice_stability: configData.voice_stability, voice_similarity: configData.voice_similarity,
        voice_speed: configData.voice_speed, evaluation_criteria: configData.evaluation_criteria,
      };
      const { error } = await supabase.functions.invoke("update-agent", { body: { id, name: configData.name, description: configData.description, sector: configData.sector, language: configData.language, el_voice_id: configData.voice_id, system_prompt: configData.system_prompt, first_message: configData.first_message, config } });
      if (error) throw error;
      toast({ title: "Salvato", description: "Configurazione aggiornata." });
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
    } catch (err: any) { toast({ variant: "destructive", title: "Errore", description: err.message }); }
    finally { setSaving(false); }
  };

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "draft" : "active";
    await supabase.functions.invoke("update-agent", { body: { id: agent.id, status: newStatus } });
    queryClient.invalidateQueries({ queryKey: ["agent", id] });
    toast({ title: newStatus === "active" ? "Agente attivato" : "Agente disattivato" });
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  if (!agent) return <div className="p-8 text-center text-ink-500">Agente non trovato.</div>;

  const isActive = agent.status === "active";

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      <button onClick={() => navigate("/app/agents")} className="flex items-center gap-1 text-sm mb-6 hover:opacity-80 text-ink-500">
        <ArrowLeft className="w-4 h-4" /> Torna agli agenti
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-ink-900">{agent.name}</h1>
            <Badge className={isActive ? "bg-status-success-light text-status-success border-none" : "bg-ink-100 text-ink-400 border-none"}>
              {isActive ? "Attivo" : agent.status}
            </Badge>
          </div>
          {agent.description && <p className="text-sm text-ink-500">{agent.description}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={toggleStatus} className="border-ink-200 text-ink-700 hover:bg-ink-50">
          <Power className="w-4 h-4 mr-1" /> {isActive ? "Disattiva" : "Attiva"}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-ink-100 border-none flex-wrap">
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="config">Configurazione</TabsTrigger>
          <TabsTrigger value="test">Test Vocale</TabsTrigger>
          <TabsTrigger value="conversations">Conversazioni</TabsTrigger>
          <TabsTrigger value="analytics"><BarChart3 className="w-3.5 h-3.5 mr-1" />Analytics</TabsTrigger>
          <TabsTrigger value="integration"><Plug className="w-3.5 h-3.5 mr-1" />Integrazione</TabsTrigger>
          <TabsTrigger value="knowledge"><BookOpen className="w-3.5 h-3.5 mr-1" />Knowledge Base</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Chiamate totali", value: agent.calls_total ?? 0, icon: Phone },
              { label: "Questo mese", value: (agent as any).calls_month ?? 0, icon: Phone },
              { label: "Durata media", value: `${agent.avg_duration_sec ?? 0}s`, icon: Clock },
            ].map(stat => (
              <div key={stat.label} className="rounded-card p-4 bg-white border border-ink-200 shadow-card">
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4 text-ink-400" />
                  <span className="text-xs text-ink-400">{stat.label}</span>
                </div>
                <p className="text-xl font-bold text-ink-900">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-card p-5 space-y-3 bg-white border border-ink-200 shadow-card">
            <h3 className="text-sm font-semibold text-ink-900">Dettagli</h3>
            {[["Use Case", agent.use_case], ["Settore", agent.sector], ["Lingua", agent.language], ["Tipo", agent.type], ["ElevenLabs ID", (agent as any).el_agent_id]].map(([label, val]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-ink-400">{label}</span>
                <span className="text-ink-900">{val || "—"}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config">
          {configData && (
            <>
              <AgentConfigForm data={configData} companyId={companyId} onChange={updateConfig} />
              <div className="mt-6">
                <Button onClick={handleSave} disabled={saving} className="bg-brand hover:bg-brand-hover text-white">
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salva configurazione
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="test">
          <VoiceTestPanel elevenlabsAgentId={(agent as any).el_agent_id} companyId={companyId} />
        </TabsContent>

        <TabsContent value="conversations">
          {conversations.length === 0 ? (
            <div className="text-center py-12 text-ink-400"><p>Nessuna conversazione per questo agente.</p></div>
          ) : (
            <div className="rounded-card overflow-hidden border border-ink-200 bg-white shadow-card">
              <Table>
                <TableHeader>
                  <TableRow className="bg-ink-50">
                    <TableHead className="text-ink-500">Data</TableHead>
                    <TableHead className="text-ink-500">Numero</TableHead>
                    <TableHead className="text-ink-500">Durata</TableHead>
                    <TableHead className="text-ink-500">Esito</TableHead>
                    <TableHead className="text-ink-500">Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map(conv => (
                    <TableRow key={conv.id} className="cursor-pointer hover:bg-ink-50" onClick={() => setViewTranscript(conv)}>
                      <TableCell className="text-ink-900">{conv.started_at ? format(new Date(conv.started_at), "dd MMM HH:mm", { locale: it }) : "—"}</TableCell>
                      <TableCell className="text-ink-500">{conv.caller_number || "—"}</TableCell>
                      <TableCell className="text-ink-500">{conv.duration_sec ? `${conv.duration_sec}s` : "—"}</TableCell>
                      <TableCell className="text-ink-500">{conv.outcome || "—"}</TableCell>
                      <TableCell><Badge className="bg-ink-100 text-ink-500 border-none">{conv.status || "—"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <AgentAnalyticsTab conversations={conversations} />
        </TabsContent>

        <TabsContent value="integration">
          <AgentIntegrationTab agentId={agent.id} elAgentId={agent.el_agent_id} agentName={agent.name} />
        </TabsContent>

        <TabsContent value="knowledge">
          <AgentKnowledgeTab agentId={agent.id} companyId={companyId} />
        </TabsContent>
      </Tabs>

      <TranscriptViewer open={!!viewTranscript} onOpenChange={() => setViewTranscript(null)} transcript={viewTranscript?.transcript ?? null} agentName={agent.name} />
    </div>
  );
}
