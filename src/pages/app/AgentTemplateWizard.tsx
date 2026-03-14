import { useParams, useNavigate } from "react-router-dom";
import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useCompanyId } from "@/hooks/useCompanyId";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, AlertCircle, ShieldAlert } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { motion, AnimatePresence } from "framer-motion";
import { PROMPT_TEMPLATES, type UseCaseId } from "@/components/agents/PromptTemplates";
import AgentStepSidebar from "@/components/agents/create/AgentStepSidebar";
import StepAgent from "@/components/agents/create/StepAgent";
import StepVoice from "@/components/agents/create/StepVoice";
import StepSettings from "@/components/agents/create/StepSettings";
import StepReview from "@/components/agents/create/StepReview";
import { Progress } from "@/components/ui/progress";
import type { AgentForm, CustomTool } from "./CreateAgent.types";

const VOCAL_SLUGS = [
  "vocale-custom", "richiama-lead-ads", "qualifica-serramenti", "qualifica-ristrutturazione",
  "qualifica-fotovoltaico", "conferma-appuntamenti", "recupera-preventivi", "recupera-noshow",
  "followup-sopralluogo", "raccolta-recensioni", "verifica-soddisfazione",
  // legacy slugs
  "qualifica-infissi", "inbound-campagne", "conferma-sopralluogo",
  "recupero-preventivi", "recupero-noshow", "recensioni-post-lavoro",
];
const RENDER_SLUGS = ["render-infissi", "render-bagno", "render-facciate", "render-persiane", "render-pavimento", "render-stanza"];
const WHATSAPP_SLUGS = [
  "primo-contatto-wa", "followup-preventivi-wa", "assistente-whatsapp",
  "whatsapp-preventivi",
];

function getAgentType(slug: string): string {
  if (WHATSAPP_SLUGS.includes(slug) || slug.includes("whatsapp") || slug.includes("-wa")) return "whatsapp";
  if (VOCAL_SLUGS.includes(slug)) return "vocal";
  if (RENDER_SLUGS.includes(slug)) return "render";
  return "vocal";
}

