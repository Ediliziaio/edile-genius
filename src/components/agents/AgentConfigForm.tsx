import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoicePickerEnhanced from "@/components/agents/VoicePickerEnhanced";
import { SECTORS, LANGUAGES } from "@/components/agents/PromptTemplates";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

const LLM_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "gpt-4.1-mini", label: "GPT-4.1 Mini" },
  { value: "gpt-4.1", label: "GPT-4.1" },
  { value: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
  { value: "claude-3-haiku", label: "Claude 3 Haiku" },
  { value: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
];

export interface AgentConfigData {
  name: string; description: string; sector: string; language: string;
  voice_id: string; system_prompt: string; first_message: string; temperature: number;
  llm_model?: string;
  turn_timeout_sec?: number; turn_eagerness?: string; max_duration_sec?: number;
  interruptions_enabled?: boolean; end_call_enabled?: boolean; end_call_prompt?: string;
  language_detection_enabled?: boolean;
  voice_stability?: number; voice_similarity?: number; voice_speed?: number;
  evaluation_criteria?: string;
}

interface AgentConfigFormProps {
  data: AgentConfigData;
  companyId: string;
  onChange: <K extends keyof AgentConfigData>(key: K, value: AgentConfigData[K]) => void;
}

export default function AgentConfigForm({ data, companyId, onChange }: AgentConfigFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const voiceSettings = {
    stability: data.voice_stability ?? 0.5,
    similarity: data.voice_similarity ?? 0.75,
    speed: data.voice_speed ?? 1.0,
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label className="text-ink-600">Nome agente</Label>
        <Input value={data.name} onChange={e => onChange("name", e.target.value)} placeholder="es. Assistente Prenotazioni" className="border border-ink-200 bg-ink-50 text-ink-900" />
      </div>
      <div className="space-y-2">
        <Label className="text-ink-600">Descrizione</Label>
        <Textarea value={data.description} onChange={e => onChange("description", e.target.value)} placeholder="Breve descrizione del ruolo dell'agente..." className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[80px]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-ink-600">Settore</Label>
          <Select value={data.sector} onValueChange={v => onChange("sector", v)}>
            <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue placeholder="Seleziona settore" /></SelectTrigger>
            <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-ink-600">Lingua</Label>
          <Select value={data.language} onValueChange={v => onChange("language", v)}>
            <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue placeholder="Lingua" /></SelectTrigger>
            <SelectContent>{LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      </div>

      {/* LLM Model */}
      <div className="space-y-2">
        <Label className="text-ink-600">Modello LLM</Label>
        <Select value={data.llm_model || "gpt-4o-mini"} onValueChange={v => onChange("llm_model", v)}>
          <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue /></SelectTrigger>
          <SelectContent>{LLM_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Voice */}
      <div className="space-y-2">
        <Label className="text-ink-600">Voce</Label>
        <VoicePickerEnhanced
          companyId={companyId}
          selected={data.voice_id}
          onSelect={v => onChange("voice_id", v)}
          voiceSettings={voiceSettings}
          onSettingsChange={s => {
            onChange("voice_stability", s.stability);
            onChange("voice_similarity", s.similarity);
            onChange("voice_speed", s.speed);
          }}
        />
      </div>

      <div className="space-y-2">
        <Label className="text-ink-600">System Prompt</Label>
        <Textarea value={data.system_prompt} onChange={e => onChange("system_prompt", e.target.value)} className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[200px] font-mono-brand text-xs" />
      </div>
      <div className="space-y-2">
        <Label className="text-ink-600">Primo messaggio</Label>
        <Textarea value={data.first_message} onChange={e => onChange("first_message", e.target.value)} className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[80px]" />
      </div>
      <div className="space-y-2">
        <Label className="text-ink-600">Temperatura: {data.temperature.toFixed(1)}</Label>
        <Slider value={[data.temperature]} onValueChange={([v]) => onChange("temperature", v)} min={0} max={1} step={0.1} className="w-full" />
        <div className="flex justify-between text-[10px] text-ink-400"><span>Preciso</span><span>Creativo</span></div>
      </div>

      {/* Advanced Collapsible */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors w-full py-2">
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          Impostazioni avanzate
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          {/* Conversation Flow */}
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Turn Timeout: {data.turn_timeout_sec ?? 10}s</Label>
            <Slider value={[data.turn_timeout_sec ?? 10]} onValueChange={([v]) => onChange("turn_timeout_sec", v)} min={1} max={30} step={1} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Reattività turno</Label>
            <Select value={data.turn_eagerness || "normal"} onValueChange={v => onChange("turn_eagerness", v)}>
              <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="eager">Eager</SelectItem>
                <SelectItem value="normal">Normale</SelectItem>
                <SelectItem value="patient">Paziente</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Durata max: {Math.floor((data.max_duration_sec ?? 600) / 60)} min</Label>
            <Slider value={[data.max_duration_sec ?? 600]} onValueChange={([v]) => onChange("max_duration_sec", v)} min={60} max={1800} step={60} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-ink-500">Interruzioni</Label>
            <Switch checked={data.interruptions_enabled ?? true} onCheckedChange={v => onChange("interruptions_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-ink-500">End Call automatico</Label>
            <Switch checked={data.end_call_enabled ?? false} onCheckedChange={v => onChange("end_call_enabled", v)} />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs text-ink-500">Language Detection</Label>
            <Switch checked={data.language_detection_enabled ?? false} onCheckedChange={v => onChange("language_detection_enabled", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Criteri di valutazione</Label>
            <Textarea value={data.evaluation_criteria || ""} onChange={e => onChange("evaluation_criteria", e.target.value)} placeholder="Cosa definisce una conversazione di successo..." className="border border-ink-200 bg-ink-50 text-ink-900 text-sm min-h-[80px]" />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
