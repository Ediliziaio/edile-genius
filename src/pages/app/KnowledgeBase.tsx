import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
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
import { BookOpen, Plus, FileText, Globe, Type, Loader2, Trash2, Upload } from "lucide-react";
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
}

export default function KnowledgeBase() {
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [docs, setDocs] = useState<KBDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [addTab, setAddTab] = useState("url");
  const [urlInput, setUrlInput] = useState("");
  const [textName, setTextName] = useState("");
  const [textContent, setTextContent] = useState("");
  const [saving, setSaving] = useState(false);

  // File upload state
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [fileDragOver, setFileDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchDocs = async () => {
    if (!companyId) return;
    const { data } = await supabase
      .from("ai_knowledge_docs")
      .select("*")
      .eq("company_id", companyId)
      .is("agent_id", null)
      .order("created_at", { ascending: false });
    if (data) setDocs(data as unknown as KBDoc[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchDocs();
  }, [companyId]);

  const addUrl = async () => {
    if (!urlInput || !companyId) return;
    setSaving(true);
    try {
      await supabase.from("ai_knowledge_docs").insert({
        company_id: companyId,
        name: new URL(urlInput).hostname,
        type: "url",
        source_url: urlInput,
        status: "processing",
      } as any);
      toast({ title: "URL aggiunto", description: "Il documento verrà elaborato a breve." });
      setAddModal(false);
      setUrlInput("");
      fetchDocs();
    } finally {
      setSaving(false);
    }
  };

  const addText = async () => {
    if (!textName || !textContent || !companyId) return;
    setSaving(true);
    try {
      await supabase.from("ai_knowledge_docs").insert({
        company_id: companyId,
        name: textName,
        type: "text",
        content_preview: textContent.slice(0, 500),
        size_bytes: new TextEncoder().encode(textContent).length,
        status: "ready",
      } as any);
      toast({ title: "Documento aggiunto" });
      setAddModal(false);
      setTextName("");
      setTextContent("");
      fetchDocs();
    } finally {
      setSaving(false);
    }
  };

  const handleFileSelect = (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["pdf", "txt", "csv"].includes(ext || "")) {
      toast({ variant: "destructive", title: "Formato non supportato", description: "Sono accettati solo file PDF, TXT e CSV." });
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

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  const uploadFileToStorage = async () => {
    if (!uploadFile || !companyId) return;
    setUploading(true);
    setUploadProgress(10);

    try {
      const uuid = crypto.randomUUID();
      const filePath = `${companyId}/${uuid}-${uploadFile.name}`;

      setUploadProgress(30);

      // Upload to storage
      const { error: storageError } = await supabase.storage
        .from("knowledge-docs")
        .upload(filePath, uploadFile);

      if (storageError) {
        toast({ variant: "destructive", title: "Errore upload", description: storageError.message });
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(60);

      // Insert record
      const { data: doc, error: dbError } = await supabase
        .from("ai_knowledge_docs")
        .insert({
          company_id: companyId,
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
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(80);

      // Invoke edge function for async processing
      await supabase.functions.invoke("add-knowledge-doc", {
        body: {
          doc_id: (doc as any).id,
          company_id: companyId,
          file_path: filePath,
          type: "file",
          name: uploadFile.name,
        },
      });

      setUploadProgress(100);

      toast({ title: "File caricato", description: `"${uploadFile.name}" caricato con successo. Elaborazione in corso...` });
      setAddModal(false);
      setUploadFile(null);
      setUploadProgress(0);
      fetchDocs();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message || "Errore durante l'upload." });
    } finally {
      setUploading(false);
    }
  };

  const deleteDoc = async (id: string) => {
    await supabase.from("ai_knowledge_docs").delete().eq("id", id);
    fetchDocs();
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );

  const totalSize = docs.reduce((s, d) => s + (d.size_bytes || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Knowledge Base</h1>
          <p className="text-sm text-ink-500 mt-1">Documenti globali condivisi tra tutti gli agenti</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-ink-400">
            {docs.length} documenti · {(totalSize / 1024).toFixed(0)} KB
          </span>
          <Button onClick={() => setAddModal(true)} className="bg-brand hover:bg-brand-hover text-white">
            <Plus className="h-4 w-4 mr-2" /> Aggiungi Documento
          </Button>
        </div>
      </div>

      {docs.length === 0 ? (
        <Card className="border-dashed border-2 border-ink-200">
          <CardContent className="p-12 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-brand-light flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-brand" />
            </div>
            <h3 className="text-lg font-semibold text-ink-900">Nessun documento nella Knowledge Base</h3>
            <p className="text-sm text-ink-500 max-w-md mx-auto">
              Aggiungi documenti, URL o testi per espandere le conoscenze dei tuoi agenti AI.
            </p>
            <Button onClick={() => setAddModal(true)} className="bg-brand hover:bg-brand-hover text-white">
              <Plus className="h-4 w-4 mr-2" /> Aggiungi il primo documento
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {docs.map((doc) => (
            <Card key={doc.id} className="border border-ink-200 shadow-card">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-btn bg-ink-50 flex items-center justify-center">
                    {doc.type === "url" ? (
                      <Globe className="h-4 w-4 text-blue" />
                    ) : doc.type === "text" ? (
                      <Type className="h-4 w-4 text-violet" />
                    ) : (
                      <FileText className="h-4 w-4 text-ink-500" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-ink-900">{doc.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge variant="secondary" className="text-[10px]">
                        {doc.type}
                      </Badge>
                      {doc.size_bytes != null && (
                        <span className="text-[10px] font-mono text-ink-400">
                          {(doc.size_bytes / 1024).toFixed(0)} KB
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
                <div className="flex items-center gap-2">
                  {doc.status === "processing" ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      In elaborazione
                    </Badge>
                  ) : (
                    <Badge
                      variant={doc.status === "ready" ? "default" : "secondary"}
                      className={doc.status === "ready" ? "bg-brand-light text-brand-text border-brand-border" : ""}
                    >
                      {doc.status === "ready" ? "Pronto" : doc.status === "error" ? "Errore" : doc.status || "—"}
                    </Badge>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => deleteDoc(doc.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Document Modal */}
      <Dialog
        open={addModal}
        onOpenChange={(open) => {
          setAddModal(open);
          if (!open) {
            setUploadFile(null);
            setUploadProgress(0);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Documento</DialogTitle>
          </DialogHeader>
          <Tabs value={addTab} onValueChange={setAddTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="url">
                <Globe className="h-3 w-3 mr-1" /> URL
              </TabsTrigger>
              <TabsTrigger value="file">
                <FileText className="h-3 w-3 mr-1" /> File
              </TabsTrigger>
              <TabsTrigger value="text">
                <Type className="h-3 w-3 mr-1" /> Testo
              </TabsTrigger>
            </TabsList>

            {/* URL Tab */}
            <TabsContent value="url" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>URL del sito o pagina</Label>
                <Input placeholder="https://esempio.com/pagina" value={urlInput} onChange={(e) => setUrlInput(e.target.value)} />
              </div>
              <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={addUrl} disabled={saving || !urlInput}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Aggiungi URL
              </Button>
            </TabsContent>

            {/* File Tab */}
            <TabsContent value="file" className="space-y-4 mt-4">
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setFileDragOver(true);
                }}
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
                    <p className="text-xs text-ink-400">{(uploadFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-ink-400 mx-auto mb-2" />
                    <p className="text-sm text-ink-500">Trascina un file qui o clicca per selezionare</p>
                    <p className="text-xs text-ink-400 mt-1">PDF, TXT, CSV — Max 10MB</p>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.csv"
                  className="hidden"
                  onChange={handleFileInputChange}
                />
              </div>

              {uploading && (
                <div className="space-y-1">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-ink-400 text-center">Caricamento in corso... {uploadProgress}%</p>
                </div>
              )}

              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white"
                onClick={uploadFileToStorage}
                disabled={!uploadFile || uploading}
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                {uploading ? "Caricamento..." : "Carica File"}
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
                <Textarea
                  rows={6}
                  placeholder="Incolla o scrivi il testo..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
              </div>
              <Button
                className="w-full bg-brand hover:bg-brand-hover text-white"
                onClick={addText}
                disabled={saving || !textName || !textContent}
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null} Aggiungi Testo
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
