import { useState, useEffect } from "react";
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
  Settings2, Sparkles, Palette, Building2, Info,
} from "lucide-react";
import KnowledgeBaseManager from "@/components/preventivo/KnowledgeBaseManager";

/* ─── Constants ─────────────────────────────────────── */

const BRAND_PRESETS = [
  "#2563EB", "#7C3AED", "#059669", "#DC2626", "#D97706",
  "#0F172A", "#0EA5E9", "#F97316", "#EC4899", "#14B8A6",
];

const STEPS = [
  { id: 1, label: "Azienda & Brand", icon: Building2 },
  { id: 2, label: "Knowledge Base",  icon: BookOpen },
  { id: 3, label: "Canale",          icon: MessageSquare },
  { id: 4, label: "Attiva",          icon: Sparkles },
];

/* ─── Step bar ─────────────────────────────────────── */

function StepBar({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((s, i) => {
        const Icon = s.icon;
        const done   = s.id < current;
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

/* ─── Color swatch ─────────────────────────────────── */

function ColorSwatch({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-lg border-2 transition-all ${selected ? "border-foreground scale-110 shadow-md" : "border-transparent hover:scale-105"}`}
      style={{ backgroundColor: color }}
      title={color}
    />
  );
}

/* ─── PDF Preview mini ─────────────────────────────── */

function PdfPreview({
  nomeImpresa, titoloOfferta, brandColor, logoUrl,
}: {
  nomeImpresa: string; titoloOfferta: string; brandColor: string; logoUrl: string;
}) {
  return (
    <div className="border rounded-lg overflow-hidden shadow-sm text-xs bg-white w-full select-none">
      {/* Intestazione colorata */}
      <div className="px-4 py-3 flex items-center gap-3" style={{ backgroundColor: brandColor }}>
        {logoUrl ? (
          <img src={logoUrl} alt="logo" className="h-8 w-8 object-contain rounded bg-white/20 p-0.5" />
        ) : (
          <div className="h-8 w-8 rounded bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {(nomeImpresa || "?")[0]?.toUpperCase()}
          </div>
        )}
        <div>
          <p className="font-bold text-white text-sm leading-tight">{nomeImpresa || "Nome impresa"}</p>
          <p className="text-white/70 text-[10px]">{titoloOfferta || "Offerta commerciale"}</p>
        </div>
      </div>
      {/* Corpo documento simulato */}
      <div className="p-3 space-y-1.5">
        <div className="h-2 w-3/4 rounded bg-gray-200" />
        <div className="h-2 w-1/2 rounded bg-gray-100" />
        <div className="mt-3 border rounded" style={{ borderColor: brandColor + "44" }}>
          <div className="px-2 py-1 text-[10px] font-semibold" style={{ backgroundColor: brandColor + "22", color: brandColor }}>
            Riepilogo lavori
          </div>
          <div className="p-2 space-y-1">
            {["Voce 1", "Voce 2", "Totale"].map((r, i) => (
              <div key={r} className={`flex justify-between text-[9px] ${i === 2 ? "font-bold border-t pt-1 mt-1" : "text-muted-foreground"}`}>
                <span>{r}</span>
                <span style={i === 2 ? { color: brandColor } : {}}>€ {i === 2 ? "2.450,00" : ["850,00", "1.600,00"][i]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */

export default function PreventivoAgentSetup() {
  const navigate   = useNavigate();
  const companyId  = useCompanyId();
  const { toast }  = useToast();

  const [step,   setStep]   = useState(1);
  const [saving, setSaving] = useState(false);

  /* Step 1 — Azienda */
  const [nomeImpresa,    setNomeImpresa]    = useState("");
  const [settore,        setSettore]        = useState("ristrutturazioni");
  const [ivaPerc,        setIvaPerc]        = useState("22");
  const [validitaGiorni, setValiditaGiorni] = useState("30");
  const [noteStandard,   setNoteStandard]   = useState("");
  const [titoloOfferta,  setTitoloOfferta]  = useState("Offerta commerciale");

  /* Step 1 — Branding */
  const [brandColor,    setBrandColor]    = useState("#2563EB");
  const [logoUrl,       setLogoUrl]       = useState("");
  const [emailFirma,    setEmailFirma]    = useState("");
  const [customColor,   setCustomColor]   = useState("");

  /* Step 3 — Canale */
  const [canale, setCanale] = useState<"whatsapp" | "telegram">("whatsapp");

  /* ── Precarica dati azienda esistenti ── */
  useEffect(() => {
    if (!companyId) return;
    supabase
      .from("companies")
      .select("name, logo_url, brand_color, phone, email, website")
      .eq("id", companyId)
      .single()
      .then(({ data }) => {
        if (!data) return;
        if (data.name)                         setNomeImpresa(data.name);
        if (data.logo_url)                     setLogoUrl(data.logo_url);
        if ((data as any).brand_color)         setBrandColor((data as any).brand_color);
        if ((data as any).email)               setEmailFirma((data as any).email);
      });
  }, [companyId]);

  /* ── helpers ── */
  const next = () => setStep(s => Math.min(s + 1, 4));
  const back = () => setStep(s => Math.max(s - 1, 1));

  const canProceed1 = nomeImpresa.trim().length >= 2;

  const handleColorPreset = (c: string) => { setBrandColor(c); setCustomColor(""); };
  const handleCustomColor = (v: string) => {
    setCustomColor(v);
    if (/^#[0-9a-fA-F]{6}$/.test(v)) setBrandColor(v);
  };

  /* ── Step 4: salva agente ── */
  const handleActivate = async () => {
    if (!companyId) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("agents").insert({
        company_id:   companyId,
        name:         "Preventivo AI — " + nomeImpresa,
        type:         canale,
        status:       "active",
        description:  `Genera preventivi automaticamente da audio o testo via ${canale === "whatsapp" ? "WhatsApp" : "Telegram"}.`,
        system_prompt: buildPrompt(),
        config: {
          settore,
          iva_percentuale:  parseFloat(ivaPerc),
          validita_giorni:  parseInt(validitaGiorni),
          note_standard:    noteStandard,
          titolo_offerta:   titoloOfferta,
          canale,
          brand_color:      brandColor,
          logo_url:         logoUrl || null,
          email_firma:      emailFirma || null,
          template_slug:    "preventivo-ai",
        } as any,
      } as any);

      if (error) throw error;

      toast({
        title: "✅ Agente Preventivi attivato!",
        description: "Invia un audio o un testo con la descrizione del lavoro per generare il preventivo.",
      });

      navigate("/app/preventivo-hub");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Errore", description: err.message });
    } finally {
      setSaving(false);
    }
  };

  function buildPrompt(): string {
    return `Sei un assistente AI specializzato in preventivi per ${nomeImpresa}, un'impresa di ${settore}.

Quando ricevi un messaggio (audio trascritto o testo libero), devi:
1. Analizzare la richiesta del cliente e identificare i lavori richiesti
2. Estrarre superfici, materiali, quantità e specifiche tecniche
3. Cercare prezzi e prodotti nella Knowledge Base aziendale
4. Generare un preventivo dettagliato, professionale e formattato

Parametri predefiniti:
- IVA: ${ivaPerc}%
- Validità offerta: ${validitaGiorni} giorni dalla data di emissione
- Titolo documento: ${titoloOfferta}
- Colore brand: ${brandColor}
${noteStandard ? `- Note standard a piè di pagina: ${noteStandard}` : ""}

Regole:
- Se mancano informazioni essenziali (superficie, materiale, piano, ecc.) chiedi prima di procedere
- Usa sempre prezzi dalla Knowledge Base se disponibili, altrimenti indica "da definire"
- Il preventivo deve essere professionale, dettagliato e visivamente coerente con il brand aziendale
- Tono: professionale e cortese, mai generico`;
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
            Invia un audio o un testo e ottieni un preventivo professionale in pochi secondi
          </p>
        </div>
      </div>

      <StepBar current={step} />

      {/* ─────────────────────────────────────────────
          STEP 1 — Azienda & Brand
      ───────────────────────────────────────────── */}
      {step === 1 && (
        <div className="space-y-4">

          {/* Info azienda */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Informazioni azienda
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Questi dati vengono usati dall'AI per personalizzare i preventivi
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
                  <Label>Titolo documento</Label>
                  <Input
                    value={titoloOfferta}
                    onChange={e => setTitoloOfferta(e.target.value)}
                    placeholder="Es. Offerta commerciale"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>IVA applicata</Label>
                  <Select value={ivaPerc} onValueChange={setIvaPerc}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">4% — Prima casa agevolata</SelectItem>
                      <SelectItem value="10">10% — Manutenzione ordinaria</SelectItem>
                      <SelectItem value="22">22% — Aliquota standard</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Validità preventivo</Label>
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
                  <Label>Note a piè di pagina</Label>
                  <Textarea
                    value={noteStandard}
                    onChange={e => setNoteStandard(e.target.value)}
                    placeholder="Es. I prezzi si intendono IVA esclusa. Validità 30 giorni dalla data di emissione..."
                    rows={2}
                    className="resize-none"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Branding PDF */}
          <Card>
            <CardContent className="p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Brand & stile PDF
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Il preventivo PDF utilizzerà questi colori e il tuo logo
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">

                {/* Colore brand */}
                <div className="space-y-3">
                  <Label>Colore principale</Label>
                  <div className="flex gap-2 flex-wrap">
                    {BRAND_PRESETS.map(c => (
                      <ColorSwatch
                        key={c}
                        color={c}
                        selected={brandColor === c && !customColor}
                        onClick={() => handleColorPreset(c)}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-8 h-8 rounded-lg border" style={{ backgroundColor: brandColor }} />
                    <Input
                      value={customColor || brandColor}
                      onChange={e => handleCustomColor(e.target.value)}
                      placeholder="#2563EB"
                      className="font-mono text-sm h-8 w-28"
                    />
                    <span className="text-xs text-muted-foreground">HEX personalizzato</span>
                  </div>
                </div>

                {/* Logo + Email firma */}
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>URL logo aziendale</Label>
                    <Input
                      value={logoUrl}
                      onChange={e => setLogoUrl(e.target.value)}
                      placeholder="https://esempio.com/logo.png"
                      className="text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Il logo appare nell'intestazione del PDF.{" "}
                      <button
                        className="text-primary underline-offset-2 hover:underline"
                        onClick={() => navigate("/app/settings?tab=profilo")}
                      >
                        Cambia logo →
                      </button>
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Email firma PDF</Label>
                    <Input
                      type="email"
                      value={emailFirma}
                      onChange={e => setEmailFirma(e.target.value)}
                      placeholder="info@tuaazienda.it"
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Anteprima PDF */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  Anteprima intestazione PDF
                </Label>
                <div className="max-w-xs">
                  <PdfPreview
                    nomeImpresa={nomeImpresa}
                    titoloOfferta={titoloOfferta}
                    brandColor={brandColor}
                    logoUrl={logoUrl}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={next} disabled={!canProceed1}>
              Avanti <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          STEP 2 — Knowledge Base
      ───────────────────────────────────────────── */}
      {step === 2 && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-lg bg-primary/10">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">Knowledge Base — Listini & Materiali</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">
                    Carica listini prezzi, schede prodotto e cataloghi.
                    L'AI li legge per generare preventivi con i tuoi prezzi reali.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {["📋 Listini prezzi", "📄 Schede prodotto", "📚 Cataloghi fornitori", "💰 Tariffari lavorazioni"].map(t => (
                      <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                    <Info className="h-3 w-3 shrink-0" />
                    Puoi saltare questo step e aggiungere documenti in seguito dall'Hub Preventivi
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <KnowledgeBaseManager />

          <div className="flex justify-between">
            <Button variant="outline" onClick={back}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>
            <Button onClick={next}>
              Avanti <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────
          STEP 3 — Canale
      ───────────────────────────────────────────── */}
      {step === 3 && (
        <Card>
          <CardContent className="p-6 space-y-5">
            <div>
              <h2 className="text-lg font-semibold">Scegli il canale di ricezione</h2>
              <p className="text-sm text-muted-foreground">
                Da dove arriveranno le richieste di preventivo?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  id: "whatsapp" as const,
                  label: "WhatsApp",
                  emoji: "💬",
                  desc: "Il cliente invia un vocale o un messaggio su WhatsApp. L'AI analizza e risponde con il preventivo in PDF.",
                  badge: "Consigliato",
                  badgeCls: "bg-green-50 text-green-700 border-green-200",
                },
                {
                  id: "telegram" as const,
                  label: "Telegram",
                  emoji: "✈️",
                  desc: "Funziona tramite bot Telegram. Ideale per chi preferisce Telegram per comunicare con il team o i clienti.",
                  badge: null,
                  badgeCls: "",
                },
              ].map(ch => (
                <Card
                  key={ch.id}
                  className={`cursor-pointer transition-all ${canale === ch.id
                    ? "border-2 border-primary bg-primary/5 shadow-sm"
                    : "border hover:shadow-md hover:border-muted-foreground/30"}`}
                  onClick={() => setCanale(ch.id)}
                >
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{ch.emoji}</span>
                      <p className="font-semibold">{ch.label}</p>
                      {ch.badge && (
                        <Badge className={`${ch.badgeCls} border text-xs ml-auto`} variant="outline">
                          {ch.badge}
                        </Badge>
                      )}
                      {canale === ch.id && (
                        <CheckCircle className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{ch.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Info collegamento canale */}
            <Card className="bg-muted/50 border-dashed">
              <CardContent className="p-4 space-y-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <Settings2 className="h-4 w-4" />
                  Come si collega {canale === "whatsapp" ? "WhatsApp" : "Telegram"}?
                </p>
                <p className="text-xs text-muted-foreground">
                  {canale === "whatsapp"
                    ? "Dopo l'attivazione vai in Impostazioni → WhatsApp e collega il numero tramite Meta Business oppure scansiona il QR code."
                    : "Dopo l'attivazione crea un bot su Telegram con @BotFather, poi incolla il token nelle Impostazioni → Integrazioni."}
                </p>
                <Button
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs gap-1"
                  onClick={() => navigate(canale === "whatsapp" ? "/app/whatsapp" : "/app/integrations")}
                >
                  Vai alle impostazioni <ExternalLink className="h-3 w-3" />
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

      {/* ─────────────────────────────────────────────
          STEP 4 — Riepilogo & Attiva
      ───────────────────────────────────────────── */}
      {step === 4 && (
        <div className="space-y-4">

          {/* Riepilogo config */}
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-6 space-y-5">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold">Tutto pronto!</h2>
                  <p className="text-sm text-muted-foreground">Verifica la configurazione e attiva l'agente</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Dati azienda */}
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Azienda</p>
                  {[
                    ["Nome",      nomeImpresa],
                    ["Settore",   settore.replace(/_/g, " ")],
                    ["IVA",       `${ivaPerc}%`],
                    ["Validità",  `${validitaGiorni} giorni`],
                    ["Canale",    canale === "whatsapp" ? "💬 WhatsApp" : "✈️ Telegram"],
                  ].map(([label, value]) => (
                    <div key={label} className="flex justify-between py-1 border-b last:border-0 text-sm">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium capitalize">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Brand preview */}
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Stile PDF</p>
                  <PdfPreview
                    nomeImpresa={nomeImpresa}
                    titoloOfferta={titoloOfferta}
                    brandColor={brandColor}
                    logoUrl={logoUrl}
                  />
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-5 h-5 rounded border" style={{ backgroundColor: brandColor }} />
                    <span className="text-xs text-muted-foreground font-mono">{brandColor}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Come funzionerà */}
          <Card>
            <CardContent className="p-5 space-y-3">
              <p className="text-sm font-semibold">Come funzionerà</p>
              <div className="space-y-2">
                {[
                  { n: "1", text: `Cliente manda un audio o un testo su ${canale === "whatsapp" ? "WhatsApp" : "Telegram"}` },
                  { n: "2", text: "L'AI trascrive l'audio (se vocale) e analizza la richiesta" },
                  { n: "3", text: "Consulta la Knowledge Base per prezzi, materiali e prodotti" },
                  { n: "4", text: "Genera un preventivo dettagliato e professionale in PDF" },
                  { n: "5", text: "Invia il PDF al cliente e salva tutto nell'archivio preventivi" },
                ].map(({ n, text }) => (
                  <div key={n} className="flex items-start gap-3 text-sm">
                    <span
                      className="w-6 h-6 rounded-full text-white text-xs font-bold flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: brandColor }}
                    >
                      {n}
                    </span>
                    <span className="text-muted-foreground pt-0.5">{text}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-between">
            <Button variant="outline" onClick={back}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Indietro
            </Button>
            <Button size="lg" onClick={handleActivate} disabled={saving} style={{ backgroundColor: brandColor }}>
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
