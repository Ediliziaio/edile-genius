import { useEffect, useState, useRef } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { motion, useInView } from "framer-motion";
import {
  Phone,
  Camera,
  HardHat,
  BarChart3,
  CheckCircle2,
  Shield,
  Star,
  ArrowRight,
  ArrowDown,
  XCircle,
  Wrench,
  Package,
  MessageSquare,
  Users,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/sections/Footer";

/* ---------- helpers ---------- */

function AnimatedSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const COUNTDOWN_KEY = "offerta_pacchetto_first_visit";
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

function useCountdown() {
  const [remaining, setRemaining] = useState({ days: 0, hours: 0, minutes: 0, expired: false });

  useEffect(() => {
    let stored = localStorage.getItem(COUNTDOWN_KEY);
    if (!stored) {
      stored = String(Date.now());
      localStorage.setItem(COUNTDOWN_KEY, stored);
    }
    const deadline = Number(stored) + SEVEN_DAYS;

    const tick = () => {
      const diff = deadline - Date.now();
      if (diff <= 0) {
        setRemaining({ days: 0, hours: 0, minutes: 0, expired: true });
        return;
      }
      setRemaining({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        expired: false,
      });
    };
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, []);

  return remaining;
}

function scrollToPricing() {
  document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
}

const WA_LINK = "https://wa.me/3901onal?text=Ciao%2C%20sono%20interessato%20al%20pacchetto%20completo%20Edil%20Genius.%20Vorrei%20maggiori%20informazioni.";

/* ---------- data ---------- */

const singleModules = [
  { name: "Agente Vocale Professional", price: "€297" },
  { name: "Render AI Professional", price: "€127" },
  { name: "Preventivatore Professional", price: "€97" },
  { name: "Rapportini AI Professional", price: "€67" },
  { name: "WhatsApp AI Professional", price: "€97" },
];

const bundleFeatures = [
  "2 Agenti Vocali AI (750 min/mese)",
  "80 Render AI al mese",
  "150 Preventivi AI al mese",
  "80 Rapportini AI al mese",
  "WhatsApp AI (500 msg/mese)",
  "CRM completo con pipeline",
  "Lead Scoring AI",
  "Dashboard unificata",
  "5 utenti",
  "Supporto prioritario",
];

const workflows = [
  {
    icon: Phone,
    title: "Il Lead che Arriva alle 21:30",
    steps: [
      "L'Agente Vocale risponde alla chiamata",
      "Qualifica il lead (tipo lavoro, budget, tempistiche)",
      "Fissa l'appuntamento sul calendario del commerciale",
      "Invia conferma WhatsApp AI al cliente",
      "Il lead scoring assegna un punteggio automatico",
      "La mattina dopo il commerciale apre il CRM e trova tutto pronto",
    ],
    singlePain: "Dovresti copiare i dati a mano dall'agente vocale al CRM, mandare il WhatsApp manualmente, e il lead scoring non esiste.",
  },
  {
    icon: Camera,
    title: "L'Appuntamento dal Cliente",
    steps: [
      "Il commerciale scatta la foto dell'infisso vecchio",
      "Render AI genera il render in 10 secondi",
      "Il Preventivatore calcola il preventivo con varianti, IVA e detrazioni",
      "Il render viene allegato automaticamente al PDF del preventivo",
      "Il preventivo viene inviato via WhatsApp con un click",
      "Il CRM traccia l'apertura del preventivo",
    ],
    singlePain: "Render in un'app, preventivo in un'altra, PDF fatto a mano, nessun tracking.",
  },
  {
    icon: HardHat,
    title: "Il Cantiere",
    steps: [
      "Il capo cantiere parla al telefono e descrive l'avanzamento",
      "Il Rapportino AI trascrive e genera il report",
      "Il report si collega automaticamente al progetto nel CRM",
      "Il titolare vede il KPI del cantiere aggiornato in dashboard",
      "Il cliente riceve l'aggiornamento automatico via WhatsApp",
    ],
    singlePain: "Rapportino su un'app, progetto su un'altra, nessun collegamento, nessun aggiornamento automatico al cliente.",
  },
  {
    icon: BarChart3,
    title: "Fine Mese",
    steps: [
      "La Dashboard AI genera il report mensile",
      "Lead ricevuti, qualificati, appuntamenti fissati",
      "Preventivi inviati, aperti, convertiti in ordine",
      "Margine medio per tipo di lavoro",
      "Performance di ogni commerciale",
      "Cantieri attivi, rapportini consegnati, clienti soddisfatti",
    ],
    singlePain: "Raccogli dati da 5 posti diversi e fai tutto su Excel. Buona fortuna.",
  },
];

const plans = [
  {
    name: "Essenziale",
    price: "€297",
    period: "/mese",
    setup: "€497 una tantum",
    target: "Per chi parte: serramentista o artigiano, 1-3 persone",
    features: [
      "1 Agente Vocale (300 min)",
      "30 Render AI",
      "50 Preventivi AI",
      "20 Rapportini AI",
      "CRM base + calendario",
      "2 utenti",
      "Supporto email",
    ],
    highlighted: false,
  },
  {
    name: "Crescita",
    price: "€497",
    period: "/mese",
    setup: "€997 una tantum",
    badge: "⭐ Più scelto",
    target: "Per chi cresce: impresa con show-room, 3-8 persone",
    features: [
      "2 Agenti Vocali (750 min)",
      "80 Render AI",
      "150 Preventivi AI",
      "80 Rapportini AI",
      "WhatsApp AI (500 msg)",
      "Lead Scoring AI",
      "Dashboard KPI avanzata",
      "5 utenti",
      "Supporto prioritario",
    ],
    highlighted: true,
    saving: "Risparmi €188/mese vs moduli singoli",
  },
  {
    name: "Dominio",
    price: "€997",
    period: "/mese",
    setup: "€1.497 una tantum",
    target: "Per chi domina: azienda strutturata, multi-sede, 5-15 persone",
    features: [
      "3+ Agenti Vocali (2.000 min)",
      "250 Render AI",
      "500 Preventivi AI",
      "300 Rapportini AI",
      "WhatsApp AI (2.000 msg)",
      "Voice Cloning",
      "Firma Digitale",
      "Multi-sede / SuperAdmin",
      "15 utenti",
      "Account Manager dedicato",
    ],
    highlighted: false,
    saving: "Il pacchetto completo per chi vuole l'azienda AI-first",
  },
];

const testimonials = [
  {
    quote: "Ho iniziato con solo il Render AI. Dopo 2 mesi ho preso il pacchetto completo. Adesso non riesco a immaginare la mia azienda senza.",
    role: "Titolare, serramenti PVC, Lombardia",
  },
  {
    quote: "Il mio commerciale fa il triplo dei preventivi in metà tempo. E l'agente vocale mi ha recuperato lead che pensavo persi.",
    role: "Imprenditore edile, Veneto",
  },
  {
    quote: "La vera svolta è che tutto parla con tutto. Il lead entra dal telefono e arriva fino al cantiere senza che io tocchi niente.",
    role: "General contractor, Emilia-Romagna",
  },
];

const faqs = [
  {
    q: "Posso iniziare con un modulo singolo e passare al pacchetto dopo?",
    a: "Sì. Se hai già attivato un modulo singolo, puoi fare l'upgrade al pacchetto completo in qualsiasi momento. Ti scaliamo il costo del modulo dal primo mese del pacchetto. Non perdi nulla.",
  },
  {
    q: "Se non uso tutti i crediti di un servizio, li perdo?",
    a: "I crediti non usati non si accumulano tra un mese e l'altro, ma il pacchetto è calibrato sull'uso reale delle aziende del tuo settore. La maggior parte dei nostri clienti usa il 70-90% dei crediti inclusi. Se sfori, puoi comprare crediti extra dalla dashboard.",
  },
  {
    q: "Quanto tempo serve per attivare tutto?",
    a: "Il setup completo del pacchetto richiede 5-7 giorni lavorativi. In questo periodo configuriamo: agenti vocali con script personalizzati, catalogo prodotti nel preventivatore, listini, branding PDF, integrazioni calendario e CRM. Tu devi solo darci le informazioni — noi facciamo tutto il resto.",
  },
  {
    q: "Posso far usare la piattaforma ai miei commerciali esterni?",
    a: "Sì. Ogni utente ha il suo accesso con permessi configurabili. Puoi dare accesso ai commerciali solo al preventivatore e ai render, senza fargli vedere i KPI o i dati finanziari.",
  },
  {
    q: "E se cambio idea dopo 3 mesi?",
    a: "Nessun vincolo. Disdici dal dashboard con un click. Il servizio resta attivo fino a fine mese pagato. I tuoi dati (preventivi, render, contatti) restano disponibili per l'export per 30 giorni dopo la disdetta.",
  },
];

/* ---------- component ---------- */

export default function PacchettoCompleto() {
  const countdown = useCountdown();

  usePageSEO({
    title: "Pacchetto Completo Edil Genius — Offerta Riservata | Edilizia.io",
    description: "Agente Vocale + Render AI + Preventivatore + Rapportini + WhatsApp AI + CRM. Tutto in un'unica piattaforma, un unico prezzo. Risparmia fino al 40%.",
  });

  useEffect(() => {
    const m = document.createElement("meta");
    m.name = "robots";
    m.content = "noindex, nofollow";
    document.head.appendChild(m);
    return () => { m.remove(); };
  }, []);

  const CountdownBlock = () =>
    !countdown.expired ? (
      <div className="flex items-center gap-3 justify-center text-sm">
        <span className="text-muted-foreground">⏰ Offerta scade tra</span>
        {[
          { v: countdown.days, l: "g" },
          { v: countdown.hours, l: "h" },
          { v: countdown.minutes, l: "m" },
        ].map((t, i) => (
          <span key={i} className="font-mono font-bold bg-primary/10 text-primary px-2 py-1 rounded">
            {t.v}{t.l}
          </span>
        ))}
      </div>
    ) : (
      <p className="text-sm text-destructive font-medium text-center">⚠️ L'offerta è scaduta — contattaci per verificare la disponibilità</p>
    );

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
          <Link to="/" className="text-xl font-bold text-primary">Edilizia.io</Link>
          <Button size="sm" onClick={scrollToPricing}>Scopri i Pacchetti <ArrowRight className="ml-1 h-4 w-4" /></Button>
        </div>
      </header>

      {/* ══════════════════ SEZIONE 1: HERO ══════════════════ */}
      <AnimatedSection className="py-16 md:py-24 px-4">
        <div className="max-w-4xl mx-auto text-center space-y-6">
          <Badge variant="secondary" className="text-sm px-4 py-1">🔒 Pagina riservata — Offerta valida per 7 giorni</Badge>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight">
            Smetti di Comprare gli Attrezzi Uno alla Volta.{" "}
            <span className="text-primary">Prendi Tutta la Cassetta.</span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Agente Vocale + Render AI + Preventivatore + Rapportini + WhatsApp AI + CRM.
            Tutto in un'unica piattaforma. Un unico prezzo. E risparmi fino al 40% rispetto ai singoli moduli.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { icon: "🧰", label: "6 strumenti AI in 1" },
              { icon: "💰", label: "Fino al 40% di risparmio" },
              { icon: "🔄", label: "Tutto integrato, zero copia-incolla" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border rounded-lg p-3 text-center">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-sm font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <Button size="lg" className="text-base px-8" onClick={scrollToPricing}>
              Scopri il Tuo Pacchetto Ideale <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground">Nessun vincolo. Disdici quando vuoi.</p>
          </div>

          <CountdownBlock />
        </div>
      </AnimatedSection>

      {/* ══════════════════ SEZIONE 2: CONFRONTO KILLER ══════════════════ */}
      <AnimatedSection className="py-16 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Quanto spendi comprando tutto separatamente?
          </h2>

          {/* Blocco SINGOLI - rosso */}
          <Card className="border-2 border-destructive/50 bg-destructive/5">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <XCircle className="h-5 w-5 text-destructive" />
                Se compri i moduli standalone uno alla volta:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {singleModules.map((m) => (
                <div key={m.name} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                  <span className="text-muted-foreground">{m.name}</span>
                  <span className="font-mono font-semibold">{m.price}/mese</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>TOTALE MODULI SINGOLI</span>
                <span className="text-destructive">€685/mese</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 pt-2">
                <p>+ 5 setup separati = <strong>€985 una tantum</strong></p>
                <p>+ 5 dashboard diverse da controllare</p>
                <p>+ Nessuna integrazione tra i moduli</p>
                <p>+ Dati sparsi ovunque</p>
              </div>
            </CardContent>
          </Card>

          {/* Freccia */}
          <div className="flex justify-center">
            <ArrowDown className="h-10 w-10 text-primary animate-bounce" />
          </div>

          {/* Blocco PACCHETTO - verde */}
          <Card className="border-2 border-green-500/50 bg-green-500/5 ring-2 ring-green-500/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                Con il Pacchetto Crescita di Edil Genius:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bundleFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm py-1">
                  <CheckCircle2 className="h-4 w-4 text-green-600 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
              <Separator />
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>PREZZO PACCHETTO CRESCITA</span>
                <span className="text-green-600">€497/mese</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 pt-2">
                <p>+ 1 solo setup = <strong>€997 una tantum</strong></p>
                <p>+ TUTTO integrato in un'unica piattaforma</p>
                <p>+ Il render si allega al preventivo con 1 click</p>
                <p>+ L'agente vocale alimenta il CRM in automatico</p>
                <p>+ I rapportini si collegano al cantiere nel CRM</p>
              </div>
              <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 mt-4 text-center">
                <p className="text-xl font-bold text-green-600">
                  💰 RISPARMI €188/MESE = €2.256/ANNO
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* ══════════════════ SEZIONE 3: WORKFLOW INTEGRAZIONE ══════════════════ */}
      <AnimatedSection className="py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-10">
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-bold">
              Non è solo una questione di prezzo.{" "}
              <span className="text-primary">È che insieme funzionano 10 volte meglio.</span>
            </h2>
          </div>

          {workflows.map((w, i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="bg-primary/5">
                <CardTitle className="text-lg flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <w.icon className="h-5 w-5 text-primary" />
                  </div>
                  Scenario {i + 1} — {w.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-2">
                  {w.steps.map((step, si) => (
                    <div key={si} className="flex items-start gap-2 text-sm">
                      <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                      <span>{step}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-3">
                  <p className="text-sm">
                    <span className="font-semibold text-destructive">CON I SINGOLI MODULI:</span>{" "}
                    <span className="text-muted-foreground">{w.singlePain}</span>
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </AnimatedSection>

      {/* ══════════════════ SEZIONE 4: PRICING ══════════════════ */}
      <AnimatedSection className="py-16 px-4 bg-muted/30" id="pricing">
        <div className="max-w-5xl mx-auto space-y-10">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Scegli il pacchetto che fa crescere la tua impresa
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-2 border-primary ring-2 ring-primary/20 scale-[1.02]"
                    : "border border-border"
                }`}
              >
                {plan.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3">{plan.badge}</Badge>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground">{plan.target}</p>
                  <div className="pt-2">
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Setup: {plan.setup}</p>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <ul className="space-y-2">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  {plan.saving && (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-2 text-center">
                      <p className="text-sm font-semibold text-green-600">💰 {plan.saving}</p>
                    </div>
                  )}
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    asChild
                  >
                    <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
                      Attiva {plan.name} <ArrowRight className="ml-1 h-4 w-4" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center bg-card border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              🏢 Hai più di 15 persone o esigenze specifiche?{" "}
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">
                Contattaci per il Piano Enterprise da €1.997/mese
              </a>
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════════ SEZIONE 5: TESTIMONIAL ══════════════════ */}
      <AnimatedSection className="py-16 px-4">
        <div className="max-w-5xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">
            Chi ha scelto il pacchetto completo non torna più indietro
          </h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <Card key={i} className="bg-card">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, si) => (
                      <Star key={si} className="h-4 w-4 fill-primary text-primary" />
                    ))}
                  </div>
                  <p className="text-sm italic text-muted-foreground">"{t.quote}"</p>
                  <p className="text-xs font-semibold">— {t.role}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ══════════════════ SEZIONE 6: FAQ ══════════════════ */}
      <AnimatedSection className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto space-y-8">
          <h2 className="text-2xl md:text-3xl font-bold text-center">Domande Frequenti</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-sm font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      {/* ══════════════════ SEZIONE 7: GARANZIA DOPPIA ══════════════════ */}
      <AnimatedSection className="py-16 px-4">
        <div className="max-w-3xl mx-auto">
          <Card className="border-2 border-green-500/50 bg-green-500/5">
            <CardContent className="pt-6 space-y-4 text-center">
              <Shield className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-xl font-bold">🛡️ GARANZIA DOPPIA — 30 GIORNI</h3>
              <div className="space-y-3 text-left max-w-xl mx-auto">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm">
                    <strong>Garanzia 1:</strong> Se l'Agente Vocale non fissa almeno 10 appuntamenti nel primo mese, ti rimborsiamo il setup.
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
                  <p className="text-sm">
                    <strong>Garanzia 2:</strong> Se la piattaforma non ti fa risparmiare almeno 10 ore a settimana, ti rimborsiamo il setup.
                  </p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Zero rischio. Zero burocrazia. La qualità dei nostri risultati parla da sola.
              </p>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* ══════════════════ SEZIONE 8: CTA FINALE ══════════════════ */}
      <AnimatedSection className="py-20 px-4 bg-foreground text-background" id="cta-finale">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h2 className="text-2xl md:text-3xl font-bold">
            Un'unica piattaforma. Un unico prezzo.{" "}
            <span className="text-primary">Un'intera azienda che lavora per te 24/7.</span>
          </h2>
          <p className="text-lg opacity-80">
            Attiva il pacchetto oggi. Tra 7 giorni avrai un'impresa che funziona anche quando tu non ci sei.
          </p>

          <Button size="lg" variant="secondary" className="text-base px-8" asChild>
            <a href={WA_LINK} target="_blank" rel="noopener noreferrer">
              Attiva il Tuo Pacchetto Completo <ArrowRight className="ml-2 h-5 w-5" />
            </a>
          </Button>

          <div className="space-y-3 pt-4">
            <p className="text-sm opacity-70">
              ⏰ Offerta riservata. Setup a prezzo speciale solo per attivazioni entro 7 giorni.
              <br />Dopo questa data il setup torna a prezzo pieno.
            </p>

            {!countdown.expired ? (
              <div className="flex items-center gap-3 justify-center text-sm">
                <span className="opacity-60">Scade tra</span>
                {[
                  { v: countdown.days, l: "g" },
                  { v: countdown.hours, l: "h" },
                  { v: countdown.minutes, l: "m" },
                ].map((t, i) => (
                  <span key={i} className="font-mono font-bold bg-background/20 px-2 py-1 rounded">
                    {t.v}{t.l}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-destructive font-medium">⚠️ L'offerta è scaduta</p>
            )}

            <p className="text-sm pt-2">
              <Link to="/tariffe" className="underline opacity-70 hover:opacity-100">
                Preferisci partire con un singolo modulo? → Torna alla pagina Pricing
              </Link>
            </p>
          </div>
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
}
