import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Upload, FileText, Trash2, Loader2, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface Props {
  agentId: string;
  companyId: string;
}

export default function AgentKnowledgeTab({ agentId, companyId }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["kb-files", agentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("knowledge_base_files")
        .select("*")
        .eq("agent_id", agentId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const ACCEPTED = ".pdf,.txt,.csv,.md,.json,.doc,.docx";

  const uploadFiles = async (fileList: FileList | File[]) => {
    const arr = Array.from(fileList);
    if (arr.length === 0) return;

    setUploading(true);
    let uploaded = 0;

    for (const file of arr) {
      const ext = file.name.split(".").pop()?.toLowerCase();
      if (!["pdf", "txt", "csv", "md", "json", "doc", "docx"].includes(ext || "")) {
        toast({ variant: "destructive", title: "Formato non supportato", description: `${file.name} non è un formato valido.` });
        continue;
      }

      const filePath = `${companyId}/${agentId}/${Date.now()}_${file.name}`;
      const { error: storageError } = await supabase.storage.from("knowledge-base").upload(filePath, file);
      if (storageError) {
        toast({ variant: "destructive", title: "Errore upload", description: storageError.message });
        continue;
      }

      const { error: dbError } = await supabase.from("knowledge_base_files").insert({
        agent_id: agentId,
        company_id: companyId,
        file_name: file.name,
        file_path: filePath,
        file_size: file.size,
        file_type: ext || null,
        uploaded_by: user?.id || null,
      });

      if (dbError) {
        toast({ variant: "destructive", title: "Errore DB", description: dbError.message });
        continue;
      }
      uploaded++;
    }

    if (uploaded > 0) {
      toast({ title: "Upload completato", description: `${uploaded} file caricati.` });
      queryClient.invalidateQueries({ queryKey: ["kb-files", agentId] });
    }
    setUploading(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    uploadFiles(e.dataTransfer.files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) uploadFiles(e.target.files);
  };

  const deleteFile = async (fileId: string, filePath: string) => {
    await supabase.storage.from("knowledge-base").remove([filePath]);
    await supabase.from("knowledge_base_files").delete().eq("id", fileId);
    queryClient.invalidateQueries({ queryKey: ["kb-files", agentId] });
    toast({ title: "File eliminato" });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const iconForType = (type: string | null) => {
    if (type === "pdf") return <FileText className="w-5 h-5 text-status-error" />;
    if (type === "txt" || type === "md") return <FileText className="w-5 h-5 text-ink-500" />;
    return <File className="w-5 h-5 text-accent-blue" />;
  };

  return (
    <div className="space-y-6">
      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        className={`rounded-card border-2 border-dashed p-8 text-center transition-colors ${dragOver ? "border-brand bg-brand-light" : "border-ink-200 bg-white"}`}
      >
        {uploading ? (
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto mb-2" />
        ) : (
          <Upload className="w-8 h-8 text-ink-300 mx-auto mb-2" />
        )}
        <p className="text-sm text-ink-500 mb-1">
          {uploading ? "Caricamento in corso..." : "Trascina qui i file o clicca per selezionarli"}
        </p>
        <p className="text-xs text-ink-400 mb-3">PDF, TXT, CSV, MD, JSON, DOC (max 20MB)</p>
        {!uploading && (
          <label>
            <input type="file" multiple accept={ACCEPTED} onChange={handleFileInput} className="hidden" />
            <Button variant="outline" size="sm" className="border-ink-200 text-ink-700" asChild>
              <span>Seleziona file</span>
            </Button>
          </label>
        )}
      </div>

      {/* File list */}
      <div className="rounded-card border border-ink-200 bg-white shadow-card">
        <div className="px-5 py-3 border-b border-ink-100">
          <h3 className="text-sm font-semibold text-ink-900">File caricati ({files.length})</h3>
        </div>
        {isLoading ? (
          <div className="p-8 text-center"><Loader2 className="w-5 h-5 animate-spin text-brand mx-auto" /></div>
        ) : files.length === 0 ? (
          <p className="p-8 text-center text-sm text-ink-400">Nessun file caricato per questo agente.</p>
        ) : (
          <div className="divide-y divide-ink-100">
            {files.map((f: any) => (
              <div key={f.id} className="px-5 py-3 flex items-center gap-3">
                {iconForType(f.file_type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-900 truncate">{f.file_name}</p>
                  <p className="text-xs text-ink-400">
                    {formatSize(f.file_size || 0)} · {f.created_at ? format(new Date(f.created_at), "d MMM yyyy HH:mm", { locale: it }) : "—"}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteFile(f.id, f.file_path)} className="text-ink-400 hover:text-status-error">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
