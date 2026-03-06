import { useState } from "react";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, ArrowRight, Check, Loader2, Bot, ListChecks, Clock, Settings2, Megaphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

const DAYS = [
  { key: "mon", label: "Lun" },
  { key: "tue", label: "Mar" },
  { key: "wed", label: "Mer" },
  { key: "thu", label: "Gio" },
  { key: "fri", label: "Ven" },
  { key: "sat", label: "Sab" },
  { key: "sun", label: "Dom" },
];

const STEPS = [
  { label: "Base", icon: Megaphone },
  { label: "Agente & Lista", icon: Bot },
  { label: "Programmazione", icon: Clock },
  { label: "Riepilogo", icon: Check },
];

interface CampaignForm {
  name: string;
  description: string;
  type: string;
  agent_id: string;
  contact_list_id: string;
  custom_first_msg: string;
  call_window_start: string;
  call_window_end: string;
  call_days: string[];
  retry_attempts: number;
  retry_delay_min: number;
  call_hour_limit: number | null;
}

const defaultForm: CampaignForm = {
  name: "",
  description: "",
  type: "outbound",
  agent_id: "",
  contact_list_id: "",
  custom_first_msg: "",
  call_window_start: "09:00",
  call_window_end: "19:00",
  call_days: ["mon", "tue", "wed", "thu", "fri"],
  retry_attempts: 2,
  retry_delay_min: 30,
  call_hour_limit: null,
};

