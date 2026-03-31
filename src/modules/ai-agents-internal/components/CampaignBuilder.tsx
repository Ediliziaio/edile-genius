// B1 fix: canNext() con validazione corretta
// B2 fix: step visivo pulito con validazione filtri

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useInternalCampaigns } from '../hooks/useInternalCampaigns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, ArrowRight, Check, Users, Filter, Loader2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface CampaignBuilderProps {
  onClose: () => void;
  onCreated: () => void;
}

type Step = 0 | 1 | 2 | 3;

export function CampaignBuilder({ onClose, onCreated }: CampaignBuilderProps) {
  const companyId = useCompanyId();
  const { createCampaign } = useInternalCampaigns();

  const [step, setStep] = useState<Step>(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [agentId, setAgentId] = useState('');
  const [targetType, setTargetType] = useState<'manual' | 'filter'>('manual');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [filterTags, setFilterTags] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [callsPerMinute, setCallsPerMinute] = useState(2);

  // Fetch agents
  const { data: agents = [] } = useQuery({
    queryKey: ['agents-for-campaigns', companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase
        .from('agents')
        .select('id, name, outbound_enabled')
        .eq('company_id', companyId!)
        .eq('outbound_enabled', true)
        .eq('status', 'active');
      return data || [];
    },
  });

  // Fetch contacts (per manual selection)
  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts-for-campaigns', companyId],
    enabled: !!companyId && step === 1 && targetType === 'manual',
    queryFn: async () => {
      const { data } = await supabase
        .from('contacts')
        .select('id, full_name, phone')
        .eq('company_id', companyId!)
        .not('phone', 'is', null)
        .order('full_name')
        .limit(500);
      return data || [];
    },
  });

  // B1 fix: Preview counter per filtri (query realtime)
  const { data: filterPreview } = useQuery({
    queryKey: ['filter-preview', companyId, filterTags, filterSource],
    enabled: !!companyId && step === 1 && targetType === 'filter' &&
      (filterTags.trim().length >= 2 || filterSource.trim().length >= 2),
    queryFn: async () => {
      let query = supabase
        .from('contacts')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId!)
        .not('phone', 'is', null);

      if (filterSource.trim()) {
        query = (query as any).ilike('source', `%${filterSource.trim()}%`);
      }

      const { count } = await query;
      return count || 0;
    },
    refetchInterval: 3000,
  });

  // B1 fix: canNext() con validazione corretta
  const canNext = (): boolean => {
    if (step === 0) return name.trim().length >= 2 && !!agentId;
    if (step === 1) {
      if (targetType === 'filter') {
        // B1 fix: filtri devono avere almeno 2 caratteri
        return (filterTags.trim().length >= 2 || filterSource.trim().length >= 2) &&
          (filterPreview === undefined || filterPreview > 0);
      }
      return selectedContacts.length > 0;
    }
    return true;
  };

  const handleCreate = async () => {
    await createCampaign.mutateAsync({
      name: name.trim(),
      description: description.trim() || undefined,
      agent_id: agentId || undefined,
      target_type: targetType,
      contact_ids: targetType === 'manual' ? selectedContacts : [],
      filter_tags: targetType === 'filter' ? filterTags.trim() || undefined : undefined,
      filter_source: targetType === 'filter' ? filterSource.trim() || undefined : undefined,
      scheduled_at: scheduledAt || undefined,
      calls_per_minute: callsPerMinute,
    });
    onCreated();
  };

  const steps = [
    { label: 'Campagna', desc: 'Nome e agente' },
    { label: 'Contatti', desc: 'Chi chiamare' },
    { label: 'Impostazioni', desc: 'Quando e come' },
    { label: 'Riepilogo', desc: 'Conferma' },
  ];

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onClose} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Indietro
        </Button>
        <div>
          <h1 className="text-xl font-bold">Nuova Campagna Voce</h1>
          <p className="text-sm text-muted-foreground">Step {step + 1} di {steps.length}</p>
        </div>
      </div>

      {/* Step indicators */}
      <div className="flex gap-2">
        {steps.map((s, i) => (
          <div
            key={i}
            className={cn(
              'flex-1 rounded-lg border px-3 py-2 text-center',
              i === step ? 'border-primary bg-primary/5' : i < step ? 'border-green-500 bg-green-50' : 'border-border bg-muted/30'
            )}
          >
            <p className={cn('text-xs font-medium', i === step ? 'text-primary' : i < step ? 'text-green-700' : 'text-muted-foreground')}>
              {i < step ? <Check className="h-3 w-3 inline mr-1" /> : null}
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="rounded-xl border bg-card p-6 space-y-4">

        {/* Step 0: Base info */}
        {step === 0 && (
          <>
            <div className="space-y-1.5">
              <Label>Nome campagna *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="es. Campagna Infissi Q2 2026"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Descrizione <span className="text-muted-foreground text-xs">(opz.)</span></Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Note interne sulla campagna..."
                rows={2}
                className="resize-none"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Agente AI *</Label>
              <Select value={agentId} onValueChange={setAgentId}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleziona agente outbound..." />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a: any) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {agents.length === 0 && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <Info className="h-3 w-3" />
                  Nessun agente outbound attivo. Configurane uno prima.
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 1: Target */}
        {step === 1 && (
          <>
            <div className="space-y-1.5">
              <Label>Tipo destinatari</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setTargetType('manual')}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    targetType === 'manual' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                >
                  <Users className="h-4 w-4 mb-1 text-primary" />
                  <p className="text-sm font-medium">Manuale</p>
                  <p className="text-xs text-muted-foreground">Seleziona contatti specifici</p>
                </button>
                <button
                  onClick={() => setTargetType('filter')}
                  className={cn(
                    'rounded-lg border p-3 text-left transition-colors',
                    targetType === 'filter' ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted/50'
                  )}
                >
                  <Filter className="h-4 w-4 mb-1 text-primary" />
                  <p className="text-sm font-medium">Filtro</p>
                  <p className="text-xs text-muted-foreground">Filtra per tag o fonte</p>
                </button>
              </div>
            </div>

            {/* Manuale: lista contatti */}
            {targetType === 'manual' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Contatti ({selectedContacts.length} selezionati)</Label>
                  {selectedContacts.length > 0 && (
                    <button onClick={() => setSelectedContacts([])} className="text-xs text-muted-foreground hover:text-foreground">
                      Deseleziona tutti
                    </button>
                  )}
                </div>
                <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
                  {contacts.map((c: any) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-2 hover:bg-muted/50 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedContacts.includes(c.id)}
                        onCheckedChange={(v) => {
                          setSelectedContacts(prev =>
                            v ? [...prev, c.id] : prev.filter(id => id !== c.id)
                          );
                        }}
                      />
                      <span className="flex-1 text-sm">{c.full_name}</span>
                      <span className="text-xs text-muted-foreground">{c.phone}</span>
                    </label>
                  ))}
                  {contacts.length === 0 && (
                    <p className="text-sm text-muted-foreground p-4 text-center">
                      Nessun contatto con numero di telefono
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Filtro */}
            {targetType === 'filter' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label>Fonte contatto</Label>
                  <Input
                    value={filterSource}
                    onChange={(e) => setFilterSource(e.target.value)}
                    placeholder="es. sito web, fiera, referral..."
                  />
                  <p className="text-xs text-muted-foreground">Almeno 2 caratteri per attivare il filtro</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Tag (separati da virgola)</Label>
                  <Input
                    value={filterTags}
                    onChange={(e) => setFilterTags(e.target.value)}
                    placeholder="es. interessato, preventivo, follow-up..."
                  />
                </div>

                {/* B1 fix: Preview counter */}
                {(filterTags.trim().length >= 2 || filterSource.trim().length >= 2) && (
                  <div className={cn(
                    'rounded-lg px-3 py-2 text-sm flex items-center gap-2',
                    filterPreview === 0
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : 'bg-green-50 text-green-700 border border-green-200'
                  )}>
                    <Users className="h-3.5 w-3.5" />
                    {filterPreview === undefined
                      ? 'Contando contatti...'
                      : filterPreview === 0
                      ? 'Nessun contatto trovato con questi filtri'
                      : `~${filterPreview} contatti trovati con questi filtri`
                    }
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* Step 2: Settings */}
        {step === 2 && (
          <>
            <div className="space-y-1.5">
              <Label>Velocità chiamate</Label>
              <Select value={String(callsPerMinute)} onValueChange={(v) => setCallsPerMinute(Number(v))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 chiamata al minuto</SelectItem>
                  <SelectItem value="2">2 chiamate al minuto</SelectItem>
                  <SelectItem value="3">3 chiamate al minuto</SelectItem>
                  <SelectItem value="5">5 chiamate al minuto</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Pianifica per dopo <span className="text-muted-foreground text-xs">(opz. — lascia vuoto per avvio manuale)</span></Label>
              <Input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
              />
              {scheduledAt && (
                <p className="text-xs text-primary">
                  La campagna partirà il {format(new Date(scheduledAt), 'dd MMM yyyy alle HH:mm', { locale: it })}
                </p>
              )}
            </div>
          </>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-3">
            <h3 className="font-medium">Riepilogo campagna</h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nome</dt>
                <dd className="font-medium">{name}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Agente</dt>
                <dd className="font-medium">
                  {(agents as any[]).find((a) => a.id === agentId)?.name || '—'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Destinatari</dt>
                <dd className="font-medium">
                  {targetType === 'manual'
                    ? `${selectedContacts.length} contatti selezionati`
                    : `Filtro: ${[filterSource, filterTags].filter(Boolean).join(', ')}`
                  }
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Velocità</dt>
                <dd className="font-medium">{callsPerMinute} chiamate/min</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Avvio</dt>
                <dd className="font-medium">
                  {scheduledAt
                    ? format(new Date(scheduledAt), 'dd/MM/yyyy HH:mm', { locale: it })
                    : 'Manuale'}
                </dd>
              </div>
            </dl>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => step > 0 ? setStep((step - 1) as Step) : onClose()}
        >
          {step === 0 ? 'Annulla' : 'Indietro'}
        </Button>

        {step < 3 ? (
          <Button onClick={() => setStep((step + 1) as Step)} disabled={!canNext()}>
            Avanti <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button
            onClick={handleCreate}
            disabled={createCampaign.isPending}
            className="gap-2"
          >
            {createCampaign.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Crea campagna
          </Button>
        )}
      </div>
    </div>
  );
}
