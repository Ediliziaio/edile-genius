import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { PROMPT_TEMPLATES, type UseCaseId } from "@/components/agents/PromptTemplates";
import AgentStepSidebar from "@/components/agents/create/AgentStepSidebar";
import StepAgent from "@/components/agents/create/StepAgent";
import StepVoice from "@/components/agents/create/StepVoice";
import StepConversation from "@/components/agents/create/StepConversation";
import StepAdvanced from "@/components/agents/create/StepAdvanced";
import StepReview from "@/components/agents/create/StepReview";
import { Progress } from "@/components/ui/progress";
import type { AgentForm, CustomTool } from "./CreateAgent.types";

/* ── Slug → type mapping ───────────────────────────── */

const VOCAL_SLUGS = ["vocale-custom", "qualifica-inbound", "richiamo-outbound", "prenotazione-appuntamenti", "assistenza-post-vendita"];
const RENDER_SLUGS = ["render-infissi"];

function getAgentType(slug: string): string {
  if (VOCAL_SLUGS.includes(slug)) return "vocal";
  if (RENDER_SLUGS.includes(slug)) return "render";
  if (slug.startsWith("assistente-whatsapp") || slug.includes("whatsapp")) return "whatsapp";
  return "vocal";
}

function getTemplateLabel(slug: string): string {
  const labels: Record<string, string> = {
    "vocale-custom": "Agente Vocale Personalizzato",
    "qualifica-inbound": "Qualifica Lead Inbound",
    "richiamo-outbound": "Richiamo Clienti (Outbound)",
    "prenotazione-appuntamenti": "Prenotazione Appuntamenti",
    "assistenza-post-vendita": "Assistenza Post-Vendita",
    "render-infissi": "Render Infissi AI",
    "assistente-whatsapp": "Assistente WhatsApp",
  };
  return labels[slug] || slug;
}

function getTypeBadge(type: string) {
  switch (type) {
    case "vocal": return { emoji: "🎙️", label: "AGENTE VOCALE", cls: "bg-brand-light text-brand-text" };
    case "render": return { emoji: "🎨", label: "AGENTE RENDER", cls: "bg-settore-ristr-bg text-settore-ristr" };
    case "whatsapp": return { emoji: "💬", label: "AGENTE WHATSAPP", cls: "bg-[hsl(142,60%,94%)] text-[hsl(142,70%,30%)]" };
    default: return { emoji: "⚙️", label: "AGENTE", cls: "bg-ink-100 text-ink-500" };
  }
}

/* ── Default form ──────────────────────────────────── */

const defaultForm: AgentForm = {
  use_case: null, name: "", description: "", sector: "", language: "it",
  additional_languages: [],
  voice_id: "", system_prompt: "", first_message: "", temperature: 0.7, status: "draft",
  llm_model: "gpt-4o-mini",
  turn_timeout_sec: 10, soft_timeout_sec: -1, soft_timeout_message: "",
  interruptions_enabled: true, turn_eagerness: "normal",
  max_duration_sec: 600, end_call_enabled: false, end_call_prompt: "",
  language_detection_enabled: false,
  voice_stability: 0.5, voice_similarity: 0.75, voice_speed: 1.0,
  evaluation_criteria: "", data_retention: true,
  webhook_url: "", custom_tools: [],
  pii_redaction: false, blocked_topics: "",
};

function validateStep(step: number, form: AgentForm): boolean {
  switch (step) {
    case 0: return !!form.name.trim() && !!form.system_prompt.trim();
    case 1: return !!form.voice_id;
    default: return true;
  }
}

function getCompletionPercent(form: AgentForm): number {
  let score = 0;
  const total = 7;
  if (form.name.trim()) score++;
  if (form.system_prompt.trim()) score++;
  if (form.voice_id) score++;
  if (form.first_message.trim()) score++;
  if (form.description.trim()) score++;
  if (form.sector) score++;
  if (form.use_case) score++;
  return Math.round((score / total) * 100);
}

/* ── Component ─────────────────────────────────────── */

