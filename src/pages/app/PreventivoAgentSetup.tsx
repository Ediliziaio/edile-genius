import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useCompanyId } from "@/hooks/useCompanyId";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft, ArrowRight, CheckCircle, FileText, Upload,
  Zap, MessageSquare, Loader2, ExternalLink, BookOpen,
  Settings2, Sparkles
} from "lucide-react";
import KnowledgeBaseManager from "@/components/preventivo/KnowledgeBaseManager";

/* ─── Step indicator ─────────────────────────────────────── */
const STEPS = [
  { id: 1, label: "Info azienda",    icon: Settings2 },
  { id: 2, label: "Knowledge Base",  icon: BookOpen },
  { id: 3, label: "Canale",          icon: MessageSquare },
  { id: 4, label: "Attiva",          icon: Sparkles },
];

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done = s.id < current;
        const active = s.id === current;
        return (
          <div key={s.id} className="flex items-center flex-1 last:flex-none">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all
              ${active ? "bg-primary text-primary-foreground shadow" : done ? "text-primary" : "text-muted-foreground"}`}>
              {done
                ? <CheckCircle className="h-4 w-4 shrink-0" />
                : <Icon className="h-4 w-4 shrink-0" />}
              <span className="hidden sm:inline">{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-0.5 flex-1 mx-1 ${done ? "bg-primary" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────── */
export default function PreventivoAgentSetup() {
  const navigate = useNavigate();
  const companyId = useCompanyId();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);

  // Step 1 — Info azienda
  const [nomeImpresa, setNomeImpresa]       = useState("");
  const [settore, setSettore]               = useState("ristrutturazioni");
  const [ivaPerc, setIvaPerc]               = useState("22");
  const [validitaGiorni, setValiditaGiorni] = useState("30");
  const [noteStandard, setNoteStandard]     = useState("");
  const [titoloOfferta, setTitoloOfferta]   = useState("Offerta commerciale");

  // Step 3 — Canale
  const [canale, setCanale] = useState<"whatsapp" | "telegram">("whatsapp");

  /* ── helpers ── */
  const next = () => setStep((s) => Math.min(s + 1, 4));
  const back = () => setStep((s) => Math.max(s - 1, 1));

  const canProceed1 = nomeImpresa.trim().length >= 2;

  /* ── Step 4: salva agente ── */
  const handleActivate = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      // Salva le impostazioni agente preventivo nella tabella agents
      const { error } = await supabase.from("agents").insert({
        company_id: companyId,
        name: "Preventivo AI — " + nomeImpresa,
        type: canale === "whatsapp" ? "whatsapp" : "telegram",
        status: "active",
        description: `Genera preventivi automaticamente da audio o testo via ${canale === "whatsapp" ? "WhatsApp" : "Telegram"}.`,
        prompt: buildPrompt(),
        config: {
          settore,
          iva_percentuale: parseFloat(ivaPerc),
          validita_giorni: parseInt(validitaGiorni),
          note_standard: noteStandard,
          titolo_offerta: titoloOfferta,
          canale,
          template_slug: "preventivo-whatsapp-ai",
        } as any,
      } as any);

      if (error) throw error;

      toast({
        title: "✅ Agente Preventivo attivato!",
        description: "Puoi ora inviare audio o testo per generare preventivi automatici.",
      });

      // Porta l'utente all'hub preventivi
      navigate("/app/preventivo-hub");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  function buildPrompt(): string {
    return `Sei un assistente AI specializzato in preventivi per ${nomeImpresa}, un'impresa di ${settore}.

Quando ricevi un messaggio (audio trascritto o testo), devi:
1. Analizzare la richiesta del cliente
2. Identificare i lavori richiesti, le superfici, i materiali
3. Cercare prezzi e prodotti nella Knowledge Base aziendale
4. Generare un preventivo dettagliato e professionale

Parametri di default:
- IVA: ${ivaPerc}%
- Validità offerta: ${validitaGiorni} giorni
- Titolo: ${titoloOfferta}
${noteStandard ? `- Note standard: ${noteStandard}` : ""}

Usa sempre un tono professionale e cortese. Se mancano informazioni, chiedi i dettagli necessari prima di procedere.`;
  }

  /* ─── RENDER ─── */
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Configura Agente Preventivi AI
          </h1>
          <p className="text-sm text-muted-foreground">
            L'AI ascolta audio o testo e genera preventivi professionali in secondi
          </p>
        </div>
      </div>

      <StepBar current={step} />

      {/* ── STEP 1: Info azienda ── */}
      {step === 1 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Informazioni azienda</h2>
              <p className="text-sm text-muted-foreground">
                Questi dati vengono usati dall'AI per contestualizzare i preventivi
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <Label>Nome impresa *</Label>
                <Input
                  value={nomeImpresa}
                  onChange={e => setNomeImpresa(e.target.value)}
                  placeholder="Es. Rossi Ristrutturazioni srl"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Settore principale</Label>
                <Select value={settore} onValueChange={setSettore}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ristrutturazioni">Ristrutturazioni</SelectItem>
                    <SelectItem value="impianti_idraulici">Impianti idraulici</SelectItem>
                    <SelectItem value="impianti_elettrici">Impianti elettrici</SelectItem>
                    <SelectItem value="infissi_serramenti">Infissi e serramenti</SelectItem>
                    <SelectItem value="pavimenti_rivestimenti">Pavimenti e rivestimenti</SelectItem>
                    <SelectItem value="costruzioni">Costruzioni edili</SelectItem>
                    <SelectItem value="isolamento_facciate">Isolamento e facciate</SelectItem>
                    <SelectItem value="tetti_coperture">Tetti e coperture</SelectItem>
                    <SelectItem value="altro">Altro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Titolo offerta</Label>
                <Input
                  value={titoloOfferta}
                  onChange={e => setTitoloOfferta(e.target.value)}
                  placeholder="Es. Offerta commerciale"
                />
              </div>

              <div className="space-y-1.5">
                <Label>IVA (%)</Label>
                <Select value={ivaPerc} onValueChange={setIvaPerc}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="4">4% — Agevolata prima casa</SelectItem>
                    <SelectItem value="10">10% — Manutenzione ordinaria</SelectItem>
                    <SelectItem value="22">22% — Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Validità preventivo (giorni)</Label>
                <Select value={validitaGiorni} onValueChange={setValiditaGiorni}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 giorni</SelectItem>
                    <SelectItem value="30">30 giorni</SelectItem>
                    <SelectItem value="60">60 giorni</SelectItem>
                    <SelectItem value="90">90 giorni</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <Label>Note standard in calce al preventivo</Label>
                <Textarea
                  value={noteStandard}
                  onChange={e => setNoteStandard(e.target.value)}
                  placeholder="Es. I prezzi si intendono IVA esclusa. Validità offerta 30 giorni dalla data di emissione..."
                  rows={3}
                  className="resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button onClick={next} disabled={!canProceed1}>
                Avanti <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 2: Knowledge Base ── */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Knowledge Base — Materiali & Listini</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Carica i tuoi listini prezzi, schede prodotto e cataloghi.
                    L'AI li leggerà automaticamente per generare preventivi accurati con i tuoi prezzi reali.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["Listini prezzi PDF", "Schede prodotto", "Cataloghi fornitori", "Tariffari lavorazioni"].map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">
                        <Upload className="h-3 w-3 mr-1" />{t}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reuse del componente esistente */}
          <KnowledgeBaseManager />

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>
            <Button onClick={next}>
              Avanti <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ── STEP 3: Canale ── */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Scegli il canale</h2>
              <p className="text-sm text-muted-foreground">
                Dove riceverai le richieste di preventivo dai tuoi clienti o collaboratori?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: "whatsapp" as const,
                  label: "WhatsApp",
                  emoji: "💬",
                  desc: "Il cliente manda un messaggio o vocale su WhatsApp. L'AI genera il preventivo e lo invia come PDF.",
                  badge: "Consigliato",
                },
                {
                  id: "telegram" as const,
                  label: "Telegram",
                  emoji: "✈️",
                  desc: "Funziona via bot Telegram. Ideale se preferisci Telegram per comunicare con clienti o team.",
                  badge: null,
                },
              ].map(ch => (
                <Card
                  key={ch.id}
                  className={`cursor-pointer transition-all ${canale === ch.id ? "border-2 border-primary bg-primary/5" : "border hover:shadow-md"}`}
                  onClick={() => setCanale(ch.id)}
                >
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ch.emoji}</span>
                      <p className="font-semibold">{ch.label}</p>
                      {ch.badge && (
                        <Badge className="bg-primary/10 text-primary border-0 text-xs ml-auto">{ch.badge}</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{ch.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info configurazione canale */}
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Settings2 className="h-4 w-4" />
                  Come si collega {canale === "whatsapp" ? "WhatsApp" : "Telegram"}?
                </p>
                <p className="text-xs text-muted-foreground">
                  {canale === "whatsapp"
                    ? "Dopo l'attivazione vai in Impostazioni → WhatsApp e collega il numero via Meta Business o scansiona il QR code."
                    : "Dopo l'attivazione crea un bot su @BotFather su Telegram e incolla il token nelle Impostazioni → Integrazioni."}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs"
                  onClick={() => navigate(canale === "whatsapp" ? "/app/integrazioni" : "/app/integrazioni")}
                >
                  Vai alle impostazioni <ExternalLink className="h-3 w-3 ml-1" />
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={back}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Indietro
              </Button>
              <Button onClick={next}>
                Avanti <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── STEP 4: Attiva ── */}
      {step === 4 && (
        <div className="space-y-4">
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Tutto pronto!</h2>
                  <p className="text-sm text-muted-foreground">Riepilogo configurazione agente</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {[
                  ["Impresa", nomeImpresa],
                  ["Settore", settore.replace(/_/g, " ")],
                  ["IVA", `${ivaPerc}%`],
                  ["Validità preventivo", `${validitaGiorni} giorni`],
                  ["Canale", canale === "whatsapp" ? "💬 WhatsApp" : "✈️ Telegram"],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between py-1.5 border-b last:border-0">
                    <span className="text-muted-foreground">{label}</span>
                    <span className="font-medium capitalize">{value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Come funziona */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-sm font-semibold">Come funzionerà</p>
              <div className="space-y-2">
                {[
                  { n: "1", text: `Cliente manda audio o testo su ${canale === "whatsapp" ? "WhatsApp" : "Telegram"}` },
                  { n: "2", text: "L'AI trascrive l'audio (se vocale) e analizza la richiesta" },
                  { n: "3", text: "Consulta la tua Knowledge Base per prezzi e prodotti" },
                  { n: "4", text: "Genera un preventivo dettagliato e professionale in PDF" },
                  { n: "5", text: "Invia il PDF al cliente e lo salva nel tuo archivio" },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{n}</span>
                    <span className="text-muted-foreground">{text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between pt-2">
            <Button variant="outline" onClick={back}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>
            <Button size="lg" onClick={handleActivate} disabled={saving}>
              {saving
                ? <Loader2 className="h-5 w-5 animate-spin mr-2" />
                : <Zap className="h-5 w-5 mr-2" />}
              Attiva Agente Preventivi
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
