import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoicePicker from "@/components/agents/VoicePicker";
import { SECTORS, LANGUAGES } from "@/components/agents/PromptTemplates";

export interface AgentConfigData {
  name: string; description: string; sector: string; language: string;
  voice_id: string; system_prompt: string; first_message: string; temperature: number;
}

interface AgentConfigFormProps {
  data: AgentConfigData;
  companyId: string;
  onChange: <K extends keyof AgentConfigData>(key: K, value: AgentConfigData[K]) => void;
}

export default function AgentConfigForm({ data, companyId, onChange }: AgentConfigFormProps) {
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
      <div className="space-y-2">
        <Label className="text-ink-600">Voce</Label>
        <VoicePicker companyId={companyId} selected={data.voice_id} onSelect={v => onChange("voice_id", v)} />
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
    </div>
  );
}
