import { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  BookOpen, Plus, FileText, Globe, Type, Loader2, Trash2, Upload,
  Search, RefreshCw, Eye, Bot, Link2, Download, AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";

interface KBDoc {
  id: string;
  name: string;
  type: string;
  status: string | null;
  size_bytes: number | null;
  source_url: string | null;
  content_preview: string | null;
  created_at: string | null;
  agent_id: string | null;
  el_doc_id: string | null;
  file_path: string | null;
}

interface AgentOption {
  id: string;
  name: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  ready: { label: "Pronto", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  processing: { label: "In elaborazione", className: "bg-amber-50 text-amber-700 border-amber-200" },
  error: { label: "Errore", className: "bg-red-50 text-red-700 border-red-200" },
};

const typeIcons: Record<string, { icon: typeof FileText; color: string }> = {
  url: { icon: Globe, color: "text-blue-500" },
  text: { icon: Type, color: "text-violet-500" },
  file: { icon: FileText, color: "text-ink-500" },
};

export default function KnowledgeBase() {
  const companyId = useCompanyId();
  const { user } = useAuth();
  const { toast } = useToast();
  const [docs, setDocs] = useState<KBDoc[]>([]);
  const [agents, setAgents] = useState<AgentOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");
  const [filterAgent, setFilterAgent] = useState<string>("all");

  // Add modal
  const [addModal, setAddModal] = useState(false);
  const [addTab, setAddTab] = useState("file");
  const [urlInput, setUrlInput] = useState("");
  const [textName, setTextName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("global");
  const [saving, setSaving] = useState(false);

  // File upload
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview
  const [previewDoc, setPreviewDoc] = useState<KBDoc | null>(null);

  // Reprocess
  const [reprocessingId, setReprocessingId] = useState<string | null>(null);

  const fetchData = async () => {
    if (!companyId) return;
    const [docsRes, agentsRes] = await Promise.all([
      supabase
        .from("ai_knowledge_docs")
        .select("*")
        .eq("company_id", companyId)
        .order("created_at", { ascending: false }),
      supabase
        .from("agents")
        .select("id, name")
        .eq("company_id", companyId)
        .order("name"),
    ]);
    if (docsRes.data) setDocs(docsRes.data as unknown as KBDoc[]);
    if (agentsRes.data) setAgents(agentsRes.data as AgentOption[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [companyId]);

  const filteredDocs = useMemo(() => {
    return docs.filter((d) => {
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterType !== "all" && d.type !== filterType) return false;
      if (filterAgent === "global" && d.agent_id !== null) return false;
      if (filterAgent !== "all" && filterAgent !== "global" && d.agent_id !== filterAgent) return false;
      return true;
    });
  }, [docs, search, filterType, filterAgent]);

  const addUrl = async () => {
    if (!urlInput || !companyId) return;
    setSaving(true);
    try {
      const agentId = selectedAgentId === "global" ? null : selectedAgentId;
      const { data: doc } = await supabase.from("ai_knowledge_docs").insert({
        company_id: companyId,
        agent_id: agentId,
        name: new URL(urlInput).hostname,
        type: "url",
        source_url: urlInput,
        status: "processing",
      } as any).select().single();

      // Invoke edge function
      if (doc) {
        await supabase.functions.invoke("add-knowledge-doc", {
          body: {
            doc_id: (doc as any).id,
            company_id: companyId,
            agent_id: agentId,
            name: new URL(urlInput).hostname,
            type: "url",
            source_url: urlInput,
          },
        });
      }

      toast({ title: "URL aggiunto", description: "Il documento verrà elaborato a breve." });
      closeModal();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const addText = async () => {
    if (!textName || !textContent || !companyId) return;
    setSaving(true);
    try {
      const agentId = selectedAgentId === "global" ? null : selectedAgentId;
      const { data: doc } = await supabase.from("ai_knowledge_docs").insert({
        company_id: companyId,
        agent_id: agentId,
        name: textName,
        type: "text",
        content_preview: textContent.slice(0, 500),
        size_bytes: new TextEncoder().encode(textContent).length,
        status: "processing",
      } as any).select().single();

      if (doc) {
        await supabase.functions.invoke("add-knowledge-doc", {
          body: {
            doc_id: (doc as any).id,
            company_id: companyId,
            agent_id: agentId,
            name: textName,
            type: "text",
            content_preview: textContent,
          },
        });
      }

      toast({ title: "Documento aggiunto" });
      closeModal();
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "csv", "docx", "md"].includes(ext || "")) {
      toast({ variant: "destructive", title: "Formato non supportato", description: "Formati accettati: PDF, TXT, CSV, DOCX, MD." });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File troppo grande", description: "La dimensione massima è 10MB." });
      return;
    }
    setUploadFile(file);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setFileDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const uploadFileToStorage = async () => {
    if (!uploadFile || !companyId) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      const uuid = crypto.randomUUID();
      const filePath = `${companyId}/${uuid}-${uploadFile.name}`;
      const agentId = selectedAgentId === "global" ? null : selectedAgentId;

      setUploadProgress(30);
      const { error: storageError } = await supabase.storage
        .from("knowledge-docs")
        .upload(filePath, uploadFile);

      if (storageError) {
        toast({ variant: "destructive", title: "Errore upload", description: storageError.message });
        return;
      }

      setUploadProgress(60);
      const { data: doc, error: dbError } = await supabase
        .from("ai_knowledge_docs")
        .insert({
          company_id: companyId,
          agent_id: agentId,
          name: uploadFile.name,
          type: "file",
          file_path: filePath,
          size_bytes: uploadFile.size,
          status: "processing",
        } as any)
        .select()
        .single();

      if (dbError) {
        toast({ variant: "destructive", title: "Errore database", description: dbError.message });
        return;
      }

      setUploadProgress(80);
      await supabase.functions.invoke("add-knowledge-doc", {
        body: { doc_id: (doc as any).id, company_id: companyId, agent_id: agentId, file_path: filePath, type: "file", name: uploadFile.name },
      });
      setUploadProgress(100);

      toast({ title: "File caricato", description: `"${uploadFile.name}" caricato con successo.` });
      closeModal();
      fetchData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const deleteDoc = async (doc: KBDoc) => {
    // Delete from storage if file
    if (doc.file_path) {
      await supabase.storage.from("knowledge-docs").remove([doc.file_path]);
    }
    await supabase.from("ai_knowledge_docs").delete().eq("id", doc.id);
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    if (previewDoc?.id === doc.id) setPreviewDoc(null);
    toast({ title: "Documento eliminato" });
  };

  const reprocessDoc = async (doc: KBDoc) => {
    setReprocessingId(doc.id);
    await supabase.from("ai_knowledge_docs").update({ status: "processing" } as any).eq("id", doc.id);
    await supabase.functions.invoke("add-knowledge-doc", {
      body: {
        doc_id: doc.id,
        company_id: companyId,
        agent_id: doc.agent_id,
        file_path: doc.file_path,
        type: doc.type,
        name: doc.name,
        source_url: doc.source_url,
        content_preview: doc.content_preview,
      },
    });
    toast({ title: "Rielaborazione avviata" });
    setReprocessingId(null);
    fetchData();
  };

  const closeModal = () => {
    setAddModal(false);
    setUploadFile(null);
    setUploadProgress(0);
    setUrlInput("");
    setTextName("");
    setTextContent("");
    setSelectedAgentId("global");
  };

  const totalSize = docs.reduce((s, d) => s + (d.size_bytes || 0), 0);
  const readyCount = docs.filter((d) => d.status === "ready").length;
  const processingCount = docs.filter((d) => d.status === "processing").length;
  const errorCount = docs.filter((d) => d.status === "error").length;

  const formatBytes = (b: number) => {
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getAgentName = (agentId: string | null) => {
    if (!agentId) return "Globale";
    return agents.find((a) => a.id === agentId)?.name || "Agente";
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Knowledge Base</h1>
          <p className="text-sm text-ink-500 mt-1">Documenti, URL e testi per arricchire i tuoi agenti AI</p>
        </div>
        <Button onClick={() => setAddModal(true)} className="bg-brand hover:bg-brand-hover text-white">
          <Plus className="h-4 w-4 mr-2" /> Aggiungi Documento
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border border-ink-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-btn bg-brand-light flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-brand" />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-900">{docs.length}</p>
              <p className="text-xs text-ink-500">Documenti</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-ink-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-btn bg-emerald-50 flex items-center justify-center">
              <FileText className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-900">{readyCount}</p>
              <p className="text-xs text-ink-500">Pronti</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-ink-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-btn bg-amber-50 flex items-center justify-center">
              <Loader2 className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-900">{processingCount}</p>
              <p className="text-xs text-ink-500">In elaborazione</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border border-ink-200">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-9 w-9 rounded-btn bg-ink-50 flex items-center justify-center">
              <Download className="h-4 w-4 text-ink-500" />
            </div>
            <div>
              <p className="text-xl font-bold text-ink-900">{formatBytes(totalSize)}</p>
              <p className="text-xs text-ink-500">Dimensione totale</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
          <Input
            placeholder="Cerca documento..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti i tipi</SelectItem>
            <SelectItem value="file">File</SelectItem>
            <SelectItem value="url">URL</SelectItem>
            <SelectItem value="text">Testo</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterAgent} onValueChange={setFilterAgent}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Agente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tutti</SelectItem>
            <SelectItem value="global">Solo globali</SelectItem>
            {agents.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Document list */}
      {filteredDocs.length === 0 ? (
        <Card className="border-dashed border-2 border-ink-200">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900">
              {docs.length === 0 ? "Nessun documento nella Knowledge Base" : "Nessun risultato"}
            </h3>
            <p className="text-sm text-ink-500 max-w-md mx-auto">
              {docs.length === 0
                ? "Aggiungi documenti, URL o testi per espandere le conoscenze dei tuoi agenti AI."
                : "Prova a modificare i filtri di ricerca."}
            </p>
            {docs.length === 0 && (
              <Button onClick={() => setAddModal(true)} className="bg-brand hover:bg-brand-hover text-white">
                <Plus className="h-4 w-4 mr-2" /> Aggiungi il primo documento
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-2">
          {filteredDocs.map((doc) => {
            const typeInfo = typeIcons[doc.type] || typeIcons.file;
            const TypeIcon = typeInfo.icon;
            const statusInfo = statusConfig[doc.status || ""] || { label: doc.status || "—", className: "bg-ink-50 text-ink-500" };

            return (
              <Card key={doc.id} className="border border-ink-200 shadow-card hover:shadow-md transition-shadow">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-btn bg-ink-50 flex-shrink-0 flex items-center justify-center">
                      <TypeIcon className={`h-4 w-4 ${typeInfo.color}`} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink-900 truncate">{doc.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <Badge variant="secondary" className="text-[10px]">{doc.type}</Badge>
                        {doc.agent_id ? (
                          <span className="text-[10px] text-ink-400 flex items-center gap-0.5">
                            <Bot className="h-2.5 w-2.5" /> {getAgentName(doc.agent_id)}
                          </span>
                        ) : (
                          <span className="text-[10px] text-ink-400">Globale</span>
                        )}
                        {doc.size_bytes != null && (
                          <span className="text-[10px] font-mono text-ink-400">{formatBytes(doc.size_bytes)}</span>
                        )}
                        {doc.el_doc_id && (
                          <span className="text-[10px] text-emerald-600 flex items-center gap-0.5">
                            <Link2 className="h-2.5 w-2.5" /> EL Sync
                          </span>
                        )}
                        {doc.created_at && (
                          <span className="text-[10px] text-ink-400">
                            {format(new Date(doc.created_at), "dd MMM yyyy", { locale: it })}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {doc.status === "processing" ? (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" /> Elaborazione
                      </Badge>
                    ) : (
                      <Badge variant="outline" className={`text-[10px] ${statusInfo.className}`}>
                        {statusInfo.label}
                      </Badge>
                    )}
                    {doc.content_preview && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPreviewDoc(doc)} title="Anteprima">
                        <Eye className="h-3.5 w-3.5 text-ink-400" />
                      </Button>
                    )}
                    {doc.status === "error" && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => reprocessDoc(doc)}
                        disabled={reprocessingId === doc.id}
                        title="Rielabora"
                      >
                        {reprocessingId === doc.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <RefreshCw className="h-3.5 w-3.5 text-amber-500" />}
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteDoc(doc)}>
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Preview Panel */}
      <Dialog open={!!previewDoc} onOpenChange={(open) => !open && setPreviewDoc(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {previewDoc?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="secondary">{previewDoc?.type}</Badge>
              {previewDoc?.el_doc_id && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  <Link2 className="h-3 w-3 mr-1" /> Sincronizzato EL
                </Badge>
              )}
              {previewDoc?.source_url && (
                <a href={previewDoc.source_url} target="_blank" rel="noopener noreferrer"
                   className="text-xs text-brand hover:underline flex items-center gap-1">
                  <Globe className="h-3 w-3" /> {previewDoc.source_url}
                </a>
              )}
            </div>
            <div className="bg-ink-50 rounded-btn p-4 max-h-64 overflow-y-auto">
              <p className="text-sm text-ink-700 whitespace-pre-wrap font-mono leading-relaxed">
                {previewDoc?.content_preview || "Nessuna anteprima disponibile."}
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-ink-400">
              {previewDoc?.size_bytes != null && <span>{formatBytes(previewDoc.size_bytes)}</span>}
              {previewDoc?.created_at && (
                <span>{format(new Date(previewDoc.created_at), "dd MMMM yyyy, HH:mm", { locale: it })}</span>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Document Modal */}
      <Dialog open={addModal} onOpenChange={(open) => { if (!open) closeModal(); else setAddModal(true); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Aggiungi Documento</DialogTitle>
          </DialogHeader>

          {/* Agent selector */}
          <div className="space-y-1.5">
            <Label className="text-xs text-ink-500">Associa a</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleziona agente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="global">
                  <span className="flex items-center gap-2"><BookOpen className="h-3 w-3" /> Knowledge Base Globale</span>
                </SelectItem>
                {agents.map((a) => (
                  <SelectItem key={a.id} value={a.id}>
                    <span className="flex items-center gap-2"><Bot className="h-3 w-3" /> {a.name}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Tabs value={addTab} onValueChange={setAddTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="file"><FileText className="h-3 w-3 mr-1" /> File</TabsTrigger>
              <TabsTrigger value="url"><Globe className="h-3 w-3 mr-1" /> URL</TabsTrigger>
              <TabsTrigger value="text"><Type className="h-3 w-3 mr-1" /> Testo</TabsTrigger>
            </TabsList>

            {/* File Tab */}
            <TabsContent value="file" className="space-y-4 mt-4">
              <div
                onDragOver={(e) => { e.preventDefault(); setFileDragOver(true); }}
                onDragLeave={() => setFileDragOver(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-btn p-8 text-center cursor-pointer transition-colors ${
                  fileDragOver ? "border-brand bg-brand-light" : "border-ink-200 hover:border-ink-300"
                }`}
              >
                {uploadFile ? (
                  <div className="space-y-2">
                    <FileText className="h-8 w-8 text-brand mx-auto" />
                    <p className="text-sm font-medium text-ink-900">{uploadFile.name}</p>
                    <p className="text-xs text-ink-400">{formatBytes(uploadFile.size)}</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-ink-400 mx-auto mb-2" />
                    <p className="text-sm text-ink-500">Trascina un file qui o clicca per selezionare</p>
                    <p className="text-xs text-ink-400 mt-1">PDF, TXT, CSV, DOCX, MD — Max 10MB</p>
                  </>
                )}
                <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv,.docx,.md" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }} />
              </div>

              {uploading && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-ink-400 text-center">Caricamento... {uploadProgress}%</p>
                </div>
              )}

              <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={uploadFileToStorage} disabled={!uploadFile || uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? "Caricamento..." : "Carica File"}
              </Button>
            </TabsContent>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>URL del sito o pagina</Label>
                <Input placeholder="https://esempio.com/pagina" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
              </div>
              <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={addUrl} disabled={saving || !urlInput}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Aggiungi URL
              </Button>
            </TabsContent>

            {/* Text Tab */}
            <TabsContent value="text" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Nome documento</Label>
                <Input placeholder="Es. FAQ Prodotti" value={textName} onChange={(e) => setTextName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Contenuto</Label>
                <Textarea rows={6} placeholder="Incolla o scrivi il testo..." value={textContent} onChange={(e) => setTextContent(e.target.value)} />
                {textContent && <p className="text-[10px] text-ink-400 text-right">{textContent.length} caratteri</p>}
              </div>
              <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={addText} disabled={saving || !textName || !textContent}>
                {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Aggiungi Testo
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
