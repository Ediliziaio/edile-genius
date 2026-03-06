import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
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

interface AgentForm {
  use_case: UseCaseId | null;
  name: string;
  description: string;
  sector: string;
  language: string;
  voice_id: string;
  system_prompt: string;
  first_message: string;
  temperature: number;
  status: "active" | "draft";
  llm_model: string;
  turn_timeout_sec: number;
  soft_timeout_sec: number;
  soft_timeout_message: string;
  interruptions_enabled: boolean;
  turn_eagerness: string;
  max_duration_sec: number;
  end_call_enabled: boolean;
  end_call_prompt: string;
  language_detection_enabled: boolean;
  voice_stability: number;
  voice_similarity: number;
  voice_speed: number;
  evaluation_criteria: string;
  data_retention: boolean;
}

const defaultForm: AgentForm = {
  use_case: null, name: "", description: "", sector: "", language: "it",
  voice_id: "", system_prompt: "", first_message: "", temperature: 0.7, status: "draft",
  llm_model: "gpt-4o-mini",
  turn_timeout_sec: 10, soft_timeout_sec: -1, soft_timeout_message: "",
  interruptions_enabled: true, turn_eagerness: "normal",
  max_duration_sec: 600, end_call_enabled: false, end_call_prompt: "",
  language_detection_enabled: false,
  voice_stability: 0.5, voice_similarity: 0.75, voice_speed: 1.0,
  evaluation_criteria: "", data_retention: true,
};

export default function CreateAgent() {
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

  const goToStep = (next: number) => {
    setCompletedSteps(prev => new Set([...prev, step]));
    setDirection(next > step ? 1 : -1);
    setStep(next);
  };

  const canSubmit = !!form.name && !!form.system_prompt;

  const buildConfig = () => ({
    temperature: form.temperature,
    llm_model: form.llm_model,
    turn_timeout_sec: form.turn_timeout_sec,
    soft_timeout_sec: form.soft_timeout_sec,
    soft_timeout_message: form.soft_timeout_message,
    interruptions_enabled: form.interruptions_enabled,
    turn_eagerness: form.turn_eagerness,
    max_duration_sec: form.max_duration_sec,
    end_call_enabled: form.end_call_enabled,
    end_call_prompt: form.end_call_prompt,
    language_detection_enabled: form.language_detection_enabled,
    voice_stability: form.voice_stability,
    voice_similarity: form.voice_similarity,
    voice_speed: form.voice_speed,
    evaluation_criteria: form.evaluation_criteria,
    data_retention: form.data_retention,
  });

  const createAgent = async (statusOverride?: string) => {
    if (!companyId) return null;
    const body = {
      company_id: companyId, name: form.name, description: form.description,
      use_case: form.use_case, sector: form.sector, language: form.language,
      voice_id: form.voice_id, system_prompt: form.system_prompt,
      first_message: form.first_message, status: statusOverride || form.status, config: buildConfig(),
    };
    const { data, error } = await supabase.functions.invoke("create-elevenlabs-agent", { body });
    if (error || data?.error) throw new Error(data?.error || "Errore creazione agente");
    return data;
  };

  const handleCreateDraft = async (): Promise<string | null> => {
    try {
      const data = await createAgent("draft");
      return data?.el_agent_id || null;
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
      return null;
    }
  };

  const handleSubmit = async () => {
    if (!companyId) return;
    setSubmitting(true);
    try {
      await createAgent();
      toast({ title: "Agente creato!", description: `${form.name} è stato creato con successo.` });
      navigate("/app/agents");
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const variants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -40 : 40, opacity: 0 }),
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/agents")} className="p-2 rounded-btn bg-ink-100 hover:bg-ink-200 transition-colors">
          <ArrowLeft className="w-4 h-4 text-ink-500" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-ink-900">Crea Agente Vocale</h1>
          <p className="text-xs text-ink-400">Configura il tuo agente AI con voce naturale</p>
        </div>
      </div>

      {/* Layout: Sidebar + Content */}
      <div className="flex gap-6">
        <AgentStepSidebar currentStep={step} onStepChange={goToStep} completedSteps={completedSteps} />

        <div className="flex-1 min-w-0">
          <div className="rounded-card p-6 border border-ink-200 bg-white shadow-card min-h-[500px]">
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

          {/* Navigation */}
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
                className="px-6 py-2.5 rounded-btn text-sm font-medium bg-brand text-white hover:bg-brand-hover"
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
