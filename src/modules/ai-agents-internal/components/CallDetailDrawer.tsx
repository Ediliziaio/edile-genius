// B8 fix: query con internal_call_log_id (non conversation_id)

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, Clock, User, Bot, Euro, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { InternalCallLog } from '../types/internalAgent.types';

interface CallDetailDrawerProps {
  callId: string | null;
  onClose: () => void;
}

export function CallDetailDrawer({ callId, onClose }: CallDetailDrawerProps) {
  const { data: callLog, isLoading } = useQuery({
    queryKey: ['internal-call-log-detail', callId],
    enabled: !!callId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('internal_call_logs')
        .select(`
          *,
          contact:contacts(full_name, phone, email),
          agent:agents(name),
          campaign:internal_outbound_campaigns(name)
        `)
        .eq('id', callId)
        .single();
      if (error) throw error;
      return data as InternalCallLog;
    },
  });

  // B8 fix: cerca i crediti per internal_call_log_id (non conversation_id)
  const { data: creditUsage } = useQuery({
    queryKey: ['call-credit-usage', callId],
    enabled: !!callId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('ai_credit_usage')
        .select('*')
        .eq('internal_call_log_id', callId!) // B8 fix
        .maybeSingle();
      return data;
    },
  });

  const formatDuration = (sec: number | null | undefined) => {
    if (!sec) return '—';
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const STATUS_LABELS: Record<string, string> = {
    initiated: 'Avviata',
    answered: 'Risposta',
    no_answer: 'Nessuna risposta',
    failed: 'Fallita',
    busy: 'Occupato',
  };

  const OUTCOME_LABELS: Record<string, string> = {
    interested: '✅ Interessato',
    not_interested: '❌ Non interessato',
    callback: '📞 Richiamare',
    dnc: '🚫 DNC',
    no_answer: '📵 Non risposto',
    voicemail: '📬 Segreteria',
  };

  return (
    <Sheet open={!!callId} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-[400px] sm:max-w-[400px]">
        <SheetHeader>
          <SheetTitle>Dettaglio Chiamata</SheetTitle>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : callLog ? (
          <div className="mt-4 space-y-5">
            {/* Status + outcome */}
            <div className="flex gap-2 flex-wrap">
              <Badge variant={callLog.status === 'answered' ? 'default' : 'secondary'}>
                {STATUS_LABELS[callLog.status] || callLog.status}
              </Badge>
              {callLog.outcome && (
                <Badge variant="outline">{OUTCOME_LABELS[callLog.outcome] || callLog.outcome}</Badge>
              )}
            </div>

            <Separator />

            {/* Contact */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Contatto</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium">{callLog.contact?.full_name || 'Sconosciuto'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">{callLog.phone_number || callLog.contact?.phone || '—'}</span>
              </div>
            </div>

            <Separator />

            {/* Call details */}
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Chiamata</p>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">
                  {format(new Date(callLog.started_at), 'dd MMM yyyy HH:mm', { locale: it })}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">Durata: {formatDuration(callLog.duration_sec)}</span>
              </div>
              {callLog.agent && (
                <div className="flex items-center gap-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{callLog.agent.name}</span>
                </div>
              )}
            </div>

            {callLog.campaign && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Campagna</p>
                  <p className="text-sm">{callLog.campaign.name}</p>
                </div>
              </>
            )}

            {/* B8 fix: Costo chiamata */}
            <Separator />
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Costo</p>
              {creditUsage ? (
                <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Costo totale</span>
                    <span className="font-semibold flex items-center gap-1">
                      <Euro className="h-3.5 w-3.5" />
                      {Number(creditUsage.cost_billed_total || 0).toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>€/min</span>
                    <span>{Number(creditUsage.cost_billed_per_min || 0).toFixed(4)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Saldo prima</span>
                    <span>€{Number(creditUsage.balance_before || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Saldo dopo</span>
                    <span>€{Number(creditUsage.balance_after || 0).toFixed(2)}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  {callLog.status === 'initiated' ? 'Chiamata in corso...' : 'Nessun costo registrato'}
                </p>
              )}
            </div>

            {/* Notes */}
            {callLog.notes && (
              <>
                <Separator />
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Note</p>
                  <p className="text-sm">{callLog.notes}</p>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="mt-8 text-center text-muted-foreground text-sm">Chiamata non trovata</p>
        )}
      </SheetContent>
    </Sheet>
  );
}
