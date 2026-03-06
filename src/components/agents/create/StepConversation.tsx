import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

function Tip({ text }: { text: string }) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild><HelpCircle className="w-3.5 h-3.5 text-ink-300 inline-block ml-1 cursor-help" /></TooltipTrigger>
        <TooltipContent className="max-w-[240px] text-xs">{text}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface StepConversationProps {
  form: any;
  update: (key: string, value: any) => void;
}

export default function StepConversation({ form, update }: StepConversationProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Flusso Conversazione</h2>
        <p className="text-sm text-ink-400 mt-1">Configura come l'agente gestisce i turni e le interruzioni.</p>
      </div>

      {/* Turn Timeout */}
      <div className="space-y-2">
        <Label className="text-ink-600">Turn Timeout: {form.turn_timeout_sec}s <Tip text="Secondi di silenzio prima che l'agente risponda automaticamente." /></Label>
        <Slider value={[form.turn_timeout_sec]} onValueChange={([v]) => update("turn_timeout_sec", v)} min={1} max={30} step={1} />
        <div className="flex justify-between text-[10px] text-ink-300"><span>1s</span><span>30s</span></div>
      </div>

      {/* Turn Eagerness */}
      <div className="space-y-2">
        <Label className="text-ink-600">Reattività turno <Tip text="Quanto velocemente l'agente prende il turno dopo il silenzio dell'utente." /></Label>
        <Select value={form.turn_eagerness} onValueChange={v => update("turn_eagerness", v)}>
          <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="eager">Eagerness alta – risponde subito</SelectItem>
            <SelectItem value="normal">Normale – bilanciato</SelectItem>
            <SelectItem value="patient">Paziente – attende di più</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Max Duration */}
      <div className="space-y-2">
        <Label className="text-ink-600">Durata massima: {Math.floor(form.max_duration_sec / 60)} min <Tip text="Tempo massimo della conversazione prima della chiusura automatica." /></Label>
        <Slider value={[form.max_duration_sec]} onValueChange={([v]) => update("max_duration_sec", v)} min={60} max={1800} step={60} />
        <div className="flex justify-between text-[10px] text-ink-300"><span>1 min</span><span>30 min</span></div>
      </div>

      {/* Interruptions */}
      <div className="flex items-center justify-between p-4 rounded-btn border border-ink-200 bg-ink-50">
        <div>
          <p className="text-sm font-medium text-ink-700">Interruzioni</p>
          <p className="text-xs text-ink-400">Permetti all'utente di interrompere l'agente.</p>
        </div>
        <Switch checked={form.interruptions_enabled} onCheckedChange={v => update("interruptions_enabled", v)} />
      </div>

      {/* Soft Timeout */}
      <div className="space-y-3 p-4 rounded-btn border border-ink-200 bg-ink-50">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-ink-700">Soft Timeout <Tip text="L'agente invia un messaggio filler se l'utente non parla per un po'." /></p>
            <p className="text-xs text-ink-400">Messaggio automatico dopo silenzio prolungato.</p>
          </div>
          <Switch checked={form.soft_timeout_sec > 0} onCheckedChange={v => update("soft_timeout_sec", v ? 10 : -1)} />
        </div>
        {form.soft_timeout_sec > 0 && (
          <>
            <div className="space-y-1.5">
              <Label className="text-xs text-ink-500">Dopo {form.soft_timeout_sec}s di silenzio</Label>
              <Slider value={[form.soft_timeout_sec]} onValueChange={([v]) => update("soft_timeout_sec", v)} min={3} max={30} step={1} />
            </div>
            <Textarea value={form.soft_timeout_message} onChange={e => update("soft_timeout_message", e.target.value)} placeholder="Es: Sei ancora lì?" className="border border-ink-200 bg-white text-ink-900 text-sm min-h-[60px]" />
          </>
        )}
      </div>

      {/* System Tools */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-ink-700">System Tools</h3>

        <div className="space-y-3 p-4 rounded-btn border border-ink-200 bg-ink-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-700">End Call automatico</p>
              <p className="text-xs text-ink-400">L'agente può terminare la chiamata se ritiene opportuno.</p>
            </div>
            <Switch checked={form.end_call_enabled} onCheckedChange={v => update("end_call_enabled", v)} />
          </div>
          {form.end_call_enabled && (
            <Textarea value={form.end_call_prompt} onChange={e => update("end_call_prompt", e.target.value)} placeholder="Prompt per decidere quando terminare..." className="border border-ink-200 bg-white text-ink-900 text-sm min-h-[60px]" />
          )}
        </div>

        <div className="flex items-center justify-between p-4 rounded-btn border border-ink-200 bg-ink-50">
          <div>
            <p className="text-sm font-medium text-ink-700">Language Detection</p>
            <p className="text-xs text-ink-400">Rileva e adatta la lingua dell'utente automaticamente.</p>
          </div>
          <Switch checked={form.language_detection_enabled} onCheckedChange={v => update("language_detection_enabled", v)} />
        </div>
      </div>
    </div>
  );
}