function getTemplateLabel(slug: string): string {
  const labels: Record<string, string> = {
    "vocale-custom": "Agente Vocale Personalizzato",
    "richiama-lead-ads": "Richiama Lead da Campagne",
    "qualifica-serramenti": "Qualifica Lead Serramenti",
    "qualifica-ristrutturazione": "Qualifica Lead Ristrutturazione",
    "qualifica-fotovoltaico": "Qualifica Lead Fotovoltaico",
    "conferma-appuntamenti": "Conferma Appuntamenti",
    "recupera-preventivi": "Recupera Preventivi Fermi",
    "recupera-noshow": "Recupera No-Show",
    "followup-sopralluogo": "Follow-up Dopo Sopralluogo",
    "followup-preventivi-wa": "Follow-up Preventivi WhatsApp",
    "assistente-whatsapp": "Assistente WhatsApp Commerciale",
    "primo-contatto-wa": "Primo Contatto Lead WhatsApp",
    "raccolta-recensioni": "Raccolta Recensioni",
    "verifica-soddisfazione": "Verifica Soddisfazione Post-Lavoro",
    "render-infissi": "Render Infissi AI",
    // legacy
    "qualifica-infissi": "Qualifica Lead Serramenti",
    "inbound-campagne": "Richiama Lead da Campagne",
    "conferma-sopralluogo": "Conferma Appuntamenti",
    "recupero-preventivi": "Recupera Preventivi Fermi",
    "recupero-noshow": "Recupera No-Show",
    "recensioni-post-lavoro": "Raccolta Recensioni",
    "whatsapp-preventivi": "Follow-up Preventivi WhatsApp",
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

const SLUG_TO_USE_CASE: Record<string, UseCaseId> = {
  "richiama-lead-ads": "inbound_campagne",
  "qualifica-serramenti": "qualifica_infissi",
  "qualifica-ristrutturazione": "qualifica_ristrutturazione",
  "qualifica-fotovoltaico": "qualifica_fotovoltaico",
  "conferma-appuntamenti": "conferma_sopralluogo",
  "recupera-preventivi": "recupero_preventivi",
  "recupera-noshow": "recupero_noshow",
  "followup-sopralluogo": "followup_sopralluogo",
  "followup-preventivi-wa": "assistente_whatsapp",
  "assistente-whatsapp": "assistente_whatsapp",
  "primo-contatto-wa": "primo_contatto_wa",
  "raccolta-recensioni": "recensioni",
  "verifica-soddisfazione": "verifica_soddisfazione",
  // legacy
  "qualifica-infissi": "qualifica_infissi",
  "inbound-campagne": "inbound_campagne",
  "conferma-sopralluogo": "conferma_sopralluogo",
  "recupero-preventivi": "recupero_preventivi",
  "recupero-noshow": "recupero_noshow",
  "recensioni-post-lavoro": "recensioni",
  "whatsapp-preventivi": "assistente_whatsapp",
};

/* ── Default form ──────────────────────────────────── */

const defaultForm: AgentForm = {
  use_case: null, name: "", description: "", sector: "", language: "it",
  additional_languages: [],
  voice_id: "", system_prompt: "", first_message: "", temperature: 0.7, status: "active",
  llm_model: "gpt-4o-mini", tts_model: "eleven_turbo_v2_5", llm_backup_model: "",
  turn_timeout_sec: 10, soft_timeout_sec: -1, soft_timeout_message: "",
  interruptions_enabled: true, turn_eagerness: "normal",
  max_duration_sec: 600, end_call_enabled: false, end_call_prompt: "",
  language_detection_enabled: false,
  voice_stability: 0.5, voice_similarity: 0.75, voice_speed: 1.0,
  evaluation_criteria: "", evaluation_prompt: "", data_retention: true,
  webhook_url: "", custom_tools: [],
  pii_redaction: false, blocked_topics: "",
  asr_quality: "high", asr_keywords: [], silence_end_call_timeout: 20,
  speculative_turn: false, dynamic_variables: [], built_in_tools: {},
  transfer_number: "", monitoring_enabled: false, outbound_enabled: false,
};

const TOTAL_STEPS = 4;

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
  const queryClient = useQueryClient();
  const companyId = useCompanyId();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AgentForm>(() => {
    const useCaseId = SLUG_TO_USE_CASE[slug || ""];
    if (useCaseId && PROMPT_TEMPLATES[useCaseId]) {
      const tpl = PROMPT_TEMPLATES[useCaseId];
      return {
        ...defaultForm,
        use_case: useCaseId,
        name: getTemplateLabel(slug || ""),
        system_prompt: tpl.system_prompt,
        first_message: tpl.first_message,
      };
    }
    return defaultForm;
  });
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [direction, setDirection] = useState(1);
  const [showAbandonDialog, setShowAbandonDialog] = useState(false);

  const isDirty = form.name !== defaultForm.name || form.system_prompt !== defaultForm.system_prompt || !!form.voice_id;

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

  const RENDER_ROUTES: Record<string, string> = {
    "render-infissi": "/app/render/new",
    "render-bagno": "/app/render-bagno/new",
    "render-facciate": "/app/render-facciata/new",
    "render-persiane": "/app/render-persiane/new",
    "render-pavimento": "/app/render-pavimento/new",
    "render-stanza": "/app/render-stanza/new",
  };

  useEffect(() => {
    if (agentType === "render") {
      navigate(RENDER_ROUTES[slug || ""] || "/app/render/new", { replace: true });
    } else if (agentType === "whatsapp") {
      navigate("/app/whatsapp", { replace: true });
    }
  }, [agentType, navigate, slug]);

  if (agentType === "render" || agentType === "whatsapp") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const lastStep = TOTAL_STEPS - 1;

  const validatedSteps = new Set<number>();
  for (let i = 0; i <= lastStep; i++) {
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
    if (!companyId) {
      toast({ title: "Nessuna azienda selezionata", description: "Devi impersonare un'azienda prima di creare un agente.", variant: "destructive" });
      return;
    }
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

      toast({ title: "Agente creato! 🎉", description: `${form.name} è pronto.` });
      await queryClient.invalidateQueries({ queryKey: ["company-agents"] });
      const newAgentId = data?.agent?.id;
      navigate(newAgentId ? `/app/agents/${newAgentId}` : "/app/agents");
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateDraft = async (): Promise<string | null> => {
    if (!companyId) {
      toast({ title: "Nessuna azienda selezionata", description: "Devi impersonare un'azienda prima di creare un agente.", variant: "destructive" });
      return null;
    }
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
          onClick={() => isDirty ? setShowAbandonDialog(true) : navigate("/app/agents/new")}
          className="flex items-center gap-1.5 text-sm text-ink-500 hover:text-ink-700 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4" /> Torna ai template
        </button>

        {/* Template banner */}
        <div className={`${typeBadge.cls} border rounded-lg px-4 py-2.5 mb-4 flex items-center gap-3`}>
          <span className="text-xs font-mono font-bold">{typeBadge.emoji} {typeBadge.label}</span>
          <span className="text-sm text-foreground/80">Template: {getTemplateLabel(slug || "")}</span>
          <span className="text-xs text-foreground/50 ml-auto hidden sm:inline">Puoi modificare tutto durante la configurazione</span>
        </div>

        {/* Missing company warning for superadmins */}
        {!companyId && (
          <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-lg border border-destructive/30 bg-destructive/5 text-destructive">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <div className="text-sm">
              <strong>Nessuna azienda selezionata.</strong>{" "}
              <span className="text-destructive/80">Devi impersonare un'azienda dalla sezione SuperAdmin prima di poter creare un agente.</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-ink-900">Configura il tuo agente</h1>
            <p className="text-xs text-ink-400">Completa i dati essenziali per attivarlo</p>
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
                {step === 2 && <StepSettings form={form} update={update} />}
                {step === 3 && <StepReview form={form} update={update} companyId={companyId || undefined} onCreateDraft={handleCreateDraft} />}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Voice validation hint */}
          {step === 1 && !form.voice_id && completedSteps.has(1) && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-status-warning-light text-status-warning text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" /> Seleziona una voce per continuare
            </div>
          )}

          <div className="flex justify-between mt-4">
            <button
              onClick={() => step > 0 ? goToStep(step - 1) : isDirty ? setShowAbandonDialog(true) : navigate("/app/agents/new")}
              className="px-4 py-2.5 rounded-btn text-sm font-medium bg-ink-100 text-ink-600 hover:bg-ink-200"
            >
              {step === 0 ? "Annulla" : "Indietro"}
            </button>
            {step < lastStep ? (
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
                {submitting ? "Creazione..." : form.status === "active" ? "Attiva Agente" : "Crea Agente"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Abandon confirmation */}
      <AlertDialog open={showAbandonDialog} onOpenChange={setShowAbandonDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Abbandonare la configurazione?</AlertDialogTitle>
            <AlertDialogDescription>
              Le modifiche non salvate andranno perse. Vuoi davvero uscire?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continua a configurare</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate("/app/agents/new")} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Esci senza salvare
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
