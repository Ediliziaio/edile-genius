import { useState, useEffect } from "react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Phone, AlertTriangle, CheckCircle2, Loader2 } from "lucide-react";

interface BulkCallResult {
  queued: number;
  skipped_dnc: number;
  skipped_dup: number;
  errors: number;
  first_call_at: string;
}

interface BulkCallModalProps {
  open: boolean;
  onClose: () => void;
  contactIds: string[];
  onSuccess: () => void;
}

export function BulkCallModal({ open, onClose, contactIds, onSuccess }: BulkCallModalProps) {
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<BulkCallResult | null>(null);

  // Fetch outbound-enabled agents
  const { data: agents = [] } = useQuery({
    queryKey: ["outbound-agents", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, outbound_enabled, el_phone_number_id")
        .eq("company_id", companyId!)
        .eq("outbound_enabled", true)
        .eq("status", "active")
        .not("el_phone_number_id", "is", null)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId && open,
  });

  // Fetch selected contacts preview
  const { data: selectedContacts = [] } = useQuery({
    queryKey: ["contacts-preview", contactIds],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contacts")
        .select("id, full_name, phone, do_not_call, status")
        .in("id", contactIds);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!companyId && open && contactIds.length > 0,
  });

  const dncCount = selectedContacts.filter((c) => c.do_not_call).length;
  const validCount = selectedContacts.filter((c) => !c.do_not_call && c.phone).length;
  const noPhoneCount = selectedContacts.filter((c) => !c.do_not_call && !c.phone).length;

  const launchMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("launch_bulk_calls", {
        p_company_id: companyId!,
        p_contact_ids: contactIds,
        p_agent_id: selectedAgentId,
        p_scheduled_at: scheduleMode && scheduledAt
          ? new Date(scheduledAt).toISOString()
          : null,
        p_notes: notes || null,
      });
      if (error) throw error;
      return data as unknown as BulkCallResult;
    },
    onSuccess: (data) => {
      setResult(data);
    },
    onError: (err: Error) => {
      toast({ title: "Errore lancio chiamate", description: err.message, variant: "destructive" });
    },
  });

  useEffect(() => {
    if (!open) {
      setResult(null);
      setSelectedAgentId("");
      setScheduleMode(false);
      setScheduledAt("");
      setNotes("");
    }
  }, [open]);

  const minDateTime = new Date(Date.now() + 5 * 60 * 1000).toISOString().slice(0, 16);

  // Result screen
  if (result) {
    return (
      <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-status-success">
              <CheckCircle2 className="w-5 h-5" />
              Chiamate avviate!
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "In coda", value: result.queued, color: "text-status-success bg-status-success-light" },
                { label: "Skip DNC", value: result.skipped_dnc, color: "text-status-error bg-status-error-light" },
                { label: "Skip duplicati", value: result.skipped_dup, color: "text-status-warning bg-status-warning-light" },
                { label: "Senza numero", value: result.errors, color: "text-ink-500 bg-ink-50" },
              ].map(({ label, value, color }) => (
                <div key={label} className={`rounded-xl p-3 text-center ${color}`}>
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs">{label}</p>
                </div>
              ))}
            </div>
            {result.queued > 0 && (
              <p className="text-sm text-ink-500 text-center">
                Le chiamate sono state programmate e partiranno automaticamente.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => { onClose(); onSuccess(); }}>Chiudi</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  // Config screen
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Phone className="w-5 h-5 text-status-success" />
            Chiama {contactIds.length} contatti
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Preview */}
          <div className="rounded-xl border border-ink-100 p-3 space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-ink-500">Contatti selezionati</span>
              <span className="font-semibold text-ink-900">{contactIds.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink-500">Chiamabili</span>
              <span className="font-semibold text-status-success">{validCount}</span>
            </div>
            {dncCount > 0 && (
              <div className="flex justify-between">
                <span className="text-status-error flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Do Not Call (saltati)
                </span>
                <span className="font-semibold text-status-error">{dncCount}</span>
              </div>
            )}
            {noPhoneCount > 0 && (
              <div className="flex justify-between">
                <span className="text-ink-400">Senza numero (saltati)</span>
                <span className="font-semibold text-ink-400">{noPhoneCount}</span>
              </div>
            )}
          </div>

          {/* Agent selector */}
          <div className="space-y-1.5">
            <Label className="text-ink-600">Agente AI *</Label>
            <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
              <SelectTrigger className="bg-white border-ink-200">
                <SelectValue placeholder="Seleziona agente..." />
              </SelectTrigger>
              <SelectContent>
                {agents.map((a: any) => (
                  <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {agents.length === 0 && (
              <p className="text-xs text-status-warning">Nessun agente con outbound abilitato e numero telefonico.</p>
            )}
          </div>

          {/* Schedule toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-ink-900">Programmazione</p>
              <p className="text-xs text-ink-400">
                {scheduleMode ? "Chiama alla data specificata" : "Chiama il prima possibile"}
              </p>
            </div>
            <Switch checked={scheduleMode} onCheckedChange={setScheduleMode} />
          </div>

          {scheduleMode && (
            <div className="space-y-1.5">
              <Label className="text-ink-600">Data e ora di inizio</Label>
              <Input
                type="datetime-local"
                min={minDateTime}
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="bg-white border-ink-200"
              />
              <p className="text-xs text-ink-400">Le chiamate verranno distribuite al ritmo di 1 al minuto</p>
            </div>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <Label className="text-ink-600">Note (opzionale)</Label>
            <Textarea
              placeholder="Note per questa sessione di chiamate..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="bg-white border-ink-200"
            />
          </div>

          {validCount === 0 && (
            <div className="flex items-start gap-2 text-status-warning bg-status-warning-light border border-status-warning/20 rounded-lg p-3 text-sm">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <p>Nessun contatto chiamabile: tutti sono segnati come Do Not Call o senza numero telefono.</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="border-ink-200 text-ink-700">Annulla</Button>
          <Button
            onClick={() => launchMutation.mutate()}
            disabled={
              !selectedAgentId ||
              validCount === 0 ||
              (scheduleMode && !scheduledAt) ||
              launchMutation.isPending
            }
            className="gap-1.5 bg-status-success hover:bg-status-success/90 text-white"
          >
            {launchMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Avvio...</>
            ) : (
              <><Phone className="w-4 h-4" /> Avvia {validCount} chiamate</>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
