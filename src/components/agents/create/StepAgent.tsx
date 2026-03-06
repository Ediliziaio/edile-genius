import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UseCaseSelector from "@/components/agents/UseCaseSelector";
import { SECTORS, LANGUAGES, type UseCaseId } from "@/components/agents/PromptTemplates";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle, X } from "lucide-react";
import React from "react";

const LLM_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (default)" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

interface StepAgentProps {
  form: any;
  update: (key: string, value: any) => void;
  selectUseCase: (id: UseCaseId) => void;
}

const Tip = React.forwardRef<HTMLSpanElement, { text: string }>(({ text }, ref) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <span ref={ref} className="inline-flex items-center ml-1 cursor-help">
          <HelpCircle className="w-3.5 h-3.5 text-ink-300" />
        </span>
      </TooltipTrigger>
      <TooltipContent className="max-w-[240px] text-xs">{text}</TooltipContent>
    </Tooltip>
  </TooltipProvider>
));
Tip.displayName = "Tip";

export default function StepAgent({ form, update, selectUseCase }: StepAgentProps) {
  const additionalLangs: string[] = form.additional_languages || [];

  const toggleAdditionalLang = (val: string) => {
    if (val === form.language) return;
    const updated = additionalLangs.includes(val)
      ? additionalLangs.filter((l: string) => l !== val)
      : [...additionalLangs, val];
    update("additional_languages", updated);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Identità Agente</h2>
        <p className="text-sm text-ink-400 mt-1">Definisci chi è il tuo agente vocale e come si comporta.</p>
      </div>

      {/* Use Case */}
      <div className="space-y-2">
        <Label className="text-ink-600">Caso d'uso <Tip text="Seleziona il template per pre-compilare prompt e primo messaggio." /></Label>
        <UseCaseSelector selected={form.use_case} onSelect={selectUseCase} />
      </div>

      {/* Name + Description */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-ink-600">Nome agente *</Label>
          <Input value={form.name} onChange={e => update("name", e.target.value)} placeholder="Es. Assistente Vendite" className="border border-ink-200 bg-ink-50 text-ink-900" />
        </div>
        <div className="space-y-2">
          <Label className="text-ink-600">Settore</Label>
          <Select value={form.sector} onValueChange={v => update("sector", v)}>
            <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue placeholder="Seleziona settore" /></SelectTrigger>
            <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-ink-600">Descrizione</Label>
        <Textarea value={form.description} onChange={e => update("description", e.target.value)} placeholder="Breve descrizione del ruolo dell'agente..." className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[80px]" />
      </div>

      {/* Language + LLM */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-ink-600">Lingua principale</Label>
          <Select value={form.language} onValueChange={v => update("language", v)}>
            <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue /></SelectTrigger>
            <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-ink-600">Modello LLM <Tip text="Il modello di linguaggio che alimenta l'agente. GPT-4o Mini è il migliore rapporto qualità/costo." /></Label>
          <Select value={form.llm_model} onValueChange={v => update("llm_model", v)}>
            <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue /></SelectTrigger>
            <SelectContent>{LLM_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* Additional Languages */}
      <div className="space-y-2">
        <Label className="text-ink-600">Lingue aggiuntive <Tip text="L'agente potrà rispondere anche in queste lingue se rileva che l'utente le parla." /></Label>
        <div className="flex flex-wrap gap-2">
          {LANGUAGES.filter(l => l.value !== form.language).map(l => {
            const isSelected = additionalLangs.includes(l.value);
            return (
              <button
                key={l.value}
                type="button"
                onClick={() => toggleAdditionalLang(l.value)}
                className={`px-3 py-1.5 rounded-btn text-xs font-medium border transition-all ${
                  isSelected
                    ? "border-brand bg-brand-light text-brand-text"
                    : "border-ink-200 text-ink-500 bg-ink-50 hover:border-ink-300"
                }`}
              >
                {l.label}
                {isSelected && <X className="w-3 h-3 inline ml-1" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label className="text-ink-600">System Prompt * <Tip text="Le istruzioni principali che definiscono il comportamento dell'agente." /></Label>
        <Textarea value={form.system_prompt} onChange={e => update("system_prompt", e.target.value)} className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[180px] font-mono-brand text-xs" />
      </div>

      {/* First Message */}
      <div className="space-y-2">
        <Label className="text-ink-600">Primo Messaggio</Label>
        <Textarea value={form.first_message} onChange={e => update("first_message", e.target.value)} placeholder="Il primo messaggio che l'agente dirà..." className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[80px]" />
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label className="text-ink-600">Temperatura: {form.temperature.toFixed(1)} <Tip text="Valori bassi = risposte più precise, valori alti = più creative." /></Label>
        <Slider value={[form.temperature]} onValueChange={([v]) => update("temperature", v)} min={0} max={1} step={0.1} className="w-full" />
        <div className="flex justify-between text-[10px] text-ink-400"><span>Preciso</span><span>Creativo</span></div>
      </div>
    </div>
  );
}
