import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
  ArrowLeft, Play, Pause, Square, Loader2, Bot, ListChecks, Clock,
  Phone, Users, CalendarCheck, BarChart3, Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState } from "react";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: "Bozza", color: "bg-ink-100 text-ink-600" },
  scheduled: { label: "Programmata", color: "bg-status-info-light text-status-info" },
  active: { label: "Attiva", color: "bg-status-success-light text-status-success" },
  paused: { label: "In pausa", color: "bg-status-warning-light text-status-warning" },
  completed: { label: "Completata", color: "bg-ink-100 text-ink-700" },
  cancelled: { label: "Annullata", color: "bg-status-error-light text-status-error" },
};

const DAYS_MAP: Record<string, string> = {
  mon: "Lun", tue: "Mar", wed: "Mer", thu: "Gio", fri: "Ven", sat: "Sab", sun: "Dom",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { profile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [confirmAction, setConfirmAction] = useState<"start" | "pause" | "cancel" | null>(null);
  const [acting, setActing] = useState(false);

  const { data: campaign, isLoading } = useQuery({
    queryKey: ["campaign-detail", id],
    enabled: !!id,
    refetchInterval: 10000, // live refresh
    queryFn: async () => {
      const { data, error } = await supabase
        .from("campaigns")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
  });

  const { data: agent } = useQuery({
    queryKey: ["agent-name", campaign?.agent_id],
    enabled: !!campaign?.agent_id,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("id, name").eq("id", campaign!.agent_id!).single();
      return data;
    },
  });

  const { data: list } = useQuery({
    queryKey: ["list-name", campaign?.contact_list_id],
    enabled: !!campaign?.contact_list_id,
    queryFn: async () => {
      const { data } = await supabase.from("contact_lists").select("id, name, contact_count").eq("id", campaign!.contact_list_id!).single();
      return data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["campaign-detail", id] });

  const handleAction = async (action: "start" | "pause" | "cancel") => {
    setActing(true);
    try {
      if (action === "start") {
        // 1. Populate contacts from list
        const { data: popResult, error: popErr } = await supabase.functions.invoke("run-campaign-batch", {
          body: { campaign_id: id, action: "populate" },
        });
        if (popErr) throw new Error(popErr.message || "Populate failed");
        if (popResult?.error) throw new Error(popResult.error);

        // 2. Update status to active
        await supabase.from("campaigns").update({
          status: "active",
          started_at: campaign?.started_at || new Date().toISOString(),
        }).eq("id", id!);

        // 3. Run first batch
        const { data: batchResult, error: batchErr } = await supabase.functions.invoke("run-campaign-batch", {
          body: { campaign_id: id, action: "run_batch" },
        });
        if (batchErr) console.warn("Batch error (non-blocking):", batchErr);

        toast({
          title: "Campagna avviata",
          description: `${popResult?.populated || 0} contatti caricati, ${batchResult?.calls_initiated || 0} chiamate iniziate`,
        });
      } else if (action === "pause") {
        await supabase.from("campaigns").update({ status: "paused" }).eq("id", id!);
        toast({ title: "Campagna in pausa" });
      } else if (action === "cancel") {
        await supabase.from("campaigns").update({
          status: "cancelled",
          completed_at: new Date().toISOString(),
        }).eq("id", id!);
        toast({ title: "Campagna annullata" });
      }
      setConfirmAction(null);
      invalidate();
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setActing(false);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-brand" /></div>;
  }

  if (!campaign) {
    return (
      <div className="text-center py-20">
        <p className="text-ink-500">Campagna non trovata</p>
        <Button variant="outline" onClick={() => navigate("/app/campaigns")} className="mt-4 border-ink-200 text-ink-700">Torna alle campagne</Button>
      </div>
    );
  }

  const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.draft;
  const progressPct = campaign.contacts_total && campaign.contacts_total > 0
    ? Math.round(((campaign.contacts_called || 0) / campaign.contacts_total) * 100)
    : 0;

  const canStart = ["draft", "paused", "scheduled"].includes(campaign.status);
  const canPause = campaign.status === "active";
  const canCancel = ["draft", "scheduled", "active", "paused"].includes(campaign.status);
  const isFinished = ["completed", "cancelled"].includes(campaign.status);

  const stats = [
    { label: "Contatti totali", value: campaign.contacts_total || 0, icon: Users, color: "text-ink-600" },
    { label: "Chiamati", value: campaign.contacts_called || 0, icon: Phone, color: "text-status-info" },
    { label: "Raggiunti", value: campaign.contacts_reached || 0, icon: Phone, color: "text-brand" },
    { label: "Qualificati", value: campaign.contacts_qualified || 0, icon: BarChart3, color: "text-status-warning" },
    { label: "Appuntamenti", value: campaign.appointments_set || 0, icon: CalendarCheck, color: "text-status-success" },
    { label: "Durata media", value: campaign.avg_duration ? `${Math.floor(campaign.avg_duration / 60)}:${String(campaign.avg_duration % 60).padStart(2, "0")}` : "—", icon: Clock, color: "text-ink-500" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/app/campaigns")} className="text-ink-500 mt-1">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-ink-900">{campaign.name}</h1>
              <Badge className={`${status.color} border-none`}>{status.label}</Badge>
            </div>
            {campaign.description && <p className="text-sm text-ink-500 mt-1">{campaign.description}</p>}
            <p className="text-xs text-ink-400 mt-1">
              Creata il {campaign.created_at ? format(new Date(campaign.created_at), "dd MMM yyyy HH:mm", { locale: it }) : "—"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {canStart && (
            <Button onClick={() => setConfirmAction("start")} className="bg-status-success hover:bg-status-success/90 text-white">
              <Play className="w-4 h-4 mr-2" /> {campaign.status === "paused" ? "Riprendi" : "Avvia"}
            </Button>
          )}
          {canPause && (
            <Button onClick={() => setConfirmAction("pause")} variant="outline" className="border-status-warning text-status-warning hover:bg-status-warning hover:text-white">
              <Pause className="w-4 h-4 mr-2" /> Pausa
            </Button>
          )}
          {canCancel && (
            <Button onClick={() => setConfirmAction("cancel")} variant="outline" className="border-status-error text-status-error hover:bg-status-error hover:text-white">
              <Square className="w-4 h-4 mr-2" /> Annulla
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="rounded-card border border-ink-200 bg-white p-5 shadow-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-ink-700">Progresso campagna</span>
          <span className="text-sm font-bold text-ink-900">{progressPct}%</span>
        </div>
        <Progress value={progressPct} className="h-3" />
        <p className="text-xs text-ink-400 mt-2">
          {campaign.contacts_called || 0} di {campaign.contacts_total || 0} contatti chiamati
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {stats.map((s, i) => (
          <Card key={i} className="bg-white border-ink-200 shadow-card">
            <CardContent className="p-4 text-center">
              <s.icon className={`w-5 h-5 mx-auto mb-2 ${s.color}`} />
              <p className="text-xl font-bold text-ink-900">{s.value}</p>
              <p className="text-xs text-ink-500">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Config details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-white border-ink-200 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ink-700 flex items-center gap-2">
              <Bot className="w-4 h-4" /> Agente & Lista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-ink-400">Agente AI</p>
              <p className="text-sm font-medium text-ink-900">{agent?.name || campaign.agent_id?.slice(0, 8) || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Lista contatti</p>
              <p className="text-sm font-medium text-ink-900">
                {list?.name || "—"}
                {list?.contact_count != null && <span className="text-ink-400 font-normal"> ({list.contact_count} contatti)</span>}
              </p>
            </div>
            {campaign.custom_first_msg && (
              <div>
                <p className="text-xs text-ink-400">Messaggio personalizzato</p>
                <p className="text-sm text-ink-700">{campaign.custom_first_msg}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-ink-200 shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-ink-700 flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Configurazione
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-xs text-ink-400">Finestra oraria</p>
              <p className="text-sm font-medium text-ink-900">{campaign.call_window_start || "09:00"} — {campaign.call_window_end || "19:00"}</p>
            </div>
            <div>
              <p className="text-xs text-ink-400">Giorni attivi</p>
              <div className="flex gap-1 mt-1">
                {(campaign.call_days || []).map((d: string) => (
                  <Badge key={d} className="bg-brand-light text-brand-text border-none text-xs">{DAYS_MAP[d] || d}</Badge>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-ink-400">Retry</p>
                <p className="text-sm font-medium text-ink-900">{campaign.retry_attempts ?? 2} tentativi</p>
              </div>
              <div>
                <p className="text-xs text-ink-400">Ritardo retry</p>
                <p className="text-sm font-medium text-ink-900">{campaign.retry_delay_min ?? 30} min</p>
              </div>
            </div>
            {campaign.call_hour_limit && (
              <div>
                <p className="text-xs text-ink-400">Limite/ora</p>
                <p className="text-sm font-medium text-ink-900">{campaign.call_hour_limit} chiamate</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timestamps */}
      {(campaign.started_at || campaign.completed_at) && (
        <div className="rounded-card border border-ink-200 bg-white p-4 shadow-card">
          <div className="flex gap-6 text-sm">
            {campaign.started_at && (
              <div>
                <span className="text-ink-400">Avviata: </span>
                <span className="text-ink-700">{format(new Date(campaign.started_at), "dd MMM yyyy HH:mm", { locale: it })}</span>
              </div>
            )}
            {campaign.completed_at && (
              <div>
                <span className="text-ink-400">Completata: </span>
                <span className="text-ink-700">{format(new Date(campaign.completed_at), "dd MMM yyyy HH:mm", { locale: it })}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Confirm Dialogs */}
      <AlertDialog open={confirmAction !== null} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent className="bg-white border-ink-200">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ink-900">
              {confirmAction === "start" && "Avvia campagna"}
              {confirmAction === "pause" && "Metti in pausa"}
              {confirmAction === "cancel" && "Annulla campagna"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-ink-500">
              {confirmAction === "start" && "La campagna inizierà a chiamare i contatti nella finestra oraria configurata."}
              {confirmAction === "pause" && "La campagna verrà messa in pausa. Potrai riprenderla in qualsiasi momento."}
              {confirmAction === "cancel" && "La campagna verrà annullata definitivamente. I contatti non ancora chiamati non verranno contattati."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-ink-200 text-ink-700">Annulla</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirmAction && handleAction(confirmAction)}
              disabled={acting}
              className={
                confirmAction === "cancel"
                  ? "bg-status-error hover:bg-status-error/90 text-white"
                  : "bg-brand hover:bg-brand-hover text-white"
              }
            >
              {acting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              Conferma
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
