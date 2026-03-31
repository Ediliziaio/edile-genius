import { memo } from 'react';
import { GripVertical, X, FileText, Minus, File } from 'lucide-react';
import type { DraggableProvided } from '@hello-pangea/dnd';
import type { PdfBlock } from '@/hooks/usePdfAssembler';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface PdfBlockCardProps {
  block: PdfBlock;
  draggableProvided: DraggableProvided;
  onUpdate: (patch: Partial<PdfBlock>) => void;
  onRemove: () => void;
}

export const PdfBlockCard = memo(function PdfBlockCard({
  block,
  draggableProvided,
  onUpdate,
  onRemove,
}: PdfBlockCardProps) {
  const isDivider = block.tipo === 'divider';
  const isPreventivo = block.tipo === 'preventivo';

  return (
    <div
      ref={draggableProvided.innerRef}
      {...draggableProvided.draggableProps}
      className={cn(
        'flex items-center gap-2 rounded-xl border bg-card px-3 py-2.5 shadow-sm',
        isDivider && 'border-dashed bg-muted/30',
        isPreventivo && 'border-primary/30 bg-primary/5',
      )}
    >
      {/* Drag handle */}
      <div
        {...draggableProvided.dragHandleProps}
        className="text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing shrink-0"
      >
        <GripVertical className="h-4 w-4" />
      </div>

      {/* Icon */}
      <div className={cn(
        'shrink-0 w-7 h-7 rounded-lg flex items-center justify-center',
        isDivider ? 'bg-muted' : isPreventivo ? 'bg-primary/10' : 'bg-blue-500/10',
      )}>
        {isDivider ? (
          <Minus className="h-3.5 w-3.5 text-muted-foreground" />
        ) : isPreventivo ? (
          <FileText className="h-3.5 w-3.5 text-primary" />
        ) : (
          <File className="h-3.5 w-3.5 text-blue-500" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isPreventivo && (
          <span className="text-sm font-medium">Preventivo (PDF principale)</span>
        )}

        {isDivider && (
          <Input
            value={block.testo ?? ''}
            onChange={e => onUpdate({ testo: e.target.value })}
            placeholder="Testo separatore (es. Capitolo 1 — Muratura)"
            className="h-7 text-xs border-0 bg-transparent px-0 focus-visible:ring-0 font-medium"
          />
        )}

        {block.tipo === 'kb_doc' && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium truncate">{block.doc_nome || 'Documento KB'}</span>
            <div className="flex items-center gap-1.5 shrink-0">
              <Switch
                id={`copertina-${block.id}`}
                checked={block.include_copertina ?? false}
                onCheckedChange={v => onUpdate({ include_copertina: v })}
                className="h-4 w-7"
              />
              <Label htmlFor={`copertina-${block.id}`} className="text-xs text-muted-foreground cursor-pointer">
                Pagina copertina
              </Label>
            </div>
            {block.doc_pagine != null && (
              <span className="text-xs text-muted-foreground shrink-0">{block.doc_pagine} pag.</span>
            )}
          </div>
        )}
      </div>

      {/* Remove (not for preventivo block) */}
      {!isPreventivo && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
});
