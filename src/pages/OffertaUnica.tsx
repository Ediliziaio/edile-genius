import { useRef } from "react";
import { motion } from "framer-motion";
import { usePageSEO } from "@/hooks/usePageSEO";
import {
  AnimatedSection,
  OfferHeader,
  OfferBadge,
  OfferCTABanner,
  OfferCountdown,
  OfferGuarantee,
  LogoBarMini,
  SectionDivider,
  HeroBlob,
  DotPattern,
  useCountdown,
  useNoIndex,
  staggerContainer,
  staggerItem,
} from "@/components/offerta/shared";
import CounterStat from "@/components/custom/CounterStat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Clock,
  ShieldCheck,
  Headphones,
  UserX,
  PhoneMissed,
  TrendingDown,
  Search,
  Target,
  Zap,
  CheckCircle2,
  CalendarCheck,
  BarChart3,
  DollarSign,
} from "lucide-react";

const NAV_LINKS = [
  { label: "Problema", href: "#problema" },
  { label: "Soluzione", href: "#soluzione" },
  { label: "Risultati", href: "#risultati" },
  { label: "Caso Studio", href: "#caso-studio" },
  { label: "Come Funziona", href: "#come-funziona" },
  { label: "FAQ", href: "#faq" },
  { label: "Garanzia", href: "#garanzia" },
];

const scrollToCta = () =>
  document.querySelector("#cta-finale")?.scrollIntoView({ behavior: "smooth" });

const PAIN_CARDS = [
  {
    icon: UserX,
    title: "Dipendenti improduttivi costano €3.200+/mese",
    desc: "Segretarie, centralinisti e operatori che gestiscono meno di 15 chiamate al giorno. Stai pagando stipendi pieni per attività che un AI fa in 1/10 del tempo.",
  },
  {
    icon: PhoneMissed,
    title: "Il 40% delle chiamate non viene risposto",
    desc: "Ogni chiamata persa è un potenziale cliente che va dalla concorrenza. In edilizia, un lead perso vale in media €4.500 di fatturato mancato.",
  },
  {
    icon: TrendingDown,
    title: "Margini erosi da costi fissi crescenti",
    desc: "TFR, ferie, malattie, contributi: il costo reale di un dipendente è 1.7x lo stipendio lordo. I tuoi margini si assottigliano ogni anno.",
  },
];

const SOLUTION_STEPS = [
  {
    icon: Search,
    title: "Analizziamo il tuo organico",
    desc: "Mappiamo ogni ruolo, i costi reali e le ore dedicate ad attività ripetitive e automatizzabili.",
  },
  {
    icon: Target,
    title: "Identifichiamo le figure sostituibili",
    desc: "Ti mostriamo esattamente quali ruoli possono essere coperti da Agenti AI, con il risparmio calcolato al centesimo.",
  },
  {
    icon: Zap,
    title: "Attiviamo Agenti AI specializzati",
    desc: "In 7 giorni hai agenti vocali attivi che rispondono, qualificano lead e fissano appuntamenti — 24/7, senza pause caffè.",
  },
];

const RESULTS = [
  { prefix: "+", value: 40, suffix: "", label: "Appuntamenti/mese", icon: CalendarCheck },
  { prefix: "−€", value: 6600, suffix: "", label: "Costi operativi/mese", icon: DollarSign },
  { prefix: "+€", value: 180, suffix: "K", label: "Fatturato/anno", icon: BarChart3 },
  { prefix: "+", value: 30, suffix: "%", label: "Lead qualificati", icon: Target },
  { prefix: "−", value: 70, suffix: "%", label: "Tempi di gestione", icon: Clock },
  { prefix: "€", value: 79200, suffix: "", label: "Risparmio/anno", icon: DollarSign },
];

const CASE_STUDY = {
  company: "Serramenti Bianchi S.r.l.",
  sector: "Serramenti — Milano",
  before: [
    "2 segretarie full-time (€5.400/mese totali)",
    "~35% chiamate perse in orario lavorativo",
    "12 appuntamenti/mese da telefonate",
    "Follow-up manuali, spesso dimenticati",
  ],
  after: [
    "1 Agente Vocale AI attivo 24/7 (€297/mese)",
    "0% chiamate perse — risposta in <1 secondo",
    "47 appuntamenti/mese qualificati",
    "Follow-up automatici entro 5 minuti",
  ],
  quote:
    "In 30 giorni abbiamo risparmiato più di €5.000 e triplicato gli appuntamenti. Non torneremmo mai indietro.",
  author: "Marco B., Titolare",
};

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Analisi Gratuita (15 min)",
    desc: "Analizziamo la tua struttura, i costi del personale e le opportunità di automazione. Zero impegno.",
  },
  {
    step: "02",
    title: "Setup in 7 Giorni",
    desc: "Configuriamo gli Agenti AI con la tua knowledge base, il tuo tono di voce e le tue regole commerciali.",
  },
  {
    step: "03",
    title: "Risultati dal Giorno 1",
    desc: "Gli agenti rispondono alle chiamate, qualificano i lead e fissano appuntamenti. Tu monitori tutto dalla dashboard.",
  },
];

