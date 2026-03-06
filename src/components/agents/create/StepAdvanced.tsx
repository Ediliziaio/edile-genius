import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SECTORS } from "@/components/agents/PromptTemplates";
import { Upload, FileText } from "lucide-react";

interface StepAdvancedProps {
  form: any;
  update: (key: string, value: any) => void;
}

export default function StepAdvanced({ form, update }: StepAdvancedProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Impostazioni Avanzate</h2>
        <p className="text-sm text-ink-400 mt-1">Knowledge base, criteri di valutazione e privacy.</p>
      </div>

      {/* Knowledge Base Placeholder */}
      <div className="space-y-2">
        <Label className="text-ink-600">Knowledge Base</Label>
        <div className="border-2 border-dashed border-ink-200 rounded-card p-8 text-center hover:border-ink-300 transition-colors cursor-pointer">
          <Upload className="w-8 h-8 text-ink-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-ink-600">Trascina file qui o clicca per caricare</p>
          <p className="text-xs text-ink-400 mt-1">PDF, TXT, DOCX fino a 10MB. Disponibile dopo la creazione dell'agente.</p>
        </div>
        <p className="text-xs text-ink-400 flex items-center gap-1">
          <FileText className="w-3 h-3" /> Potrai aggiungere file nella sezione Knowledge Base dopo la creazione.
        </p>
      </div>

      {/* Evaluation Criteria */}
      <div className="space-y-2">
        <Label className="text-ink-600">Criteri di Valutazione</Label>
        <Textarea
          value={form.evaluation_criteria}
          onChange={e => update("evaluation_criteria", e.target.value)}
          placeholder="Es: La conversazione è considerata di successo se l'utente fissa un appuntamento o lascia i propri dati di contatto..."
          className="border border-ink-200 bg-ink-50 text-ink-900 min-h-[100px] text-sm"
        />
        <p className="text-xs text-ink-400">Definisci cosa rende una conversazione un successo o un fallimento.</p>
      </div>

      {/* Sector (moved from step 1 for simplicity) */}
      <div className="space-y-2">
        <Label className="text-ink-600">Settore</Label>
        <Select value={form.sector} onValueChange={v => update("sector", v)}>
          <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue placeholder="Seleziona settore" /></SelectTrigger>
          <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Privacy */}
      <div className="flex items-center justify-between p-4 rounded-btn border border-ink-200 bg-ink-50">
        <div>
          <p className="text-sm font-medium text-ink-700">Data Retention</p>
          <p className="text-xs text-ink-400">Conserva le registrazioni e trascrizioni delle conversazioni.</p>
        </div>
        <Switch checked={form.data_retention ?? true} onCheckedChange={v => update("data_retention", v)} />
      </div>
    </div>
  );
}
