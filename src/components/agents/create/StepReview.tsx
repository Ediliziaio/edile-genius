import { useState, useCallback, useRef, useMemo } from "react";
import { LANGUAGES } from "@/components/agents/PromptTemplates";
import { MessageSquare, Play, Square, Loader2, Mic, Volume2, FileText } from "lucide-react";
import VoiceTestPanel from "@/components/agents/VoiceTestPanel";
import AgentScoreDetail from "@/components/agents/AgentScoreDetail";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";

interface StepReviewProps {
  form: any;
  update: (key: string, value: any) => void;
  companyId?: string;
  onCreateDraft?: () => Promise<string | null>;
}

const LLM_LABELS: Record<string, string> = {
  "gpt-4o-mini": "GPT-4o Mini",
  "gpt-4o": "GPT-4o",
  "gpt-4.1-mini": "GPT-4.1 Mini",
  "gpt-4.1": "GPT-4.1",
  "claude-3.5-sonnet": "Claude 3.5 Sonnet",
  "claude-3-haiku": "Claude 3 Haiku",
  "gemini-2.0-flash": "Gemini 2.0 Flash",
};

export default function StepReview({ form, update, companyId, onCreateDraft }: StepReviewProps) {
  const { toast } = useToast();
  const langLabel = LANGUAGES.find(l => l.value === form.language)?.label || form.language;

  // TTS preview state
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Draft test state
  const [draftAgentId, setDraftAgentId] = useState<string | null>(null);
  const [creatingDraft, setCreatingDraft] = useState(false);

  const playTtsPreview = useCallback(async () => {
    if (ttsPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setTtsPlaying(false);
      return;
    }

    if (!form.first_message || !form.voice_id) {
      toast({ variant: "destructive", title: "Mancano dati", description: "Serve un messaggio di apertura e una voce selezionata." });
      return;
    }

    setTtsLoading(true);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/elevenlabs-tts`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
        },
        body: JSON.stringify({
          text: form.first_message,
          voice_id: form.voice_id,
          company_id: companyId,
          voice_settings: {
            stability: form.voice_stability ?? 0.5,
            similarity_boost: form.voice_similarity ?? 0.75,
            speed: form.voice_speed ?? 1.0,
          },
        }),
      });

      if (!response.ok) throw new Error("Errore generazione audio");

      const blob = await response.blob();
      const audioUrl = URL.createObjectURL(blob);
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => setTtsPlaying(false);
      audio.play();
      setTtsPlaying(true);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore TTS", description: err.message });
    } finally {
      setTtsLoading(false);
    }
  }, [form.first_message, form.voice_id, form.voice_stability, form.voice_similarity, form.voice_speed, companyId, ttsPlaying, toast]);

  const handleCreateDraftAndTest = useCallback(async () => {
    if (!onCreateDraft) return;
    setCreatingDraft(true);
    try {
      const elAgentId = await onCreateDraft();
      if (elAgentId) {
        setDraftAgentId(elAgentId);
        toast({ title: "Bozza creata!", description: "Ora puoi testare l'agente vocale." });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally {
      setCreatingDraft(false);
    }
  }, [onCreateDraft, toast]);

  const kbFiles = form._pendingKBFiles || [];

  // Build a pseudo-agent row for scoring from the wizard form
  const pseudoAgent = useMemo(() => ({
    id: "",
    company_id: companyId || "",
    name: form.name || "",
    description: form.description || null,
    system_prompt: form.system_prompt || null,
    first_message: form.first_message || null,
    el_voice_id: form.voice_id || null,
    el_agent_id: null,
    sector: form.sector || null,
    calls_total: 0,
    el_phone_number_id: null,
    phone_number_id: null,
    webhook_url: form.webhook_url || null,
    evaluation_criteria: form.evaluation_criteria || null,
    type: "vocal",
    status: form.status || "draft",
  } as unknown as Tables<"agents">), [form, companyId]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Rivedi e Attiva</h2>
        <p className="text-sm text-ink-400 mt-1">Controlla il riepilogo, ascolta l'anteprima e attiva il tuo agente.</p>
      </div>

      {/* Publish Mode — Prominent at top */}
      <div className="space-y-2">
        <p className="text-xs font-medium text-ink-600">Come vuoi procedere?</p>
        <div className="flex gap-3">
          {(["draft", "active"] as const).map(s => (
            <button
              key={s}
              onClick={() => update("status", s)}
              className={`flex-1 py-3 rounded-btn text-sm font-medium border transition-all ${form.status === s ? "border-brand bg-brand-light text-brand-text" : "border-ink-200 text-ink-500 bg-ink-50"}`}
            >
              {s === "draft" ? "🔒 Salva come bozza" : "🟢 Attiva subito"}
            </button>
          ))}
        </div>
      </div>

      {/* Scorecard */}
      <AgentScoreDetail agent={pseudoAgent} defaultOpen />

      {/* First Message Preview + TTS */}
      {form.first_message && (
        <div className="rounded-card border border-ink-200 bg-ink-50 p-4">
          <p className="text-[10px] font-semibold text-ink-400 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Anteprima messaggio di apertura
          </p>
          <div className="flex justify-start">
            <div className="bg-white border border-ink-200 rounded-btn rounded-bl-none px-4 py-2.5 max-w-[85%] text-sm text-ink-800 shadow-sm">
              {form.first_message}
            </div>
          </div>
          {form.voice_id && (
            <button
              onClick={playTtsPreview}
              disabled={ttsLoading}
              className="mt-3 flex items-center gap-2 px-4 py-2 rounded-btn text-xs font-medium border border-ink-200 bg-white text-ink-600 hover:bg-ink-100 transition-colors disabled:opacity-50"
            >
              {ttsLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : ttsPlaying ? (
                <Square className="w-3.5 h-3.5" />
              ) : (
                <Volume2 className="w-3.5 h-3.5" />
              )}
              {ttsLoading ? "Generazione audio..." : ttsPlaying ? "Ferma" : "Ascolta anteprima vocale"}
            </button>
          )}
        </div>
      )}

      {/* Simplified Summary */}
      <div className="rounded-card border border-ink-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-ink-50 border-b border-ink-200">
          <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide">Riepilogo</h3>
        </div>
        <div className="divide-y divide-ink-100">
          <SummaryRow label="Nome" value={form.name || "—"} />
          <SummaryRow label="Settore" value={form.sector || "—"} />
          <SummaryRow label="Lingua" value={langLabel} />
          <SummaryRow label="Modello AI" value={LLM_LABELS[form.llm_model] || form.llm_model} />
          <SummaryRow label="Voce" value={form.voice_id ? "✓ Selezionata" : "Non selezionata"} />
          {kbFiles.length > 0 && (
            <SummaryRow label="Documenti caricati" value={`${kbFiles.length} file`} />
          )}
        </div>
      </div>

      {/* Live Voice Test */}
      <div className="rounded-card border border-ink-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-ink-50 border-b border-ink-200">
          <h3 className="text-xs font-semibold text-ink-500 uppercase tracking-wide flex items-center gap-1.5">
            <Mic className="w-3 h-3" /> Prova il tuo agente
          </h3>
        </div>
        <div className="p-4">
          {draftAgentId ? (
            <VoiceTestPanel elevenlabsAgentId={draftAgentId} companyId={companyId || ""} />
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="w-16 h-16 rounded-full bg-ink-100 flex items-center justify-center">
                <Mic className="w-7 h-7 text-ink-300" />
              </div>
              <div className="text-center">
                <p className="text-sm text-ink-600 font-medium">Testa il tuo agente in tempo reale</p>
                <p className="text-xs text-ink-400 mt-1">Creeremo una bozza per farti provare la conversazione vocale.</p>
              </div>
              <button
                onClick={handleCreateDraftAndTest}
                disabled={creatingDraft || !form.name || !form.system_prompt}
                className="px-5 py-2.5 rounded-btn text-sm font-medium bg-brand text-white hover:bg-brand-hover transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {creatingDraft && <Loader2 className="w-4 h-4 animate-spin" />}
                {creatingDraft ? "Creazione bozza..." : "Prova il tuo agente"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between px-4 py-2.5 text-sm">
      <span className="text-ink-400">{label}</span>
      <span className="text-ink-900 font-medium">{value}</span>
    </div>
  );
}