const FAQ_ITEMS = [
  {
    q: "Quanto costa davvero il servizio?",
    a: "I piani partono da €197/mese — meno di 1/10 del costo di un dipendente. Il setup è gratuito se attivi entro 7 giorni.",
  },
  {
    q: "Funziona anche per la mia nicchia edile?",
    a: "Sì. Abbiamo agenti specializzati per serramenti, fotovoltaico, ristrutturazioni, impiantistica, edilizia generale e coperture.",
  },
  {
    q: "I clienti si accorgono che parlano con un AI?",
    a: "La nostra tecnologia vocale è indistinguibile da un operatore umano. Il 94% dei chiamanti non nota la differenza.",
  },
  {
    q: "Quanto tempo serve per essere operativi?",
    a: "7 giorni lavorativi dal kick-off. Include configurazione, test e go-live con monitoraggio dedicato.",
  },
  {
    q: "Posso provare senza rischi?",
    a: "Assolutamente. Offriamo garanzia soddisfatti o rimborsati entro 30 giorni. Se non vedi risultati, ti restituiamo tutto.",
  },
  {
    q: "Come si integra con il mio CRM o gestionale?",
    a: "Ci integriamo con i principali CRM (Salesforce, HubSpot, Zoho) e con qualsiasi tool tramite webhook e API. Setup incluso.",
  },
  {
    q: "Posso mantenere il mio numero di telefono?",
    a: "Sì, puoi portare il tuo numero esistente o attivarne uno nuovo dedicato. Supportiamo numeri fissi e mobili italiani.",
  },
];

