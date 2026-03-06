import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { ArrowLeft, Save, Loader2, Power, Phone, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentConfigForm, { type AgentConfigData } from "@/components/agents/AgentConfigForm";
import VoiceTestPanel from "@/components/agents/VoiceTestPanel";
import TranscriptViewer from "@/components/conversations/TranscriptViewer";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Tables } from "@/integrations/supabase/types";

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const companyId = profile?.company_id || "";

  const [saving, setSaving] = useState(false);
  const [configData, setConfigData] = useState<AgentConfigData | null>(null);
  const [viewTranscript, setViewTranscript] = useState<Tables<"conversations"> | null>(null);

  const { data: agent, isLoading } = useQuery({
    queryKey: ["agent", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase.from("agents").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ["agent-conversations", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*")
        .eq("agent_id", id!)
        .order("started_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data;
    },
  });

  // Init config data from agent
  if (agent && !configData) {
    const cfg = (agent.config && typeof agent.config === "object" && !Array.isArray(agent.config)) ? agent.config as Record<string, unknown> : {};
    setConfigData({
      name: agent.name,
      description: agent.description || "",
      sector: agent.sector || "",
      language: agent.language || "it",
      voice_id: agent.elevenlabs_voice_id || "",
      system_prompt: agent.system_prompt || "",
      first_message: agent.first_message || "",
      temperature: typeof cfg.temperature === "number" ? cfg.temperature : 0.7,
    });
  }

  const updateConfig = <K extends keyof AgentConfigData>(key: K, value: AgentConfigData[K]) => {
    setConfigData(prev => prev ? { ...prev, [key]: value } : prev);
  };

  const handleSave = async () => {
    if (!configData || !id) return;
    setSaving(true);
    try {
      const { error } = await supabase.functions.invoke("update-agent", {
        body: {
          id,
          name: configData.name,
          description: configData.description,
          sector: configData.sector,
          language: configData.language,
          elevenlabs_voice_id: configData.voice_id,
          system_prompt: configData.system_prompt,
          first_message: configData.first_message,
          config: { temperature: configData.temperature },
        },
      });
      if (error) throw error;
      toast({ title: "Salvato", description: "Configurazione aggiornata." });
      queryClient.invalidateQueries({ queryKey: ["agent", id] });
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async () => {
    if (!agent) return;
    const newStatus = agent.status === "active" ? "draft" : "active";
    await supabase.functions.invoke("update-agent", { body: { id: agent.id, status: newStatus } });
    queryClient.invalidateQueries({ queryKey: ["agent", id] });
    toast({ title: newStatus === "active" ? "Agente attivato" : "Agente disattivato" });
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" style={{ color: "hsl(var(--app-brand))" }} /></div>;
  }

  if (!agent) {
    return <div className="p-8 text-center" style={{ color: "hsl(var(--app-text-secondary))" }}>Agente non trovato.</div>;
  }

  const isActive = agent.status === "active";

  return (
    <div className="p-6 md:p-8 max-w-5xl">
      {/* Header */}
      <button onClick={() => navigate("/app/agents")} className="flex items-center gap-1 text-sm mb-6 hover:opacity-80" style={{ color: "hsl(var(--app-text-secondary))" }}>
        <ArrowLeft className="w-4 h-4" /> Torna agli agenti
      </button>

      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>{agent.name}</h1>
            <Badge style={{ backgroundColor: isActive ? "hsl(var(--app-success) / 0.15)" : "hsl(var(--app-bg-tertiary))", color: isActive ? "hsl(var(--app-success))" : "hsl(var(--app-text-tertiary))", border: "none" }}>
              {isActive ? "Attivo" : agent.status}
            </Badge>
          </div>
          {agent.description && <p className="text-sm" style={{ color: "hsl(var(--app-text-secondary))" }}>{agent.description}</p>}
        </div>
        <Button variant="outline" size="sm" onClick={toggleStatus} className="border-none" style={{ backgroundColor: "hsl(var(--app-bg-tertiary))", color: "hsl(var(--app-text-primary))" }}>
          <Power className="w-4 h-4 mr-1" /> {isActive ? "Disattiva" : "Attiva"}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="border-none" style={{ backgroundColor: "hsl(var(--app-bg-tertiary))" }}>
          <TabsTrigger value="overview">Panoramica</TabsTrigger>
          <TabsTrigger value="config">Configurazione</TabsTrigger>
          <TabsTrigger value="test">Test Vocale</TabsTrigger>
          <TabsTrigger value="conversations">Conversazioni</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { label: "Chiamate totali", value: agent.calls_total ?? 0, icon: Phone },
              { label: "Questo mese", value: agent.calls_this_month ?? 0, icon: Phone },
              { label: "Durata media", value: `${agent.avg_duration_sec ?? 0}s`, icon: Clock },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl p-4" style={{ backgroundColor: "hsl(var(--app-bg-secondary))", border: "1px solid hsl(var(--app-border-subtle))" }}>
                <div className="flex items-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4" style={{ color: "hsl(var(--app-text-tertiary))" }} />
                  <span className="text-xs" style={{ color: "hsl(var(--app-text-tertiary))" }}>{stat.label}</span>
                </div>
                <p className="text-xl font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-5 space-y-3" style={{ backgroundColor: "hsl(var(--app-bg-secondary))", border: "1px solid hsl(var(--app-border-subtle))" }}>
            <h3 className="text-sm font-semibold" style={{ color: "hsl(var(--app-text-primary))" }}>Dettagli</h3>
            {[
              ["Use Case", agent.use_case],
              ["Settore", agent.sector],
              ["Lingua", agent.language],
              ["Tipo", agent.type],
              ["ElevenLabs ID", agent.elevenlabs_agent_id],
            ].map(([label, val]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span style={{ color: "hsl(var(--app-text-tertiary))" }}>{label}</span>
                <span style={{ color: "hsl(var(--app-text-primary))" }}>{val || "—"}</span>
              </div>
            ))}
          </div>
        </TabsContent>

        {/* Config */}
        <TabsContent value="config">
          {configData && (
            <>
              <AgentConfigForm data={configData} companyId={companyId} onChange={updateConfig} />
              <div className="mt-6">
                <Button onClick={handleSave} disabled={saving} style={{ backgroundColor: "hsl(var(--app-brand))", color: "#000" }}>
                  {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                  Salva configurazione
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Test */}
        <TabsContent value="test">
          <VoiceTestPanel elevenlabsAgentId={agent.elevenlabs_agent_id} companyId={companyId} />
        </TabsContent>

        {/* Conversations */}
        <TabsContent value="conversations">
          {conversations.length === 0 ? (
            <div className="text-center py-12" style={{ color: "hsl(var(--app-text-tertiary))" }}>
              <p>Nessuna conversazione per questo agente.</p>
            </div>
          ) : (
            <div className="rounded-xl overflow-hidden" style={{ border: "1px solid hsl(var(--app-border-subtle))" }}>
              <Table>
                <TableHeader>
                  <TableRow style={{ backgroundColor: "hsl(var(--app-bg-tertiary))" }}>
                    <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Data</TableHead>
                    <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Numero</TableHead>
                    <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Durata</TableHead>
                    <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Esito</TableHead>
                    <TableHead style={{ color: "hsl(var(--app-text-secondary))" }}>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversations.map(conv => (
                    <TableRow
                      key={conv.id}
                      className="cursor-pointer"
                      onClick={() => setViewTranscript(conv)}
                      style={{ backgroundColor: "hsl(var(--app-bg-secondary))" }}
                    >
                      <TableCell style={{ color: "hsl(var(--app-text-primary))" }}>
                        {conv.started_at ? format(new Date(conv.started_at), "dd MMM HH:mm", { locale: it }) : "—"}
                      </TableCell>
                      <TableCell style={{ color: "hsl(var(--app-text-secondary))" }}>{conv.caller_number || "—"}</TableCell>
                      <TableCell style={{ color: "hsl(var(--app-text-secondary))" }}>{conv.duration_sec ? `${conv.duration_sec}s` : "—"}</TableCell>
                      <TableCell style={{ color: "hsl(var(--app-text-secondary))" }}>{conv.outcome || "—"}</TableCell>
                      <TableCell>
                        <Badge style={{ backgroundColor: "hsl(var(--app-bg-tertiary))", color: "hsl(var(--app-text-secondary))", border: "none" }}>
                          {conv.status || "—"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <TranscriptViewer
        open={!!viewTranscript}
        onOpenChange={() => setViewTranscript(null)}
        transcript={viewTranscript?.transcript ?? null}
        agentName={agent.name}
      />
    </div>
  );
}
