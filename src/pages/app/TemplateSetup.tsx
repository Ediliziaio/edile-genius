import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, CheckCircle2, Loader2,
  ExternalLink, Upload, Download, Circle
} from "lucide-react";

/* ── Types ────────────────────────────────────────────── */

interface ConfigField {
  key: string;
  label: string;
  type: "text" | "select" | "multiselect" | "time" | "number";
  placeholder?: string;
  options?: string[];
  default?: any;
  required?: boolean;
  section?: string;
  help?: string;
  min?: number;
  max?: number;
}

interface Template {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  channel: string[];
  config_schema: ConfigField[];
  first_message_template: string | null;
  prompt_template: string;
  estimated_setup_min: number;
}

interface Responder {
  name: string;
  phone: string;
  cantiere: string;
}

interface Recipient {
  name: string;
  role: string;
  channels: string[];
  email: string;
  phone: string;
  telegram: string;
  receive_partial: boolean;
}

interface CreditInfo {
  balance_eur: number;
  total_recharged_eur: number;
}

const STEPS = ["Personalizza", "Operai", "Manager", "Canali", "Attiva"];

/* ── Component ───────────────────────────────────────── */

export default function TemplateSetupPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const csvInputRef = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [instanceId, setInstanceId] = useState<string | null>(null);

  // Step 1
  const [agentName, setAgentName] = useState("");
  const [configValues, setConfigValues] = useState<Record<string, any>>({});

  // Step 2
  const [responders, setResponders] = useState<Responder[]>([{ name: "", phone: "", cantiere: "" }]);

  // Step 3
  const [recipients, setRecipients] = useState<Recipient[]>([
    { name: "", role: "Titolare", channels: ["email"], email: "", phone: "", telegram: "", receive_partial: true },
  ]);

  // Step 4
  const [waConnected, setWaConnected] = useState(false);
  const [telegramToken, setTelegramToken] = useState("");
  const [telegramBotName, setTelegramBotName] = useState("");

  // Step 5
  const [deploying, setDeploying] = useState(false);
  const [deploySteps, setDeploySteps] = useState<{ label: string; status: "pending" | "loading" | "done" | "error" }[]>([]);
  const [creditInfo, setCreditInfo] = useState<CreditInfo | null>(null);
  const [costPerMin, setCostPerMin] = useState(0.07);

  /* ── Load template ─────────────────────────────────── */

  useEffect(() => {
    if (!slug) return;
    (async () => {
      const { data } = await supabase
        .from("agent_templates")
        .select("*")
        .eq("slug", slug)
        .single();
      if (data) {
        const t = data as any as Template;
        setTemplate(t);
        setAgentName(`${t.name} — `);
        const defaults: Record<string, any> = {};
        (t.config_schema as any[] || []).forEach((f: ConfigField) => {
          if (f.default !== undefined) defaults[f.key] = f.default;
        });
        setConfigValues(defaults);
      }
      setLoading(false);
    })();
  }, [slug]);

  /* ── Check WA + credits ────────────────────────────── */

  useEffect(() => {
    (async () => {
      const { data: waData } = await supabase
        .from("company_channels")
        .select("id")
        .eq("channel_type", "whatsapp")
        .eq("is_verified", true)
        .limit(1);
      if (waData && waData.length > 0) setWaConnected(true);

      // Load credits
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", user.id).single();
      if (!profile?.company_id) return;
      const { data: credits } = await supabase.from("ai_credits").select("balance_eur, total_recharged_eur").eq("company_id", profile.company_id).single();
      if (credits) setCreditInfo(credits as unknown as CreditInfo);

      // Load pricing
      const { data: pricing } = await supabase.from("platform_pricing").select("cost_billed_per_min").eq("is_active", true).limit(1);
      if (pricing && pricing.length > 0) setCostPerMin(pricing[0].cost_billed_per_min);
    })();
  }, []);

  /* ── Helpers ───────────────────────────────────────── */

  const setConfig = (key: string, val: any) => setConfigValues((prev) => ({ ...prev, [key]: val }));

  const toggleMultiselect = (key: string, option: string) => {
    const current: string[] = configValues[key] || [];
    setConfig(key, current.includes(option) ? current.filter((o) => o !== option) : [...current, option]);
  };

  const sections = useMemo(() => {
    if (!template) return {};
    const groups: Record<string, ConfigField[]> = {};
    ((template.config_schema as any[]) || []).forEach((f: ConfigField) => {
      const sec = f.section || "Generale";
      if (!groups[sec]) groups[sec] = [];
      groups[sec].push(f);
    });
    return groups;
  }, [template]);

  const previewMessage = useMemo(() => {
    if (!template?.first_message_template) return "";
    let msg = template.first_message_template;
    msg = msg.replace(/\{\{NOME_AZIENDA\}\}/g, configValues.nome_azienda || "[Nome Azienda]");
    msg = msg.replace(/\{\{NOME_CANTIERE\}\}/g, responders[0]?.cantiere || "[Cantiere]");
    msg = msg.replace(/\{\{NOME_CAPOCANTIERE\}\}/g, responders[0]?.name || "[Capo Cantiere]");
    return msg;
  }, [template, configValues, responders]);

  /* ── CSV Import ────────────────────────────────────── */

  const handleCsvImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const lines = text.split("\n").filter((l) => l.trim());
      if (lines.length < 2) { toast.error("CSV vuoto o senza dati"); return; }

      const header = lines[0].toLowerCase().split(/[;,\t]/);
      const nameIdx = header.findIndex((h) => /nome|name/i.test(h));
      const phoneIdx = header.findIndex((h) => /telefon|phone|cellulare|mobile/i.test(h));
      const cantiereIdx = header.findIndex((h) => /cantiere|site|luogo/i.test(h));

      if (nameIdx === -1 || phoneIdx === -1) {
        toast.error("Il CSV deve avere colonne 'nome' e 'telefono'");
        return;
      }

      const imported: Responder[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(/[;,\t]/);
        const name = cols[nameIdx]?.trim();
        const phone = cols[phoneIdx]?.trim();
        const cantiere = cantiereIdx >= 0 ? cols[cantiereIdx]?.trim() || "" : "";
        if (name && phone) imported.push({ name, phone, cantiere });
      }

      if (imported.length === 0) { toast.error("Nessun operaio valido trovato nel CSV"); return; }
      setResponders((prev) => [...prev.filter((r) => r.name.trim()), ...imported]);
      toast.success(`${imported.length} operai importati dal CSV`);
    };
    reader.readAsText(file);
    if (csvInputRef.current) csvInputRef.current.value = "";
  };

  const downloadCsvTemplate = () => {
    const csv = "nome;telefono;cantiere\nMario Rossi;+39 333 1234567;Via Roma 15 Milano\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "template_operai.csv";
    a.click();
  };

  /* ── Validation ────────────────────────────────────── */

  const canProceed = () => {
    if (step === 0) {
      if (!agentName.trim()) return false;
      const schema = (template?.config_schema as any[] || []) as ConfigField[];
      for (const f of schema) {
        if (f.required && (configValues[f.key] === undefined || configValues[f.key] === "")) return false;
      }
      return true;
    }
    if (step === 1) return responders.some((r) => r.name.trim() && r.phone.trim());
    if (step === 2) return recipients.some((r) => r.name.trim() && r.channels.length > 0);
    return true;
  };

  /* ── Save instance ─────────────────────────────────── */

  const saveInstance = async () => {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const { data: profile } = await supabase
      .from("profiles")
      .select("company_id")
      .eq("id", userData.user.id)
      .single();
    if (!profile?.company_id || !template) return;

    const payload = {
      template_id: template.id,
      company_id: profile.company_id,
      name: agentName,
      config_values: configValues as any,
      responders: responders.filter((r) => r.name.trim()) as any,
      recipients: recipients.filter((r) => r.name.trim()) as any,
      trigger_time: configValues.orario_invio || "17:30:00",
      trigger_days: (configValues.giorni_attivi as string[] || ["Lunedì", "Martedì", "Mercoledì", "Giovedì", "Venerdì", "Sabato"]).map((d) => {
        const map: Record<string, string> = { "Lunedì": "monday", "Martedì": "tuesday", "Mercoledì": "wednesday", "Giovedì": "thursday", "Venerdì": "friday", "Sabato": "saturday", "Domenica": "sunday" };
        return map[d] || d.toLowerCase();
      }),
      status: "setup",
      created_by: userData.user.id,
    };

    if (instanceId) {
      await supabase.from("agent_template_instances").update(payload as any).eq("id", instanceId);
    } else {
      const { data: ins } = await supabase.from("agent_template_instances").insert(payload as any).select("id").single();
      if (ins) setInstanceId(ins.id);
    }
  };

  /* ── Save Telegram to company_channels ─────────────── */

  const saveTelegramChannel = async () => {
    if (!telegramToken || !telegramBotName) return;
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) return;
    const { data: profile } = await supabase.from("profiles").select("company_id").eq("id", userData.user.id).single();
    if (!profile?.company_id) return;

    // Check if telegram channel already exists
    const { data: existing } = await supabase
      .from("company_channels")
      .select("id")
      .eq("company_id", profile.company_id)
      .eq("channel_type", "telegram")
      .limit(1);

    if (existing && existing.length > 0) {
      await supabase.from("company_channels").update({
        telegram_bot_token: telegramToken,
        telegram_bot_name: telegramBotName,
      }).eq("id", existing[0].id);
    } else {
      await supabase.from("company_channels").insert({
        company_id: profile.company_id,
        channel_type: "telegram",
        telegram_bot_token: telegramToken,
        telegram_bot_name: telegramBotName,
        label: telegramBotName,
      });
    }
  };

  /* ── Deploy ────────────────────────────────────────── */

  const deploy = async () => {
    if (!instanceId) {
      await saveInstance();
    }
    setDeploying(true);

    const steps = [
      { label: "Salvataggio configurazione...", status: "loading" as const },
      { label: "Creazione agente su ElevenLabs...", status: "pending" as const },
      { label: "Configurazione workflow n8n...", status: "pending" as const },
      { label: "Connessione canali e scheduling...", status: "pending" as const },
    ];
    setDeploySteps([...steps]);

    try {
      // Step 1: Save config
      await saveInstance();
      if (telegramToken) await saveTelegramChannel();
      steps[0].status = "done";
      steps[1].status = "loading";
      setDeploySteps([...steps]);

      // Step 2-4: Call deploy function
      const { data: session } = await supabase.auth.getSession();
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/deploy-template-instance`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session?.session?.access_token}`,
          },
          body: JSON.stringify({ instanceId }),
        }
      );

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Errore deploy");
      }

      const result = await res.json();

      steps[1].status = "done";
      steps[2].status = result.n8nWorkflowId ? "done" : "done";
      steps[2].label = result.n8nWorkflowId ? "✅ Workflow n8n configurato" : "Workflow n8n — configurazione manuale";
      steps[3].status = "done";
      steps[3].label = `Primo invio programmato per le ${configValues.orario_invio || "17:30"}`;
      setDeploySteps([...steps]);

      toast.success(`✅ Agente attivato! Il primo report partirà alle ${configValues.orario_invio || "17:30"}.`);
      setTimeout(() => navigate("/app/agents"), 2000);
    } catch (e: any) {
      const failIdx = steps.findIndex((s) => s.status === "loading");
      if (failIdx >= 0) steps[failIdx].status = "error";
      setDeploySteps([...steps]);
      toast.error(e.message || "Errore durante il deploy");
      setDeploying(false);
    }
  };

  /* ── Step navigation ───────────────────────────────── */

  const goNext = async () => {
    if (step < 4) {
      await saveInstance();
      if (step === 3 && telegramToken) await saveTelegramChannel();
      setStep(step + 1);
    }
  };

  const goBack = () => step > 0 && setStep(step - 1);

  /* ── Cost calculations ─────────────────────────────── */

  const activeResponders = responders.filter((r) => r.name.trim()).length;
  const dailyCost = activeResponders * 4 * costPerMin;
  const monthlyCost = dailyCost * 22;
  const availableNights = creditInfo && dailyCost > 0 ? Math.floor(creditInfo.balance_eur / dailyCost) : 0;

  /* ── Render ────────────────────────────────────────── */

  if (loading) return <div className="p-8"><div className="h-96 bg-muted animate-pulse rounded-lg" /></div>;
  if (!template) return <div className="p-8 text-muted-foreground text-center">Template non trovato.</div>;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-card border-b border-border px-8 py-4">
        <div className="flex items-center gap-4 mb-4">
          <Button variant="ghost" size="sm" onClick={() => navigate(`/app/templates/${slug}`)}>
            <ArrowLeft size={16} className="mr-1" /> Indietro
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-2xl">{template.icon}</span>
            <span className="font-bold text-foreground">{template.name}</span>
          </div>
          <span className="ml-auto text-sm text-muted-foreground">Step {step + 1} di {STEPS.length}</span>
        </div>

        {/* Progress */}
        <div className="flex gap-1">
          {STEPS.map((s, i) => (
            <div key={i} className="flex-1">
              <div className={`h-1.5 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`} />
              <p className={`text-[11px] mt-1 text-center font-medium ${i <= step ? "text-primary" : "text-muted-foreground"}`}>{s}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-8 py-8 max-w-4xl mx-auto w-full">
        {/* ── STEP 0: Personalizza ───────────────────────── */}
        {step === 0 && (
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Personalizza l'agente</h2>
            <p className="text-sm text-muted-foreground mt-1">Inserisci i dati della tua azienda per adattare il template.</p>

            <Card className="mt-6">
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label>Nome di questo agente</Label>
                  <Input value={agentName} onChange={(e) => setAgentName(e.target.value)} className="mt-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Visibile solo a te. Puoi avere più istanze dello stesso template.</p>
                </div>

                {Object.entries(sections).map(([section, fields]) => (
                  <div key={section}>
                    <p className="text-[13px] font-mono uppercase text-muted-foreground tracking-wider mb-4 pt-4 border-t border-border">{section}</p>
                    <div className="space-y-5">
                      {fields.map((f) => (
                        <div key={f.key}>
                          <Label>{f.label} {f.required && <span className="text-destructive">*</span>}</Label>

                          {f.type === "text" && (
                            <Input
                              className="mt-1.5"
                              placeholder={f.placeholder}
                              value={configValues[f.key] || ""}
                              onChange={(e) => setConfig(f.key, e.target.value)}
                            />
                          )}

                          {f.type === "select" && (
                            <Select value={configValues[f.key] || ""} onValueChange={(v) => setConfig(f.key, v)}>
                              <SelectTrigger className="mt-1.5"><SelectValue placeholder="Seleziona..." /></SelectTrigger>
                              <SelectContent>
                                {(f.options || []).map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                              </SelectContent>
                            </Select>
                          )}

                          {f.type === "multiselect" && (
                            <div className="flex flex-wrap gap-2 mt-1.5">
                              {(f.options || []).map((o) => {
                                const active = (configValues[f.key] || []).includes(o);
                                return (
                                  <button
                                    key={o}
                                    type="button"
                                    onClick={() => toggleMultiselect(f.key, o)}
                                    className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                                      active ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/50"
                                    }`}
                                  >
                                    {o}
                                  </button>
                                );
                              })}
                            </div>
                          )}

                          {f.type === "time" && (
                            <Input
                              type="time"
                              className="mt-1.5 w-40"
                              value={configValues[f.key] || f.default || "17:30"}
                              onChange={(e) => setConfig(f.key, e.target.value)}
                            />
                          )}

                          {f.type === "number" && (
                            <div className="mt-1.5 flex items-center gap-4">
                              <Slider
                                className="flex-1"
                                min={f.min || 0}
                                max={f.max || 100}
                                step={1}
                                value={[configValues[f.key] ?? f.default ?? 30]}
                                onValueChange={([v]) => setConfig(f.key, v)}
                              />
                              <span className="text-sm font-mono font-bold text-foreground w-16 text-right">
                                {configValues[f.key] ?? f.default ?? 30} min
                              </span>
                            </div>
                          )}

                          {f.help && <p className="text-xs text-muted-foreground mt-1">{f.help}</p>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Preview */}
            {previewMessage && (
              <Card className="mt-6 bg-muted/50">
                <CardContent className="p-4">
                  <p className="text-[12px] font-mono uppercase text-muted-foreground mb-3">📱 Anteprima primo messaggio</p>
                  <div className="flex justify-end">
                    <div className="bg-[#DCF8C6] rounded-[12px_12px_3px_12px] px-4 py-2.5 inline-block max-w-[80%] text-[14px]">
                      {previewMessage.split("\n").map((line, i) => <span key={i}>{line}<br /></span>)}
                      <span className="block text-[10px] text-right text-muted-foreground mt-1">
                        {configValues.orario_invio || "17:30"} ✓✓
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── STEP 1: Operai ─────────────────────────────── */}
        {step === 1 && (
          <div>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-extrabold text-foreground">Chi deve rispondere al report?</h2>
                <p className="text-sm text-muted-foreground mt-1">Aggiungi i capi-cantiere che riceveranno il messaggio ogni sera.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={downloadCsvTemplate}>
                  <Download size={14} className="mr-1" /> Template CSV
                </Button>
                <Button variant="outline" size="sm" onClick={() => csvInputRef.current?.click()}>
                  <Upload size={14} className="mr-1" /> Importa CSV
                </Button>
                <input ref={csvInputRef} type="file" accept=".csv" className="hidden" onChange={handleCsvImport} />
              </div>
            </div>

            <div className="space-y-3 mt-6">
              {responders.map((r, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end">
                      <div>
                        <Label className="text-xs">Nome e cognome</Label>
                        <Input
                          className="mt-1"
                          placeholder="es. Marco Rossi"
                          value={r.name}
                          onChange={(e) => {
                            const copy = [...responders];
                            copy[i].name = e.target.value;
                            setResponders(copy);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Numero WhatsApp</Label>
                        <Input
                          className="mt-1"
                          type="tel"
                          placeholder="+39 333 1234567"
                          value={r.phone}
                          onChange={(e) => {
                            const copy = [...responders];
                            copy[i].phone = e.target.value;
                            setResponders(copy);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Cantiere</Label>
                        <Input
                          className="mt-1"
                          placeholder="es. Via Roma, 15 Milano"
                          value={r.cantiere}
                          onChange={(e) => {
                            const copy = [...responders];
                            copy[i].cantiere = e.target.value;
                            setResponders(copy);
                          }}
                        />
                      </div>
                      {responders.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setResponders(responders.filter((_, j) => j !== i))}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              className="mt-3 border-dashed border-primary text-primary"
              onClick={() => setResponders([...responders, { name: "", phone: "", cantiere: "" }])}
            >
              <Plus size={16} className="mr-1" /> Aggiungi Operaio
            </Button>

            <div className="bg-muted/50 border border-border rounded-lg p-3 mt-4 text-sm text-foreground">
              ℹ️ Il numero WhatsApp deve essere registrato su WhatsApp. L'agente invierà il messaggio a questo numero ogni sera all'orario impostato.
            </div>
          </div>
        )}

        {/* ── STEP 2: Destinatari ────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Chi riceve il report?</h2>
            <p className="text-sm text-muted-foreground mt-1">Il report generato verrà inviato a queste persone.</p>

            <div className="space-y-3 mt-6">
              {recipients.map((r, i) => (
                <Card key={i}>
                  <CardContent className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3 items-end">
                      <div>
                        <Label className="text-xs">Nome</Label>
                        <Input
                          className="mt-1"
                          placeholder="es. Giovanni Bianchi"
                          value={r.name}
                          onChange={(e) => {
                            const copy = [...recipients];
                            copy[i].name = e.target.value;
                            setRecipients(copy);
                          }}
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Ruolo</Label>
                        <Select
                          value={r.role}
                          onValueChange={(v) => {
                            const copy = [...recipients];
                            copy[i].role = v;
                            setRecipients(copy);
                          }}
                        >
                          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {["Titolare", "Manager", "Direttore Lavori", "Altro"].map((o) => (
                              <SelectItem key={o} value={o}>{o}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      {recipients.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => setRecipients(recipients.filter((_, j) => j !== i))}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>

                    <div>
                      <Label className="text-xs mb-2 block">Canali di ricezione</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {[
                          { key: "email", label: "📧 Email" },
                          { key: "whatsapp", label: "💬 WhatsApp" },
                          { key: "telegram", label: "✈️ Telegram" },
                        ].map((ch) => {
                          const active = r.channels.includes(ch.key);
                          return (
                            <div key={ch.key} className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Checkbox
                                  checked={active}
                                  onCheckedChange={(checked) => {
                                    const copy = [...recipients];
                                    copy[i].channels = checked
                                      ? [...copy[i].channels, ch.key]
                                      : copy[i].channels.filter((c) => c !== ch.key);
                                    setRecipients(copy);
                                  }}
                                />
                                <span className="text-sm">{ch.label}</span>
                              </div>
                              {active && ch.key === "email" && (
                                <Input type="email" placeholder="email@azienda.it" value={r.email}
                                  onChange={(e) => { const copy = [...recipients]; copy[i].email = e.target.value; setRecipients(copy); }}
                                />
                              )}
                              {active && ch.key === "whatsapp" && (
                                <Input type="tel" placeholder="+39 333..." value={r.phone}
                                  onChange={(e) => { const copy = [...recipients]; copy[i].phone = e.target.value; setRecipients(copy); }}
                                />
                              )}
                              {active && ch.key === "telegram" && (
                                <Input placeholder="@username" value={r.telegram}
                                  onChange={(e) => { const copy = [...recipients]; copy[i].telegram = e.target.value; setRecipients(copy); }}
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Checkbox
                        checked={r.receive_partial}
                        onCheckedChange={(checked) => {
                          const copy = [...recipients];
                          copy[i].receive_partial = !!checked;
                          setRecipients(copy);
                        }}
                      />
                      <span className="text-sm text-foreground">Ricevi anche report incompleti</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Button
              variant="outline"
              className="mt-3 border-dashed border-primary text-primary"
              onClick={() =>
                setRecipients([
                  ...recipients,
                  { name: "", role: "Manager", channels: ["email"], email: "", phone: "", telegram: "", receive_partial: true },
                ])
              }
            >
              <Plus size={16} className="mr-1" /> Aggiungi Destinatario
            </Button>

            {/* Email Preview Mockup */}
            {recipients.some((r) => r.channels.includes("email") && r.name.trim()) && (
              <Card className="mt-6 overflow-hidden">
                <div className="bg-primary h-1" />
                <CardContent className="p-5">
                  <p className="text-[11px] font-mono uppercase text-muted-foreground mb-3">📧 Anteprima Email Report</p>
                  <div className="border border-border rounded-lg p-5 bg-card text-sm space-y-3">
                    <div className="text-xs text-muted-foreground">
                      Da: reportistica@edilizia.io<br />
                      Oggetto: 📋 Report Cantiere {responders[0]?.cantiere || "Via Roma"} — {new Date().toLocaleDateString("it-IT", { weekday: "long", day: "numeric", month: "long" })}
                    </div>
                    <hr className="border-border" />
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-foreground">edilizia<span className="text-primary">.io</span></span>
                      <span className="text-muted-foreground">· {configValues.nome_azienda || "Azienda"}</span>
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Report Giornaliero Cantiere</h3>
                    <p className="text-muted-foreground text-xs">{new Date().toLocaleDateString("it-IT")} · {responders[0]?.cantiere || "Cantiere"}</p>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-foreground">—</p>
                        <p className="text-[10px] text-muted-foreground">Operai</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-primary">Pari</p>
                        <p className="text-[10px] text-muted-foreground">Avanzamento</p>
                      </div>
                      <div className="bg-muted rounded-lg p-3 text-center">
                        <p className="text-lg font-bold text-foreground">✅</p>
                        <p className="text-[10px] text-muted-foreground">Problemi</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-4 text-center">Generato da edilizia.io · {configValues.nome_azienda || "Azienda"}</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* ── STEP 3: Canali ─────────────────────────────── */}
        {step === 3 && (
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Connetti i canali</h2>
            <p className="text-sm text-muted-foreground mt-1">L'agente userà questi canali per contattare gli operai e inviare i report.</p>

            <Tabs defaultValue="whatsapp" className="mt-6">
              <TabsList>
                <TabsTrigger value="whatsapp">📱 WhatsApp</TabsTrigger>
                <TabsTrigger value="telegram">✈️ Telegram</TabsTrigger>
              </TabsList>

              <TabsContent value="whatsapp" className="mt-4">
                {waConnected ? (
                  <Card className="border-primary/20">
                    <CardContent className="p-5">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="text-primary" size={20} />
                        <span className="text-[15px] font-bold text-foreground">WhatsApp configurato e attivo</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Il tuo numero WhatsApp Business è già collegato tramite il modulo WhatsApp.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-5">
                      <p className="text-sm text-foreground font-semibold mb-3">WhatsApp non ancora configurato</p>
                      <p className="text-sm text-muted-foreground mb-4">
                        Per utilizzare WhatsApp con questo template, devi prima collegare il tuo numero WhatsApp Business.
                      </p>
                      <Button onClick={() => navigate("/app/whatsapp")} variant="outline">
                        <ExternalLink size={14} className="mr-1" /> Configura WhatsApp
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="telegram" className="mt-4">
                <Card>
                  <CardContent className="p-5 space-y-4">
                    <div className="bg-muted/50 border border-border rounded-lg p-4">
                      <p className="text-sm font-semibold text-foreground mb-2">Come creare il bot (2 minuti):</p>
                      <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                        <li>Apri Telegram e cerca @BotFather</li>
                        <li>Invia /newbot e segui le istruzioni</li>
                        <li>Copia il token API che ti manda BotFather</li>
                        <li>Incollalo qui sotto</li>
                      </ol>
                      <a href="https://t.me/BotFather" target="_blank" rel="noopener noreferrer"
                        className="text-sm text-primary hover:underline mt-2 inline-flex items-center gap-1">
                        Apri @BotFather su Telegram <ExternalLink size={12} />
                      </a>
                    </div>

                    <div>
                      <Label>Token Bot Telegram</Label>
                      <Input
                        type="password"
                        className="mt-1.5"
                        placeholder="123456:ABCdefGHIjklMNOpqrsTUVwxyz"
                        value={telegramToken}
                        onChange={(e) => setTelegramToken(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Nome del bot</Label>
                      <Input
                        className="mt-1.5"
                        placeholder="@MioAgente_bot"
                        value={telegramBotName}
                        onChange={(e) => setTelegramBotName(e.target.value)}
                      />
                    </div>

                    {telegramBotName && (
                      <div className="bg-muted/50 border border-border rounded-lg p-3 text-sm">
                        ⚠️ Gli operai devono prima inviare <code className="bg-muted px-1 rounded">/start</code> al bot Telegram per poter ricevere messaggi. Condividi questo link:
                        <div className="flex items-center gap-2 mt-2">
                          <code className="text-xs bg-muted px-2 py-1 rounded flex-1 overflow-hidden">
                            https://t.me/{telegramBotName.replace("@", "")}?start=cantiere
                          </code>
                          <Button variant="outline" size="sm" onClick={() => {
                            navigator.clipboard.writeText(`https://t.me/${telegramBotName.replace("@", "")}?start=cantiere`);
                            toast.success("Link copiato!");
                          }}>Copia</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* ── STEP 4: Riepilogo & Attiva ─────────────────── */}
        {step === 4 && (
          <div>
            <h2 className="text-2xl font-extrabold text-foreground">Tutto pronto! 🎉</h2>
            <p className="text-sm text-muted-foreground mt-1">Rivedi la configurazione e attiva il tuo agente.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-bold text-foreground mb-3">📋 Configurazione Agente</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Nome agente</span><span className="font-medium text-foreground">{agentName}</span></div>
                    {configValues.nome_azienda && <div className="flex justify-between"><span className="text-muted-foreground">Azienda</span><span className="font-medium text-foreground">{configValues.nome_azienda}</span></div>}
                    {configValues.settore && <div className="flex justify-between"><span className="text-muted-foreground">Settore</span><span className="font-medium text-foreground">{configValues.settore}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">Orario invio</span><span className="font-mono font-medium text-primary">{configValues.orario_invio || "17:30"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Giorni</span><span className="font-medium text-foreground">{(configValues.giorni_attivi as string[])?.join(", ") || "Lun-Sab"}</span></div>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setStep(0)}>Modifica</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-bold text-foreground mb-3">👷 Operai configurati ({activeResponders})</p>
                  <div className="space-y-1 text-sm">
                    {responders.filter((r) => r.name.trim()).slice(0, 5).map((r, i) => (
                      <p key={i} className="text-foreground">{r.name} — <span className="text-muted-foreground">{r.cantiere}</span></p>
                    ))}
                    {activeResponders > 5 && <p className="text-muted-foreground">+ {activeResponders - 5} altri</p>}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setStep(1)}>Modifica</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-bold text-foreground mb-3">📩 Destinatari report</p>
                  <div className="space-y-1 text-sm">
                    {recipients.filter((r) => r.name.trim()).map((r, i) => (
                      <p key={i} className="text-foreground">{r.name} ({r.role}) — {r.channels.join(", ")}</p>
                    ))}
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setStep(2)}>Modifica</Button>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <p className="text-sm font-bold text-foreground mb-3">📱 Canali</p>
                  <div className="space-y-1 text-sm">
                    <p className="text-foreground">{waConnected ? "✅ WhatsApp configurato" : "❌ WhatsApp non configurato"}</p>
                    <p className="text-foreground">{telegramToken ? "✅ Telegram configurato" : "❌ Telegram non configurato"}</p>
                    <p className="text-foreground">✅ Email configurata</p>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-2 text-xs" onClick={() => setStep(3)}>Modifica</Button>
                </CardContent>
              </Card>
            </div>

            {/* Cost Estimate */}
            <Card className="mt-5 border-primary/20">
              <CardContent className="p-5">
                <p className="text-sm font-bold text-foreground mb-3">💰 Stima costi</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Costo giornaliero</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{activeResponders} operai × ~4 min × €{costPerMin.toFixed(2)}/min</p>
                    <p className="text-2xl font-bold text-primary mt-1">~€{dailyCost.toFixed(2)} / sera</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Costo mensile stimato</p>
                    <p className="text-sm text-muted-foreground mt-0.5">22 giorni lavorativi</p>
                    <p className="text-2xl font-bold text-foreground mt-1">~€{monthlyCost.toFixed(2)} / mese</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Crediti disponibili</p>
                    <p className="text-2xl font-bold text-primary mt-1">€{creditInfo?.balance_eur?.toFixed(2) || "0.00"}</p>
                    {dailyCost > 0 && <p className="text-sm text-muted-foreground mt-0.5">≈ {availableNights} sere</p>}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Deploy */}
            {deploying ? (
              <Card className="mt-6">
                <CardContent className="p-6">
                  <p className="text-sm font-bold text-foreground mb-4 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin" /> Stiamo creando il tuo agente...
                  </p>
                  <div className="space-y-3">
                    {deploySteps.map((s, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm">
                        {s.status === "done" && <CheckCircle2 size={16} className="text-primary shrink-0" />}
                        {s.status === "loading" && <Loader2 size={16} className="animate-spin text-primary shrink-0" />}
                        {s.status === "pending" && <Circle size={16} className="text-muted-foreground shrink-0" />}
                        {s.status === "error" && <Circle size={16} className="text-destructive shrink-0" />}
                        <span className={s.status === "done" ? "text-foreground" : s.status === "error" ? "text-destructive" : "text-muted-foreground"}>
                          {s.label}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="mt-8 text-center space-y-3">
                <Button size="lg" className="px-10 py-4 text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-transform" onClick={deploy}>
                  🚀 Attiva Agente
                </Button>
                <div>
                  <Button variant="ghost" onClick={async () => { await saveInstance(); if (telegramToken) await saveTelegramChannel(); toast.success("Bozza salvata"); }}>
                    Salva bozza e attiva dopo
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer nav */}
      {step < 4 && (
        <div className="border-t border-border bg-card px-8 py-4 flex justify-between">
          <Button variant="ghost" onClick={goBack} disabled={step === 0}>
            <ArrowLeft size={16} className="mr-1" /> Indietro
          </Button>
          <Button onClick={goNext} disabled={!canProceed()}>
            Avanti <ArrowRight size={16} className="ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}
