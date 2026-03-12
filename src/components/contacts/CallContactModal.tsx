import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Phone, CalendarClock, AlertTriangle, Clock, ChevronDown, Info,
} from "lucide-react";
import { format, addHours } from "date-fns";
import { it } from "date-fns/locale";

interface Contact {
  id: string;
  full_name: string;
  phone: string;
  phone_alt?: string;
  company_name?: string;
  city?: string;
  sector?: string;
  status?: string;
  notes?: string;
  do_not_call?: boolean;
  do_not_call_reason?: string;
  last_call_at?: string;
  call_count?: number;
}

interface Props {
  contact: Contact;
  companyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCallStarted?: (callLogId: string) => void;
}

export default function CallContactModal({
  contact, companyId, open, onOpenChange, onCallStarted,
}: Props) {
  const { toast } = useToast();
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [useAltPhone, setUseAltPhone] = useState(false);
  const [scheduleMode, setScheduleMode] = useState(false);
  const [scheduledDate, setScheduledDate] = useState<Date>(addHours(new Date(), 1));
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [customVars, setCustomVars] = useState<Record<string, string>>({});
  const [additionalNotes, setAdditionalNotes] = useState("");
  const [showVarPreview, setShowVarPreview] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ["agents-outbound", companyId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, el_agent_id, el_phone_number_id, outbound_enabled, sector")
        .eq("company_id", companyId)
        .eq("outbound_enabled", true)
        .not("el_phone_number_id", "is", null)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
    enabled: open,
  });

  useEffect(() => {
    if (agents.length > 0 && !selectedAgentId) {
      setSelectedAgentId(agents[0].id);
    }
  }, [agents, selectedAgentId]);

  const buildDynamicVariables = (): Record<string, string> => ({
    nome: contact.full_name?.split(" ")[0] ?? "",
    nome_completo: contact.full_name ?? "",
    azienda: contact.company_name ?? "",
    citta: contact.city ?? "",
    settore: contact.sector ?? "",
    telefono: contact.phone ?? "",
    note_contatto: contact.notes ?? "",
    stato_lead: contact.status ?? "",
    numero_chiamate: String(contact.call_count ?? 0),
    ultima_chiamata: contact.last_call_at
      ? format(new Date(contact.last_call_at), "dd MMMM yyyy", { locale: it })
      : "Prima chiamata",
    ...customVars,
  });

  const phoneToUse = useAltPhone && contact.phone_alt ? contact.phone_alt : contact.phone;

  const callNow = useMutation({
    mutationFn: async () => {
      if (!selectedAgentId) throw new Error("Seleziona un agente");
      if (!phoneToUse) throw new Error("Numero di telefono mancante");

      const dynVars = buildDynamicVariables();
      if (additionalNotes) dynVars["note_operatore"] = additionalNotes;

      const { data, error } = await supabase.functions.invoke(
        "elevenlabs-outbound-call",
        {
          body: {
            agent_id: selectedAgentId,
            to_number: phoneToUse.replace(/\s/g, ""),
            contact_id: contact.id,
            dynamic_variables: dynVars,
          },
        }
      );
      if (error) throw error;
      if (!data?.ok) throw new Error(data?.error || "Errore avvio chiamata");
      return data;
    },
    onSuccess: (data) => {
      toast({ title: "📞 Chiamata avviata!", description: `Sto chiamando ${contact.full_name}...` });
      onCallStarted?.(data.call_sid);
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Chiamata non avviata", description: err.message, variant: "destructive" });
    },
  });

  const scheduleCall = useMutation({
    mutationFn: async () => {
      if (!selectedAgentId) throw new Error("Seleziona un agente");
      if (scheduledDate <= new Date()) throw new Error("La data deve essere futura");

      const { error } = await supabase.from("scheduled_calls" as any).insert({
        company_id: companyId,
        contact_id: contact.id,
        agent_id: selectedAgentId,
        scheduled_at: scheduledDate.toISOString(),
        dynamic_variables: buildDynamicVariables(),
        notes: additionalNotes || null,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "📅 Chiamata schedulata!",
        description: `Chiamerò ${contact.full_name} il ${format(scheduledDate, "dd MMM 'alle' HH:mm", { locale: it })}`,
      });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast({ title: "Errore schedulazione", description: err.message, variant: "destructive" });
    },
  });

  if (contact.do_not_call) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-white border-ink-200 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-ink-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-status-error" />
              Contatto non chiamabile
            </DialogTitle>
          </DialogHeader>
          <div className="text-sm text-ink-600">
            <p><strong>{contact.full_name}</strong> è nella lista "Non chiamare".</p>
            {contact.do_not_call_reason && (
              <p className="text-ink-400 mt-1">Motivo: {contact.do_not_call_reason}</p>
            )}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)} className="border-ink-200 text-ink-700">
            Chiudi
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  const dynVars = buildDynamicVariables();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white border-ink-200 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-ink-900 flex items-center gap-2">
            <Phone className="w-5 h-5 text-brand" />
            Chiama {contact.full_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Info contatto */}
          <div className="rounded-lg border border-ink-100 bg-ink-50 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-ink-400">Telefono</span>
              <span className="text-sm font-medium text-ink-900">{phoneToUse}</span>
            </div>
            {contact.phone_alt && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-ink-400">Usa telefono alternativo</span>
                <Switch checked={useAltPhone} onCheckedChange={setUseAltPhone} />
              </div>
            )}
            {contact.call_count != null && contact.call_count > 0 && (
              <div className="flex items-center justify-between text-xs text-ink-400">
                <span>Chiamate precedenti: {contact.call_count}</span>
                {contact.last_call_at && (
                  <span>Ultima: {format(new Date(contact.last_call_at), "dd/MM/yy", { locale: it })}</span>
                )}
              </div>
            )}
          </div>

          {/* Selezione agente */}
          <div className="space-y-1.5">
            <Label className="text-ink-600 flex items-center gap-1.5">
              <span>🤖</span> Agente AI
            </Label>
            {agents.length === 0 ? (
              <div className="rounded-lg border border-status-warning-light bg-status-warning-light/30 p-3">
                <p className="text-xs text-status-warning">
                  Nessun agente abilitato per le chiamate outbound.
                </p>
              </div>
            ) : (
              <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
                <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      <div className="flex items-center gap-2">
                        <span>{a.name}</span>
                        {a.sector && (
                          <Badge variant="outline" className="text-[10px] border-ink-200 text-ink-500">
                            {a.sector}
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Variabili dinamiche accordion */}
          <div className="space-y-2">
            <button
              type="button"
              className="flex items-center justify-between w-full text-left text-sm text-ink-600 hover:text-ink-900"
              onClick={() => setShowVarPreview(!showVarPreview)}
            >
              <span className="flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5" />
                Dati passati all'AI ({Object.keys(dynVars).length} variabili)
              </span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showVarPreview ? "rotate-180" : ""}`} />
            </button>
            {showVarPreview && (
              <div className="space-y-2 rounded-lg border border-ink-100 p-3 bg-ink-50">
                <p className="text-[10px] text-ink-400">
                  L'AI riceve questi dati per personalizzare la conversazione. Puoi sovrascrivere qualsiasi valore.
                </p>
                {Object.entries(dynVars).map(([key, value]) => (
                  <div key={key} className="grid grid-cols-3 gap-2 items-center">
                    <span className="text-xs text-ink-500 font-mono">{key}</span>
                    <Input
                      className="col-span-2 text-xs bg-white border-ink-200 text-ink-900 h-7"
                      defaultValue={value}
                      onChange={(e) => setCustomVars((prev) => ({ ...prev, [key]: e.target.value }))}
                      placeholder={value || "(vuoto)"}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Note operatore */}
          <div className="space-y-1.5">
            <Label className="text-ink-600 text-xs">Note per l'AI (opzionale)</Label>
            <Textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              className="text-sm bg-ink-50 border-ink-200 text-ink-900 min-h-[60px]"
              placeholder="Es: Il cliente ha chiesto un preventivo la settimana scorsa..."
            />
          </div>

          {/* Switch: chiama ora vs schedula */}
          <div className="flex items-center justify-between rounded-lg border border-ink-100 p-3">
            <div className="flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-ink-400" />
              <span className="text-sm text-ink-700">Schedula per dopo</span>
            </div>
            <Switch checked={scheduleMode} onCheckedChange={setScheduleMode} />
          </div>

          {/* Selezione data/ora se schedula */}
          {scheduleMode && (
            <div className="space-y-2">
              <Label className="text-ink-600 text-xs">Data e ora della chiamata</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start border-ink-200 text-ink-700">
                    <Clock className="w-4 h-4 mr-2" />
                    {format(scheduledDate, "EEEE d MMMM yyyy, HH:mm", { locale: it })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={scheduledDate}
                    onSelect={(d) => {
                      if (d) {
                        const newDate = new Date(d);
                        newDate.setHours(scheduledDate.getHours(), scheduledDate.getMinutes());
                        setScheduledDate(newDate);
                      }
                    }}
                    disabled={(d) => d < new Date()}
                    locale={it}
                  />
                  <div className="p-3 border-t border-ink-100">
                    <Label className="text-xs text-ink-400">Ora</Label>
                    <input
                      type="time"
                      className="mt-1 w-full border border-ink-200 rounded-md px-2 py-1 text-sm bg-white text-ink-900"
                      value={format(scheduledDate, "HH:mm")}
                      onChange={(e) => {
                        const [h, m] = e.target.value.split(":").map(Number);
                        const newDate = new Date(scheduledDate);
                        newDate.setHours(h, m);
                        setScheduledDate(newDate);
                        setCalendarOpen(false);
                      }}
                    />
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1 border-ink-200 text-ink-700">
            Annulla
          </Button>
          {scheduleMode ? (
            <Button
              className="flex-1 bg-brand hover:bg-brand-hover text-white"
              onClick={() => scheduleCall.mutate()}
              disabled={scheduleCall.isPending || !selectedAgentId}
            >
              {scheduleCall.isPending ? (
                <>⏳ Schedulando...</>
              ) : (
                <><CalendarClock className="w-4 h-4 mr-2" /> Schedula chiamata</>
              )}
            </Button>
          ) : (
            <Button
              className="flex-1 bg-status-success hover:bg-status-success/90 text-white"
              onClick={() => callNow.mutate()}
              disabled={callNow.isPending || !selectedAgentId || !phoneToUse}
            >
              {callNow.isPending ? (
                <>📞 Chiamando...</>
              ) : (
                <><Phone className="w-4 h-4 mr-2" /> Chiama ora</>
              )}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
