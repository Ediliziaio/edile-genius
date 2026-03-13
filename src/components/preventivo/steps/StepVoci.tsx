import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, GripVertical, Euro } from 'lucide-react';
import type { PreventivoVoce } from '@/lib/preventivo-pdf';
import type { StepProps } from './types';

const UNITS = ['mq', 'ml', 'mc', 'nr', 'ore', 'forfait', 'kg', 'cad'];

export function StepVoci({ state, setState }: StepProps) {
  const { voci, scontoGlobalePerc } = state;

  const updateVoce = (i: number, field: keyof PreventivoVoce, value: any) => {
    const newVoci = [...voci];
    (newVoci[i] as any)[field] = value;
    if (field === 'quantita' || field === 'prezzo_unitario' || field === 'sconto_percentuale') {
      const v = newVoci[i];
      newVoci[i] = { ...v, totale: (v.quantita || 0) * (v.prezzo_unitario || 0) * (1 - (v.sconto_percentuale || 0) / 100) };
    }
    setState(prev => ({ ...prev, voci: newVoci }));
  };

  const addVoce = () => setState(prev => ({
    ...prev,
    voci: [...prev.voci, {
      id: crypto.randomUUID(),
      ordine: prev.voci.length + 1,
      categoria: prev.voci.length > 0 ? prev.voci[prev.voci.length - 1].categoria : 'Generale',
      titolo_voce: '', descrizione: '', unita_misura: 'nr',
      quantita: 1, prezzo_unitario: 0, sconto_percentuale: 0, totale: 0,
      foto_urls: [], note_voce: '', evidenziata: false,
    }],
  }));

  const removeVoce = (i: number) => setState(prev => ({ ...prev, voci: prev.voci.filter((_, idx) => idx !== i) }));

  const categories = [...new Set(voci.map(v => v.categoria || 'Generale'))];
  const subtotaleBruto = Number(voci.reduce((s, v) => s + v.totale, 0).toFixed(2));
  const scontoImporto = Number((subtotaleBruto * (scontoGlobalePerc / 100)).toFixed(2));
  const imponibile = Number((subtotaleBruto - scontoImporto).toFixed(2));
  const ivaPercentuale = 22;
  const ivaImporto = Number((imponibile * (ivaPercentuale / 100)).toFixed(2));
  const totaleFinale = Number((imponibile + ivaImporto).toFixed(2));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">📝 Voci Preventivo</CardTitle>
            <Button variant="outline" size="sm" onClick={addVoce} className="gap-1">
              <Plus className="h-3 w-3" /> Aggiungi
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {categories.map(cat => {
            const catVoci = voci.filter(v => (v.categoria || 'Generale') === cat);
            const catTotal = catVoci.reduce((s, v) => s + v.totale, 0);
            return (
              <div key={cat}>
                <div className="flex items-center justify-between bg-muted rounded-lg px-3 py-2 mb-2">
                  <span className="text-sm font-semibold">{cat}</span>
                  <span className="text-xs font-mono text-muted-foreground">€{catTotal.toFixed(2)}</span>
                </div>
                <div className="space-y-3 pl-2">
                  {catVoci.map(v => {
                    const gi = voci.indexOf(v);
                    return (
                      <Card key={v.id} className={v.evidenziata ? 'border-yellow-300 bg-yellow-50/50' : ''}>
                        <CardContent className="p-3 space-y-3">
                          <div className="flex items-start gap-2">
                            <GripVertical className="h-4 w-4 text-muted-foreground mt-2 flex-shrink-0" />
                            <div className="flex-1 space-y-2">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                <div className="md:col-span-2">
                                  <Input placeholder="Titolo voce" value={v.titolo_voce} onChange={e => updateVoce(gi, 'titolo_voce', e.target.value)} className="font-medium" />
                                </div>
                                <Input placeholder="Categoria" value={v.categoria} onChange={e => updateVoce(gi, 'categoria', e.target.value)} />
                              </div>
                              <Textarea placeholder="Descrizione..." value={v.descrizione} onChange={e => updateVoce(gi, 'descrizione', e.target.value)} rows={2} className="text-sm" />
                              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                                <Select value={v.unita_misura} onValueChange={val => updateVoce(gi, 'unita_misura', val)}>
                                  <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                                  <SelectContent>{UNITS.map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}</SelectContent>
                                </Select>
                                <Input type="number" placeholder="Q.tà" value={v.quantita || ''} onChange={e => updateVoce(gi, 'quantita', parseFloat(e.target.value) || 0)} className="text-right h-9" />
                                <Input type="number" placeholder="Prezzo €" value={v.prezzo_unitario || ''} onChange={e => updateVoce(gi, 'prezzo_unitario', parseFloat(e.target.value) || 0)} className="text-right h-9" />
                                <Input type="number" placeholder="Sconto %" value={v.sconto_percentuale || ''} onChange={e => updateVoce(gi, 'sconto_percentuale', parseFloat(e.target.value) || 0)} className="text-right h-9" />
                                <div className="flex items-center justify-end h-9 px-3 bg-muted rounded-md">
                                  <span className="text-sm font-bold">€{v.totale.toFixed(2)}</span>
                                </div>
                              </div>
                              {v.note_voce && <p className="text-xs text-amber-600 italic">💡 {v.note_voce}</p>}
                            </div>
                            <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0" onClick={() => removeVoce(gi)}>
                              <Trash2 className="h-3.5 w-3.5 text-destructive" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>
            );
          })}
          {voci.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">Nessuna voce. Aggiungi manualmente o elabora un audio nello step precedente.</div>
          )}
        </CardContent>
      </Card>

      {/* Totals */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2 text-right">
            <div className="flex justify-end gap-8 text-sm"><span className="text-muted-foreground">Subtotale</span><span className="w-24">€{subtotaleBruto.toFixed(2)}</span></div>
            {scontoGlobalePerc > 0 && (
              <div className="flex justify-end gap-8 text-sm text-green-600"><span>Sconto {scontoGlobalePerc}%</span><span className="w-24">-€{scontoImporto.toFixed(2)}</span></div>
            )}
            <div className="flex justify-end gap-8 text-sm"><span className="text-muted-foreground">Imponibile</span><span className="w-24">€{imponibile.toFixed(2)}</span></div>
            <div className="flex justify-end gap-8 text-sm"><span className="text-muted-foreground">IVA ({ivaPercentuale}%)</span><span className="w-24">€{ivaImporto.toFixed(2)}</span></div>
            <div className="flex justify-end gap-8 text-lg font-bold border-t pt-2">
              <span>Totale</span>
              <span className="w-24 flex items-center justify-end gap-1"><Euro className="h-4 w-4" />{totaleFinale.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Additional fields */}
      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tempi di esecuzione</Label>
              <Input value={state.tempiEsecuzione} onChange={e => setState(prev => ({ ...prev, tempiEsecuzione: e.target.value }))} placeholder="es. 15-20 giorni" />
            </div>
            <div className="space-y-2">
              <Label>Sconto globale (%)</Label>
              <Input type="number" min={0} max={100} value={scontoGlobalePerc || ''} onChange={e => setState(prev => ({ ...prev, scontoGlobalePerc: parseFloat(e.target.value) || 0 }))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Note generali</Label>
            <Textarea value={state.noteGenerali} onChange={e => setState(prev => ({ ...prev, noteGenerali: e.target.value }))} rows={2} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
