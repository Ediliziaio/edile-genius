import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import VoicePicker from "@/components/agents/VoicePicker";
import { SECTORS, LANGUAGES } from "@/components/agents/PromptTemplates";

export interface AgentConfigData {
  name: string;
  description: string;
  sector: string;
  language: string;
  voice_id: string;
  system_prompt: string;
  first_message: string;
  temperature: number;
}

interface AgentConfigFormProps {
  data: AgentConfigData;
  companyId: string;
  onChange: <K extends keyof AgentConfigData>(key: K, value: AgentConfigData[K]) => void;
}

export default function AgentConfigForm({ data, companyId, onChange }: AgentConfigFormProps) {
  return (
    <div className="space-y-6 max-w-2xl">
      {/* Name */}
      <div className="space-y-2">
        <Label style={{ color: "hsl(var(--app-text-secondary))" }}>Nome agente</Label>
        <Input
          value={data.name}
          onChange={e => onChange("name", e.target.value)}
          placeholder="es. Assistente Prenotazioni"
          className="border-none"
          style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label style={{ color: "hsl(var(--app-text-secondary))" }}>Descrizione</Label>
        <Textarea
          value={data.description}
          onChange={e => onChange("description", e.target.value)}
          placeholder="Breve descrizione del ruolo dell'agente..."
          className="border-none min-h-[80px]"
          style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sector */}
        <div className="space-y-2">
          <Label style={{ color: "hsl(var(--app-text-secondary))" }}>Settore</Label>
          <Select value={data.sector} onValueChange={v => onChange("sector", v)}>
            <SelectTrigger className="border-none" style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}>
              <SelectValue placeholder="Seleziona settore" />
            </SelectTrigger>
            <SelectContent>
              {SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label style={{ color: "hsl(var(--app-text-secondary))" }}>Lingua</Label>
          <Select value={data.language} onValueChange={v => onChange("language", v)}>
            <SelectTrigger className="border-none" style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}>
              <SelectValue placeholder="Lingua" />
            </SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Voice */}
      <div className="space-y-2">
        <Label style={{ color: "hsl(var(--app-text-secondary))" }}>Voce</Label>
        <VoicePicker companyId={companyId} selected={data.voice_id} onSelect={v => onChange("voice_id", v)} />
      </div>

      {/* System Prompt */}
      <div className="space-y-2">
        <Label style={{ color: "hsl(var(--app-text-secondary))" }}>System Prompt</Label>
        <Textarea
          value={data.system_prompt}
          onChange={e => onChange("system_prompt", e.target.value)}
          className="border-none min-h-[200px] font-mono-brand text-xs"
          style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}
        />
      </div>

      {/* First Message */}
      <div className="space-y-2">
        <Label style={{ color: "hsl(var(--app-text-secondary))" }}>Primo messaggio</Label>
        <Textarea
          value={data.first_message}
          onChange={e => onChange("first_message", e.target.value)}
          className="border-none min-h-[80px]"
          style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}
        />
      </div>

      {/* Temperature */}
      <div className="space-y-2">
        <Label style={{ color: "hsl(var(--app-text-secondary))" }}>
          Temperatura: {data.temperature.toFixed(1)}
        </Label>
        <Slider
          value={[data.temperature]}
          onValueChange={([v]) => onChange("temperature", v)}
          min={0}
          max={1}
          step={0.1}
          className="w-full"
        />
        <div className="flex justify-between text-[10px]" style={{ color: "hsl(var(--app-text-tertiary))" }}>
          <span>Preciso</span>
          <span>Creativo</span>
        </div>
      </div>
    </div>
  );
}
