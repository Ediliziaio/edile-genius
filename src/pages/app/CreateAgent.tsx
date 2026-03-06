import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Check, Mic, Settings, FileText, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import UseCaseSelector from "@/components/agents/UseCaseSelector";
import VoicePicker from "@/components/agents/VoicePicker";
import { PROMPT_TEMPLATES, SECTORS, LANGUAGES, type UseCaseId } from "@/components/agents/PromptTemplates";

const STEPS = [
  { label: "Tipo", icon: Mic },
  { label: "Configurazione", icon: Settings },
  { label: "Prompt", icon: FileText },
  { label: "Riepilogo", icon: Send },
];

interface AgentForm {
  use_case: UseCaseId | null;
  name: string;
  description: string;
  sector: string;
  language: string;
  voice_id: string;
  system_prompt: string;
  first_message: string;
  temperature: number;
  status: "active" | "draft";
}

const defaultForm: AgentForm = {
  use_case: null,
  name: "",
  description: "",
  sector: "",
  language: "it",
  voice_id: "",
  system_prompt: "",
  first_message: "",
  temperature: 0.7,
  status: "draft",
};

export default function CreateAgent() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<AgentForm>(defaultForm);

  const companyId = profile?.company_id;

  const update = <K extends keyof AgentForm>(key: K, value: AgentForm[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
  };

  const selectUseCase = (id: UseCaseId) => {
    const template = PROMPT_TEMPLATES[id];
    setForm((f) => ({
      ...f,
      use_case: id,
      system_prompt: f.system_prompt || template.system_prompt,
      first_message: f.first_message || template.first_message,
    }));
  };

  const canNext = () => {
    if (step === 0) return !!form.use_case;
    if (step === 1) return !!form.name;
    if (step === 2) return !!form.system_prompt;
    return true;
  };

  const handleSubmit = async () => {
    if (!companyId) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-elevenlabs-agent", {
        body: {
          company_id: companyId,
          name: form.name,
          description: form.description,
          use_case: form.use_case,
          sector: form.sector,
          language: form.language,
          voice_id: form.voice_id,
          system_prompt: form.system_prompt,
          first_message: form.first_message,
          status: form.status,
          config: { temperature: form.temperature },
        },
      });
      if (error || data?.error) throw new Error(data?.error || "Errore creazione agente");
      toast({ title: "Agente creato!", description: `${form.name} è stato creato con successo.` });
      navigate("/app/agents");
    } catch (e: any) {
      toast({ title: "Errore", description: e.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/app/agents")} className="p-2 rounded-lg" style={{ backgroundColor: "hsl(var(--app-bg-tertiary))" }}>
          <ArrowLeft className="w-4 h-4" style={{ color: "hsl(var(--app-text-secondary))" }} />
        </button>
        <h1 className="text-xl font-bold" style={{ color: "hsl(var(--app-text-primary))" }}>Crea Agente</h1>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center gap-2 flex-1">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                backgroundColor: i <= step ? "hsl(var(--app-brand))" : "hsl(var(--app-bg-tertiary))",
                color: i <= step ? "#fff" : "hsl(var(--app-text-tertiary))",
              }}
            >
              {i < step ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className="text-xs hidden sm:inline" style={{ color: i <= step ? "hsl(var(--app-text-primary))" : "hsl(var(--app-text-tertiary))" }}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && (
              <div className="flex-1 h-px" style={{ backgroundColor: i < step ? "hsl(var(--app-brand))" : "hsl(var(--app-border-subtle))" }} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl p-6 border" style={{ backgroundColor: "hsl(var(--app-bg-secondary))", borderColor: "hsl(var(--app-border-subtle))" }}>
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold mb-1" style={{ color: "hsl(var(--app-text-primary))" }}>Tipo di Agente</h2>
              <p className="text-sm mb-4" style={{ color: "hsl(var(--app-text-secondary))" }}>Seleziona il caso d'uso per il tuo agente vocale.</p>
            </div>
            <div className="rounded-lg p-3 mb-4 flex items-center gap-3" style={{ backgroundColor: "hsl(var(--app-brand-dim))" }}>
              <Mic className="w-5 h-5" style={{ color: "hsl(var(--app-brand))" }} />
              <div>
                <p className="text-sm font-medium" style={{ color: "hsl(var(--app-text-primary))" }}>Agente Vocale</p>
                <p className="text-xs" style={{ color: "hsl(var(--app-text-secondary))" }}>Gestisce chiamate telefoniche con voce AI</p>
              </div>
            </div>
            <UseCaseSelector selected={form.use_case} onSelect={selectUseCase} />
          </div>
        )}

        {step === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "hsl(var(--app-text-primary))" }}>Configurazione</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--app-text-secondary))" }}>Nome agente *</label>
                <Input value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="Es. Assistente Vendite"
                  className="border-0" style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }} />
              </div>
              <div>
                <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--app-text-secondary))" }}>Descrizione</label>
                <Textarea value={form.description} onChange={(e) => update("description", e.target.value)} placeholder="Breve descrizione dell'agente..."
                  className="border-0 min-h-[80px]" style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--app-text-secondary))" }}>Settore</label>
                  <Select value={form.sector} onValueChange={(v) => update("sector", v)}>
                    <SelectTrigger className="border-0" style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}>
                      <SelectValue placeholder="Seleziona settore" />
                    </SelectTrigger>
                    <SelectContent>
                      {SECTORS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--app-text-secondary))" }}>Lingua</label>
                  <Select value={form.language} onValueChange={(v) => update("language", v)}>
                    <SelectTrigger className="border-0" style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {companyId && (
                <div>
                  <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--app-text-secondary))" }}>Voce</label>
                  <VoicePicker companyId={companyId} selected={form.voice_id || null} onSelect={(v) => update("voice_id", v)} />
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "hsl(var(--app-text-primary))" }}>Prompt & Impostazioni</h2>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--app-text-secondary))" }}>System Prompt *</label>
              <Textarea
                value={form.system_prompt}
                onChange={(e) => update("system_prompt", e.target.value)}
                className="border-0 font-mono-brand min-h-[200px] text-xs"
                style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--app-text-secondary))" }}>Primo Messaggio</label>
              <Textarea
                value={form.first_message}
                onChange={(e) => update("first_message", e.target.value)}
                className="border-0 min-h-[80px] text-sm"
                style={{ backgroundColor: "hsl(var(--app-bg-input))", color: "hsl(var(--app-text-primary))" }}
              />
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: "hsl(var(--app-text-secondary))" }}>
                Temperatura: {form.temperature.toFixed(1)}
              </label>
              <Slider value={[form.temperature]} onValueChange={([v]) => update("temperature", v)} min={0} max={1} step={0.1} className="mt-2" />
              <div className="flex justify-between text-[10px] mt-1" style={{ color: "hsl(var(--app-text-tertiary))" }}>
                <span>Preciso</span><span>Creativo</span>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-semibold" style={{ color: "hsl(var(--app-text-primary))" }}>Riepilogo</h2>
            <div className="space-y-3 text-sm">
              {[
                ["Nome", form.name],
                ["Caso d'uso", form.use_case],
                ["Settore", form.sector || "—"],
                ["Lingua", LANGUAGES.find((l) => l.value === form.language)?.label || form.language],
                ["Voce", form.voice_id ? `ID: ${form.voice_id.slice(0, 12)}…` : "Non selezionata"],
                ["Temperatura", form.temperature.toFixed(1)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-2 border-b" style={{ borderColor: "hsl(var(--app-border-subtle))" }}>
                  <span style={{ color: "hsl(var(--app-text-secondary))" }}>{k}</span>
                  <span style={{ color: "hsl(var(--app-text-primary))" }}>{v}</span>
                </div>
              ))}
            </div>
            <div>
              <label className="text-xs font-medium mb-2 block" style={{ color: "hsl(var(--app-text-secondary))" }}>Modalità pubblicazione</label>
              <div className="flex gap-3">
                {(["draft", "active"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => update("status", s)}
                    className="flex-1 py-3 rounded-lg text-sm font-medium border transition-all"
                    style={{
                      backgroundColor: form.status === s ? "hsl(var(--app-brand-dim))" : "hsl(var(--app-bg-tertiary))",
                      borderColor: form.status === s ? "hsl(var(--app-brand))" : "transparent",
                      color: form.status === s ? "hsl(var(--app-brand))" : "hsl(var(--app-text-secondary))",
                    }}
                  >
                    {s === "draft" ? "🔒 Bozza" : "🟢 Attivo"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          className="px-4 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30"
          style={{ backgroundColor: "hsl(var(--app-bg-tertiary))", color: "hsl(var(--app-text-secondary))" }}
        >
          Indietro
        </button>
        {step < 3 ? (
          <button
            onClick={() => canNext() && setStep(step + 1)}
            disabled={!canNext()}
            className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-30"
            style={{ backgroundColor: "hsl(var(--app-brand))", color: "#fff" }}
          >
            Avanti
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{ backgroundColor: "hsl(var(--app-brand))", color: "#fff" }}
          >
            {submitting ? "Creazione..." : "Crea Agente"}
          </button>
        )}
      </div>
    </div>
  );
}
