import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { StepProps } from './types';

export function StepDatiCliente({ state, setState, companyId }: StepProps) {
  const { data: cantieri } = useQuery({
    queryKey: ['cantieri-select', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await (supabase.from('cantieri') as any)
        .select('id, nome, indirizzo')
        .eq('company_id', companyId)
        .eq('stato', 'attivo');
      return data || [];
    },
  });

  const update = (field: string, value: any) =>
    setState(prev => ({ ...prev, [field]: value }));

  const selectCantiere = (id: string) => {
    update('cantiereId', id);
    const c = (cantieri || []).find((x: any) => x.id === id);
    if (c?.indirizzo && !state.luogoLavori) update('luogoLavori', c.indirizzo);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">👤 Dati Cliente</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nome / Ragione Sociale *</Label>
              <Input placeholder="Mario Rossi" value={state.clienteNome} onChange={e => update('clienteNome', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input placeholder="+39 333 1234567" value={state.clienteTelefono} onChange={e => update('clienteTelefono', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input placeholder="mario@email.it" value={state.clienteEmail} onChange={e => update('clienteEmail', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Indirizzo</Label>
              <Input placeholder="Via Roma 15, Milano" value={state.clienteIndirizzo} onChange={e => update('clienteIndirizzo', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>P.IVA</Label>
              <Input placeholder="IT12345678901" value={state.clientePiva} onChange={e => update('clientePiva', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Codice Fiscale</Label>
              <Input placeholder="RSSMRA80A01H501Z" value={state.clienteCF} onChange={e => update('clienteCF', e.target.value)} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg">📋 Dettagli Lavori</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Titolo Preventivo</Label>
            <Input placeholder="es. Ristrutturazione completa bagno" value={state.titolo} onChange={e => update('titolo', e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Oggetto lavori</Label>
            <Textarea placeholder="Descrizione sintetica dei lavori..." value={state.oggetto} onChange={e => update('oggetto', e.target.value)} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Luogo lavori</Label>
              <Input placeholder="Via Roma 15, Milano" value={state.luogoLavori} onChange={e => update('luogoLavori', e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Cantiere</Label>
              <Select value={state.cantiereId} onValueChange={selectCantiere}>
                <SelectTrigger><SelectValue placeholder="Seleziona cantiere" /></SelectTrigger>
                <SelectContent>
                  {(cantieri || []).map((c: any) => (
                    <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Validità offerta</Label>
            <div className="flex gap-2">
              {[15, 30, 60, 90].map(d => (
                <Button
                  key={d}
                  type="button"
                  variant={state.validitaGiorni === d ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update('validitaGiorni', d)}
                >
                  {d} gg
                </Button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <Label>Note interne</Label>
            <Textarea placeholder="Note visibili solo a te..." value={state.noteInterne} onChange={e => update('noteInterne', e.target.value)} rows={2} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
