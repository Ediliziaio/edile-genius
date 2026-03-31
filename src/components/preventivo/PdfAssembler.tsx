import { useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, Download, Loader2, FileDown, Minus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { usePdfAssembler } from '@/hooks/usePdfAssembler';
import type { PdfBlock } from '@/hooks/usePdfAssembler';
import { PdfBlockCard } from './PdfBlockCard';
import { DocumentoKBCard } from './DocumentoKBCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PdfAssemblerProps {
  preventivoId: string;
  companyId: string | null | undefined;
}

export function PdfAssembler({ preventivoId, companyId }: PdfAssemblerProps) {
  const {
    blocks,
    assembling,
    result,
    addBlock,
    removeBlock,
    reorderBlocks,
    updateBlock,
    loadFromPreventivo,
    assemble,
  } = usePdfAssembler({ preventivoId, companyId });

  // Load saved config on mount
  useEffect(() => {
    loadFromPreventivo();
  }, [loadFromPreventivo]);

  // Fetch KB documents
  const { data: kbDocs = [] } = useQuery({
    queryKey: ['kb-docs-assembler', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase
        .from('preventivo_kb_documenti' as any)
        .select('id, nome, file_type, pagine, file_size_kb, categoria')
        .eq('company_id', companyId)
        .eq('visibile', true)
        .order('categoria') as any);
      return (data ?? []) as Array<{
        id: string;
        nome: string;
        file_type: string;
        pagine: number | null;
        file_size_kb: number | null;
        categoria: string;
      }>;
    },
  });

  const addedDocIds = new Set(blocks.filter(b => b.tipo === 'kb_doc').map(b => b.doc_id));

  // Ensure preventivo block is always first
  const hasPreventivoBock = blocks.some(b => b.tipo === 'preventivo');

  const handleAddPreventivo = () => {
    if (!hasPreventivoBock) {
      addBlock({ tipo: 'preventivo' });
    }
  };

  const handleAddDivider = () => {
    addBlock({ tipo: 'divider', testo: '' });
  };

  const handleAddKBDoc = (doc: typeof kbDocs[number]) => {
    addBlock({
      tipo: 'kb_doc',
      doc_id: doc.id,
      doc_nome: doc.nome,
      doc_pagine: doc.pagine,
      include_copertina: false,
    });
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const arr = [...blocks];
    const [moved] = arr.splice(result.source.index, 1);
    arr.splice(result.destination.index, 0, moved);
    reorderBlocks(arr);
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Assembly area */}
      <div className="flex-1 min-w-0 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Assemblaggio PDF</h3>
            <p className="text-xs text-muted-foreground">Trascina i blocchi per definire l'ordine del documento finale</p>
          </div>
          <div className="flex items-center gap-2">
            {result && (
              <a href={result.pdf_url} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="gap-1.5 text-xs h-8">
                  <FileDown className="h-3.5 w-3.5" /> Scarica PDF ({result.pagine_totali} pag.)
                </Button>
              </a>
            )}
            <Button
              size="sm"
              onClick={assemble}
              disabled={assembling || blocks.length === 0}
              className="gap-1.5 text-xs h-8"
            >
              {assembling ? (
                <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Assemblaggio...</>
              ) : (
                <><Download className="h-3.5 w-3.5" /> Assembla PDF</>
              )}
            </Button>
          </div>
        </div>

        {/* Quick add buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddPreventivo}
            disabled={hasPreventivoBock}
            className="gap-1.5 text-xs h-8"
          >
            <Plus className="h-3.5 w-3.5" /> Preventivo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddDivider}
            className="gap-1.5 text-xs h-8"
          >
            <Minus className="h-3.5 w-3.5" /> Separatore
          </Button>
        </div>

        {/* Drag & Drop list */}
        {blocks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
            <p className="text-sm">Nessun blocco aggiunto</p>
            <p className="text-xs mt-1">Aggiungi il preventivo e i documenti dal pannello a destra</p>
          </div>
        ) : (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="pdf-blocks">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="space-y-2"
                >
                  {blocks.map((block, i) => (
                    <Draggable key={block.id} draggableId={block.id} index={i}>
                      {(dragProvided) => (
                        <PdfBlockCard
                          block={block}
                          draggableProvided={dragProvided}
                          onUpdate={(patch) => updateBlock(block.id, patch)}
                          onRemove={() => removeBlock(block.id)}
                        />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>

      {/* Right: KB Documents library */}
      <div className="w-72 shrink-0 space-y-3">
        <div>
          <h3 className="text-sm font-semibold">Documenti KB</h3>
          <p className="text-xs text-muted-foreground">Clicca per aggiungere al PDF</p>
        </div>

        <div className="space-y-1.5 max-h-[60vh] overflow-y-auto pr-1">
          {kbDocs.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              Nessun documento nella Knowledge Base
            </div>
          ) : (
            kbDocs.map(doc => (
              <DocumentoKBCard
                key={doc.id}
                doc={doc}
                onAdd={handleAddKBDoc}
                alreadyAdded={addedDocIds.has(doc.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
