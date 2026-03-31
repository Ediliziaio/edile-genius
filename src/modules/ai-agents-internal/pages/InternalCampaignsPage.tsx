import { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCompanyId } from '@/hooks/useCompanyId';
import { useInternalCampaigns } from '../hooks/useInternalCampaigns';
import { CampaignBuilder } from '../components/CampaignBuilder';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Plus, Play, Pause, RotateCcw, Trash2, Loader2,
  Megaphone, Clock, CheckCircle2, XCircle, AlertCircle, List,
} from 'lucide-react';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';
import type { InternalOutboundCampaign } from '../types/internalAgent.types';

const STATUS_CONFIG: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; icon?: any }> = {
  draft:     { label: 'Bozza',     variant: 'secondary' },
  scheduled: { label: 'Pianificata', variant: 'outline',    icon: Clock },
  queued:    { label: 'In coda',   variant: 'outline',    icon: List },
  running:   { label: 'In corso',  variant: 'default',    icon: Play },
  paused:    { label: 'In pausa',  variant: 'secondary',  icon: Pause },
  completed: { label: 'Completata', variant: 'secondary', icon: CheckCircle2 },
  cancelled: { label: 'Annullata', variant: 'destructive', icon: XCircle },
  failed:    { label: 'Fallita',   variant: 'destructive', icon: AlertCircle },
};

export default function InternalCampaignsPage() {
  const companyId = useCompanyId();
  const qc = useQueryClient();
  const [showBuilder, setShowBuilder] = useState(false);
  const {
    campaigns, isLoading,
    startCampaign, pauseCampaign, resumeCampaign, deleteCampaign,
  } = useInternalCampaigns();

  // M2: Realtime subscription per campagne running/queued
  useEffect(() => {
    if (!companyId) return;

    const channel = supabase
      .channel('internal-campaigns-progress')
      .on(
        'postgres_changes' as any,
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'internal_outbound_campaigns',
        },
        () => {
          qc.invalidateQueries({ queryKey: ['internal-campaigns', companyId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [companyId, qc]);

  if (showBuilder) {
    return (
      <CampaignBuilder
        onClose={() => setShowBuilder(false)}
        onCreated={() => {
          setShowBuilder(false);
          qc.invalidateQueries({ queryKey: ['internal-campaigns', companyId] });
        }}
      />
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Campagne Voce</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {campaigns.length} campagne · chiamate outbound AI
            </p>
          </div>
          <Button onClick={() => setShowBuilder(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Nuova Campagna
          </Button>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : campaigns.length === 0 ? (
          <div className="rounded-xl border bg-card p-16 text-center space-y-3">
            <Megaphone className="h-10 w-10 mx-auto text-muted-foreground/40" />
            <p className="text-muted-foreground">Nessuna campagna creata</p>
            <Button variant="outline" onClick={() => setShowBuilder(true)} className="gap-2">
              <Plus className="h-4 w-4" /> Crea la prima campagna
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {campaigns.map((c) => (
              <CampaignRow
                key={c.id}
                campaign={c}
                onStart={() => startCampaign.mutate(c.id)}
                onPause={() => pauseCampaign.mutate(c.id)}
                onResume={() => resumeCampaign.mutate(c.id)}
                onDelete={() => deleteCampaign.mutate(c.id)}
                isPending={
                  startCampaign.isPending ||
                  pauseCampaign.isPending ||
                  resumeCampaign.isPending
                }
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}

interface CampaignRowProps {
  campaign: InternalOutboundCampaign;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onDelete: () => void;
  isPending: boolean;
}

function CampaignRow({ campaign: c, onStart, onPause, onResume, onDelete, isPending }: CampaignRowProps) {
  const st = STATUS_CONFIG[c.status] || STATUS_CONFIG.draft;
  const StatusIcon = st.icon;

  const progress = c.total_calls > 0
    ? Math.round(((c.calls_answered + c.calls_failed) / c.total_calls) * 100)
    : 0;

  // M2: ETA stimata
  const remaining = c.total_calls - c.calls_answered - c.calls_failed;
  const etaMin = c.calls_per_minute > 0 ? Math.ceil(remaining / c.calls_per_minute) : 0;

  return (
    <div className="rounded-xl border bg-card px-4 py-3 space-y-2">
      <div className="flex items-center gap-3">
        {/* Status badge */}
        <Badge variant={st.variant} className="gap-1 shrink-0">
          {StatusIcon && <StatusIcon className="h-3 w-3" />}
          {st.label}
        </Badge>

        {/* Name */}
        <div className="flex-1 min-w-0">
          <span className="font-medium text-sm">{c.name}</span>
          {c.description && (
            <p className="text-xs text-muted-foreground truncate">{c.description}</p>
          )}
        </div>

        {/* Scheduled time (B6 UI) */}
        {c.status === 'scheduled' && c.scheduled_at && (
          <span className="text-xs text-muted-foreground">
            {format(new Date(c.scheduled_at), 'dd/MM HH:mm', { locale: it })}
          </span>
        )}

        {/* Stats */}
        {c.total_calls > 0 && (
          <span className="text-xs text-muted-foreground">
            {c.calls_answered}/{c.total_calls}
          </span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Start */}
          {['draft', 'failed'].includes(c.status) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={onStart}
                  disabled={isPending}
                >
                  {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Avvia campagna</TooltipContent>
            </Tooltip>
          )}

          {/* Pause */}
          {['running', 'queued'].includes(c.status) && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={onPause}
                  disabled={isPending}
                >
                  <Pause className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Metti in pausa</TooltipContent>
            </Tooltip>
          )}

          {/* Resume */}
          {c.status === 'paused' && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0"
                  onClick={onResume}
                  disabled={isPending}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Riprendi campagna</TooltipContent>
            </Tooltip>
          )}

          {/* B2 fix: Delete NASCOSTO per running/queued — mostra icona disabilitata */}
          {['running', 'queued'].includes(c.status) ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="p-1.5 opacity-30 cursor-not-allowed">
                  <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Metti in pausa prima di eliminare</TooltipContent>
            </Tooltip>
          ) : (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 w-7 p-0 text-muted-foreground hover:text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Elimina campagna</AlertDialogTitle>
                  <AlertDialogDescription>
                    Questa azione non può essere annullata.
                    {c.total_calls > 0 && ` La campagna ha già effettuato ${c.total_calls} chiamate.`}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annulla</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground">
                    Elimina
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* M2: Progress bar per campagne running/queued */}
      {['running', 'queued'].includes(c.status) && c.total_calls > 0 && (
        <div className="space-y-1">
          <Progress value={progress} className="h-1.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{c.calls_answered + c.calls_failed}/{c.total_calls} completate</span>
            {etaMin > 0 && c.status === 'running' && (
              <span>~{etaMin} min rimanenti</span>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {c.status === 'failed' && c.error_message && (
        <p className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
          {c.error_message}
        </p>
      )}
    </div>
  );
}
