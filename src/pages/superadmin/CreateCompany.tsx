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
  const [form, setForm] = useState({ name: "", sector: "", admin_email: "", admin_password: "", plan: "starter", el_api_key: "" });

  const updateField = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));
  const slug = form.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const canNext = () => { if (step === 0) return form.name && form.admin_email && form.admin_password.length >= 6; return true; };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await supabase.functions.invoke("create-company", { body: { name: form.name, slug, sector: form.sector || null, plan: form.plan, admin_email: form.admin_email, admin_password: form.admin_password, el_api_key: form.el_api_key || null } });
      if (res.error) throw new Error(res.error.message);
      toast({ title: "Azienda creata!", description: `${form.name} è stata creata con successo.` });
      navigate("/superadmin/companies");
    } catch (err: any) { toast({ title: "Errore", description: err.message || "Impossibile creare l'azienda.", variant: "destructive" }); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/superadmin/companies")} className="text-ink-500 hover:text-ink-900 hover:bg-ink-50">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-ink-900">Nuova Azienda</h1>
          <p className="text-sm text-ink-500">Configura una nuova azienda sulla piattaforma</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-2">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center border-2 transition-colors ${i < step ? "bg-brand border-brand text-white" : i === step ? "border-brand bg-brand-light text-brand-text" : "border-ink-200 text-ink-400"}`}>
                {i < step ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className={`text-xs ${i <= step ? "text-ink-900" : "text-ink-400"}`}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-[2px] mx-3 mt-[-20px] ${i < step ? "bg-brand" : "bg-ink-200"}`} />}
          </div>
        ))}
      </div>

      <div className="rounded-card border border-ink-200 bg-white p-6 space-y-5 shadow-card">
        {step === 0 && (
          <>
            <div className="space-y-2">
              <Label className="text-ink-900">Nome Azienda *</Label>
              <Input value={form.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Es. Costruzioni Rossi SRL" className="bg-ink-50 border-ink-200 text-ink-900" />
              {slug && <p className="text-xs text-ink-400">Slug: {slug}</p>}
            </div>
            <div className="space-y-2">
              <Label className="text-ink-900">Settore</Label>
              <div className="flex flex-wrap gap-2">
                {SECTORS.map((s) => (
                  <button key={s} type="button" onClick={() => updateField("sector", form.sector === s ? "" : s)} className={`px-3 py-1.5 rounded-btn text-sm border transition-colors ${form.sector === s ? "border-brand bg-brand-light text-brand-text" : "border-ink-200 text-ink-500 hover:border-ink-400"}`}>{s}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-ink-900">Email Admin *</Label>
                <Input type="email" value={form.admin_email} onChange={(e) => updateField("admin_email", e.target.value)} placeholder="admin@azienda.it" className="bg-ink-50 border-ink-200 text-ink-900" />
              </div>
              <div className="space-y-2">
                <Label className="text-ink-900">Password Temporanea *</Label>
                <Input type="password" value={form.admin_password} onChange={(e) => updateField("admin_password", e.target.value)} placeholder="Min. 6 caratteri" className="bg-ink-50 border-ink-200 text-ink-900" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-ink-900">Piano</Label>
              <div className="grid grid-cols-3 gap-3">
                {PLANS.map((p) => (
                  <button key={p.value} type="button" onClick={() => updateField("plan", p.value)} className={`text-left p-4 rounded-card border-2 transition-all ${form.plan === p.value ? "border-brand bg-brand-light" : "border-ink-200 hover:border-ink-400"}`}>
                    <div className="font-semibold text-ink-900">{p.label}</div>
                    <div className="text-lg font-bold text-brand mt-1">{p.price}</div>
                    <div className="text-xs text-ink-500 mt-1">{p.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-ink-900">ElevenLabs API Key</Label>
              <Input type="password" value={form.el_api_key} onChange={(e) => updateField("el_api_key", e.target.value)} placeholder="xi-..." className="bg-ink-50 border-ink-200 text-ink-900" />
              <p className="text-xs text-ink-400">Opzionale. Puoi configurarla anche in seguito.</p>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-ink-900">Riepilogo</h3>
            <div className="space-y-3 text-sm">
              {[["Nome Azienda", form.name], ["Slug", slug], ["Settore", form.sector || "Non specificato"], ["Piano", PLANS.find((p) => p.value === form.plan)?.label || form.plan], ["Email Admin", form.admin_email], ["ElevenLabs API Key", form.el_api_key ? "••••••••" : "Non configurata"]].map(([label, value]) => (
                <div key={label} className="flex justify-between py-2 border-b border-ink-100">
                  <span className="text-ink-500">{label}</span>
                  <span className="text-ink-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => s - 1)} disabled={step === 0} className="border-ink-200 text-ink-700">
          <ArrowLeft className="mr-2 h-4 w-4" /> Indietro
        </Button>
        {step < 2 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()} className="bg-brand hover:bg-brand-hover text-white">
            Avanti <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="bg-brand hover:bg-brand-hover text-white">
            {submitting ? "Creazione in corso..." : "Crea Azienda"}
            {!submitting && <Check className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>
    </div>
  );
}
