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
  { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
];

const TTS_MODELS = [
  { value: "eleven_turbo_v2_5", label: "Turbo v2.5 (veloce, economico) ⚡" },
  { value: "eleven_multilingual_v2", label: "Multilingual v2 (qualità superiore) 🌍" },
  { value: "eleven_flash_v2_5", label: "Flash v2.5 (ultra-bassa latenza) 🚀" },
  { value: "eleven_v3_conversational", label: "v3 Conversational (nuovissimo) ✨" },
];

export interface AgentConfigData {
  name: string; description: string; sector: string; language: string;
  voice_id: string; system_prompt: string; first_message: string; temperature: number;
  llm_model?: string; tts_model?: string; llm_backup_model?: string;
  turn_timeout_sec?: number; turn_eagerness?: string; max_duration_sec?: number;
  interruptions_enabled?: boolean; end_call_enabled?: boolean; end_call_prompt?: string;
  language_detection_enabled?: boolean;
  voice_stability?: number; voice_similarity?: number; voice_speed?: number;
  evaluation_criteria?: string; evaluation_prompt?: string;
  asr_quality?: string; asr_keywords?: string[];
  silence_end_call_timeout?: number; speculative_turn?: boolean;
  dynamic_variables?: Array<{ name: string; type: string; description?: string }>;
  built_in_tools?: { voicemail?: boolean; transfer?: boolean };
  transfer_number?: string; monitoring_enabled?: boolean;
  pii_redaction?: boolean; blocked_topics?: string;
}

interface AgentConfigFormProps {
  data: AgentConfigData;
  companyId: string;
  onChange: <K extends keyof AgentConfigData>(key: K, value: AgentConfigData[K]) => void;
}

