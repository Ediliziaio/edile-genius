import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  Plus, Pencil, Trash2, Search, Tag, FileText, Loader2,
} from 'lucide-react';
import { formatEuro } from '@/lib/computedTotals';
import { cn } from '@/lib/utils';

const UNITS = ['mq', 'ml', 'mc', 'nr', 'ore', 'forfait', 'kg', 'cad', 'corpo'];

interface ListinoVoce {
  id: string;
  codice: string | null;
  categoria: string;
  titolo_voce: string;
  descrizione: string | null;
  unita_misura: string;
  prezzo_unitario: number;
  iva_percentuale: number | null;
  note: string | null;
  attivo: boolean;
  kb_documento_id: string | null;
}

const EMPTY_FORM = (): Omit<ListinoVoce, 'id'> => ({
  codice: '',
  categoria: 'Generale',
  titolo_voce: '',
  descrizione: '',
  unita_misura: 'nr',
  prezzo_unitario: 0,
  iva_percentuale: 22,
  note: '',
  attivo: true,
  kb_documento_id: null,
});

export default function ListinoVociManager() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingVoce, setEditingVoce] = useState<ListinoVoce | null>(null);
  const [form, setForm] = useState<Omit<ListinoVoce, 'id'>>(EMPTY_FORM());

  // Fetch listino
  const { data: voci = [], isLoading } = useQuery({
    queryKey: ['listino-voci', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('listino_voci' as any)
        .select('*')
        .eq('company_id', companyId)
        .order('categoria')
        .order('titolo_voce') as any);
      if (error) throw error;
      return (data || []) as ListinoVoce[];
    },
  });

  // Fetch KB docs for selector
  const { data: kbDocs = [] } = useQuery({
    queryKey: ['kb-docs-listino', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase
        .from('preventivo_kb_documenti' as any)
        .select('id, nome, codice_prodotto')
        .eq('company_id', companyId)
        .eq('visibile', true)
        .order('nome') as any);
      return (data || []) as Array<{ id: string; nome: string; codice_prodotto: string | null }>;
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (data: Omit<ListinoVoce, 'id'> & { id?: string }) => {
      const { id, ...rest } = data;
      const payload = {
        ...rest,
        company_id: companyId,
        codice: rest.codice?.trim() || null,
        kb_documento_id: rest.kb_documento_id || null,
      };
      if (id) {
        const { error } = await (supabase.from('listino_voci' as any).update(payload).eq('id', id) as any);
        if (error) throw error;
      } else {
        const { error } = await (supabase.from('listino_voci' as any).insert(payload) as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(editingVoce ? 'Voce aggiornata' : 'Voce aggiunta al listino');
      qc.invalidateQueries({ queryKey: ['listino-voci', companyId] });
      closeDialog();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase.from('listino_voci' as any).delete().eq('id', id) as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Voce eliminata');
      qc.invalidateQueries({ queryKey: ['listino-voci', companyId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const openNew = () => { setEditingVoce(null); setForm(EMPTY_FORM()); setDialogOpen(true); };
  const openEdit = (v: ListinoVoce) => { setEditingVoce(v); setForm({ ...v }); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingVoce(null); };

  const handleSave = () => {
    if (!form.titolo_voce.trim()) { toast.error('Inserisci una descrizione voce'); return; }
    upsertMutation.mutate(editingVoce ? { ...form, id: editingVoce.id } : form);
  };

  const filtered = voci.filter(v =>
    !search ||
    v.titolo_voce.toLowerCase().includes(search.toLowerCase()) ||
    v.categoria.toLowerCase().includes(search.toLowerCase()) ||
    (v.codice || '').toLowerCase().includes(search.toLowerCase()),
  );

  // Group by category
  const grouped = filtered.reduce<Record<string, ListinoVoce[]>>((acc, v) => {
    const cat = v.categoria || 'Generale';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(v);
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Listino Voci</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {voci.length} voci · usate per arricchire i preventivi vocali con prezzi reali
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Aggiungi voce
        </Button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Cerca per descrizione, codice o categoria..."
          className="pl-9"
        />
      </div>

      {/* List */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {!isLoading && filtered.length === 0 && (
        <div className="text-center py-12 text-muted-foreground space-y-2">
          <p className="text-sm">Nessuna voce nel listino</p>
          <p className="text-xs">Aggiungi voci con prezzi reali per arricchire automaticamente i preventivi</p>
        </div>
      )}

      {Object.entries(grouped).map(([cat, items]) => (
        <div key={cat} className="space-y-1.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-1">{cat}</h3>
          {items.map(v => (
            <div key={v.id} className={cn(
              'flex items-center gap-3 rounded-xl border bg-card px-4 py-3',
              !v.attivo && 'opacity-50',
            )}>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{v.titolo_voce}</span>
                  {v.codice && (
                    <Badge variant="outline" className="text-[10px] font-mono px-1.5">{v.codice}</Badge>
                  )}
                  {v.kb_documento_id && (
                    <span className="flex items-center gap-1 text-[10px] text-primary">
                      <FileText className="h-3 w-3" />
                      <span>PDF</span>
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{v.unita_misura}</span>
                  <span>·</span>
                  <span>{formatEuro(v.prezzo_unitario)}</span>
                  {v.iva_percentuale != null && <><span>+</span><span>IVA {v.iva_percentuale}%</span></>}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => openEdit(v)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => { if (confirm('Eliminare questa voce?')) deleteMutation.mutate(v.id); }}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ))}

      {/* Dialog: Add / Edit */}
      <Dialog open={dialogOpen} onOpenChange={v => !v && closeDialog()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingVoce ? 'Modifica voce' : 'Nuova voce listino'}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Codice prodotto <span className="text-muted-foreground text-xs">(opz.)</span></Label>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input
                    value={form.codice || ''}
                    onChange={e => setForm(f => ({ ...f, codice: e.target.value.toUpperCase() }))}
                    placeholder="ES. URBAN"
                    className="pl-8 font-mono text-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground">Usato dall'AI per abbinamento automatico</p>
              </div>
              <div className="space-y-1.5">
                <Label>Categoria</Label>
                <Input
                  value={form.categoria}
                  onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
                  placeholder="Es. Infissi, Bagno..."
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Descrizione voce *</Label>
              <Input
                value={form.titolo_voce}
                onChange={e => setForm(f => ({ ...f, titolo_voce: e.target.value }))}
                placeholder="Es. Infisso URBAN mod. 70 doppio vetro"
              />
            </div>

            <div className="space-y-1.5">
              <Label>Descrizione estesa <span className="text-muted-foreground text-xs">(opz.)</span></Label>
              <Textarea
                value={form.descrizione || ''}
                onChange={e => setForm(f => ({ ...f, descrizione: e.target.value }))}
                placeholder="Dettagli tecnici, specifiche, materiali..."
                rows={2}
                className="resize-none text-sm"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Unità misura</Label>
                <Select value={form.unita_misura} onValueChange={v => setForm(f => ({ ...f, unita_misura: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Prezzo unitario</Label>
                <div className="relative">
                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">€</span>
                  <Input
                    type="number"
                    value={form.prezzo_unitario}
                    onChange={e => setForm(f => ({ ...f, prezzo_unitario: parseFloat(e.target.value) || 0 }))}
                    className="pl-6"
                    min={0}
                    step={0.01}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>IVA %</Label>
                <Input
                  type="number"
                  value={form.iva_percentuale ?? 22}
                  onChange={e => setForm(f => ({ ...f, iva_percentuale: parseFloat(e.target.value) || 22 }))}
                  min={0}
                  max={100}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>
                PDF tecnico associato
                <span className="text-muted-foreground text-xs ml-1">(scheda prodotto, certificazione...)</span>
              </Label>
              <Select
                value={form.kb_documento_id || '__none__'}
                onValueChange={v => setForm(f => ({ ...f, kb_documento_id: v === '__none__' ? null : v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona documento KB..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nessuno</SelectItem>
                  {kbDocs.map(d => (
                    <SelectItem key={d.id} value={d.id}>
                      <span className="flex items-center gap-2">
                        <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                        {d.nome}
                        {d.codice_prodotto && (
                          <Badge variant="outline" className="text-[10px] font-mono ml-1">{d.codice_prodotto}</Badge>
                        )}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">
                Verrà incluso automaticamente nel PDF assemblato quando questa voce è usata
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>Annulla</Button>
            <Button onClick={handleSave} disabled={upsertMutation.isPending} className="gap-2">
              {upsertMutation.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {editingVoce ? 'Salva modifiche' : 'Aggiungi al listino'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
