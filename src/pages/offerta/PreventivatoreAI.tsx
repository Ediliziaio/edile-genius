import { useEffect, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Zap,
  Target,
  FileText,
  CheckCircle2,
  XCircle,
  Shield,
  Star,
  ArrowRight,
  Calculator,
  BarChart3,
  RefreshCw,
  Landmark,
  Send,
  Settings2,
  Search,
  AlertTriangle,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/sections/Footer";

/* ---------- helpers ---------- */

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const COUNTDOWN_KEY = "offerta_prev_first_visit";
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

function scrollToCta() {
  document.getElementById("cta-finale")?.scrollIntoView({ behavior: "smooth" });
}

/* ---------- feature cards ---------- */
const features = [
  {
    icon: Zap,
    title: "Calcolo Istantaneo",
    text: "Seleziona prodotto, misure, varianti → preventivo calcolato in automatico con prezzi aggiornati, ricariche e sconti personalizzati.",
  },
  {
    icon: Calculator,
    title: "IVA Intelligente",
    text: "L'AI identifica automaticamente l'aliquota IVA corretta (4%, 10%, 22%) in base al tipo di intervento, edificio, servizio e tipo di cliente. Niente più dubbi.",
  },
  {
    icon: Landmark,
    title: "Detrazioni Fiscali",
    text: "Calcola in automatico Ecobonus, Bonus Ristrutturazione, Bonus Mobili. Mostra al cliente quanto risparmia — questo chiude le vendite.",
  },
  {
    icon: FileText,
    title: "PDF Professionale",
    text: "PDF brandizzato con il tuo logo, contatti, condizioni di vendita, disegni tecnici e riepilogo detrazioni. Il cliente riceve un documento che trasmette autorevolezza.",
  },
  {
    icon: RefreshCw,
    title: "Varianti e Alternative",
    text: "Genera varianti dello stesso preventivo (con/senza optional, materiali diversi, fasce di prezzo) con un click. Il cliente sceglie — tu chiudi.",
  },
  {
    icon: BarChart3,
    title: "Analytics",
    text: "Dashboard con tasso di conversione per tipo di preventivo, margine medio, prodotti più venduti. Capisci COSA vendi di più e DOVE guadagni di più.",
  },
];

/* ---------- pricing data ---------- */
const plans = [
  {
    name: "Starter",
    price: "€47",
    period: "/mese",
    setup: "€97 una tantum",
    extra: "Extra: €0,80/preventivo",
    features: [
      "50 preventivi/mese",
      "Calcolo varianti automatico",
      "IVA e detrazioni AI",
      "PDF base con logo",
      "1 utente",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "€97",
    period: "/mese",
    setup: "€197 una tantum",
    extra: "Extra: €0,60/preventivo",
    badge: "⭐ Più scelto",
    features: [
      "150 preventivi/mese",
      "Tutto Starter +",
      "PDF professionale personalizzabile",
      "Varianti e alternative con 1 click",
      "Analytics base",
      "3 utenti",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    price: "€197",
    period: "/mese",
    setup: "€297 una tantum",
    extra: "Extra: €0,50/preventivo",
    features: [
      "400 preventivi/mese",
      "Tutto Professional +",
      "Dashboard analytics completa",
      "Integrazione Render AI",
      "Gestione multi-fornitore",
      "5 utenti",
    ],
    highlighted: false,
  },
  {
    name: "Unlimited",
    price: "€347",
    period: "/mese",
    setup: "€397 una tantum",
    extra: "Extra: €0,40/preventivo",
    features: [
      "1.000 preventivi/mese",
      "Tutto Business +",
      "Utenti illimitati",
      "Listini multi-brand",
      "Report marginalità avanzato",
      "Supporto dedicato",
    ],
    highlighted: false,
  },
];

/* ---------- FAQ data ---------- */
const faqs = [
  {
    q: "Posso caricare i listini dei miei fornitori?",
    a: "Sì. Puoi caricare listini in Excel o CSV. Il sistema importa prezzi, varianti, accessori e li tiene aggiornati. Supportiamo i principali formati usati dai produttori di infissi italiani.",
  },
  {
    q: "Funziona solo per serramenti?",
    a: "No. Il preventivatore funziona per qualsiasi prodotto edile: serramenti, porte interne, porte blindate, persiane, tende da sole, fotovoltaico, climatizzazione, ristrutturazioni. Basta configurare il catalogo prodotti.",
  },
  {
    q: "Come fa a sapere l'IVA giusta?",
    a: "L'AI ti guida con una procedura in 3 domande (tipo intervento, tipo edificio, tipo cliente) e applica automaticamente l'aliquota corretta secondo la normativa vigente. Aggiornato con le ultime disposizioni fiscali.",
  },
  {
    q: "I miei commerciali riusciranno a usarlo?",
    a: "Se sanno usare WhatsApp, sanno usare il Preventivatore AI. L'interfaccia è pensata per chi lavora in cantiere, non per informatici. Selezioni, clicchi, invii.",
  },
  {
    q: "Posso allegare il render AI al preventivo?",
    a: "Sì, se hai attivato anche il modulo Render AI. Il render viene allegato automaticamente al PDF del preventivo. Questo aumenta drasticamente il tasso di chiusura.",
  },
];

/* ---------- comparison table ---------- */
const comparisonRows = [
  {
    label: "Tempo per preventivo",
    excel: "30 min – 2 ore",
    software: "10-15 minuti",
    edilizia: "30 secondi",
  },
  {
    label: "Calcolo IVA automatico",
    excel: "❌ Manuale",
    software: "⚠️ Parziale",
    edilizia: "✅ Automatico + AI",
  },
  {
    label: "Detrazioni fiscali",
    excel: "❌ Manuale",
    software: "⚠️ Solo alcuni",
    edilizia: "✅ Tutte, aggiornate",
  },
  {
    label: "PDF brandizzato",
    excel: "❌ Artigianale",
    software: "✅ Base",
    edilizia: "✅ Professionale + render",
  },
  {
    label: "Analytics vendite",
    excel: "❌ Nessuna",
    software: "⚠️ Base",
    edilizia: "✅ Dashboard AI completa",
  },
  {
    label: "Integrazione CRM",
    excel: "❌",
    software: "❌",
    edilizia: "✅ Nativa (Edilizia.io)",
  },
  {
    label: "Costo",
    excel: "€0 (ma quanto tempo perdi?)",
    software: "€50-150/mese",
    edilizia: "Da €47/mese",
  },
];

/* ========== PAGE COMPONENT ========== */

export default function OffertaPreventivatoreAI() {
  usePageSEO({
    title: "Offerta Preventivatore AI — Edilizia.io",
    description: "Preventivi professionali in 30 secondi con calcolo IVA, detrazioni e PDF automatico. Offerta riservata.",
  });

  // noindex
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "robots");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", "noindex, nofollow");
    return () => {
      meta?.setAttribute("content", "index, follow");
    };
  }, []);

  const countdown = useCountdown();

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Simplified header */}
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="text-xl font-bold text-primary">
            Edilizia.io
          </Link>
          <Button onClick={scrollToCta} size="lg">
            Attiva il Preventivatore AI <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 border-primary/40 bg-primary/5 text-primary px-4 py-1.5 text-sm">
            🔒 Pagina riservata — Offerta valida per 7 giorni
          </Badge>

          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Smetti di Perdere 2 Ore a Fare un Preventivo.
            <br className="hidden md:block" />
            L'AI Lo Fa in 30 Secondi.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Preventivi professionali con calcolo automatico di varianti, detrazioni fiscali, IVA agevolata e PDF brandizzato con il tuo logo. Il cliente riceve un documento perfetto — tu risparmi mezza giornata.
          </p>

          {/* Mini stats */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            {[
              { icon: Zap, text: "Preventivo in 30 secondi" },
              { icon: Target, text: "Zero errori di calcolo" },
              { icon: FileText, text: "PDF professionale automatico" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-5 w-5 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <Button size="lg" className="mt-10 text-base px-8 py-6" onClick={scrollToCta}>
            Attiva il Preventivatore AI <ArrowRight className="ml-1" />
          </Button>

          <p className="mt-3 text-sm text-muted-foreground">
            Attivo in giornata. Disdici quando vuoi.
          </p>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== IL PROBLEMA ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Quante ore butti via ogni settimana in preventivi?
          </h2>

          <div className="mx-auto mt-12 max-w-3xl space-y-6 text-base leading-relaxed text-muted-foreground">
            <p>
              Pensaci un attimo.
            </p>
            <p>
              Ogni preventivo ti porta via 30 minuti — 2 ore se è complesso. Devi aprire il foglio Excel, cercare i prezzi aggiornati del fornitore, calcolare le varianti per colore e dimensione, verificare l'IVA corretta (4%? 10%? 22% — dipende dal tipo di intervento), controllare se rientra nell'Ecobonus o nel Bonus Ristrutturazione, aggiungere la posa, calcolare i totali…
            </p>
            <p>
              E poi formattare il tutto in un documento presentabile.
            </p>
            <p>
              Alla fine della settimana hai fatto 10-15 preventivi e hai perso 15-20 ore. Ore che potevi usare per vendere, per stare in cantiere, per far crescere l'azienda.
            </p>
            <p className="font-semibold text-foreground">
              E il bello? Il 60-70% di quei preventivi non diventerà mai un ordine.
            </p>
          </div>

          <div className="mx-auto mt-10 max-w-2xl space-y-3">
            {[
              "Tempo sprecato su preventivi che non convertono",
              "Errori di calcolo che ti costano margine o credibilità",
              "Documenti poco professionali che non ti differenziano dalla concorrenza",
              "Detrazioni e IVA agevolata calcolate a mano — rischio di sbagliare",
              "Nessun modo di sapere quali preventivi convertono e perché",
            ].map((item) => (
              <div key={item} className="flex items-start gap-2 text-sm">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ===== LA SOLUZIONE ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Il Preventivatore AI che lavora come il tuo miglior commerciale
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(({ icon: Icon, title, text }) => (
              <Card key={title}>
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="rounded-lg bg-primary/10 p-2.5">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== COME FUNZIONA ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Da richiesta a preventivo inviato: 30 secondi.
          </h2>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                icon: Search,
                step: "1",
                title: "SELEZIONA",
                text: "Scegli il prodotto dal tuo catalogo già caricato (infissi, porte, persiane, accessori).",
              },
              {
                icon: Settings2,
                step: "2",
                title: "CONFIGURA",
                text: "Inserisci misure, colore, vetro, accessori. L'AI calcola prezzo base + varianti automaticamente.",
              },
              {
                icon: CheckCircle2,
                step: "3",
                title: "VERIFICA",
                text: "L'AI applica IVA corretta, detrazioni, ricariche e sconti. Tu controlli il totale in un click.",
              },
              {
                icon: Send,
                step: "4",
                title: "INVIA",
                text: "PDF professionale generato e inviato al cliente via email o WhatsApp. Salvato nel CRM con tracking apertura.",
              },
            ].map(({ icon: Icon, step, title, text }) => (
              <div key={step} className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div className="mt-4 text-xs font-bold text-primary uppercase tracking-wider">Step {step}</div>
                <h3 className="mt-2 text-xl font-bold">{title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ===== CONFRONTO MERCATO ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Quanto paghi oggi per fare preventivi?
          </h2>

          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="font-bold">Funzionalità</TableHead>
                  <TableHead className="text-center">Excel / Manuale</TableHead>
                  <TableHead className="text-center">Software Preventivi</TableHead>
                  <TableHead className="text-center font-bold text-primary">Edilizia.io AI</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {comparisonRows.map((row) => (
                  <TableRow key={row.label}>
                    <TableCell className="font-medium">{row.label}</TableCell>
                    <TableCell className="text-center text-sm">{row.excel}</TableCell>
                    <TableCell className="text-center text-sm">{row.software}</TableCell>
                    <TableCell className="text-center text-sm font-semibold text-primary">{row.edilizia}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== CASO STUDIO ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            "Prima facevamo 15 preventivi a settimana. Adesso 15 al giorno."
          </h2>

          <Card className="mx-auto mt-12 max-w-3xl">
            <CardContent className="p-8">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Azienda:</strong> Rivenditore serramenti — 4 commerciali</p>
                <p><strong className="text-foreground">Situazione:</strong> Ogni commerciale perdeva 1,5 ore al giorno in preventivi. Errori frequenti su IVA e detrazioni. Documenti non uniformi tra i venditori.</p>
              </div>

              <Separator className="my-6" />

              <h3 className="font-bold text-lg mb-4">Dopo 90 giorni con Preventivatore AI:</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Tempo per preventivo", value: "da 45 min a 2 min (−96%)" },
                  { label: "Errori IVA/detrazioni", value: "da 15% a 0%" },
                  { label: "Preventivi inviati/mese", value: "da 60 a 180 (+200%)" },
                  { label: "Conversione prev → ordine", value: "dal 18% al 26% (+44%)" },
                  { label: "Margine medio per ordine", value: "+8% (meno errori pricing)" },
                ].map((r) => (
                  <div key={r.label} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">
                      <strong>{r.label}:</strong> {r.value}
                    </span>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground">
                "Prima facevamo 15 preventivi a settimana per commerciale. Adesso ne facciamo 15 al giorno. E sono tutti perfetti."
              </blockquote>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* ===== PRICING ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Quanto costa fare preventivi perfetti?
          </h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <Card
                key={plan.name}
                className={`relative flex flex-col ${
                  plan.highlighted
                    ? "border-primary shadow-lg ring-2 ring-primary/20"
                    : ""
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground whitespace-nowrap">
                      {plan.badge}
                    </Badge>
                  </div>
                )}
                <CardHeader className="text-center pt-8">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <p className="mt-2">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </p>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col">
                  <ul className="flex-1 space-y-2 text-sm">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground text-center">
                    Setup: {plan.setup}
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    {plan.extra}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={() =>
                      window.open(
                        `https://wa.me/3900000000?text=${encodeURIComponent(
                          `Ciao, vorrei attivare il piano ${plan.name} del Preventivatore AI di Edilizia.io`
                        )}`,
                        "_blank"
                      )
                    }
                  >
                    Attiva {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
            💡 Fai i conti: se un commerciale risparmia 1,5 ore al giorno in preventivi, in un mese sono <strong>30 ore recuperate</strong>. A €25/ora di costo aziendale, risparmi <strong>€750/mese</strong>. Il piano Professional si ripaga 7 volte.
          </p>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== FAQ ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl mb-12">
            Domande frequenti
          </h2>

          <Accordion type="single" collapsible className="mx-auto max-w-3xl">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      {/* ===== GARANZIA + CTA FINALE ===== */}
      <AnimatedSection className="py-16 md:py-24" id="cta-finale">
        <div className="container mx-auto px-4">
          {/* Garanzia */}
          <div className="mx-auto max-w-2xl rounded-xl border border-primary/30 bg-primary/5 p-6 mb-12">
            <div className="flex items-start gap-3">
              <Shield className="mt-0.5 h-6 w-6 shrink-0 text-primary" />
              <div>
                <h3 className="font-bold text-lg">Garanzia 30 Giorni</h3>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                  Se il preventivatore non ti fa risparmiare almeno 5 ore a settimana, ti rimborsiamo il setup. Zero rischio.
                </p>
              </div>
            </div>
          </div>

          {/* CTA finale */}
          <div className="mx-auto max-w-3xl rounded-2xl bg-foreground text-background p-8 md:p-12 text-center">
            <h2 className="text-2xl font-bold md:text-3xl">
              Ogni preventivo fatto a mano è tempo rubato alla vendita.
            </h2>
            <p className="mt-4 text-background/70">
              Attiva il Preventivatore AI oggi. Da domani i tuoi preventivi si fanno da soli.
            </p>

            <Button
              size="lg"
              variant="secondary"
              className="mt-8 text-base px-8 py-6"
              onClick={() =>
                window.open(
                  `https://wa.me/3900000000?text=${encodeURIComponent(
                    "Ciao, vorrei attivare il Preventivatore AI di Edilizia.io"
                  )}`,
                  "_blank"
                )
              }
            >
              Attiva il Preventivatore AI Ora <ArrowRight className="ml-1" />
            </Button>

            {/* Countdown */}
            {!countdown.expired ? (
              <p className="mt-4 text-sm text-background/60">
                ⏰ Offerta riservata — scade tra{" "}
                <span className="font-bold text-background">
                  {countdown.days}g {countdown.hours}h {countdown.minutes}m
                </span>
              </p>
            ) : (
              <p className="mt-4 text-sm text-background/60">
                ⏰ Contattaci per verificare la disponibilità dell'offerta.
              </p>
            )}
          </div>
        </div>
      </AnimatedSection>

      <Footer />
    </div>
  );
}