export default function CreateCampaignPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const companyId = useCompanyId();

  const [step, setStep] = useState(0);
  const [form, setForm] = useState<CampaignForm>({ ...defaultForm });
  const [submitting, setSubmitting] = useState(false);

  const { data: agents = [] } = useQuery({
    queryKey: ["company-agents-list", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("agents").select("id, name, status").eq("company_id", companyId!).order("name");
      return data || [];
    },
  });

  const { data: contactLists = [] } = useQuery({
    queryKey: ["contact-lists-simple", companyId],
    enabled: !!companyId,
    queryFn: async () => {
      const { data } = await supabase.from("contact_lists").select("id, name, contact_count").eq("company_id", companyId!).order("name");
      return data || [];
    },
  });

  const update = (field: keyof CampaignForm, value: any) => setForm(f => ({ ...f, [field]: value }));

  const toggleDay = (day: string) => {
    const days = form.call_days.includes(day)
      ? form.call_days.filter(d => d !== day)
      : [...form.call_days, day];
    update("call_days", days);
  };

  const canNext = () => {
    if (step === 0) return form.name.trim().length > 0;
    if (step === 1) return form.agent_id && form.contact_list_id;
    if (step === 2) return form.call_days.length > 0;
    return true;
  };

  const selectedAgent = agents.find((a: any) => a.id === form.agent_id);
  const selectedList = contactLists.find((l: any) => l.id === form.contact_list_id);

  const handleSubmit = async () => {
    if (!companyId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.from("campaigns").insert({
        company_id: companyId,
        name: form.name.trim(),
        description: form.description.trim() || null,
        type: form.type,
        agent_id: form.agent_id,
        contact_list_id: form.contact_list_id,
        custom_first_msg: form.custom_first_msg.trim() || null,
        call_window_start: form.call_window_start,
        call_window_end: form.call_window_end,
        call_days: form.call_days,
        retry_attempts: form.retry_attempts,
        retry_delay_min: form.retry_delay_min,
        call_hour_limit: form.call_hour_limit,
        contacts_total: selectedList?.contact_count || 0,
        status: "draft",
      }).select("id").single();
      if (error) throw error;
      toast({ title: "Campagna creata" });
      navigate(`/app/campaigns/${data.id}`);
    } catch (err: any) {
      toast({ title: "Errore", description: err.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Nuova Campagna</h1>
          <p className="text-sm text-ink-500 mt-1">Configura e lancia una campagna di chiamate</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/app/campaigns")} className="border-ink-200 text-ink-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> Torna alle campagne
        </Button>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              step > i ? "bg-status-success text-white" : step === i ? "bg-brand text-white" : "bg-ink-100 text-ink-400"
            }`}>
              {step > i ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-sm hidden sm:inline ${step >= i ? "text-ink-900 font-medium" : "text-ink-400"}`}>{s.label}</span>
            {i < 3 && <div className={`w-8 h-0.5 ${step > i ? "bg-status-success" : "bg-ink-200"}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-card border border-ink-200 bg-white p-6 shadow-card space-y-6">
        {/* Step 0: Base info */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-ink-600">Nome campagna *</Label>
              <Input value={form.name} onChange={e => update("name", e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900" placeholder="es. Campagna Primavera 2026" />
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Descrizione</Label>
              <Textarea value={form.description} onChange={e => update("description", e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900 min-h-[80px]" placeholder="Descrizione opzionale..." />
            </div>
            <div className="space-y-1">
              <Label className="text-ink-600">Tipo</Label>
              <Select value={form.type} onValueChange={v => update("type", v)}>
                <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900 w-[200px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="outbound">Outbound</SelectItem>
                  <SelectItem value="inbound">Inbound</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Step 1: Agent & List */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-3">
              <Label className="text-ink-700 font-medium">Seleziona agente AI *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {agents.map((a: any) => (
                  <div
                    key={a.id}
                    onClick={() => update("agent_id", a.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      form.agent_id === a.id ? "border-brand bg-brand-light" : "border-ink-200 hover:border-ink-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Bot className={`w-5 h-5 ${form.agent_id === a.id ? "text-brand" : "text-ink-400"}`} />
                      <span className="font-medium text-ink-900">{a.name}</span>
                    </div>
                    <Badge className={`mt-2 border-none text-xs ${a.status === "active" ? "bg-status-success-light text-status-success" : "bg-ink-100 text-ink-500"}`}>
                      {a.status === "active" ? "Attivo" : "Inattivo"}
                    </Badge>
                  </div>
                ))}
                {agents.length === 0 && (
                  <p className="text-sm text-ink-400 col-span-2">Nessun agente disponibile. Creane uno prima.</p>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-ink-700 font-medium">Seleziona lista contatti *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contactLists.map((l: any) => (
                  <div
                    key={l.id}
                    onClick={() => update("contact_list_id", l.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      form.contact_list_id === l.id ? "border-brand bg-brand-light" : "border-ink-200 hover:border-ink-300"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ListChecks className={`w-5 h-5 ${form.contact_list_id === l.id ? "text-brand" : "text-ink-400"}`} />
                      <span className="font-medium text-ink-900">{l.name}</span>
                    </div>
                    <p className="text-xs text-ink-500 mt-1">{l.contact_count || 0} contatti</p>
                  </div>
                ))}
                {contactLists.length === 0 && (
                  <p className="text-sm text-ink-400 col-span-2">Nessuna lista disponibile. Creane una prima.</p>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-ink-600">Messaggio iniziale personalizzato (opzionale)</Label>
              <Textarea value={form.custom_first_msg} onChange={e => update("custom_first_msg", e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900 min-h-[60px]" placeholder="Sovrascrive il messaggio iniziale dell'agente..." />
            </div>
          </div>
        )}

        {/* Step 2: Scheduling */}
        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="text-ink-700 font-medium mb-3 block">Finestra oraria chiamate</Label>
              <div className="flex items-center gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-ink-500">Dalle</Label>
                  <Input type="time" value={form.call_window_start} onChange={e => update("call_window_start", e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900 w-[130px]" />
                </div>
                <span className="text-ink-400 mt-5">—</span>
                <div className="space-y-1">
                  <Label className="text-xs text-ink-500">Alle</Label>
                  <Input type="time" value={form.call_window_end} onChange={e => update("call_window_end", e.target.value)} className="bg-ink-50 border-ink-200 text-ink-900 w-[130px]" />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-ink-700 font-medium mb-3 block">Giorni attivi</Label>
              <div className="flex gap-2">
                {DAYS.map(d => (
                  <button
                    key={d.key}
                    onClick={() => toggleDay(d.key)}
                    className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                      form.call_days.includes(d.key)
                        ? "bg-brand text-white"
                        : "bg-ink-50 text-ink-500 hover:bg-ink-100"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-ink-600">Tentativi di richiamata</Label>
                <Select value={String(form.retry_attempts)} onValueChange={v => update("retry_attempts", Number(v))}>
                  <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Nessuno</SelectItem>
                    <SelectItem value="1">1 tentativo</SelectItem>
                    <SelectItem value="2">2 tentativi</SelectItem>
                    <SelectItem value="3">3 tentativi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-ink-600">Ritardo tra tentativi (min)</Label>
                <Select value={String(form.retry_delay_min)} onValueChange={v => update("retry_delay_min", Number(v))}>
                  <SelectTrigger className="bg-ink-50 border-ink-200 text-ink-900"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minuti</SelectItem>
                    <SelectItem value="30">30 minuti</SelectItem>
                    <SelectItem value="60">1 ora</SelectItem>
                    <SelectItem value="120">2 ore</SelectItem>
                    <SelectItem value="1440">1 giorno</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-ink-600">Limite chiamate/ora (opzionale)</Label>
              <Input
                type="number"
                value={form.call_hour_limit ?? ""}
                onChange={e => update("call_hour_limit", e.target.value ? Number(e.target.value) : null)}
                className="bg-ink-50 border-ink-200 text-ink-900 w-[200px]"
                placeholder="Nessun limite"
                min={1}
              />
            </div>
          </div>
        )}

        {/* Step 3: Summary */}
        {step === 3 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-ink-900">Riepilogo campagna</h3>
            <div className="grid grid-cols-2 gap-4">
              <SummaryItem label="Nome" value={form.name} />
              <SummaryItem label="Tipo" value={form.type === "outbound" ? "Outbound" : "Inbound"} />
              <SummaryItem label="Agente" value={selectedAgent?.name || "—"} />
              <SummaryItem label="Lista" value={`${selectedList?.name || "—"} (${selectedList?.contact_count || 0} contatti)`} />
              <SummaryItem label="Orario" value={`${form.call_window_start} — ${form.call_window_end}`} />
              <SummaryItem label="Giorni" value={form.call_days.map(d => DAYS.find(dd => dd.key === d)?.label).join(", ")} />
              <SummaryItem label="Retry" value={`${form.retry_attempts} tentativi, ogni ${form.retry_delay_min} min`} />
              {form.call_hour_limit && <SummaryItem label="Limite/ora" value={`${form.call_hour_limit} chiamate`} />}
            </div>
            {form.description && (
              <div>
                <p className="text-xs text-ink-400 mb-1">Descrizione</p>
                <p className="text-sm text-ink-700">{form.description}</p>
              </div>
            )}
            {form.custom_first_msg && (
              <div>
                <p className="text-xs text-ink-400 mb-1">Messaggio personalizzato</p>
                <p className="text-sm text-ink-700">{form.custom_first_msg}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => step === 0 ? navigate("/app/campaigns") : setStep(s => s - 1)} className="border-ink-200 text-ink-700">
          <ArrowLeft className="w-4 h-4 mr-2" /> {step === 0 ? "Annulla" : "Indietro"}
        </Button>
        {step < 3 ? (
          <Button onClick={() => setStep(s => s + 1)} disabled={!canNext()} className="bg-brand hover:bg-brand-hover text-white">
            Avanti <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="bg-brand hover:bg-brand-hover text-white">
            {submitting && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
            <Megaphone className="w-4 h-4 mr-2" /> Crea Campagna
          </Button>
        )}
      </div>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-ink-400">{label}</p>
      <p className="text-sm font-medium text-ink-900">{value}</p>
    </div>
  );
}
