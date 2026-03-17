import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd';
import {
  GripVertical, Plus, Trash2, Eye, Save,
  ChevronDown, ChevronUp, CheckCircle2, Palette,
  Star
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { SEZIONI_DEFAULT, TIPO_SEZIONE_META } from '@/modules/preventivo/lib/defaultTemplate';
import type {
  PreventivoSezione, TipoSezione,
} from '@/modules/preventivo/types';
import { useCompanyId } from '@/hooks/useCompanyId';

// ─── Sezioni aggiungibili ─────────────────────────────────────────────────────

const SEZIONI_AGGIUNGIBILI: TipoSezione[] = [
  'copertina', 'presentazione_azienda', 'analisi_progetto', 'render_visivi',
  'schede_prodotti', 'descrizione_lavori', 'computo_metrico', 'offerta_economica',
  'condizioni_contrattuali', 'note_finali', 'portfolio_riferimenti', 'certificazioni',
  'garanzie', 'firma_cliente', 'superfici_computo',
];

function newSezione(tipo: TipoSezione): PreventivoSezione {
  const meta = TIPO_SEZIONE_META[tipo];
  const base = { id: crypto.randomUUID(), tipo, titolo: meta.label, attiva: true, ordine: 999 };

  switch (tipo) {
    case 'copertina':
      return { ...base, sorgente: 'manuale', config: { tipo, mostra_foto_progetto: true } };
    case 'presentazione_azienda':
      return { ...base, sorgente: 'kb_document', config: { tipo, max_pagine: 2 } };
    case 'analisi_progetto':
    case 'descrizione_lavori':
    case 'note_finali':
      return { ...base, sorgente: 'ai_generated', config: { tipo, usa_renders: true, usa_kb: tipo === 'descrizione_lavori', lunghezza: 'media', tono: 'professionale' } };
    case 'render_visivi':
      return { ...base, sorgente: 'renders', config: { tipo, render_ids: [], layout: 'affiancato', mostra_before: true, mostra_disclaimer: true, disclaimer_text: 'Le immagini sono elaborate con AI a scopo illustrativo e non costituiscono impegno contrattuale.' } };
    case 'schede_prodotti':
      return { ...base, sorgente: 'kb_document', config: { tipo, categoria_kb: 'scheda_tecnica', max_prodotti: 4, query_hint: '' } };
    case 'condizioni_contrattuali':
      return { ...base, sorgente: 'kb_document', config: { tipo, categoria_kb: 'condizioni_contrattuali' } };
    case 'portfolio_riferimenti':
      return { ...base, sorgente: 'kb_document', config: { tipo, categoria_kb: 'portfolio' } };
    case 'certificazioni':
      return { ...base, sorgente: 'kb_document', config: { tipo, categoria_kb: 'certificazioni' } };
    case 'garanzie':
      return { ...base, sorgente: 'kb_document', config: { tipo, categoria_kb: 'garanzie', query_hint: '' } };
    case 'computo_metrico':
      return { ...base, sorgente: 'tabella', config: { tipo, usa_stime_ai: true, voce_manuale: true } };
    case 'offerta_economica':
      return { ...base, sorgente: 'tabella', config: { tipo, mostra_prezzi_unitari: true, mostra_sconto: false, mostra_iva: true, valuta: 'EUR' } };
    case 'firma_cliente':
      return { ...base, sorgente: 'manuale', config: { tipo: 'firma_cliente', mostra_data: true, mostra_timbro: false, testo_accettazione: 'Il sottoscritto dichiara di accettare il presente preventivo nelle condizioni sopra descritte.' } };
    case 'superfici_computo':
      return { ...base, sorgente: 'ai_generated', config: { tipo: 'superfici_computo', usa_stime_ai: true, mostra_confidenza: true } };
    default:
      return { ...base, sorgente: 'manuale', config: { tipo } as any };
  }
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function PreventivoTemplateBuilder() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const companyId = useCompanyId();
  const isNew = !id || id === 'nuovo';

  const [nome, setNome] = useState('Template Standard');
  const [descrizione, setDescrizione] = useState('');
  const [sezioni, setSezioni] = useState<PreventivoSezione[]>(
    () => SEZIONI_DEFAULT.map(s => ({ ...s, id: crypto.randomUUID() }))
  );
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [saving, setSaving] = useState(false);
  const [colore, setColore] = useState('#6D28D9');
  const [piede, setPiede] = useState('');
  const [isDirty, setIsDirty] = useState(false);

  // Track dirty state helpers
  const markDirty = useCallback(() => setIsDirty(true), []);

  const setNomeDirty = useCallback((v: string) => { setNome(v); markDirty(); }, [markDirty]);
  const setDescrizioneDirty = useCallback((v: string) => { setDescrizione(v); markDirty(); }, [markDirty]);
  const setColoreDirty = useCallback((v: string) => { setColore(v); markDirty(); }, [markDirty]);
  const setPiedeDirty = useCallback((v: string) => { setPiede(v); markDirty(); }, [markDirty]);

  useQuery({
    queryKey: ['template', id],
    enabled: !isNew && !!id,
    queryFn: async () => {
      const { data } = await supabase
        .from('preventivo_templates')
        .select('*')
        .eq('id', id!)
        .single();
      if (data) {
        setNome(data.nome || 'Template Standard');
        setDescrizione(data.descrizione || '');
        const sezioniData = data.sezioni as unknown;
        if (Array.isArray(sezioniData)) setSezioni(sezioniData as PreventivoSezione[]);
        setColore(data.colore_primario || '#6D28D9');
        setPiede(data.piede_pagina || '');
        setIsDirty(false);
      }
      return data;
    },
  });

  // ── DnD reorder ──
  const onDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    const startIdx = result.source.index;
    const endIdx = result.destination.index;
    if (startIdx === endIdx) return;
    setSezioni(prev => {
      const items = [...prev];
      const [moved] = items.splice(startIdx, 1);
      items.splice(endIdx, 0, moved);
      return items.map((s, i) => ({ ...s, ordine: i }));
    });
    markDirty();
  }, [markDirty]);

  const toggleSezione = (sid: string) => {
    setSezioni(prev => prev.map(s => s.id === sid ? { ...s, attiva: !s.attiva } : s));
    markDirty();
  };

  const removeSezione = (sid: string) => {
    setSezioni(prev => prev.filter(s => s.id !== sid));
    markDirty();
  };

  const addSezione = (tipo: TipoSezione) => {
    const nuova = newSezione(tipo);
    nuova.ordine = sezioni.length;
    setSezioni(prev => [...prev, nuova]);
    setExpandedId(nuova.id);
    setShowAddMenu(false);
    markDirty();
  };

  const updateSezioneConfig = (sid: string, updates: Partial<PreventivoSezione>) => {
    setSezioni(prev => prev.map(s => s.id === sid ? { ...s, ...updates } : s));
    markDirty();
  };

  const handleSave = async (asDefault = false) => {
    if (!companyId) { toast.error('Company non trovata'); return; }
    setSaving(true);
    try {
      const payload = {
        company_id: companyId,
        nome,
        descrizione,
        sezioni: sezioni as any,
        is_default: asDefault,
        colore_primario: colore,
        piede_pagina: piede,
      };

      if (isNew) {
        const { data, error } = await supabase
          .from('preventivo_templates')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        toast.success('Template creato!');
        navigate(`/app/preventivi/templates/${data.id}`, { replace: true });
      } else {
        const { error } = await supabase
          .from('preventivo_templates')
          .update(payload)
          .eq('id', id!);
        if (error) throw error;
        toast.success('Template salvato!');
      }
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['preventivo_templates'] });
    } catch (err: any) {
      toast.error('Errore: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const sezioniAttive = sezioni.filter(s => s.attiva).length;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header sticky */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Palette className="w-5 h-5 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <input
                value={nome}
                onChange={e => setNomeDirty(e.target.value)}
                className="font-bold text-foreground bg-transparent border-0 outline-none text-base w-full max-w-sm"
                placeholder="Nome template"
              />
              <p className="text-xs text-muted-foreground">{sezioniAttive} sezioni attive</p>
            </div>
            {isDirty && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-400 bg-amber-50 dark:bg-amber-950/30 flex-shrink-0">
                Non salvato
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={() => handleSave(false)} disabled={saving}>
              <Save className="w-4 h-4 mr-1" /> Salva
            </Button>
            <Button size="sm" variant="outline" onClick={() => handleSave(true)} disabled={saving}>
              <Star className="w-4 h-4 mr-1" /> Salva come default
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Sidebar: Branding + Preview ── */}
          <div className="space-y-4">
            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" /> Branding
              </h3>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Colore primario</Label>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="relative w-9 h-9 rounded-lg border border-border overflow-hidden flex-shrink-0" style={{ backgroundColor: colore }}>
                      <input type="color" value={colore} onChange={e => setColoreDirty(e.target.value)} className="opacity-0 w-full h-full cursor-pointer" />
                    </div>
                    <Input value={colore} onChange={e => setColoreDirty(e.target.value)} className="h-9 text-xs font-mono" />
                  </div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Piede di pagina</Label>
                  <Textarea value={piede} onChange={e => setPiedeDirty(e.target.value)} className="mt-1 text-xs resize-none" rows={2} placeholder="es. P.IVA 01234567890 — Via Roma 1, Milano" />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl border border-border p-4">
              <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                <Eye className="w-4 h-4 text-primary" /> Struttura preventivo
              </h3>
              <div className="space-y-1">
                {sezioni.map((s, i) => {
                  const meta = TIPO_SEZIONE_META[s.tipo];
                  return (
                    <div key={s.id} className={cn('flex items-center gap-2 py-1 text-xs rounded-lg px-2', s.attiva ? 'text-foreground' : 'text-muted-foreground/50')}>
                      <span className="w-5 text-muted-foreground text-right">{i + 1}</span>
                      <span>{meta?.emoji}</span>
                      <span className="flex-1 truncate">{s.titolo}</span>
                      {!s.attiva && <span className="text-muted-foreground/50">off</span>}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ── Main: Sections list with DnD ── */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">Sezioni del preventivo</h2>
              <div className="relative">
                <Button size="sm" variant="outline" onClick={() => setShowAddMenu(!showAddMenu)} className="gap-1.5 text-xs">
                  <Plus className="w-3.5 h-3.5" /> Aggiungi sezione
                </Button>
                {showAddMenu && (
                  <div className="absolute right-0 top-full mt-1 bg-popover border border-border rounded-xl shadow-xl z-30 w-64 max-h-80 overflow-y-auto">
                    <div className="p-2 space-y-0.5">
                      {SEZIONI_AGGIUNGIBILI.map(tipo => {
                        const meta = TIPO_SEZIONE_META[tipo];
                        const esiste = sezioni.some(s => s.tipo === tipo);
                        return (
                          <button key={tipo} onClick={() => !esiste && addSezione(tipo)} disabled={esiste}
                            className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors', esiste ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent text-popover-foreground')}>
                            <span className="text-base">{meta.emoji}</span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm">{meta.label}</p>
                              <p className="text-xs text-muted-foreground truncate">{meta.desc}</p>
                            </div>
                            {esiste && <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="sezioni-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-2"
                  >
                    {sezioni.map((sezione, index) => (
                      <Draggable key={sezione.id} draggableId={sezione.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={cn(
                              'bg-card rounded-2xl border-2 transition-all overflow-hidden',
                              sezione.attiva ? 'border-border' : 'border-border/50 opacity-60',
                              snapshot.isDragging && 'shadow-lg ring-2 ring-primary/30 border-primary/40'
                            )}
                          >
                            <div className="flex items-center gap-2 px-3 py-2.5">
                              {/* Drag handle */}
                              <div
                                {...provided.dragHandleProps}
                                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground p-0.5"
                              >
                                <GripVertical className="w-4 h-4" />
                              </div>

                              <Switch checked={sezione.attiva} onCheckedChange={() => toggleSezione(sezione.id)} className="flex-shrink-0" />
                              <span className="text-base">{TIPO_SEZIONE_META[sezione.tipo]?.emoji}</span>
                              <input value={sezione.titolo} onChange={e => updateSezioneConfig(sezione.id, { titolo: e.target.value })}
                                className="flex-1 text-sm font-medium text-foreground bg-transparent border-0 outline-none min-w-0" />

                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                {sezione.sorgente === 'ai_generated' && '✨ AI'}
                                {sezione.sorgente === 'kb_document' && '📚 KB'}
                                {sezione.sorgente === 'renders' && '🖼️ Render'}
                                {sezione.sorgente === 'tabella' && '📊 Tabella'}
                                {sezione.sorgente === 'manuale' && '✏️ Manuale'}
                              </Badge>

                              <button onClick={() => setExpandedId(expandedId === sezione.id ? null : sezione.id)} className="p-1 text-muted-foreground hover:text-foreground rounded-lg">
                                {expandedId === sezione.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                              <button onClick={() => removeSezione(sezione.id)} className="p-1 text-destructive/50 hover:text-destructive rounded-lg">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            {expandedId === sezione.id && (
                              <div className="px-4 pb-4 pt-1 border-t border-border bg-muted/30">
                                <SezioneConfigPanel sezione={sezione} onChange={updates => updateSezioneConfig(sezione.id, updates)} />
                              </div>
                            )}
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SezioneConfigPanel ───────────────────────────────────────────────────────

function SezioneConfigPanel({ sezione, onChange }: { sezione: PreventivoSezione; onChange: (u: Partial<PreventivoSezione>) => void }) {
  const cfg = sezione.config as any;
  const update = (field: string, value: any) => onChange({ config: { ...cfg, [field]: value } });

  switch (sezione.tipo) {
    case 'copertina':
      return (
        <div className="space-y-2.5">
          <SwitchRow label="Mostra foto progetto in copertina" checked={cfg.mostra_foto_progetto} onChange={v => update('mostra_foto_progetto', v)} />
          <div>
            <Label className="text-xs text-muted-foreground">Sottotitolo personalizzato (opzionale)</Label>
            <Input value={cfg.sottotitolo_custom || ''} onChange={e => update('sottotitolo_custom', e.target.value)} placeholder="es. Proposta di ristrutturazione" className="mt-1 h-8 text-sm" />
          </div>
        </div>
      );
    case 'presentazione_azienda':
      return (
        <div>
          <Label className="text-xs text-muted-foreground">Massimo pagine da inserire</Label>
          <Select value={String(cfg.max_pagine)} onValueChange={v => update('max_pagine', parseInt(v))}>
            <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4].map(n => <SelectItem key={n} value={String(n)}>{n} pagina{n > 1 ? 'e' : ''}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      );
    case 'render_visivi':
      return (
        <div className="space-y-2.5">
          <div>
            <Label className="text-xs text-muted-foreground">Layout render</Label>
            <Select value={cfg.layout} onValueChange={v => update('layout', v)}>
              <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="singolo">📄 Singolo (full page)</SelectItem>
                <SelectItem value="affiancato">◫ Affiancato (prima/dopo)</SelectItem>
                <SelectItem value="griglia">⊞ Griglia (2 per riga)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <SwitchRow label="Mostra immagine originale (prima)" checked={cfg.mostra_before} onChange={v => update('mostra_before', v)} />
          <SwitchRow label="Mostra disclaimer AI" checked={cfg.mostra_disclaimer} onChange={v => update('mostra_disclaimer', v)} />
          {cfg.mostra_disclaimer && (
            <div>
              <Label className="text-xs text-muted-foreground">Testo disclaimer</Label>
              <Textarea value={cfg.disclaimer_text} onChange={e => update('disclaimer_text', e.target.value)} className="mt-1 text-xs resize-none" rows={2} />
            </div>
          )}
        </div>
      );
    case 'analisi_progetto':
    case 'descrizione_lavori':
    case 'note_finali':
      return (
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <Label className="text-xs text-muted-foreground">Lunghezza testo</Label>
              <Select value={cfg.lunghezza} onValueChange={v => update('lunghezza', v)}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="breve">Breve (1 par.)</SelectItem>
                  <SelectItem value="media">Media (2-3 par.)</SelectItem>
                  <SelectItem value="dettagliata">Dettagliata (4+ par.)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Tono</Label>
              <Select value={cfg.tono} onValueChange={v => update('tono', v)}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="formale">Formale</SelectItem>
                  <SelectItem value="professionale">Professionale</SelectItem>
                  <SelectItem value="tecnico">Tecnico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SwitchRow label="Usa dati render per il contesto" checked={cfg.usa_renders} onChange={v => update('usa_renders', v)} />
          {sezione.tipo === 'descrizione_lavori' && (
            <SwitchRow label="Attinge dalla knowledge base" checked={cfg.usa_kb} onChange={v => update('usa_kb', v)} />
          )}
          <div>
            <Label className="text-xs text-muted-foreground">Istruzioni aggiuntive per l'AI (opzionale)</Label>
            <Textarea value={cfg.istruzioni_custom || ''} onChange={e => update('istruzioni_custom', e.target.value)} className="mt-1 text-xs resize-none" rows={2} placeholder="es. Evidenzia i benefici di risparmio energetico…" />
          </div>
        </div>
      );
    case 'schede_prodotti':
    case 'condizioni_contrattuali':
    case 'portfolio_riferimenti':
    case 'certificazioni':
    case 'garanzie':
      return (
        <div className="space-y-2.5">
          <div>
            <Label className="text-xs text-muted-foreground">Query di ricerca nel KB</Label>
            <Input value={cfg.query_hint || ''} onChange={e => update('query_hint', e.target.value)} placeholder="es. sistemi di isolamento termico…" className="mt-1 h-8 text-sm" />
            <p className="text-xs text-muted-foreground mt-1">Lascia vuoto: l'AI userà il contesto del progetto</p>
          </div>
          {sezione.tipo === 'schede_prodotti' && (
            <div>
              <Label className="text-xs text-muted-foreground">Numero massimo prodotti</Label>
              <Select value={String(cfg.max_prodotti || 4)} onValueChange={v => update('max_prodotti', parseInt(v))}>
                <SelectTrigger className="mt-1 h-8 text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[2, 3, 4, 6, 8].map(n => <SelectItem key={n} value={String(n)}>{n} prodotti</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      );
    case 'offerta_economica':
      return (
        <div className="space-y-2.5">
          <SwitchRow label="Mostra prezzi unitari" checked={cfg.mostra_prezzi_unitari} onChange={v => update('mostra_prezzi_unitari', v)} />
          <SwitchRow label="Mostra riga sconto" checked={cfg.mostra_sconto} onChange={v => update('mostra_sconto', v)} />
          <SwitchRow label="Mostra IVA separata" checked={cfg.mostra_iva} onChange={v => update('mostra_iva', v)} />
        </div>
      );
    case 'firma_cliente':
      return (
        <div className="space-y-2.5">
          <div>
            <Label className="text-xs text-muted-foreground">Testo di accettazione</Label>
            <Textarea
              value={cfg.testo_accettazione || ''}
              onChange={e => update('testo_accettazione', e.target.value)}
              className="mt-1 text-xs resize-none"
              rows={3}
              placeholder="Il sottoscritto dichiara di accettare..."
            />
          </div>
          <SwitchRow label="Mostra data firma" checked={cfg.mostra_data ?? true} onChange={v => update('mostra_data', v)} />
          <SwitchRow label="Mostra timbro aziendale" checked={cfg.mostra_timbro ?? false} onChange={v => update('mostra_timbro', v)} />
        </div>
      );
    case 'superfici_computo':
      return (
        <div className="space-y-2.5">
          <SwitchRow label="Usa stime AI per le superfici" checked={cfg.usa_stime_ai ?? true} onChange={v => update('usa_stime_ai', v)} />
          <SwitchRow label="Mostra livello di confidenza" checked={cfg.mostra_confidenza ?? true} onChange={v => update('mostra_confidenza', v)} />
        </div>
      );
    default:
      return <p className="text-xs text-muted-foreground italic">Nessuna configurazione disponibile per questa sezione.</p>;
  }
}

function SwitchRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3 py-0.5">
      <Label className="text-xs text-muted-foreground cursor-pointer flex-1">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
