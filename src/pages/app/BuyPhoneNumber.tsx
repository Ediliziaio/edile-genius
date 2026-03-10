import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Phone, Check, Loader2, ExternalLink, Eye, EyeOff, Info, CheckCircle2 } from "lucide-react";

interface Agent { id: string; name: string; }

const DAYS = [
  { value: "mon", label: "Lun" }, { value: "tue", label: "Mar" }, { value: "wed", label: "Mer" },
  { value: "thu", label: "Gio" }, { value: "fri", label: "Ven" }, { value: "sat", label: "Sab" }, { value: "sun", label: "Dom" },
];

export default function BuyPhoneNumber() {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [hasTwilio, setHasTwilio] = useState<boolean | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [importing, setImporting] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [importedNumber, setImportedNumber] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    phone_number: "", label: "", twilio_sid: "", twilio_token: "",
  });

  const [config, setConfig] = useState({
    agent_id: "", inbound_enabled: true, outbound_enabled: true,
    active_hours_start: "09:00", active_hours_end: "19:00",
    active_days: ["mon", "tue", "wed", "thu", "fri"],
  });

  useEffect(() => {
    if (!companyId) return;
    supabase.from("agents").select("id, name").eq("company_id", companyId).then(({ data }) => {
      if (data) setAgents(data as Agent[]);
    });
  }, [companyId]);

  const handleImport = async () => {
    if (!companyId || !form.phone_number || !form.twilio_sid || !form.twilio_token) return;
    setImporting(true);
    try {
      const { data, error } = await supabase.functions.invoke("elevenlabs-import-phone-number", {
        body: { company_id: companyId, ...form },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setImportedNumber(data);
      toast({ title: "Numero importato!", description: "Numero registrato su ElevenLabs con successo." });
      setStep(3);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore importazione", description: err.message });
    } finally {
      setImporting(false);
    }
  };

  const handleSaveConfig = async () => {
    if (!importedNumber?.phone_number?.id) return;
    setSaving(true);
    try {
      await supabase.from("ai_phone_numbers").update({
        agent_id: config.agent_id || null,
        inbound_enabled: config.inbound_enabled,
        outbound_enabled: config.outbound_enabled,
        active_hours_start: config.active_hours_start,
        active_hours_end: config.active_hours_end,
        active_days: config.active_days,
      } as any).eq("id", importedNumber.phone_number.id);

      if (config.agent_id && importedNumber.el_phone_number_id) {
        await supabase.from("agents").update({
          el_phone_number_id: importedNumber.el_phone_number_id,
        } as any).eq("id", config.agent_id);
      }

      toast({ title: "Configurazione salvata!" });
      setStep(4);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => step > 1 ? setStep(step - 1) : navigate("/app/phone-numbers")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Importa Numero Twilio</h1>
          <p className="text-sm text-muted-foreground">Step {step} di 4</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-brand" : "bg-muted"}`} />
        ))}
      </div>

      {/* Step 1: Hai già Twilio? */}
      {step === 1 && (
        <Card className="border border-border shadow-card">
          <CardHeader>
            <CardTitle>Hai già un numero Twilio?</CardTitle>
            <CardDescription>ElevenLabs non vende numeri telefonici direttamente. È necessario avere un numero Twilio da importare.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Card
                className={`cursor-pointer transition-all ${hasTwilio === true ? "border-2 border-brand bg-brand/5" : "border border-border hover:border-muted-foreground"}`}
                onClick={() => setHasTwilio(true)}
              >
                <CardContent className="p-5 text-center">
                  <Phone className="h-8 w-8 mx-auto mb-2 text-brand" />
                  <p className="font-semibold text-sm text-foreground">Ho già un numero Twilio</p>
                  <p className="text-xs text-muted-foreground mt-1">Procedi con l'importazione</p>
                </CardContent>
              </Card>
              <Card
                className={`cursor-pointer transition-all ${hasTwilio === false ? "border-2 border-brand bg-brand/5" : "border border-border hover:border-muted-foreground"}`}
                onClick={() => setHasTwilio(false)}
              >
                <CardContent className="p-5 text-center">
                  <ExternalLink className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="font-semibold text-sm text-foreground">Non ho Twilio</p>
                  <p className="text-xs text-muted-foreground mt-1">Devo creare un account</p>
                </CardContent>
              </Card>
            </div>

            {hasTwilio === false && (
              <div className="rounded-lg border border-brand/30 bg-brand/5 p-4 space-y-2">
                <p className="text-sm text-foreground font-medium">Crea un account Twilio gratuito</p>
                <p className="text-xs text-muted-foreground">Twilio offre un account gratuito con crediti di prova. Dopo la registrazione, acquista un numero e torna qui per importarlo.</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={() => window.open("https://www.twilio.com/try-twilio", "_blank")}>
                  Crea account Twilio <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </div>
            )}

            {hasTwilio === true && (
              <Button className="w-full bg-brand hover:bg-brand/90 text-white" onClick={() => setStep(2)}>
                Avanti <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 2: Credenziali Twilio */}
      {step === 2 && (
        <Card className="border border-border shadow-card">
          <CardHeader>
            <CardTitle>Inserisci credenziali Twilio</CardTitle>
            <CardDescription>Queste informazioni verranno usate per importare il numero su ElevenLabs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Numero di telefono</Label>
              <Input value={form.phone_number} onChange={e => setForm({ ...form, phone_number: e.target.value })} placeholder="+39 02 XXXX XXXX" className="font-mono" />
              <p className="text-[10px] text-muted-foreground">Formato internazionale E.164 (es. +39025551234)</p>
            </div>
            <div className="space-y-2">
              <Label>Etichetta</Label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })} placeholder="es. Linea Commerciale Milano" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Twilio Account SID</Label>
                <button onClick={() => window.open("https://console.twilio.com", "_blank")} className="text-[10px] text-brand hover:underline flex items-center gap-0.5">
                  Dove lo trovo? <ExternalLink className="h-2.5 w-2.5" />
                </button>
              </div>
              <Input value={form.twilio_sid} onChange={e => setForm({ ...form, twilio_sid: e.target.value })} placeholder="ACxxxxxxxx..." className="font-mono text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Twilio Auth Token</Label>
              <div className="relative">
                <Input type={showToken ? "text" : "password"} value={form.twilio_token} onChange={e => setForm({ ...form, twilio_token: e.target.value })} placeholder="••••••••••••" className="font-mono text-sm pr-10" />
                <button onClick={() => setShowToken(!showToken)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950 p-3 flex gap-2">
              <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700 dark:text-blue-300">I tuoi dati Twilio vengono usati una sola volta per importare il numero su ElevenLabs e non vengono salvati nel nostro database.</p>
            </div>

            <Button className="w-full bg-brand hover:bg-brand/90 text-white" onClick={handleImport} disabled={importing || !form.phone_number || !form.twilio_sid || !form.twilio_token}>
              {importing ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Importazione in corso su ElevenLabs...</> : <>Importa Numero <ArrowRight className="h-4 w-4 ml-2" /></>}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Configurazione */}
      {step === 3 && (
        <Card className="border border-border shadow-card">
          <CardHeader>
            <CardTitle>Configurazione</CardTitle>
            <CardDescription>Configura il numero importato</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Associa ad agente</Label>
              <Select value={config.agent_id} onValueChange={v => setConfig({ ...config, agent_id: v })}>
                <SelectTrigger><SelectValue placeholder="Nessun agente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun agente</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between">
              <div><Label>Chiamate in entrata (Inbound)</Label><p className="text-xs text-muted-foreground">Ricevi chiamate su questo numero</p></div>
              <Switch checked={config.inbound_enabled} onCheckedChange={v => setConfig({ ...config, inbound_enabled: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div><Label>Chiamate in uscita (Outbound)</Label><p className="text-xs text-muted-foreground">Avvia chiamate da questo numero</p></div>
              <Switch checked={config.outbound_enabled} onCheckedChange={v => setConfig({ ...config, outbound_enabled: v })} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Orario inizio</Label>
                <Input type="time" value={config.active_hours_start} onChange={e => setConfig({ ...config, active_hours_start: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Orario fine</Label>
                <Input type="time" value={config.active_hours_end} onChange={e => setConfig({ ...config, active_hours_end: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Giorni attivi</Label>
              <div className="flex flex-wrap gap-2">
                {DAYS.map(d => (
                  <label key={d.value} className="flex items-center gap-1.5">
                    <Checkbox checked={config.active_days.includes(d.value)} onCheckedChange={checked => {
                      setConfig({ ...config, active_days: checked ? [...config.active_days, d.value] : config.active_days.filter(x => x !== d.value) });
                    }} />
                    <span className="text-xs">{d.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <Button className="w-full bg-brand hover:bg-brand/90 text-white" onClick={handleSaveConfig} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Salva configurazione
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Conferma */}
      {step === 4 && (
        <Card className="border border-border shadow-card">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Numero importato con successo!</h2>
            <p className="text-sm text-muted-foreground">{form.phone_number} è stato registrato su ElevenLabs e configurato.</p>

            <Card className="bg-muted border border-border text-left">
              <CardContent className="p-4 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Numero:</span><span className="font-mono font-semibold">{form.phone_number}</span></div>
                {config.agent_id && <div className="flex justify-between"><span className="text-muted-foreground">Agente:</span><span>{agents.find(a => a.id === config.agent_id)?.name || "—"}</span></div>}
                <div className="flex justify-between"><span className="text-muted-foreground">EL Phone ID:</span><span className="font-mono text-xs">{importedNumber?.el_phone_number_id || "—"}</span></div>
              </CardContent>
            </Card>

            <div className="flex gap-3 justify-center pt-2">
              <Button variant="outline" onClick={() => navigate("/app/phone-numbers")}>Vai ai Numeri</Button>
              <Button className="bg-brand hover:bg-brand/90 text-white" onClick={() => navigate("/app/phone-numbers")}>
                <Phone className="h-4 w-4 mr-2" /> Gestisci numeri
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
