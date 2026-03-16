import { useState, useRef, useCallback } from 'react';
import {
  Upload, Trash2, RefreshCw, Search, CheckCircle2,
  Clock, AlertCircle, FileText, Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useKnowledgeBase } from '@/hooks/useKnowledgeBase';
import { useCompanyId } from '@/hooks/useCompanyId';
import type { CategoriaKB, KBDocumento } from '@/modules/preventivo/types';

import { CATEGORIA_KB_META } from '@/modules/preventivo/lib/defaultTemplate';

const CATEGORIA_META = CATEGORIA_KB_META;

const STATO_META: Record<string, { label: string; icon: typeof Clock; colore: string }> = {
  caricato:     { label: 'In attesa',    icon: Clock,        colore: 'text-amber-500' },
  elaborazione: { label: 'Elaborazione', icon: RefreshCw,    colore: 'text-blue-500' },
  indicizzato:  { label: 'Indicizzato',  icon: CheckCircle2, colore: 'text-green-500' },
  errore:       { label: 'Errore',       icon: AlertCircle,  colore: 'text-red-500' },
};

export default function KnowledgeBasePreventivo() {
  const companyId = useCompanyId();
  const {
    documenti, isLoading, stats, uploading, uploadProgress,
    uploadDocumento, eliminaDocumento, reIndicizza, testSearch
  } = useKnowledgeBase();

  const [categoriaUpload, setCategoriaUpload] = useState<CategoriaKB>('scheda_tecnica');
  const [dragOver, setDragOver] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: string; testo: string; categoria: string; similarity: number }>>([]);
  const [searching, setSearching] = useState(false);
  const [filtroCategoria, setFiltroCategoria] = useState<string>('tutti');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    files.forEach(f => {
      if (['application/pdf', 'text/plain', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(f.type)) {
        uploadDocumento(f, categoriaUpload);
      }
    });
  }, [categoriaUpload, uploadDocumento]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    const results = await testSearch(searchQuery);
    setSearchResults(results);
    setSearching(false);
  };

  const docsFiltrati = filtroCategoria === 'tutti'
    ? documenti
    : documenti.filter(d => d.categoria === filtroCategoria);

  if (!companyId) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Nessuna azienda selezionata
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Knowledge Base Preventivi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {stats.indicizzati}/{stats.totale} documenti indicizzati · {stats.chunks_totali.toLocaleString()} frammenti
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Totale', val: stats.totale, icon: FileText, color: 'text-muted-foreground' },
          { label: 'Indicizzati', val: stats.indicizzati, icon: CheckCircle2, color: 'text-green-600' },
          { label: 'In elaborazione', val: stats.in_elaborazione, icon: Clock, color: 'text-amber-600' },
          { label: 'Frammenti', val: stats.chunks_totali.toLocaleString(), icon: Zap, color: 'text-violet-600' },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-2 rounded-lg border bg-card p-3">
            <s.icon className={cn('h-4 w-4', s.color)} />
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-semibold">{s.val}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Upload area */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Carica documento</p>
        <div className="flex items-center gap-2">
          <Select value={categoriaUpload} onValueChange={v => setCategoriaUpload(v as CategoriaKB)}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(CATEGORIA_META).map(([key, meta]) => (
                <SelectItem key={key} value={key}>
                  {meta.emoji} {meta.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="gap-1.5"
          >
            <Upload className="h-3.5 w-3.5" />
            Sfoglia
          </Button>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={e => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            'border-2 border-dashed rounded-xl py-8 text-center cursor-pointer transition-all',
            dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
          )}
        >
          <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Trascina qui PDF, DOCX o TXT</p>
          <p className="text-xs text-muted-foreground/70 mt-1">max 50MB per file</p>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept=".pdf,.docx,.txt"
          multiple
          onChange={e => {
            Array.from(e.target.files || []).forEach(f =>
              uploadDocumento(f, categoriaUpload)
            );
          }}
        />

        {/* Upload progress */}
        {Object.entries(uploadProgress).map(([id, progress]) => (
          <div key={id} className="space-y-1">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Indicizzazione in corso…</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        ))}
      </div>

      {/* Test RAG search */}
      <div className="rounded-xl border bg-card p-4 space-y-3">
        <p className="text-sm font-medium">Test ricerca knowledge base</p>
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="es. garanzia prodotti, sistemi di isolamento, prezzi infissi…"
            className="h-9 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <Button size="sm" onClick={handleSearch} disabled={searching} className="gap-1.5">
            <Search className="h-3.5 w-3.5" />
            {searching ? 'Cerco…' : 'Cerca'}
          </Button>
        </div>

        {searchResults.length > 0 && (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {searchResults.map((result, i) => (
              <div key={i} className="rounded-lg border p-3 text-sm space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">{result.categoria}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {(result.similarity * 100).toFixed(0)}% similarità
                  </span>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-3">{result.testo}</p>
              </div>
            ))}
          </div>
        )}
      </div>

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
              {Object.entries(CATEGORIA_META).map(([k, m]) => (
                <SelectItem key={k} value={k}>{m.emoji} {m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          {docsFiltrati.map(doc => {
            const catMeta = CATEGORIA_META[doc.categoria as CategoriaKB];
            const statoMeta = STATO_META[doc.stato];
            const StatoIcon = statoMeta?.icon || Clock;

            return (
              <div key={doc.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
                <span className="text-xl">{catMeta?.emoji || '📄'}</span>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{doc.nome}</p>
                  <p className="text-xs text-muted-foreground">
                    <Badge variant="outline" className="mr-1 text-[10px]">{catMeta?.label || doc.categoria}</Badge>
                    {doc.file_size_kb}KB
                    {doc.pagine ? ` · ${doc.pagine}p` : ''}
                    {doc.chunks_count ? ` · ${doc.chunks_count} frammenti` : ''}
                  </p>
                </div>

                <div className={cn('flex items-center gap-1 text-xs', statoMeta?.colore)}>
                  <StatoIcon className="h-3.5 w-3.5" />
                  {statoMeta?.label}
                </div>

                <div className="flex items-center gap-1">
                  {doc.stato === 'errore' && (
                    <button
                      onClick={() => reIndicizza(doc)}
                      className="p-1.5 text-amber-500 hover:bg-accent rounded-lg"
                      title="Re-indicizza"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => eliminaDocumento(doc.id)}
                    className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            );
          })}

          {docsFiltrati.length === 0 && !isLoading && (
            <p className="text-center text-sm text-muted-foreground py-8">
              Nessun documento nella knowledge base ancora
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
