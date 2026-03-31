import { memo } from 'react';
import { Plus, FileText, File } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KBDoc {
  id: string;
  nome: string;
  file_type: string;
  pagine?: number | null;
  file_size_kb?: number | null;
  categoria: string;
}

interface DocumentoKBCardProps {
  doc: KBDoc;
  onAdd: (doc: KBDoc) => void;
  alreadyAdded?: boolean;
}

export const DocumentoKBCard = memo(function DocumentoKBCard({
  doc,
  onAdd,
  alreadyAdded = false,
}: DocumentoKBCardProps) {
  const isPdf = doc.file_type?.toLowerCase().includes('pdf');

  return (
    <div className={cn(
      'flex items-start gap-2.5 rounded-xl border bg-card px-3 py-2.5 transition-colors',
      alreadyAdded ? 'opacity-50' : 'hover:bg-muted/40 cursor-pointer',
    )}
      onClick={() => !alreadyAdded && onAdd(doc)}
    >
      <div className="shrink-0 w-7 h-7 rounded-lg bg-blue-500/10 flex items-center justify-center mt-0.5">
        {isPdf ? (
          <FileText className="h-3.5 w-3.5 text-blue-500" />
        ) : (
          <File className="h-3.5 w-3.5 text-blue-400" />
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-0.5">
        <div className="text-sm font-medium truncate">{doc.nome}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{doc.categoria}</span>
          {doc.pagine != null && <><span>·</span><span>{doc.pagine} pag.</span></>}
          {doc.file_size_kb != null && <><span>·</span><span>{doc.file_size_kb} KB</span></>}
        </div>
      </div>

      <button
        type="button"
        disabled={alreadyAdded}
        onClick={e => { e.stopPropagation(); !alreadyAdded && onAdd(doc); }}
        className={cn(
          'shrink-0 p-1.5 rounded-lg transition-colors',
          alreadyAdded
            ? 'text-green-500 cursor-default'
            : 'text-muted-foreground/50 hover:text-primary hover:bg-primary/10',
        )}
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  );
});
