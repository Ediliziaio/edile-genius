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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Phone, Check, Globe, Loader2 } from "lucide-react";

const MOCK_NUMBERS = [
  { number: "+39 02 1234 5678", city: "Milano", type: "local", cost: 5.00 },
  { number: "+39 06 8765 4321", city: "Roma", type: "local", cost: 5.00 },
  { number: "+39 055 234 5678", city: "Firenze", type: "local", cost: 5.00 },
  { number: "+39 011 987 6543", city: "Torino", type: "local", cost: 5.00 },
  { number: "+39 800 123 456", city: "Nazionale", type: "toll-free", cost: 15.00 },
];

interface Agent { id: string; name: string; }

export default function BuyPhoneNumber() {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [country, setCountry] = useState("IT");
  const [numType, setNumType] = useState("local");
  const [selected, setSelected] = useState<typeof MOCK_NUMBERS[0] | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!companyId) return;
    supabase.from("agents").select("id, name").eq("company_id", companyId).then(({ data }) => {
      if (data) setAgents(data as Agent[]);
    });
  }, [companyId]);

  const filteredNumbers = MOCK_NUMBERS.filter(n => n.type === numType);

  const handleConfirm = async () => {
    if (!selected || !companyId) return;
    setSaving(true);
    try {
      await supabase.from("ai_phone_numbers").insert({
        company_id: companyId,
        phone_number: selected.number.replace(/\s/g, ""),
        label: selected.city,
        country_code: country,
        agent_id: selectedAgent || null,
        monthly_cost: selected.cost,
        provider: "twilio",
        status: "active",
      } as any);
      toast({ title: "Numero acquistato!", description: `${selected.number} è stato attivato.` });
      navigate("/app/phone-numbers");
    } catch {
      toast({ variant: "destructive", title: "Errore" });
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
          <h1 className="text-2xl font-bold text-ink-900">Acquista Numero</h1>
          <p className="text-sm text-ink-500">Step {step} di 3</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex gap-2">
        {[1, 2, 3].map(s => (
          <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? "bg-brand" : "bg-ink-100"}`} />
        ))}
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <Card className="border border-ink-200 shadow-card">
          <CardHeader>
            <CardTitle>Paese e Tipo</CardTitle>
            <CardDescription>Scegli il paese e il tipo di numero</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Paese</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="IT">🇮🇹 Italia</SelectItem>
                  <SelectItem value="DE">🇩🇪 Germania</SelectItem>
                  <SelectItem value="FR">🇫🇷 Francia</SelectItem>
                  <SelectItem value="ES">🇪🇸 Spagna</SelectItem>
                  <SelectItem value="UK">🇬🇧 Regno Unito</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo numero</Label>
              <div className="grid grid-cols-2 gap-3">
                {[{ v: "local", l: "Locale", d: "Numero con prefisso città" }, { v: "toll-free", l: "Numero Verde", d: "800/900 gratuito per chi chiama" }].map(t => (
                  <Card key={t.v} className={`cursor-pointer transition-all ${numType === t.v ? "border-2 border-brand bg-brand-light" : "border border-ink-200 hover:border-ink-300"}`} onClick={() => setNumType(t.v)}>
                    <CardContent className="p-4">
                      <p className="font-semibold text-sm text-ink-900">{t.l}</p>
                      <p className="text-xs text-ink-500 mt-1">{t.d}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
            <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={() => setStep(2)}>
              Avanti <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <Card className="border border-ink-200 shadow-card">
          <CardHeader>
            <CardTitle>Scegli un Numero</CardTitle>
            <CardDescription>Numeri disponibili per {country}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {filteredNumbers.map((n, i) => (
              <div key={i} onClick={() => setSelected(n)} className={`flex items-center justify-between p-4 rounded-btn border-2 cursor-pointer transition-all ${selected?.number === n.number ? "border-brand bg-brand-light" : "border-ink-200 hover:border-ink-300"}`}>
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-ink-400" />
                  <div>
                    <p className="font-mono font-semibold text-ink-900">{n.number}</p>
                    <p className="text-xs text-ink-500">{n.city}</p>
                  </div>
                </div>
                <span className="text-sm font-semibold text-ink-700">€{n.cost.toFixed(2)}/mese</span>
              </div>
            ))}
            <Button className="w-full bg-brand hover:bg-brand-hover text-white" disabled={!selected} onClick={() => setStep(3)}>
              Avanti <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 3 */}
      {step === 3 && selected && (
        <Card className="border border-ink-200 shadow-card">
          <CardHeader>
            <CardTitle>Conferma e Collega</CardTitle>
            <CardDescription>Collega il numero a un agente (opzionale)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Card className="bg-ink-50 border border-ink-200">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between"><span className="text-sm text-ink-500">Numero:</span><span className="font-mono font-semibold">{selected.number}</span></div>
                <div className="flex justify-between"><span className="text-sm text-ink-500">Città:</span><span>{selected.city}</span></div>
                <div className="flex justify-between"><span className="text-sm text-ink-500">Costo mensile:</span><span className="font-semibold">€{selected.cost.toFixed(2)}</span></div>
              </CardContent>
            </Card>

            <div className="space-y-2">
              <Label>Collega ad agente (opzionale)</Label>
              <Select value={selectedAgent} onValueChange={setSelectedAgent}>
                <SelectTrigger><SelectValue placeholder="Nessun agente" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nessun agente</SelectItem>
                  {agents.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <Button className="w-full bg-brand hover:bg-brand-hover text-white" onClick={handleConfirm} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
              Conferma Acquisto
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