const OffertaUnica = () => {
  usePageSEO({
    title: "Offerta Esclusiva — AI per Imprese Edili | Edilizia.io",
    description:
      "Riduci i costi del personale del 60% e triplica gli appuntamenti con Agenti Vocali AI specializzati per l'edilizia. Analisi gratuita di 15 minuti.",
    canonical: "/offerta-unica",
  });
  useNoIndex();
  const countdown = useCountdown("offerta_unica_first_visit");

  return (
    <div className="min-h-screen bg-background">
      <OfferHeader
        ctaText="Prenota Analisi Gratuita"
        onCtaClick={scrollToCta}
        navLinks={NAV_LINKS}
      />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
        <HeroBlob />
        <DotPattern />
        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          <OfferBadge>🔒 Pagina riservata — offerta valida 7 giorni</OfferBadge>

          <h1 className="mt-6 font-display text-[32px] sm:text-5xl md:text-6xl font-extrabold leading-[1.1] tracking-tight">
            Le imprese edili più avanzate{" "}
            <span className="text-primary">hanno già sostituito</span> i ruoli
            improduttivi con l'AI
          </h1>

          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Segretarie, centralinisti, operatori di back-office: scopri quanto
            stai spendendo per attività che un Agente Vocale AI fa meglio,
            24 ore su 24, a 1/10 del costo.
          </p>

          <div className="mt-8">
            <OfferCountdown countdown={countdown} variant="light" />
          </div>

          <Button
            size="lg"
            className="mt-8 text-base px-8 py-6 shadow-button-green hover:-translate-y-0.5 transition-all"
            onClick={scrollToCta}
          >
            Prenota Analisi Gratuita 15 Min <ArrowRight className="ml-2 h-5 w-5" />
          </Button>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {[
              { icon: Clock, text: "Setup in 7 giorni" },
              { icon: ShieldCheck, text: "Garanzia 30 giorni" },
              { icon: Headphones, text: "Supporto 24/7" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-full px-4 py-2 text-sm font-medium"
              >
                <Icon className="h-4 w-4 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── LOGO BAR ─── */}
      <LogoBarMini />
      <SectionDivider />

      {/* ─── IL PROBLEMA ─── */}
      <AnimatedSection
        id="problema"
        className="py-20 md:py-28 container mx-auto px-4"
        stagger
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <OfferBadge>Il Problema</OfferBadge>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
            Stai <span className="text-destructive">bruciando margini</span> ogni mese
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Ecco cosa succede nelle aziende edili che non hanno ancora automatizzato.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {PAIN_CARDS.map((card) => (
            <motion.div key={card.title} variants={staggerItem}>
              <Card className="h-full border-destructive/20 hover:border-destructive/40 transition-colors">
                <CardContent className="pt-8 pb-6 px-6 text-center">
                  <div className="mx-auto w-14 h-14 rounded-2xl bg-destructive/10 flex items-center justify-center mb-4">
                    <card.icon className="h-7 w-7 text-destructive" />
                  </div>
                  <h3 className="font-bold text-lg mb-2">{card.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ─── LA SOLUZIONE ─── */}
      <AnimatedSection
        id="soluzione"
        className="py-20 md:py-28 bg-muted/30 container mx-auto px-4"
        stagger
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <OfferBadge>La Soluzione</OfferBadge>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
            Cosa facciamo per la tua azienda
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {SOLUTION_STEPS.map((step, i) => (
            <motion.div key={step.title} variants={staggerItem}>
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center mb-4">
                  <step.icon className="h-7 w-7 text-primary" />
                </div>
                <span className="text-xs font-mono text-primary font-bold">STEP {i + 1}</span>
                <h3 className="font-bold text-lg mt-1 mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ─── RISULTATI ─── */}
      <AnimatedSection
        id="risultati"
        className="py-20 md:py-28 container mx-auto px-4"
        stagger
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <OfferBadge>Risultati Concreti</OfferBadge>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
            Quanto puoi <span className="text-primary">guadagnare</span> (e risparmiare)
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          {RESULTS.map((r) => (
            <motion.div key={r.label} variants={staggerItem}>
              <Card className="text-center hover:border-primary/30 transition-colors">
                <CardContent className="pt-6 pb-5">
                  <r.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <div className="text-2xl md:text-3xl font-extrabold font-mono">
                    <CounterStat end={r.value} prefix={r.prefix} suffix={r.suffix} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{r.label}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ─── CASO STUDIO ─── */}
      <AnimatedSection
        id="caso-studio"
        className="py-20 md:py-28 bg-muted/30"
      >
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-14">
            <OfferBadge>Caso Studio Reale</OfferBadge>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
              {CASE_STUDY.company}
            </h2>
            <p className="text-muted-foreground mt-1">{CASE_STUDY.sector}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* PRIMA */}
            <Card className="border-destructive/30">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg text-destructive mb-4">❌ Prima</h3>
                <ul className="space-y-3">
                  {CASE_STUDY.before.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <span className="text-destructive mt-0.5">✗</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            {/* DOPO */}
            <Card className="border-primary/30 shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg text-primary mb-4">✅ Dopo (30 giorni)</h3>
                <ul className="space-y-3">
                  {CASE_STUDY.after.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <blockquote className="mt-10 max-w-2xl mx-auto text-center border-l-4 border-primary pl-6 italic text-muted-foreground text-lg">
            "{CASE_STUDY.quote}"
            <footer className="mt-2 text-sm font-semibold text-foreground not-italic">
              — {CASE_STUDY.author}
            </footer>
          </blockquote>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ─── COME FUNZIONA ─── */}
      <AnimatedSection
        id="come-funziona"
        className="py-20 md:py-28 container mx-auto px-4"
        stagger
      >
        <div className="text-center max-w-2xl mx-auto mb-14">
          <OfferBadge>Come Funziona</OfferBadge>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
            3 passi per <span className="text-primary">trasformare</span> la tua azienda
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {HOW_IT_WORKS.map((s) => (
            <motion.div key={s.step} variants={staggerItem}>
              <div className="text-center">
                <span className="inline-block text-5xl font-extrabold font-mono text-primary/20 mb-2">
                  {s.step}
                </span>
                <h3 className="font-bold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
        <div className="text-center mt-10">
          <Button size="lg" onClick={scrollToCta} className="shadow-button-green">
            Inizia dall'Analisi Gratuita <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ─── FAQ ─── */}
      <AnimatedSection id="faq" className="py-20 md:py-28 bg-muted/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="text-center mb-14">
            <OfferBadge>Domande Frequenti</OfferBadge>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
              Hai dei dubbi? È normale.
            </h2>
          </div>
          <Accordion type="single" collapsible className="w-full">
            {FAQ_ITEMS.map((item, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-semibold">
                  {item.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ─── GARANZIA ─── */}
      <AnimatedSection id="garanzia" className="py-20 md:py-28">
        <OfferGuarantee title="Zero rischi, risultati garantiti">
          <p>
            Prova il servizio per 30 giorni. Se non sei soddisfatto dei risultati,
            ti restituiamo il 100% di quanto pagato. Nessuna domanda, nessuna
            complicazione. Il rischio è tutto nostro.
          </p>
        </OfferGuarantee>
      </AnimatedSection>

      {/* ─── CTA FINALE ─── */}
      <OfferCTABanner
        headline={
          <>
            Prenota la tua <span className="text-primary">Analisi Gratuita</span> di 15 minuti
          </>
        }
        subtitle="Scopri esattamente quanto puoi risparmiare e quanti appuntamenti in più puoi generare. Zero impegno."
        ctaText="Prenota Ora — È Gratis"
        ctaHref="https://calendly.com/edilizia-io/analisi-gratuita"
        countdown={countdown}
        footerLink={{ label: "← Torna al sito principale", to: "/" }}
      />
    </div>
  );
};

export default OffertaUnica;