export default function AgentConfigForm({ data, companyId, onChange }: AgentConfigFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showASR, setShowASR] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [showSecurity, setShowSecurity] = useState(false);

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

      {/* LLM + TTS Models */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-ink-600">Modello LLM</Label>
          <Select value={data.llm_model || "gpt-4o-mini"} onValueChange={v => onChange("llm_model", v)}>
            <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue /></SelectTrigger>
            <SelectContent>{LLM_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label className="text-ink-600">Modello TTS</Label>
          <Select value={data.tts_model || "eleven_turbo_v2_5"} onValueChange={v => onChange("tts_model", v)}>
            <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue /></SelectTrigger>
            <SelectContent>{TTS_MODELS.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
          </Select>
          <p className="text-[10px] text-ink-400">Turbo v2.5 è raccomandato per la maggior parte dei casi d'uso</p>
        </div>
      </div>

      {/* Voice */}
      <div className="space-y-2">
        <Label className="text-ink-600">Voce</Label>
        <VoicePickerEnhanced
          companyId={companyId} selected={data.voice_id} onSelect={v => onChange("voice_id", v)}
          voiceSettings={voiceSettings}
          onSettingsChange={s => { onChange("voice_stability", s.stability); onChange("voice_similarity", s.similarity); onChange("voice_speed", s.speed); }}
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

      {/* Advanced */}
      <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors w-full py-2">
          <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? "rotate-180" : ""}`} />
          Impostazioni avanzate
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
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

      {/* ASR Section */}
      <Collapsible open={showASR} onOpenChange={setShowASR}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors w-full py-2">
          <ChevronDown className={`w-4 h-4 transition-transform ${showASR ? "rotate-180" : ""}`} />
          Riconoscimento Vocale (ASR)
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Qualità ASR</Label>
            <Select value={data.asr_quality || "high"} onValueChange={v => onChange("asr_quality", v)}>
              <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="high">Alta (consigliata)</SelectItem>
                <SelectItem value="medium">Media (più veloce)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Parole chiave da enfatizzare</Label>
            <Input value={(data.asr_keywords || []).join(", ")} onChange={e => onChange("asr_keywords", e.target.value.split(",").map(k => k.trim()).filter(Boolean))} placeholder="es. sopralluogo, preventivo, bonus" className="border border-ink-200 bg-ink-50 text-ink-900 text-sm" />
            <p className="text-[10px] text-ink-400">Il modello ASR riconoscerà meglio queste parole settoriali</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Silenzio prima di chiudere: {data.silence_end_call_timeout ?? 20}s</Label>
            <Slider value={[data.silence_end_call_timeout ?? 20]} onValueChange={([v]) => onChange("silence_end_call_timeout", v)} min={5} max={60} step={5} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-ink-500">Risposta speculativa</Label>
              <p className="text-[10px] text-ink-400">Genera risposta durante la pausa dell'utente (più veloce)</p>
            </div>
            <Switch checked={data.speculative_turn ?? false} onCheckedChange={v => onChange("speculative_turn", v)} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Tools Section */}
      <Collapsible open={showTools} onOpenChange={setShowTools}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors w-full py-2">
          <ChevronDown className={`w-4 h-4 transition-transform ${showTools ? "rotate-180" : ""}`} />
          Strumenti Integrati
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-ink-500">Rilevamento segreteria</Label>
              <p className="text-[10px] text-ink-400">Rileva automaticamente la segreteria e lascia un messaggio</p>
            </div>
            <Switch checked={data.built_in_tools?.voicemail ?? false} onCheckedChange={v => onChange("built_in_tools", { ...data.built_in_tools, voicemail: v })} />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-xs text-ink-500">Trasferimento a operatore</Label>
                <p className="text-[10px] text-ink-400">Trasferisci la chiamata a un numero reale</p>
              </div>
              <Switch checked={data.built_in_tools?.transfer ?? false} onCheckedChange={v => onChange("built_in_tools", { ...data.built_in_tools, transfer: v })} />
            </div>
            {data.built_in_tools?.transfer && (
              <Input value={data.transfer_number || ""} onChange={e => onChange("transfer_number", e.target.value)} placeholder="+39 02 XXXX XXXX" className="border border-ink-200 bg-ink-50 text-ink-900 text-sm font-mono" />
            )}
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-ink-500">Monitoring conversazioni</Label>
              <p className="text-[10px] text-ink-400">Abilita la supervisione in tempo reale</p>
            </div>
            <Switch checked={data.monitoring_enabled ?? false} onCheckedChange={v => onChange("monitoring_enabled", v)} />
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Security Section */}
      <Collapsible open={showSecurity} onOpenChange={setShowSecurity}>
        <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-ink-600 hover:text-ink-900 transition-colors w-full py-2">
          <ChevronDown className={`w-4 h-4 transition-transform ${showSecurity ? "rotate-180" : ""}`} />
          Sicurezza & Valutazione
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-4 pt-2">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-xs text-ink-500">Oscura dati personali (PII)</Label>
              <p className="text-[10px] text-ink-400">Rimuove automaticamente dati sensibili dal trascritto</p>
            </div>
            <Switch checked={data.pii_redaction ?? false} onCheckedChange={v => onChange("pii_redaction", v)} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Argomenti bloccati</Label>
            <Textarea value={data.blocked_topics || ""} onChange={e => onChange("blocked_topics", e.target.value)} placeholder="Politica, religione, concorrenti (uno per riga o separati da virgola)" className="border border-ink-200 bg-ink-50 text-ink-900 text-sm min-h-[60px]" rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">Criteri di valutazione</Label>
            <Textarea value={data.evaluation_criteria || ""} onChange={e => onChange("evaluation_criteria", e.target.value)} placeholder="Cosa definisce una conversazione di successo? Es: L'agente ha proposto un sopralluogo?" className="border border-ink-200 bg-ink-50 text-ink-900 text-sm min-h-[60px]" rows={3} />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-ink-500">LLM di backup</Label>
            <Select value={data.llm_backup_model || ""} onValueChange={v => onChange("llm_backup_model", v || undefined)}>
              <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900 text-sm"><SelectValue placeholder="Nessun backup" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nessun backup</SelectItem>
                <SelectItem value="gpt-4o-mini">GPT-4o Mini</SelectItem>
                <SelectItem value="gemini-2.0-flash">Gemini 2.0 Flash</SelectItem>
                <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-[10px] text-ink-400">Usato automaticamente se il modello principale non è disponibile</p>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
