import { useState, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { SECTORS } from "@/components/agents/PromptTemplates";
import { Upload, FileText, X, Loader2, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface StepAdvancedProps {
  form: any;
  update: (key: string, value: any) => void;
}

interface PendingFile {
  file: File;
  id: string;
}

const ALLOWED_EXTENSIONS = ["pdf", "txt", "csv", "md", "json", "doc", "docx"];

export default function StepAdvanced({ form, update }: StepAdvancedProps) {
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const addFiles = (fileList: FileList | File[]) => {
    const files = Array.from(fileList);
    const valid: PendingFile[] = [];
    for (const file of files) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!ext || !ALLOWED_EXTENSIONS.includes(ext)) {
        toast({ variant: "destructive", title: "Formato non supportato", description: `${file.name} non è supportato.` });
        continue;
      }
      if (file.size > 10 * 1024 * 1024) {
        toast({ variant: "destructive", title: "File troppo grande", description: `${file.name} supera 10MB.` });
        continue;
      }
      valid.push({ file, id: crypto.randomUUID() });
    }
    const updated = [...pendingFiles, ...valid];
    setPendingFiles(updated);
    update("_pendingKBFiles", updated.map(f => f.file));
  };

  const removeFile = (id: string) => {
    const updated = pendingFiles.filter(f => f.id !== id);
    setPendingFiles(updated);
    update("_pendingKBFiles", updated.map(f => f.file));
  };

  const formatSize = (bytes: number) => bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-ink-900">Impostazioni Avanzate</h2>
        <p className="text-sm text-ink-400 mt-1">Knowledge base, criteri di valutazione e privacy.</p>
      </div>

      {/* Knowledge Base Upload */}
      <div className="space-y-2">
        <Label className="text-ink-600">Knowledge Base</Label>
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-card p-8 text-center transition-colors cursor-pointer ${dragging ? "border-brand bg-brand-light" : "border-ink-200 hover:border-ink-300"}`}
        >
          <Upload className="w-8 h-8 text-ink-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-ink-600">Trascina file qui o clicca per caricare</p>
          <p className="text-xs text-ink-400 mt-1">PDF, TXT, CSV, MD, JSON, DOC fino a 10MB</p>
        </div>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.txt,.csv,.md,.json,.doc,.docx" className="hidden" onChange={e => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />

        {pendingFiles.length > 0 && (
          <div className="space-y-1.5 mt-2">
            {pendingFiles.map(pf => (
              <div key={pf.id} className="flex items-center justify-between p-2.5 rounded-btn border border-ink-200 bg-white">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-ink-400 shrink-0" />
                  <span className="text-sm text-ink-700 truncate">{pf.file.name}</span>
                  <span className="text-[10px] text-ink-400 shrink-0">{formatSize(pf.file.size)}</span>
                </div>
                <button onClick={e => { e.stopPropagation(); removeFile(pf.id); }} className="p-1 rounded hover:bg-ink-100">
                  <X className="w-3.5 h-3.5 text-ink-400" />
                </button>
              </div>
            ))}
            <p className="text-xs text-ink-400 flex items-center gap-1">
              <FileText className="w-3 h-3" /> I file verranno caricati al momento della creazione dell'agente.
            </p>
          </div>
        )}
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

      {/* Sector */}
      <div className="space-y-2">
        <Label className="text-ink-600">Settore</Label>
        <Select value={form.sector} onValueChange={v => update("sector", v)}>
          <SelectTrigger className="border border-ink-200 bg-ink-50 text-ink-900"><SelectValue placeholder="Seleziona settore" /></SelectTrigger>
          <SelectContent>{SECTORS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Webhook URL */}
      <div className="space-y-2">
        <Label className="text-ink-600 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5" /> Webhook URL
        </Label>
        <Input
          value={form.webhook_url || ""}
          onChange={e => update("webhook_url", e.target.value)}
          placeholder="https://example.com/webhook"
          className="border border-ink-200 bg-ink-50 text-ink-900"
        />
        <p className="text-xs text-ink-400">Ricevi notifiche in tempo reale per le conversazioni di questo agente. Configurabile anche dopo la creazione.</p>
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
