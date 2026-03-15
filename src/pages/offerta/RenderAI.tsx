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
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Zap,
  Camera,
  DollarSign,
  CheckCircle2,
  XCircle,
  Shield,
  Star,
  ArrowRight,
  Palette,
  Sparkles,
  Image,
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

const COUNTDOWN_KEY = "offerta_render_first_visit";
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

/* ---------- before/after data ---------- */
const beforeAfterPairs = [
  {
    before: "Foto finestra vecchia in alluminio",
    after: "Render fotorealistico con infisso nuovo in PVC effetto legno, tapparella, davanzale",
    caption: "Render infisso PVC effetto rovere — generato in 8 secondi",
  },
  {
    before: "Foto bagno datato con piastrelle anni '80",
    after: "Render bagno moderno con doccia walk-in, mobile sospeso, specchio LED",
    caption: "Render bagno completo — generato in 12 secondi",
  },
  {
    before: "Foto facciata con cappotto rovinato",
    after: "Render facciata con cappotto nuovo, persiane coordinate, fotovoltaico sul tetto",
    caption: "Render esterno con fotovoltaico — generato in 15 secondi",
  },
];

/* ---------- pricing data ---------- */
const plans = [
  {
    name: "Starter",
    price: "€67",
    period: "/mese",
    setup: "€97 una tantum",
    extra: "Extra render: €2,50 cad.",
    features: [
      "30 render/mese",
      "Render infissi e stanze",
      "Galleria render salvati",
      "Esportazione PDF",
      "Supporto email",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "€127",
    period: "/mese",
    setup: "€197 una tantum",
    extra: "Extra render: €2,00 cad.",
    badge: "⭐ Più scelto",
    features: [
      "80 render/mese",
      "Render infissi, stanze ed esterni",
      "Galleria con condivisione cliente",
      "PDF brandizzato per preventivi",
      "Before/After automatico",
      "Supporto prioritario",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    price: "€247",
    period: "/mese",
    setup: "€297 una tantum",
    extra: "Extra render: €1,80 cad.",
    features: [
      "200 render/mese",
      "Tutti i tipi di render",
      "Alta risoluzione (1536px)",
      "Galleria condivisa team",
      "Integrazione preventivatore",
      "Ottimizzazione stili mensile",
      "5 utenti",
    ],
    highlighted: false,
  },
  {
    name: "Unlimited",
    price: "€447",
    period: "/mese",
    setup: "€397 una tantum",
    extra: "Extra render: €1,50 cad.",
    features: [
      "500 render/mese",
      "Tutto Business +",
      "Render prioritari (coda dedicata)",
      "Stili custom per brand",
      "10 utenti",
      "Account Manager",
    ],
    highlighted: false,
  },
];

/* ---------- FAQ data ---------- */
const faqs = [
  {
    q: "Funziona davvero con gli infissi? Sono precisi?",
    a: "Sì. L'AI è addestrata su centinaia di migliaia di immagini architettoniche. Riconosce finestre, porte, persiane e le sostituisce nell'immagine mantenendo prospettiva, illuminazione e ombre. Non è un fotomontaggio — è un render fotorealistico generato da AI. Il risultato è sufficientemente preciso per vendere, non per produrre.",
  },
  {
    q: "Posso usarlo durante l'appuntamento dal cliente?",
    a: "Assolutamente. È pensato esattamente per quello. Scatti la foto con il telefono, selezioni il prodotto, e in 10 secondi mostri il render sul tablet o sullo smartphone. L'effetto sul cliente è immediato.",
  },
  {
    q: "Il render è abbastanza realistico da mostrare al cliente finale?",
    a: "Sì. La qualità è paragonabile a render professionali da €200-300. Non è perfetto al pixel come un render 3D fatto a mano da un architetto, ma per la vendita è più che sufficiente — e lo hai in 10 secondi invece che in 10 giorni.",
  },
  {
    q: "Posso mettere il render nel preventivo?",
    a: "Sì. Puoi esportare ogni render in PDF e allegarlo al preventivo. Se usi il Preventivatore AI di Edilizia.io, il render viene allegato automaticamente.",
  },
  {
    q: "E per i bagni e le facciate funziona uguale?",
    a: "Sì. L'AI genera render per interni (bagni, cucine, stanze), esterni (facciate, coperture, fotovoltaico) e infissi specifici. Ogni tipo ha stili e opzioni dedicate.",
  },
];

/* ========== PAGE COMPONENT ========== */

export default function OffertaRenderAI() {
  usePageSEO({
    title: "Offerta Render AI — Edilizia.io",
    description: "Render fotorealistici in 10 secondi per chiudere più vendite. Offerta riservata.",
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
            Attiva Render AI <ArrowRight className="ml-1 h-4 w-4" />
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
            Mostra al Cliente Come Starà Casa Sua.
            <br className="hidden md:block" />
            Prima Ancora di Iniziare i Lavori.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Render fotorealistici di infissi, bagni, facciate e stanze complete. In 10 secondi. Senza renderista, senza software 3D, senza aspettare 2 settimane.
          </p>

          {/* Mini stats */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            {[
              { icon: Zap, text: "Render in 10 secondi" },
              { icon: Camera, text: "Qualità fotorealistica" },
              { icon: DollarSign, text: "Da €0,67 a render (vs €200+)" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-5 w-5 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <Button size="lg" className="mt-10 text-base px-8 py-6" onClick={scrollToCta}>
            Attiva Render AI <ArrowRight className="ml-1" />
          </Button>

          <p className="mt-3 text-sm text-muted-foreground">
            Attivo in giornata. Disdici quando vuoi.
          </p>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== BEFORE/AFTER GRID ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Da una foto del cantiere al render del risultato finale
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {beforeAfterPairs.map((pair, i) => (
              <div key={i} className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {/* PRIMA placeholder */}
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed border-destructive/30 bg-destructive/5 p-4">
                    <div className="text-center">
                      <Image className="mx-auto h-8 w-8 text-destructive/40" />
                      <p className="mt-2 text-xs text-destructive/60 font-medium">PRIMA</p>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{pair.before}</p>
                    </div>
                  </div>
                  {/* DOPO placeholder */}
                  <div className="flex aspect-[4/3] items-center justify-center rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-4">
                    <div className="text-center">
                      <Sparkles className="mx-auto h-8 w-8 text-primary/40" />
                      <p className="mt-2 text-xs text-primary/60 font-medium">DOPO</p>
                      <p className="mt-1 text-[10px] text-muted-foreground leading-tight">{pair.after}</p>
                    </div>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground italic">{pair.caption}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ===== IL PROBLEMA ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Il tuo cliente non compra quello che non può immaginare
          </h2>

          <div className="mx-auto mt-12 max-w-4xl grid gap-6 md:grid-cols-2">
            {/* Senza Render AI */}
            <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6">
              <h3 className="mb-4 font-bold text-destructive text-lg">Senza Render AI</h3>
              <ul className="space-y-3 text-sm">
                {[
                  "Il cliente vede solo un campione di colore e un catalogo PDF",
                  "Non riesce a immaginare il risultato nel SUO ambiente",
                  "Chiede tempo per \"pensarci\" — e non torna più",
                  "Confronta il tuo preventivo con quello del concorrente solo sul prezzo",
                  "Se vuoi un render professionale: €200-500 a render, 5-10 giorni di attesa",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            {/* Con Render AI */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6">
              <h3 className="mb-4 font-bold text-primary text-lg">Con Render AI</h3>
              <ul className="space-y-3 text-sm">
                {[
                  "Mostri al cliente ESATTAMENTE come starà il risultato a casa sua",
                  "Il cliente si emoziona — vede il suo bagno nuovo, i suoi infissi",
                  "L'effetto \"wow\" elimina l'obiezione \"ci penso\"",
                  "Giustifichi il tuo prezzo premium mostrando il valore visivamente",
                  "Render fotorealistico in 10 secondi, direttamente in appuntamento",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== COME FUNZIONA ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            3 click. 10 secondi. Un render che chiude la vendita.
          </h2>

          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                icon: Camera,
                step: "1",
                title: "SCATTA",
                text: "Scatta una foto dell'ambiente attuale con lo smartphone. La finestra da sostituire, il bagno da ristrutturare, la facciata da rifare.",
              },
              {
                icon: Palette,
                step: "2",
                title: "SCEGLI",
                text: "Seleziona il prodotto: tipo di infisso, colore, materiale, stile del bagno, colore facciata. Oppure descrivi a parole cosa vuoi ottenere.",
              },
              {
                icon: Sparkles,
                step: "3",
                title: "MOSTRA",
                text: "In 10 secondi hai il render fotorealistico. Mostralo al cliente sul tablet o invialo via WhatsApp. Salva nella galleria e allega al preventivo PDF.",
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

      {/* ===== CASO STUDIO ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            "Da quando uso i render, chiudo il 35% in più."
          </h2>

          <Card className="mx-auto mt-12 max-w-3xl">
            <CardContent className="p-8">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong className="text-foreground">Azienda:</strong> Serramentista in Lombardia</p>
                <p><strong className="text-foreground">Settore:</strong> Infissi PVC/Alluminio</p>
                <p><strong className="text-foreground">Situazione:</strong> Preventivi sempre confrontati solo sul prezzo. Il cliente non percepiva la differenza tra un infisso da €8.000 e uno da €5.000.</p>
                <p><strong className="text-foreground">Soluzione:</strong> Render AI di Edilizia.io integrato nel processo di vendita. Il commerciale scatta una foto e mostra il render durante l'appuntamento.</p>
              </div>

              <Separator className="my-6" />

              <h3 className="font-bold text-lg mb-4">Risultati dopo 60 giorni:</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {[
                  { label: "Tasso di chiusura", value: "dal 22% al 35% (+59%)" },
                  { label: "Prezzo medio accettato", value: "+12% (meno sconti)" },
                  { label: "Tempo per render", value: "da 7 giorni a 10 secondi" },
                  { label: "Costo per render", value: "da €250 a €2,00" },
                  { label: "Clienti \"wow effect\"", value: "92% reagisce positivamente" },
                ].map((r) => (
                  <div key={r.label} className="flex items-start gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span className="text-sm">
                      <strong>{r.label}:</strong> {r.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-lg bg-muted/60 p-4">
                <p className="text-sm italic text-muted-foreground">
                  "I clienti mi dicono: sei l'unico che mi ha fatto VEDERE come verranno le finestre a casa mia. Questo vale più di qualsiasi sconto."
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== PRICING ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Meno di un caffè a render. Più vendite a fine mese.
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
                  <p className="mt-1 text-xs text-muted-foreground text-center">
                    {plan.extra}
                  </p>
                  <Button
                    className="mt-4 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={scrollToCta}
                  >
                    Attiva {plan.name}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mx-auto mt-8 max-w-2xl rounded-xl border border-primary/30 bg-primary/5 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              💡 <strong>Fai i conti:</strong> se un singolo render ti aiuta a chiudere anche solo 1 commessa in più al mese da €8.000, il pacchetto si ripaga 10 volte.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== FAQ ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Domande frequenti
          </h2>

          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base">
                  {faq.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {faq.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== GARANZIA ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">
              Garanzia 30 Giorni
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Prova i Render AI per 30 giorni. Se non migliora il tuo tasso di chiusura, ti rimborsiamo il setup.
              <br />
              Zero rischio.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== CTA FINALE ===== */}
      <section id="cta-finale" className="bg-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-background md:text-4xl">
            Ogni preventivo senza render è una vendita più difficile.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-background/70">
            Attiva i Render AI oggi. Domani chiudi con le immagini.
          </p>

          <Button
            size="lg"
            variant="secondary"
            className="mt-8 text-base px-8 py-6"
            onClick={() => window.open("https://wa.me/393000000000?text=Ciao%2C%20vorrei%20attivare%20i%20Render%20AI%20di%20Edilizia.io", "_blank")}
          >
            Attiva Render AI Ora <ArrowRight className="ml-1" />
          </Button>

          <p className="mt-4 text-sm text-background/60">
            ⏰ Offerta riservata valida per 7 giorni.
          </p>

          {/* Countdown */}
          {!countdown.expired && (
            <div className="mt-8 flex items-center justify-center gap-4">
              <p className="text-sm text-background/50">Questa offerta scade tra:</p>
              {[
                { val: countdown.days, label: "giorni" },
                { val: countdown.hours, label: "ore" },
                { val: countdown.minutes, label: "minuti" },
              ].map(({ val, label }) => (
                <div key={label} className="text-center">
                  <span className="block text-2xl font-bold text-background">{String(val).padStart(2, "0")}</span>
                  <span className="text-xs text-background/50">{label}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
