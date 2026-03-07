import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Phone, Clock, Calendar, Unlink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface PhoneNumber {
  id: string;
  phone_number: string;
  label: string | null;
  status: string | null;
  active_hours_start: string | null;
  active_hours_end: string | null;
  active_days: string[] | null;
  country_code: string | null;
}

const ALL_DAYS = [
  { value: "mon", label: "Lun" },
  { value: "tue", label: "Mar" },
  { value: "wed", label: "Mer" },
  { value: "thu", label: "Gio" },
  { value: "fri", label: "Ven" },
  { value: "sat", label: "Sab" },
  { value: "sun", label: "Dom" },
];

interface Props {
  agentId: string;
  companyId: string;
}

export default function AgentPhoneTab({ agentId, companyId }: Props) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assignedNumber, setAssignedNumber] = useState<PhoneNumber | null>(null);
  const [availableNumbers, setAvailableNumbers] = useState<PhoneNumber[]>([]);
  const [selectedNumberId, setSelectedNumberId] = useState<string>("");
  const [hoursStart, setHoursStart] = useState("09:00");
  const [hoursEnd, setHoursEnd] = useState("19:00");
  const [activeDays, setActiveDays] = useState<string[]>(["mon", "tue", "wed", "thu", "fri"]);

  useEffect(() => {
    if (!companyId) return;
    Promise.all([
      supabase.from("ai_phone_numbers").select("*").eq("agent_id", agentId).maybeSingle(),
      supabase.from("ai_phone_numbers").select("*").eq("company_id", companyId).is("agent_id", null),
    ]).then(([assignedRes, availRes]) => {
      if (assignedRes.data) {
        const n = assignedRes.data as unknown as PhoneNumber;
        setAssignedNumber(n);
        setHoursStart(n.active_hours_start || "09:00");
        setHoursEnd(n.active_hours_end || "19:00");
        setActiveDays(n.active_days || ["mon", "tue", "wed", "thu", "fri"]);
      }
      setAvailableNumbers((availRes.data || []) as unknown as PhoneNumber[]);
      setLoading(false);
    });
  }, [agentId, companyId]);

  const handleAssign = async () => {
    if (!selectedNumberId) return;
    setSaving(true);
    const { error } = await supabase.from("ai_phone_numbers").update({ agent_id: agentId }).eq("id", selectedNumberId);
    if (error) {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    } else {
      toast({ title: "Numero assegnato" });
      window.location.reload();
    }
    setSaving(false);
  };

  const handleUnlink = async () => {
    if (!assignedNumber) return;
    setSaving(true);
    const { error } = await supabase.from("ai_phone_numbers").update({ agent_id: null }).eq("id", assignedNumber.id);
    if (error) {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    } else {
      toast({ title: "Numero scollegato" });
      window.location.reload();
    }
    setSaving(false);
  };

  const handleSaveSchedule = async () => {
    if (!assignedNumber) return;
    setSaving(true);
    const { error } = await supabase.from("ai_phone_numbers").update({
      active_hours_start: hoursStart,
      active_hours_end: hoursEnd,
      active_days: activeDays,
    }).eq("id", assignedNumber.id);
    if (error) {
      toast({ variant: "destructive", title: "Errore", description: error.message });
    } else {
      toast({ title: "Orari aggiornati" });
    }
    setSaving(false);
  };

  const toggleDay = (day: string) => {
    setActiveDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="space-y-6">
      {assignedNumber ? (
        <>
          <div className="rounded-card border border-ink-200 bg-white p-6 shadow-card space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-btn bg-brand-light flex items-center justify-center">
                  <Phone className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-ink-900">{assignedNumber.phone_number}</p>
                  <p className="text-sm text-ink-500">{assignedNumber.label || "Nessuna etichetta"} · {assignedNumber.country_code || "IT"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-brand-light text-brand-text border-brand-border">{assignedNumber.status || "active"}</Badge>
                <Button variant="outline" size="sm" onClick={handleUnlink} disabled={saving} className="text-status-error border-status-error hover:bg-status-error-light">
                  <Unlink className="w-4 h-4 mr-1" /> Scollega
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-card border border-ink-200 bg-white p-6 shadow-card space-y-5">
            <h3 className="text-sm font-semibold text-ink-900 flex items-center gap-2"><Clock className="w-4 h-4" /> Orari Attivi</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs text-ink-500">Inizio</Label>
                <Input type="time" value={hoursStart} onChange={e => setHoursStart(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-ink-500">Fine</Label>
                <Input type="time" value={hoursEnd} onChange={e => setHoursEnd(e.target.value)} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-ink-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> Giorni Attivi</Label>
              <div className="flex flex-wrap gap-2">
                {ALL_DAYS.map(day => (
                  <label key={day.value} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox checked={activeDays.includes(day.value)} onCheckedChange={() => toggleDay(day.value)} />
                    <span className="text-sm text-ink-700">{day.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button onClick={handleSaveSchedule} disabled={saving} className="bg-brand hover:bg-brand-hover text-white">
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salva Orari
            </Button>
          </div>
        </>
      ) : (
        <div className="rounded-card border border-dashed border-ink-200 bg-white p-8 text-center shadow-card space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-brand-light flex items-center justify-center">
            <Phone className="w-7 h-7 text-brand" />
          </div>
          <h3 className="text-lg font-semibold text-ink-900">Nessun numero assegnato</h3>
          <p className="text-sm text-ink-500 max-w-md mx-auto">Collega un numero telefonico a questo agente per abilitare chiamate inbound e outbound.</p>

          {availableNumbers.length > 0 ? (
            <div className="flex items-center gap-2 justify-center max-w-sm mx-auto">
              <Select value={selectedNumberId} onValueChange={setSelectedNumberId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Seleziona un numero" />
                </SelectTrigger>
                <SelectContent>
                  {availableNumbers.map(n => (
                    <SelectItem key={n.id} value={n.id}>{n.phone_number} {n.label ? `(${n.label})` : ""}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleAssign} disabled={!selectedNumberId || saving} className="bg-brand hover:bg-brand-hover text-white">
                {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Assegna
              </Button>
            </div>
          ) : (
            <p className="text-xs text-ink-400">Nessun numero disponibile. <a href="/app/phone-numbers/buy" className="text-brand hover:underline">Acquista un numero</a></p>
          )}
        </div>
      )}
    </div>
  );
}
