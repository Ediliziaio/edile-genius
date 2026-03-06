import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Building2, Key, ClipboardList } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const STEPS = [
  { label: "Informazioni Azienda", icon: Building2 },
  { label: "Configurazione API", icon: Key },
  { label: "Riepilogo", icon: ClipboardList },
];

const PLANS = [
  { value: "starter", label: "Starter", price: "€49/mese", desc: "1 agente, 100 chiamate/mese" },
  { value: "professional", label: "Professional", price: "€149/mese", desc: "5 agenti, 1.000 chiamate/mese" },
  { value: "enterprise", label: "Enterprise", price: "€499/mese", desc: "Agenti illimitati, chiamate illimitate" },
];

const SECTORS = ["Edilizia", "Immobiliare", "Assicurazioni", "Automotive", "Sanità", "Servizi", "Altro"];

export default function CreateCompany() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    sector: "",
    admin_email: "",
    admin_password: "",
    plan: "starter",
    elevenlabs_api_key: "",
  });

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const slug = form.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const canNext = () => {
    if (step === 0) return form.name && form.admin_email && form.admin_password.length >= 6;
    if (step === 1) return true; // API key is optional
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      const res = await supabase.functions.invoke("create-company", {
        body: {
          name: form.name,
          slug,
          sector: form.sector || null,
          plan: form.plan,
          admin_email: form.admin_email,
          admin_password: form.admin_password,
          elevenlabs_api_key: form.elevenlabs_api_key || null,
        },
      });

      if (res.error) throw new Error(res.error.message);

      toast({
        title: "Azienda creata!",
        description: `${form.name} è stata creata con successo.`,
      });
      navigate("/superadmin/companies");
    } catch (err: any) {
      toast({
        title: "Errore",
        description: err.message || "Impossibile creare l'azienda.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/superadmin/companies")}
          className="text-[hsl(var(--app-text-secondary))] hover:text-[hsl(var(--app-text-primary))]"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[hsl(var(--app-text-primary))]">Nuova Azienda</h1>
          <p className="text-sm text-[hsl(var(--app-text-secondary))]">Configura una nuova azienda sulla piattaforma</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2">
              <div
                className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${
                  i < step
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : i === step
                    ? "border-[hsl(var(--app-accent))] bg-[hsl(var(--app-accent))]/20 text-[hsl(var(--app-accent))]"
                    : "border-[hsl(var(--app-border))] text-[hsl(var(--app-text-secondary))]"
                }`}
              >
                {i < step ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs ${i <= step ? "text-[hsl(var(--app-text-primary))]" : "text-[hsl(var(--app-text-secondary))]"}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-[2px] mx-3 mt-[-20px] ${i < step ? "bg-emerald-500" : "bg-[hsl(var(--app-border))]"}`} />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="rounded-xl border border-[hsl(var(--app-border))] bg-[hsl(var(--app-secondary))] p-6 space-y-5">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-primary))]">Nome Azienda *</Label>
              <Input
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="Es. Costruzioni Rossi SRL"
                className="bg-[hsl(var(--app-primary))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]"
              />
              {slug && <p className="text-xs text-[hsl(var(--app-text-secondary))]">Slug: {slug}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-primary))]">Settore</Label>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => updateField("sector", form.sector === s ? "" : s)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      form.sector === s
                        ? "border-[hsl(var(--app-accent))] bg-[hsl(var(--app-accent))]/20 text-[hsl(var(--app-accent))]"
                        : "border-[hsl(var(--app-border))] text-[hsl(var(--app-text-secondary))] hover:border-[hsl(var(--app-text-secondary))]"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[hsl(var(--app-text-primary))]">Email Admin *</Label>
                <Input
                  type="email"
                  value={form.admin_email}
                  onChange={(e) => updateField("admin_email", e.target.value)}
                  placeholder="admin@azienda.it"
                  className="bg-[hsl(var(--app-primary))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[hsl(var(--app-text-primary))]">Password Temporanea *</Label>
                <Input
                  type="password"
                  value={form.admin_password}
                  onChange={(e) => updateField("admin_password", e.target.value)}
                  placeholder="Min. 6 caratteri"
                  className="bg-[hsl(var(--app-primary))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-primary))]">Piano</Label>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map((p) => (
                  <button
                    key={p.value}
                    type="button"
                    onClick={() => updateField("plan", p.value)}
                    className={`text-left p-4 rounded-xl border-2 transition-all ${
                      form.plan === p.value
                        ? "border-[hsl(var(--app-accent))] bg-[hsl(var(--app-accent))]/10"
                        : "border-[hsl(var(--app-border))] hover:border-[hsl(var(--app-text-secondary))]"
                    }`}
                  >
                    <div className="font-semibold text-[hsl(var(--app-text-primary))]">{p.label}</div>
                    <div className="text-lg font-bold text-[hsl(var(--app-accent))] mt-1">{p.price}</div>
                    <div className="text-xs text-[hsl(var(--app-text-secondary))] mt-1">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[hsl(var(--app-text-primary))]">ElevenLabs API Key</Label>
              <Input
                type="password"
                value={form.elevenlabs_api_key}
                onChange={(e) => updateField("elevenlabs_api_key", e.target.value)}
                placeholder="xi-..."
                className="bg-[hsl(var(--app-primary))] border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]"
              />
              <p className="text-xs text-[hsl(var(--app-text-secondary))]">
                Opzionale. Puoi configurarla anche in seguito.
              </p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-[hsl(var(--app-text-primary))]">Riepilogo</h3>
            <div className="space-y-3 text-sm">
              {[
                ["Nome Azienda", form.name],
                ["Slug", slug],
                ["Settore", form.sector || "Non specificato"],
                ["Piano", PLANS.find((p) => p.value === form.plan)?.label || form.plan],
                ["Email Admin", form.admin_email],
                ["ElevenLabs API Key", form.elevenlabs_api_key ? "••••••••" : "Non configurata"],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-[hsl(var(--app-border))]">
                  <span className="text-[hsl(var(--app-text-secondary))]">{label}</span>
                  <span className="text-[hsl(var(--app-text-primary))] font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
          className="border-[hsl(var(--app-border))] text-[hsl(var(--app-text-primary))]"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
        </Button>
        {step < 2 ? (
          <Button
            onClick={() => setStep((s) => s + 1)}
            disabled={!canNext()}
            className="bg-[hsl(var(--app-accent))] hover:bg-[hsl(var(--app-accent))]/90 text-white"
          >
            Avanti <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            {submitting ? "Creazione in corso..." : "Crea Azienda"}
            {!submitting && <Check className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
