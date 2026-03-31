import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { CATEGORIA_KB_META } from '@/modules/preventivo/lib/defaultTemplate';
import {
  Upload, FileText, CheckCircle2, AlertCircle, Loader2,
  Trash2, RefreshCw, Eye, Clock, Zap, Search, Tag, Check, X
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { CategoriaKB, KBDocumento } from '@/modules/preventivo/types';

/* ── Stato Badge ── */
function StatoBadge({ stato }: { stato: string }) {
  const map: Record<string, { label: string; className: string; icon: React.ReactNode }> = {
    caricato:     { label: 'In coda',      className: 'bg-muted text-muted-foreground',   icon: <Clock className="h-3 w-3" /> },
    elaborazione: { label: 'Elaborazione', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', icon: <Loader2 className="h-3 w-3 animate-spin" /> },
    indicizzato:  { label: 'Pronto',       className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',     icon: <CheckCircle2 className="h-3 w-3" /> },
    errore:       { label: 'Errore',       className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',             icon: <AlertCircle className="h-3 w-3" /> },
  };
  const s = map[stato] || map.caricato;
  return (
    <Badge variant="secondary" className={cn('gap-1 text-xs', s.className)}>
      {s.icon}{s.label}
    </Badge>
  );
}

/* ── Chunk Preview Dialog ── */
function ChunkPreviewDialog({
  doc,
  open,
  onOpenChange,
}: {
  doc: KBDocumento;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [chunks, setChunks] = useState<Array<{ testo: string; chunk_index: number }>>([]);
  const [loading, setLoading] = useState(false);

  const loadChunks = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('preventivo_kb_chunks')
      .select('testo, chunk_index')
      .eq('documento_id', doc.id)
      .order('chunk_index', { ascending: true })
      .limit(5);
    setChunks((data as any) || []);
    setLoading(false);
  }, [doc.id]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (v) loadChunks();
      }}
    >
      <DialogContent className="max-w-lg max-h-[70vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-sm">Anteprima chunks — {doc.nome}</DialogTitle>
        </DialogHeader>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : chunks.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nessun chunk trovato.</p>
        ) : (
          <div className="space-y-3">
            {chunks.map((c) => (
              <div key={c.chunk_index} className="rounded-lg border p-3 space-y-1">
                <Badge variant="outline" className="text-[10px]">
                  Chunk #{c.chunk_index}
                </Badge>
                <p className="text-xs text-muted-foreground whitespace-pre-wrap line-clamp-6">
                  {c.testo}
                </p>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

/* ── Codice Prodotto Inline Edit ── */
function CodiceProdottoEdit({ docId, current }: { docId: string; current: string | null }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current || '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    await (supabase.from('preventivo_kb_documenti' as any).update({ codice_prodotto: value.trim().toUpperCase() || null }).eq('id', docId) as any);
    setSaving(false);
    setEditing(false);
  };

  const cancel = () => { setValue(current || ''); setEditing(false); };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          value={value}
          onChange={e => setValue(e.target.value.toUpperCase())}
          placeholder="ES. URBAN"
          className="h-6 w-28 text-xs px-2 font-mono"
          onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') cancel(); }}
          autoFocus
        />
        {saving
          ? <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          : <>
              <button onClick={save} className="p-0.5 text-green-500 hover:text-green-400"><Check className="h-3.5 w-3.5" /></button>
              <button onClick={cancel} className="p-0.5 text-muted-foreground hover:text-foreground"><X className="h-3.5 w-3.5" /></button>
            </>
        }
      </div>
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      title="Imposta codice prodotto per abbinamento automatico"
      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group"
    >
      <Tag className="h-3 w-3" />
      {current
        ? <span className="font-mono text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">{current}</span>
        : <span className="text-[10px] group-hover:underline">+ codice</span>
      }
    </button>
  );
}

/* ── Main Component ── */
export function KnowledgeBaseManager() {
  const {
    documenti, isLoading, stats, uploading, uploadProgress,
    uploadDocumento, eliminaDocumento, reIndicizza, testSearch
  } = useKnowledgeBase();

  const [categoriaUpload, setCategoriaUpload] = useState<CategoriaKB>('scheda_tecnica');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('tutti');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; testo: string; categoria: string; similarity: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<KBDocumento | null>(null);

  /* Dropzone */
  const onDrop = useCallback(
    (accepted: File[]) => {
      accepted.forEach((f) => uploadDocumento(f, categoriaUpload));
    },
    [categoriaUpload, uploadDocumento],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
    maxSize: 50 * 1024 * 1024,
  });

  /* RAG search */
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await testSearch(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const docsFiltrati =
    filtroCategoria === 'tutti'
      ? documenti
      : documenti.filter((d) => d.categoria === filtroCategoria);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Totale', val: stats.totale, icon: FileText, color: 'text-muted-foreground' },
          { label: 'Indicizzati', val: stats.indicizzati, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'In elaborazione', val: stats.in_elaborazione, icon: Clock, color: 'text-amber-600' },
          { label: 'Frammenti', val: stats.chunks_totali.toLocaleString(), icon: Zap, color: 'text-violet-600' },
        ].map((s) => (
          <div key={s.label} className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <s.icon className={cn('h-4 w-4', s.color)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Carica documento</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={categoriaUpload} onValueChange={(v) => setCategoriaUpload(v as CategoriaKB)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIA_KB_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>
                  {m.emoji} {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div
            {...getRootProps()}
            className={cn(
              'border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition-all',
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50 hover:bg-muted/50',
            )}
          >
            <input {...getInputProps()} />
            <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">
              Trascina qui PDF, DOCX o TXT oppure clicca per selezionare
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">Max 50MB per file</p>
          </div>

          {Object.entries(uploadProgress).map(([id, progress]) => (
            <div key={id} className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Indicizzazione in corso…</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* RAG search test */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Test ricerca knowledge base</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="es. garanzia prodotti, sistemi di isolamento…"
              className="h-9 text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button size="sm" onClick={handleSearch} disabled={searching} className="gap-1.5">
              <Search className="h-3.5 w-3.5" />
              {searching ? 'Cerco…' : 'Cerca'}
            </Button>
          </div>
          {searchResults.length > 0 && (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {searchResults.map((r, i) => (
                <div key={i} className="rounded-lg border p-3 text-sm space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">{r.categoria}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {(r.similarity * 100).toFixed(0)}% similarità
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-3">{r.testo}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document list */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium">Documenti ({docsFiltrati.length})</p>
          <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tutti">Tutte le categorie</SelectItem>
              {Object.entries(CATEGORIA_KB_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>{m.emoji} {m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!isLoading && docsFiltrati.length === 0 && (
          <div className="text-center py-8 space-y-2">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nessun documento nella Knowledge Base</p>
            <p className="text-xs text-muted-foreground/70">Carica PDF o DOCX per addestrare l'AI</p>
          </div>
        )}

        <div className="space-y-2">
          {docsFiltrati.map((doc) => {
            const catMeta = CATEGORIA_KB_META[doc.categoria as CategoriaKB];
            return (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span className="text-xl">{catMeta?.emoji || '📄'}</span>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{doc.nome}</p>
                    <CodiceProdottoEdit docId={doc.id} current={(doc as any).codice_prodotto ?? null} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="mr-1 text-[10px]">
                      {catMeta?.label || doc.categoria}
                    </Badge>
                    {doc.file_size_kb}KB
                    {doc.pagine ? ` · ${doc.pagine}p` : ''}
                    {doc.chunks_count ? ` · ${doc.chunks_count} frammenti` : ''}
                  </p>
                </div>

                <StatoBadge stato={doc.stato} />

                <div className="flex items-center gap-1">
                  {/* Preview chunks */}
                  {doc.stato === 'indicizzato' && doc.chunks_count > 0 && (
                    <button
                      onClick={() => setPreviewDoc(doc)}
                      className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg"
                      title="Anteprima chunks"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Re-index */}
                  {doc.stato === 'errore' && (
                    <button
                      onClick={() => reIndicizza(doc)}
                      className="p-1.5 text-amber-500 hover:bg-accent rounded-lg"
                      title="Rielabora"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}

                  {/* Delete with confirm */}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Elimina documento?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Verranno eliminati anche tutti i {doc.chunks_count || 0} chunk estratti.
                          Questa azione non è reversibile.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => eliminaDocumento(doc.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Elimina
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>

                {doc.stato === 'elaborazione' && (
                  <Progress value={undefined} className="h-1 w-16" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Chunk preview dialog */}
      {previewDoc && (
        <ChunkPreviewDialog
          doc={previewDoc}
          open={!!previewDoc}
          onOpenChange={(v) => !v && setPreviewDoc(null)}
        />
      )}
    </div>
  );
}
