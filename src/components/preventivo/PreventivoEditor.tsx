import { useState, useEffect, useRef, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import { Plus, Save, Loader2 } from 'lucide-react';
import type { PreventivoVoce } from '@/lib/preventivo-pdf';
import { computeVoceTotale } from '@/lib/computedTotals';
import { VoceRow } from './VoceRow';
import { CercaListinoPopover } from './CercaListinoPopover';
import { TotaliLivePanel } from './TotaliLivePanel';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

const DEBOUNCE_MS = 1500;

const EMPTY_VOCE = (): Omit<PreventivoVoce, 'id' | 'ordine'> => ({
  categoria: 'Generale',
  titolo_voce: '',
  descrizione: '',
  unita_misura: 'nr',
  quantita: 1,
  prezzo_unitario: 0,
  sconto_percentuale: 0,
  totale: 0,
  foto_urls: [],
  note_voce: '',
  evidenziata: false,
});

interface PreventivoEditorProps {
  preventivoId: string;
  initialVoci: PreventivoVoce[];
  initialIntroPrevio?: string;
  initialCondizioniPagamento?: string;
  initialNote?: string;
  ivaPercentuale?: number;
  companyId: string | null | undefined;
  onSave: (patch: {
    voci: PreventivoVoce[];
    intro_testo?: string;
    condizioni_pagamento?: string;
    note?: string;
  }) => Promise<void>;
  readOnly?: boolean;
}

export function PreventivoEditor({
  initialVoci,
  initialIntroPrevio,
  initialCondizioniPagamento,
  initialNote,
  ivaPercentuale = 22,
  companyId,
  onSave,
  readOnly = false,
}: PreventivoEditorProps) {
  const [voci, setVoci] = useState<PreventivoVoce[]>(initialVoci);
  const [introTesto, setIntroTesto] = useState(initialIntroPrevio ?? '');
  const [condizioniPagamento, setCondizioniPagamento] = useState(initialCondizioniPagamento ?? '');
  const [note, setNote] = useState(initialNote ?? '');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(false);
  const saveRef = useRef(onSave);
  saveRef.current = onSave;

  // Auto-save debounced
  const scheduleSave = useCallback((
    newVoci: PreventivoVoce[],
    intro: string,
    condizioni: string,
    n: string,
  ) => {
    setDirty(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSaving(true);
      try {
        await saveRef.current({ voci: newVoci, intro_testo: intro, condizioni_pagamento: condizioni, note: n });
        setDirty(false);
      } finally {
        setSaving(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  // Trigger save when voci/testi change (skip initial mount)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    if (!readOnly) scheduleSave(voci, introTesto, condizioniPagamento, note);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voci, introTesto, condizioniPagamento, note]);

  // Cleanup on unmount
  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const updateVoce = useCallback((index: number, field: keyof PreventivoVoce, value: any) => {
    setVoci(prev => {
      const next = [...prev];
      const v = { ...next[index], [field]: value };
      if (['quantita', 'prezzo_unitario', 'sconto_percentuale'].includes(field)) {
        v.totale = computeVoceTotale(v);
      }
      next[index] = v;
      return next;
    });
  }, []);

  const addVoce = useCallback((partial?: Omit<PreventivoVoce, 'id' | 'ordine'>) => {
    const base = partial ?? EMPTY_VOCE();
    const newVoce: PreventivoVoce = {
      id: crypto.randomUUID(),
      ordine: voci.length + 1,
      ...base,
      totale: computeVoceTotale({ ...base } as PreventivoVoce),
    };
    setVoci(prev => [...prev, newVoce]);
  }, [voci.length]);

  const deleteVoce = useCallback((index: number) => {
    setVoci(prev => prev.filter((_, i) => i !== index).map((v, i) => ({ ...v, ordine: i + 1 })));
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const { source, destination } = result;
    setVoci(prev => {
      const arr = [...prev];
      const [moved] = arr.splice(source.index, 1);
      arr.splice(destination.index, 0, moved);
      return arr.map((v, i) => ({ ...v, ordine: i + 1 }));
    });
  }, []);

  const forceSave = async () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaving(true);
    try {
      await saveRef.current({ voci, intro_testo: introTesto, condizioni_pagamento: condizioniPagamento, note });
      setDirty(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex gap-6 h-full">
      {/* Main area */}
      <div className="flex-1 min-w-0 space-y-4">
        <Tabs defaultValue="voci">
          <div className="flex items-center justify-between mb-2">
            <TabsList>
              <TabsTrigger value="voci">Voci ({voci.length})</TabsTrigger>
              <TabsTrigger value="testi">Testi</TabsTrigger>
              <TabsTrigger value="note">Note</TabsTrigger>
            </TabsList>

            {/* Auto-save indicator */}
            <div className="flex items-center gap-2">
              {saving && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin" /> Salvataggio...
                </span>
              )}
              {!saving && dirty && (
                <span className="text-xs text-amber-500">● Modifiche non salvate</span>
              )}
              {!saving && !dirty && (
                <span className="text-xs text-green-500">● Salvato</span>
              )}
              {!readOnly && (
                <Button size="sm" variant="outline" onClick={forceSave} className="h-8 gap-1.5 text-xs">
                  <Save className="h-3.5 w-3.5" /> Salva ora
                </Button>
              )}
            </div>
          </div>

          {/* TAB: VOCI */}
          <TabsContent value="voci" className="mt-0">
            {/* Column headers */}
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground border-b mb-2">
              <div className="w-4 shrink-0" />
              <div className="w-28 shrink-0">Categoria</div>
              <div className="flex-1">Voce</div>
              <div className="w-20 text-right shrink-0">Qtà</div>
              <div className="w-24 shrink-0">U.M.</div>
              <div className="w-28 text-right shrink-0">Prezzo unit.</div>
              <div className="w-16 text-right shrink-0">Sconto</div>
              <div className="w-28 text-right shrink-0">Totale</div>
              <div className="w-20 shrink-0" />
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="voci-list">
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    className="space-y-1.5"
                  >
                    {voci.map((v, i) => (
                      <Draggable key={v.id} draggableId={v.id} index={i} isDragDisabled={readOnly}>
                        {(dragProvided) => (
                          <VoceRow
                            voce={v}
                            index={i}
                            expanded={expandedIds.has(v.id)}
                            draggableProvided={dragProvided}
                            onChange={(field, value) => !readOnly && updateVoce(i, field, value)}
                            onToggleExpand={() => toggleExpand(v.id)}
                            onDelete={() => !readOnly && deleteVoce(i)}
                          />
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            {!readOnly && (
              <div className="flex items-center gap-2 mt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addVoce()}
                  className="gap-1.5 text-xs h-8"
                >
                  <Plus className="h-3.5 w-3.5" /> Aggiungi voce
                </Button>
                <CercaListinoPopover
                  companyId={companyId}
                  onSelectVoce={(partial) => addVoce(partial)}
                />
              </div>
            )}
          </TabsContent>

          {/* TAB: TESTI */}
          <TabsContent value="testi" className="mt-0 space-y-4">
            <div className="space-y-2">
              <Label>Testo introduttivo</Label>
              <Textarea
                value={introTesto}
                onChange={e => !readOnly && setIntroTesto(e.target.value)}
                placeholder="Testo di presentazione del preventivo visibile al cliente..."
                rows={5}
                readOnly={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Condizioni di pagamento</Label>
              <Textarea
                value={condizioniPagamento}
                onChange={e => !readOnly && setCondizioniPagamento(e.target.value)}
                placeholder="Es. 30% all'ordine, 40% a metà lavori, 30% al saldo..."
                rows={4}
                readOnly={readOnly}
              />
            </div>
          </TabsContent>

          {/* TAB: NOTE */}
          <TabsContent value="note" className="mt-0">
            <div className="space-y-2">
              <Label>Note generali</Label>
              <Textarea
                value={note}
                onChange={e => !readOnly && setNote(e.target.value)}
                placeholder="Note interne o visibili al cliente..."
                rows={6}
                readOnly={readOnly}
              />
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sidebar: Totali */}
      <div className="w-64 shrink-0">
        <TotaliLivePanel
          voci={voci}
          ivaPercentuale={ivaPercentuale}
          className="sticky top-4"
        />
      </div>
    </div>
  );
}