export default function AgentTemplateWizard() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const companyId = useCompanyId();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AgentForm>(defaultForm);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(1);

  const update = useCallback((key: string, value: any) => setForm(f => ({ ...f, [key]: value })), []);

  const selectUseCase = useCallback((id: UseCaseId) => {
    const template = PROMPT_TEMPLATES[id];
    setForm(f => ({
      ...f,
      use_case: id,
      system_prompt: f.system_prompt || template.system_prompt,
      first_message: f.first_message || template.first_message,
    }));
  }, []);

  const agentType = getAgentType(slug || "");
  const typeBadge = getTypeBadge(agentType);

  // For render agents, redirect to render wizard
  useEffect(() => {
    if (agentType === "render") {
      navigate("/app/render/new", { replace: true });
    }
  }, [agentType, navigate]);

  if (agentType === "render") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const validatedSteps = new Set<number>();
  for (let i = 0; i <= 4; i++) {
    if (validateStep(i, form)) validatedSteps.add(i);
  }

  const goToStep = (next: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const canAdvance = validateStep(step, form);
  const canSubmit = !!form.name && !!form.system_prompt;

  const buildConfig = () => ({
    temperature: form.temperature, llm_model: form.llm_model,
    turn_timeout_sec: form.turn_timeout_sec, soft_timeout_sec: form.soft_timeout_sec,
    soft_timeout_message: form.soft_timeout_message,
    interruptions_enabled: form.interruptions_enabled, turn_eagerness: form.turn_eagerness,
    max_duration_sec: form.max_duration_sec, end_call_enabled: form.end_call_enabled,
    end_call_prompt: form.end_call_prompt, language_detection_enabled: form.language_detection_enabled,
    voice_stability: form.voice_stability, voice_similarity: form.voice_similarity,
    voice_speed: form.voice_speed, evaluation_criteria: form.evaluation_criteria,
    data_retention: form.data_retention, webhook_url: form.webhook_url,
    custom_tools: form.custom_tools, pii_redaction: form.pii_redaction,
    blocked_topics: form.blocked_topics,
  });

  const handleSubmit = async () => {
    if (!companyId) return;
    setSubmitting(true);
    try {
      const body = {
        company_id: companyId, name: form.name, description: form.description,
        use_case: form.use_case, sector: form.sector, language: form.language,
        additional_languages: form.additional_languages,
        voice_id: form.voice_id, system_prompt: form.system_prompt,
        first_message: form.first_message, status: form.status, config: buildConfig(),
        type: agentType,
      };
      const { data, error } = await supabase.functions.invoke("create-elevenlabs-agent", { body });
      if (error || data?.error) throw new Error(data?.error || "Errore creazione agente");

      // Upload KB files
      const files = form._pendingKBFiles;
      if (files?.length && data?.agent?.id) {
        const session = (await supabase.auth.getSession()).data.session;
        for (const file of files) {
          const path = `${companyId}/${data.agent.id}/${file.name}`;
          await supabase.storage.from("knowledge-base").upload(path, file);
          await supabase.from("knowledge_base_files").insert({
            agent_id: data.agent.id, company_id: companyId,
            file_name: file.name, file_path: path,
            file_size: file.size, file_type: file.name.split(".").pop() || null,
            uploaded_by: session?.user?.id || null,
          });
        }
      }

      toast({ title: "Agente creato!", description: `${form.name} è stato creato con successo.` });
      const newAgentId = data?.agent?.id;
      navigate(newAgentId ? `/app/agents/${newAgentId}` : "/app/agents");
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDraft = async (): Promise<string | null> => {
    try {
      const body = {
        company_id: companyId, name: form.name, description: form.description,
        use_case: form.use_case, sector: form.sector, language: form.language,
        additional_languages: form.additional_languages,
        voice_id: form.voice_id, system_prompt: form.system_prompt,
        first_message: form.first_message, status: "draft", config: buildConfig(),
        type: agentType,
      };
      const { data, error } = await supabase.functions.invoke("create-elevenlabs-agent", { body });
      if (error || data?.error) throw new Error(data?.error || "Errore creazione agente");
      return data?.el_agent_id || null;
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
      return null;
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  const completionPercent = getCompletionPercent(form);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate("/app/agents/new")}
          className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Scegli Template
        </button>

        {/* Template banner */}
        <div className={`${typeBadge.cls} border rounded-lg px-4 py-2.5 mb-4 flex items-center gap-3`}>
          <span className="text-xs font-mono font-bold">{typeBadge.emoji} {typeBadge.label}</span>
          <span className="text-sm text-foreground/80">Template: {getTemplateLabel(slug || "")}</span>
          <span className="text-xs text-foreground/50 ml-auto hidden sm:inline">Puoi modificare tutto durante la configurazione</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink-900">Crea Agente</h1>
            <p className="text-xs text-ink-400">Configura il tuo agente AI con voce naturale</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-ink-400 mb-1">{completionPercent}% completato</p>
            <Progress value={completionPercent} className="w-32 h-1.5" />
          </div>
        </div>
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="flex gap-6">
        <AgentStepSidebar currentStep={step} onStepChange={goToStep} completedSteps={completedSteps} validatedSteps={validatedSteps} />
        <div className="flex-1 min-w-0">
          <div className="rounded-card p-6 border border-border bg-card shadow-card min-h-[500px]">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.2, ease: "easeOut" }}
              >
                {step === 0 && <StepAgent form={form} update={update} selectUseCase={selectUseCase} />}
                {step === 1 && companyId && <StepVoice companyId={companyId} form={form} update={update} />}
                {step === 2 && <StepConversation form={form} update={update} />}
                {step === 3 && <StepAdvanced form={form} update={update} />}
                {step === 4 && <StepReview form={form} update={update} companyId={companyId || undefined} onCreateDraft={handleCreateDraft} />}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex justify-between mt-4">
            <button
              onClick={() => step > 0 && goToStep(step - 1)}
              disabled={step === 0}
              className="px-4 py-2.5 rounded-btn text-sm font-medium disabled:opacity-30 bg-ink-100 text-ink-600 hover:bg-ink-200"
            >
              Indietro
            </button>
            {step < 4 ? (
              <button
                onClick={() => goToStep(step + 1)}
                disabled={!canAdvance}
                className="px-6 py-2.5 rounded-btn text-sm font-medium bg-brand text-white hover:bg-brand-hover disabled:opacity-40 transition-opacity"
              >
                Avanti
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={submitting || !canSubmit}
                className="px-6 py-2.5 rounded-btn text-sm font-medium disabled:opacity-50 bg-brand text-white hover:bg-brand-hover flex items-center gap-2"
              >
                {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                {submitting ? "Creazione..." : "Crea Agente"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
