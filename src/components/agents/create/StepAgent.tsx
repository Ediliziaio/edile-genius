import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UseCaseSelector from "@/components/agents/UseCaseSelector";
import { SECTORS, LANGUAGES, EDILIZIA_PROMPT_TEMPLATES, type UseCaseId } from "@/components/agents/PromptTemplates";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HelpCircle, X, Zap, ChevronDown, Settings2 } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

const LLM_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini (consigliato)" },
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
  const hasTemplatePreFill = !!form.system_prompt?.trim();
  const [advancedOpen, setAdvancedOpen] = useState(!hasTemplatePreFill);
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
        <h2 className="text-lg font-semibold text-ink-900">Come si chiama il tuo agente?</h2>
        <p className="text-sm text-ink-400 mt-1">Dai un nome e definisci il settore. Puoi modificare tutto anche dopo.</p>
      </div>

      {/* Essential Fields — Always visible */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-ink-600">Nome agente *</Label>
          <Input
            value={form.name}
            onChange={e => update("name", e.target.value)}
            placeholder="Es. Mario — Qualificatore Lead"
            className="border border-ink-200 bg-ink-50 text-ink-900"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-ink-600">Settore</Label>
          <Select value={form.sector} onValueChange={v => update("sector", v)}>
            <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900">
              <SelectValue placeholder="In quale settore opererà?" />
            </SelectTrigger>
            <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-ink-600">Descrizione <span className="text-ink-300 font-normal">(facoltativa)</span></Label>
          <Textarea
            value={form.description}
            onChange={e => update("description", e.target.value)}
            placeholder="Es. Qualifica i lead che arrivano dalle campagne Meta e fissa sopralluoghi"
            className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[70px]"
          />
        </div>
      </div>

      {/* Template pre-fill indicator */}
      {hasTemplatePreFill && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-btn border border-brand-border bg-brand-light">
          <Zap className="w-4 h-4 text-brand-text shrink-0" />
          <p className="text-xs text-brand-text">
            Le istruzioni e il messaggio di apertura sono già compilati dal template scelto.
            Puoi personalizzarli espandendo la sezione qui sotto.
          </p>
        </div>
      )}

      {/* Collapsible Advanced Section */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger asChild>
          <button className="w-full flex items-center justify-between px-4 py-3 rounded-btn border border-ink-200 bg-ink-50 hover:bg-ink-100 transition-colors group">
            <span className="flex items-center gap-2 text-sm font-medium text-ink-600">
              <Settings2 className="w-4 h-4 text-ink-400" />
              Personalizza il comportamento
            </span>
            <ChevronDown className={cn("w-4 h-4 text-ink-400 transition-transform", advancedOpen && "rotate-180")} />
          </button>
        </CollapsibleTrigger>

        <CollapsibleContent className="space-y-6 pt-4">
          {/* Use Case */}
          <div className="space-y-2">
            <Label className="text-ink-600">Obiettivo dell'agente <Tip text="Seleziona un obiettivo per pre-compilare le istruzioni e il messaggio di apertura." /></Label>
            <UseCaseSelector selected={form.use_case} onSelect={selectUseCase} />
          </div>

          {/* Quick Templates Edilizia */}
          <div className="space-y-2">
            <Label className="text-ink-600 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5" /> Template rapidi edilizia
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {Object.entries(EDILIZIA_PROMPT_TEMPLATES).map(([key, tmpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    update("system_prompt", tmpl.system_prompt);
                    update("first_message", tmpl.first_message);
                  }}
                  className="text-left p-3 rounded-btn border border-ink-200 bg-ink-50 hover:border-brand hover:bg-brand-light transition-colors"
                >
                  <span className="text-sm font-medium text-ink-700">{tmpl.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-ink-400">Clicca per pre-compilare le istruzioni e il messaggio di apertura.</p>
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <Label className="text-ink-600">Istruzioni di comportamento * <Tip text="Descrivono come l'agente si comporta, cosa chiede e come risponde." /></Label>
            <Textarea value={form.system_prompt} onChange={e => update("system_prompt", e.target.value)} className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[180px] font-mono-brand text-xs" />
          </div>

          {/* First Message */}
          <div className="space-y-2">
            <Label className="text-ink-600">Messaggio di apertura</Label>
            <Textarea value={form.first_message} onChange={e => update("first_message", e.target.value)} placeholder="La prima frase che l'agente dirà quando risponde..." className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[80px]" />
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
              <Label className="text-ink-600">Modello AI <Tip text="Il modello che alimenta l'agente. GPT-4o Mini è il miglior rapporto qualità/costo." /></Label>
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

          {/* Temperature */}
          <div className="space-y-2">
            <Label className="text-ink-600">Stile risposte: {form.temperature.toFixed(1)} <Tip text="Valori bassi = risposte più precise. Valori alti = più creative e varie." /></Label>
            <Slider value={[form.temperature]} onValueChange={([v]) => update("temperature", v)} min={0} max={1} step={0.1} className="w-full" />
            <div className="flex justify-between text-[10px] text-ink-400"><span>Preciso</span><span>Creativo</span></div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
