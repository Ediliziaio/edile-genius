import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCompanyId } from "@/hooks/useCompanyId";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Building2, HardHat, Users, CheckCircle2, ArrowRight, Loader2, Sparkles } from "lucide-react";

interface Step1Data {
  nome_azienda: string;
  partita_iva: string;
  indirizzo: string;
}

interface Step2Data {
  nome_cantiere: string;
  indirizzo_cantiere: string;
  data_inizio: string;
  data_fine_prevista: string;
  responsabile: string;
}

interface Step3Data {
  nome_operaio: string;
  cognome_operaio: string;
  telefono_operaio: string;
}

const STEPS = [
  { icon: Building2, label: "Azienda" },
  { icon: HardHat, label: "Cantiere" },
  { icon: Users, label: "Squadra" },
];

export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [seedingDemo, setSeedingDemo] = useState(false);

  const [step1, setStep1] = useState<Step1Data>({ nome_azienda: "", partita_iva: "", indirizzo: "" });
  const [step2, setStep2] = useState<Step2Data>({ nome_cantiere: "", indirizzo_cantiere: "", data_inizio: "", data_fine_prevista: "", responsabile: "" });
  const [step3, setStep3] = useState<Step3Data>({ nome_operaio: "", cognome_operaio: "", telefono_operaio: "" });
  const [cantiereId, setCantiereId] = useState<string | null>(null);

  const completeOnboarding = async () => {
    if (!user) return;
    await supabase.from("profiles" as any).update({ onboarding_completed: true }).eq("id", user.id);
    navigate("/app", { replace: true });
  };

  const handleStep1 = async () => {
    if (!step1.nome_azienda.trim()) {
      toast({ title: "Inserisci il nome dell'azienda", variant: "destructive" });
      return;
    }
    if (!companyId) return;
    setLoading(true);
    try {
      await supabase.from("companies").update({
        name: step1.nome_azienda,
        vat_number: step1.partita_iva || null,
        address: step1.indirizzo || null,
      } as any).eq("id", companyId);
      setCurrentStep(1);
    } catch (err) {
      toast({ title: "Errore nel salvataggio", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async () => {
    if (!step2.nome_cantiere.trim()) {
      toast({ title: "Inserisci il nome del cantiere", variant: "destructive" });
      return;
    }
    if (!companyId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from("cantieri").insert({
        company_id: companyId,
        nome: step2.nome_cantiere,
        indirizzo: step2.indirizzo_cantiere || null,
        data_inizio: step2.data_inizio || null,
        data_fine_prevista: step2.data_fine_prevista || null,
        responsabile: step2.responsabile || null,
        stato: "attivo",
      }).select("id").single();
      if (error) throw error;
      setCantiereId(data.id);
      setCurrentStep(2);
    } catch (err) {
      toast({ title: "Errore nella creazione del cantiere", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleStep3AddWorker = async () => {
    if (!step3.nome_operaio.trim()) {
      toast({ title: "Inserisci il nome dell'operaio", variant: "destructive" });
      return;
    }
    if (!companyId) return;
    setLoading(true);
    try {
      await supabase.from("cantiere_operai").insert({
        company_id: companyId,
        cantiere_id: cantiereId,
        nome: step3.nome_operaio,
        cognome: step3.cognome_operaio || null,
        telefono: step3.telefono_operaio || null,
        attivo: true,
      });
      toast({ title: "Operaio aggiunto!" });
      await completeOnboarding();
    } catch (err) {
      toast({ title: "Errore", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleSeedDemo = async () => {
    setSeedingDemo(true);
    try {
      const { error } = await supabase.functions.invoke("seed-demo-data");
      if (error) throw error;
      toast({ title: "Dati demo caricati con successo!" });
      await completeOnboarding();
    } catch {
      toast({ title: "Errore nel caricamento dei dati demo", variant: "destructive" });
      setSeedingDemo(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-10">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          const done = i < currentStep;
          const active = i === currentStep;
          return (
            <div key={i} className="flex items-center gap-2">
              {i > 0 && <div className={`w-10 h-0.5 ${done ? "bg-primary" : "bg-muted"}`} />}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${active ? "bg-primary text-primary-foreground" : done ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                {done ? <CheckCircle2 className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step 1 */}
      {currentStep === 0 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Configura la tua azienda</h1>
            <p className="text-muted-foreground">Iniziamo con le informazioni base della tua impresa.</p>
          </div>
          <div className="space-y-4 bg-card border border-border rounded-xl p-6">
            <div className="space-y-2">
              <Label>Nome azienda *</Label>
              <Input value={step1.nome_azienda} onChange={e => setStep1(p => ({ ...p, nome_azienda: e.target.value }))} placeholder="Es. Edil Rossi Srl" />
            </div>
            <div className="space-y-2">
              <Label>Partita IVA</Label>
              <Input value={step1.partita_iva} onChange={e => setStep1(p => ({ ...p, partita_iva: e.target.value }))} placeholder="IT01234567890" />
            </div>
            <div className="space-y-2">
              <Label>Indirizzo sede</Label>
              <Input value={step1.indirizzo} onChange={e => setStep1(p => ({ ...p, indirizzo: e.target.value }))} placeholder="Via Roma 1, Milano" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleStep1} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Avanti
            </Button>
          </div>
        </div>
      )}

      {/* Step 2 */}
      {currentStep === 1 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Crea il tuo primo cantiere</h1>
            <p className="text-muted-foreground">Aggiungi il primo cantiere per iniziare a gestire i report.</p>
          </div>
          <div className="space-y-4 bg-card border border-border rounded-xl p-6">
            <div className="space-y-2">
              <Label>Nome cantiere *</Label>
              <Input value={step2.nome_cantiere} onChange={e => setStep2(p => ({ ...p, nome_cantiere: e.target.value }))} placeholder="Es. Ristrutturazione Via Roma 12" />
            </div>
            <div className="space-y-2">
              <Label>Indirizzo cantiere</Label>
              <Input value={step2.indirizzo_cantiere} onChange={e => setStep2(p => ({ ...p, indirizzo_cantiere: e.target.value }))} placeholder="Via Roma 12, Milano" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data inizio</Label>
                <Input type="date" value={step2.data_inizio} onChange={e => setStep2(p => ({ ...p, data_inizio: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Data fine prevista</Label>
                <Input type="date" value={step2.data_fine_prevista} onChange={e => setStep2(p => ({ ...p, data_fine_prevista: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Responsabile cantiere</Label>
              <Input value={step2.responsabile} onChange={e => setStep2(p => ({ ...p, responsabile: e.target.value }))} placeholder="Nome del responsabile" />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleStep2} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
              Crea cantiere
            </Button>
          </div>
        </div>
      )}

      {/* Step 3 */}
      {currentStep === 2 && (
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold text-foreground">Invita il primo operaio</h1>
            <p className="text-muted-foreground">Aggiungi un membro della squadra al cantiere appena creato.</p>
          </div>
          <div className="space-y-4 bg-card border border-border rounded-xl p-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input value={step3.nome_operaio} onChange={e => setStep3(p => ({ ...p, nome_operaio: e.target.value }))} placeholder="Marco" />
              </div>
              <div className="space-y-2">
                <Label>Cognome</Label>
                <Input value={step3.cognome_operaio} onChange={e => setStep3(p => ({ ...p, cognome_operaio: e.target.value }))} placeholder="Ferretti" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Telefono</Label>
              <Input value={step3.telefono_operaio} onChange={e => setStep3(p => ({ ...p, telefono_operaio: e.target.value }))} placeholder="+39 333 1234567" />
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button variant="ghost" onClick={completeOnboarding} className="text-muted-foreground">
                Fallo dopo
              </Button>
              <Button variant="outline" onClick={handleSeedDemo} disabled={seedingDemo} className="gap-2">
                {seedingDemo ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                Carica dati demo
              </Button>
            </div>
            <Button onClick={handleStep3AddWorker} disabled={loading} className="gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              Aggiungi e vai alla dashboard
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
