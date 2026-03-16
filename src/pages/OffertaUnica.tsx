import { useState } from "react";
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
  StarRating,
  useCountdown,
  useNoIndex,
  staggerContainer,
  staggerItem,
} from "@/components/offerta/shared";
import CounterStat from "@/components/custom/CounterStat";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
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
  XCircle,
  Flame,
  Sparkles,
  Users,
  Phone,
  MessageSquare,
  TrendingUp,
  Gift,
} from "lucide-react";

/* ── Floating Orb background component ── */
const FloatingOrbs = ({ color = "primary", count = 3 }: { color?: string; count?: number }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <motion.div
        key={i}
        className={`absolute rounded-full pointer-events-none bg-${color}/10 blur-[80px]`}
        style={{
          width: 200 + i * 100,
          height: 200 + i * 100,
          top: `${15 + i * 25}%`,
          left: `${10 + i * 30}%`,
        }}
        animate={{
          x: [0, 30 * (i % 2 === 0 ? 1 : -1), 0],
          y: [0, -20 * (i % 2 === 0 ? -1 : 1), 0],
          scale: [1, 1.1, 1],
        }}
        transition={{ duration: 8 + i * 2, repeat: Infinity, ease: "easeInOut" }}
      />
    ))}
  </>
);

/* ── Circuit pattern for AI theme ── */
const CircuitPattern = () => (
  <div
    className="absolute inset-0 pointer-events-none opacity-[0.03]"
    style={{
      backgroundImage: `
        linear-gradient(90deg, hsl(var(--primary)) 1px, transparent 1px),
        linear-gradient(hsl(var(--primary)) 1px, transparent 1px)
      `,
      backgroundSize: "60px 60px",
    }}
  />
);

/* ── NAV ── */
const NAV_LINKS = [
  { label: "Problema", href: "#problema" },
  { label: "Costo Inazione", href: "#costo-inazione" },
  { label: "Soluzione", href: "#soluzione" },
  { label: "Per Chi È", href: "#qualificazione" },
  { label: "Risultati", href: "#risultati" },
  { label: "Value Stack", href: "#value-stack" },
  { label: "Caso Studio", href: "#caso-studio" },
  { label: "Testimonianze", href: "#testimonianze" },
  { label: "ROI Calculator", href: "#roi-calculator" },
  { label: "FAQ", href: "#faq" },
];

const scrollToCta = () =>
  document.querySelector("#cta-finale")?.scrollIntoView({ behavior: "smooth" });

/* ── DATA ── */
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

const INACTION_COSTS = [
  { label: "Chiamate perse", value: "€4.500", period: "/mese", desc: "10 chiamate perse × €450 valore medio lead" },
  { label: "Dipendente improduttivo", value: "€38.400", period: "/anno", desc: "€3.200/mese lordo con contributi e TFR" },
  { label: "Fatturato mancato in 12 mesi", value: "€180.000", period: "", desc: "Appuntamenti non fissati, follow-up dimenticati, preventivi mai inviati" },
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

const QUALIFICATION_YES = [
  "Hai un'impresa edile con almeno 5 dipendenti",
  "Ricevi più di 50 chiamate al mese",
  "Vuoi ridurre i costi del personale senza perdere qualità",
  "Sei stanco di perdere clienti per mancate risposte",
  "Cerchi un vantaggio competitivo concreto e misurabile",
  "Sei pronto ad agire nei prossimi 7 giorni",
];

const QUALIFICATION_NO = [
  "Hai meno di 5 chiamate al mese",
  "Non vuoi cambiare nulla nel tuo modo di lavorare",
  "Pensi che l'AI sia una moda passeggera",
  "Cerchi la soluzione più economica, non la più efficace",
  "Non sei disposto a investire 15 minuti per un'analisi gratuita",
];

const RESULTS = [
  { prefix: "+", value: 40, suffix: "", label: "Appuntamenti/mese", icon: CalendarCheck },
  { prefix: "−€", value: 6600, suffix: "", label: "Costi operativi/mese", icon: DollarSign },
  { prefix: "+€", value: 180, suffix: "K", label: "Fatturato/anno", icon: BarChart3 },
  { prefix: "+", value: 30, suffix: "%", label: "Lead qualificati", icon: Target },
  { prefix: "−", value: 70, suffix: "%", label: "Tempi di gestione", icon: Clock },
  { prefix: "€", value: 79200, suffix: "", label: "Risparmio/anno", icon: DollarSign },
];

const VALUE_STACK = [
  { item: "Agente Vocale AI attivo 24/7", value: "€3.200/mese", icon: Phone },
  { item: "Setup e configurazione personalizzata", value: "€2.500", icon: Zap },
  { item: "Knowledge base con i tuoi servizi e listini", value: "€1.200", icon: MessageSquare },
  { item: "Integrazione CRM + calendario automatico", value: "€800", icon: CalendarCheck },
  { item: "Dashboard analytics e reportistica", value: "€600/mese", icon: BarChart3 },
  { item: "Supporto dedicato e ottimizzazione mensile", value: "€500/mese", icon: Headphones },
  { item: "Follow-up automatici post-chiamata", value: "€400/mese", icon: TrendingUp },
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

const TESTIMONIALS = [
  {
    name: "Giuseppe R.",
    role: "Titolare",
    company: "Edilgroup Roma",
    sector: "Ristrutturazioni",
    quote: "Abbiamo eliminato 2 posizioni di back-office e raddoppiato gli appuntamenti in 45 giorni. Il ROI è stato immediato.",
    stars: 5,
  },
  {
    name: "Laura M.",
    role: "Responsabile Commerciale",
    company: "SolarTech Italia",
    sector: "Fotovoltaico",
    quote: "I nostri tecnici ora fanno solo sopralluoghi qualificati. L'AI filtra il 90% delle richieste non pertinenti. Incredibile.",
    stars: 5,
  },
  {
    name: "Andrea T.",
    role: "CEO",
    company: "Termoidraulica Verdi",
    sector: "Impiantistica",
    quote: "Rispondiamo a ogni chiamata anche di notte e nei weekend. I competitor non capiscono come facciamo. Vantaggio enorme.",
    stars: 5,
  },
];

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
  { q: "Quanto costa davvero il servizio?", a: "I piani partono da €197/mese — meno di 1/10 del costo di un dipendente. Il setup è gratuito se attivi entro 7 giorni." },
  { q: "Funziona anche per la mia nicchia edile?", a: "Sì. Abbiamo agenti specializzati per serramenti, fotovoltaico, ristrutturazioni, impiantistica, edilizia generale e coperture." },
  { q: "I clienti si accorgono che parlano con un AI?", a: "La nostra tecnologia vocale è indistinguibile da un operatore umano. Il 94% dei chiamanti non nota la differenza." },
  { q: "Quanto tempo serve per essere operativi?", a: "7 giorni lavorativi dal kick-off. Include configurazione, test e go-live con monitoraggio dedicato." },
  { q: "Posso provare senza rischi?", a: "Assolutamente. Offriamo garanzia soddisfatti o rimborsati entro 30 giorni. Se non vedi risultati, ti restituiamo tutto." },
  { q: "Come si integra con il mio CRM o gestionale?", a: "Ci integriamo con i principali CRM (Salesforce, HubSpot, Zoho) e con qualsiasi tool tramite webhook e API. Setup incluso." },
  { q: "Posso mantenere il mio numero di telefono?", a: "Sì, puoi portare il tuo numero esistente o attivarne uno nuovo dedicato. Supportiamo numeri fissi e mobili italiani." },
];

/* ── PAGE COMPONENT ── */
const OffertaUnica = () => {
  usePageSEO({
    title: "Offerta Esclusiva — AI per Imprese Edili | Edilizia.io",
    description:
      "Riduci i costi del personale del 60% e triplica gli appuntamenti con Agenti Vocali AI specializzati per l'edilizia. Analisi gratuita di 15 minuti.",
    canonical: "/offerta-unica",
  });
  useNoIndex();
  const countdown = useCountdown("offerta_unica_first_visit");
  const [callsPerMonth, setCallsPerMonth] = useState(100);

  const missedCalls = Math.round(callsPerMonth * 0.4);
  const lostRevenue = missedCalls * 450;
  const annualSavings = lostRevenue * 12 + 38400;

  return (
    <div className="min-h-screen bg-background">
      <OfferHeader ctaText="Prenota Analisi Gratuita" onCtaClick={scrollToCta} navLinks={NAV_LINKS} />

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
        <HeroBlob />
        <DotPattern />
        <FloatingOrbs color="primary" count={4} />

        {/* Animated particles */}
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={`particle-${i}`}
            className="absolute w-2 h-2 rounded-full bg-primary/30"
            style={{ top: `${20 + i * 12}%`, left: `${5 + i * 16}%` }}
            animate={{
              y: [0, -40, 0],
              opacity: [0.3, 0.8, 0.3],
              scale: [1, 1.5, 1],
            }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}

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
            24 ore su 24, a <strong className="text-foreground">1/10 del costo</strong>.
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

          {/* Scarcity - Kennedy */}
          <motion.p
            className="mt-4 text-sm font-semibold text-destructive"
            animate={{ opacity: [0.7, 1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            🔴 Solo 7 posti disponibili questo mese
          </motion.p>

          <div className="mt-8 flex flex-wrap justify-center gap-4">
            {[
              { icon: Clock, text: "Setup in 7 giorni" },
              { icon: ShieldCheck, text: "Garanzia 30 giorni" },
              { icon: Headphones, text: "Supporto 24/7" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 bg-muted/50 border border-border/60 rounded-full px-4 py-2 text-sm font-medium">
                <Icon className="h-4 w-4 text-primary" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ LOGO BAR ═══════════════════ */}
      <LogoBarMini />
      <SectionDivider />

      {/* ═══════════════════ IL PROBLEMA ═══════════════════ */}
      <AnimatedSection id="problema" className="py-20 md:py-28 container mx-auto px-4 relative overflow-hidden" stagger>
        <FloatingOrbs color="destructive" count={2} />
        <div className="text-center max-w-2xl mx-auto mb-14 relative z-10">
          <OfferBadge>Il Problema</OfferBadge>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
            Stai <span className="text-destructive">bruciando margini</span> ogni mese
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            Ecco cosa succede nelle aziende edili che non hanno ancora automatizzato.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto relative z-10">
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

      {/* ═══════════════════ COSTO DELL'INAZIONE (Abraham) ═══════════════════ */}
      <AnimatedSection id="costo-inazione" className="py-20 md:py-28 relative overflow-hidden">
        {/* Pulsing red/orange gradient background */}
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, hsl(0 84% 60% / 0.06), hsl(30 100% 50% / 0.04), hsl(0 84% 60% / 0.06))" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
        <CircuitPattern />

        <div className="container mx-auto px-4 max-w-4xl relative z-10">
          <div className="text-center mb-14">
            <OfferBadge>⚠️ Il Costo dell'Inazione</OfferBadge>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
              Ogni mese che aspetti, <span className="text-destructive">perdi soldi</span>
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Jay Abraham lo chiama "il costo opportunità nascosto". Ecco i numeri reali:
            </p>
          </div>

          <div className="space-y-4">
            {INACTION_COSTS.map((cost, i) => (
              <motion.div
                key={cost.label}
                initial={{ opacity: 0, x: -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
              >
                <Card className="border-destructive/20 bg-background/80 backdrop-blur-sm">
                  <CardContent className="py-5 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                        <Flame className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{cost.label}</p>
                        <p className="text-sm text-muted-foreground">{cost.desc}</p>
                      </div>
                    </div>
                    <span className="text-2xl md:text-3xl font-extrabold font-mono text-destructive whitespace-nowrap">
                      {cost.value}<span className="text-base text-muted-foreground">{cost.period}</span>
                    </span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          <div className="text-center mt-10">
            <p className="text-lg font-bold text-foreground mb-4">
              Totale perdita potenziale: <span className="text-destructive text-2xl">€222.900/anno</span>
            </p>
            <Button size="lg" onClick={scrollToCta} className="shadow-button-green">
              Ferma le Perdite — Analisi Gratuita <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ═══════════════════ LA SOLUZIONE ═══════════════════ */}
      <AnimatedSection id="soluzione" className="py-20 md:py-28 relative overflow-hidden" stagger>
        <DotPattern />
        <HeroBlob />
        <div className="container mx-auto px-4 relative z-10">
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
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ═══════════════════ PER CHI È / NON È (Kennedy) ═══════════════════ */}
      <AnimatedSection id="qualificazione" className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
        <FloatingOrbs color="primary" count={3} />
        <DotPattern />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-14">
            <OfferBadge>Qualificazione</OfferBadge>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
              Questo è per te? <span className="text-primary">Scopriamolo.</span>
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Non lavoriamo con tutti. Lavoriamo con chi è pronto a vincere.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* PER CHI È */}
            <Card className="border-primary/30 shadow-md">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg text-primary mb-4 flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5" /> Perfetto per te se...
                </h3>
                <ul className="space-y-3">
                  {QUALIFICATION_YES.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* PER CHI NON È */}
            <Card className="border-destructive/20">
              <CardContent className="pt-6">
                <h3 className="font-bold text-lg text-destructive mb-4 flex items-center gap-2">
                  <XCircle className="h-5 w-5" /> NON è per te se...
                </h3>
                <ul className="space-y-3">
                  {QUALIFICATION_NO.map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm">
                      <XCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
                      <span className="text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ═══════════════════ RISULTATI ═══════════════════ */}
      <AnimatedSection id="risultati" className="py-20 md:py-28 container mx-auto px-4 relative overflow-hidden" stagger>
        <CircuitPattern />
        <FloatingOrbs color="primary" count={2} />
        <div className="text-center max-w-2xl mx-auto mb-14 relative z-10">
          <OfferBadge>Risultati Concreti</OfferBadge>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
            Quanto puoi <span className="text-primary">guadagnare</span> (e risparmiare)
          </h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-w-4xl mx-auto relative z-10">
          {RESULTS.map((r) => (
            <motion.div key={r.label} variants={staggerItem}>
              <Card className="text-center hover:border-primary/30 transition-colors">
                <CardContent className="pt-6 pb-5">
                  <r.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                  <CounterStat value={r.value} prefix={r.prefix} suffix={r.suffix} label={r.label} className="text-2xl md:text-3xl font-extrabold font-mono" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ═══════════════════ VALUE STACK (Hormozi) ═══════════════════ */}
      <AnimatedSection id="value-stack" className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
        <FloatingOrbs color="primary" count={2} />
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
          <div className="text-center mb-14">
            <OfferBadge>💎 Il Valore Reale</OfferBadge>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
              Ecco cosa ottieni — <span className="text-primary">valore totale €9.200+</span>
            </h2>
            <p className="mt-3 text-muted-foreground text-lg">
              Alex Hormozi la chiama "offerta irresistibile". Ecco perché:
            </p>
          </div>

          {/* Shimmer border card */}
          <motion.div
            className="rounded-2xl border-2 border-primary/40 bg-background p-6 md:p-8 relative overflow-hidden"
            style={{ boxShadow: "0 0 40px -10px hsl(var(--primary) / 0.2)" }}
            animate={{
              borderColor: [
                "hsl(var(--primary) / 0.3)",
                "hsl(var(--primary) / 0.7)",
                "hsl(var(--primary) / 0.3)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            {/* Shimmer sweep */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.08), transparent)",
                width: "200%",
              }}
              animate={{ x: ["-100%", "100%"] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            />

            <div className="space-y-4 relative z-10">
              {VALUE_STACK.map((vs) => (
                <div key={vs.item} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <vs.icon className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-sm font-medium">{vs.item}</span>
                  </div>
                  <span className="text-sm font-bold text-muted-foreground whitespace-nowrap">
                    Valore: {vs.value}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 pt-6 border-t-2 border-primary/20 text-center relative z-10">
              <p className="text-muted-foreground text-sm">Valore totale</p>
              <p className="text-2xl font-extrabold text-muted-foreground line-through">€9.200/mese</p>
              <p className="mt-2 text-sm text-muted-foreground">Il tuo investimento:</p>
              <p className="text-4xl md:text-5xl font-extrabold text-primary font-display">
                da €197<span className="text-lg text-muted-foreground font-normal">/mese</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Setup GRATIS se attivi entro 7 giorni</p>
            </div>
          </motion.div>

          <div className="text-center mt-8">
            <Button size="lg" onClick={scrollToCta} className="shadow-button-green">
              Sblocca l'Offerta — Prenota Ora <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ═══════════════════ CASO STUDIO ═══════════════════ */}
      <AnimatedSection id="caso-studio" className="py-20 md:py-28 relative overflow-hidden">
        <CircuitPattern />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-14">
            <OfferBadge>Caso Studio Reale</OfferBadge>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
              {CASE_STUDY.company}
            </h2>
            <p className="text-muted-foreground mt-1">{CASE_STUDY.sector}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
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

      {/* ═══════════════════ TESTIMONIALS ═══════════════════ */}
      <AnimatedSection id="testimonianze" className="py-20 md:py-28 bg-muted/30 relative overflow-hidden" stagger>
        <FloatingOrbs color="primary" count={3} />
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="text-center mb-14">
            <OfferBadge>Cosa Dicono i Clienti</OfferBadge>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
              Non crederci sulla parola. <span className="text-primary">Ascolta chi l'ha fatto.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <motion.div key={t.name} variants={staggerItem}>
                <Card className="h-full hover:border-primary/30 transition-colors">
                  <CardContent className="pt-6 pb-6 flex flex-col h-full">
                    <StarRating count={t.stars} />
                    <p className="mt-4 text-sm text-muted-foreground leading-relaxed italic flex-1">
                      "{t.quote}"
                    </p>
                    <div className="mt-4 pt-4 border-t border-border/50">
                      <p className="font-bold text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role} — {t.company}</p>
                      <p className="text-xs text-primary font-medium">{t.sector}</p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ═══════════════════ COME FUNZIONA ═══════════════════ */}
      <AnimatedSection id="come-funziona" className="py-20 md:py-28 container mx-auto px-4 relative overflow-hidden" stagger>
        <DotPattern />
        <div className="text-center max-w-2xl mx-auto mb-14 relative z-10">
          <OfferBadge>Come Funziona</OfferBadge>
          <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
            3 passi per <span className="text-primary">trasformare</span> la tua azienda
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto relative z-10">
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
        <div className="text-center mt-10 relative z-10">
          <Button size="lg" onClick={scrollToCta} className="shadow-button-green">
            Inizia dall'Analisi Gratuita <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ═══════════════════ ROI CALCULATOR MINI ═══════════════════ */}
      <AnimatedSection id="roi-calculator" className="py-20 md:py-28 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.04), transparent, hsl(var(--primary) / 0.06))" }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <FloatingOrbs color="primary" count={2} />

        <div className="container mx-auto px-4 max-w-2xl relative z-10">
          <div className="text-center mb-10">
            <OfferBadge>📊 Calcola il Tuo ROI</OfferBadge>
            <h2 className="mt-4 font-display text-3xl md:text-4xl font-extrabold">
              Quante chiamate ricevi <span className="text-primary">al mese</span>?
            </h2>
            <p className="mt-3 text-muted-foreground">
              Muovi lo slider per vedere il tuo risparmio potenziale.
            </p>
          </div>

          <Card className="border-primary/20 shadow-lg">
            <CardContent className="pt-8 pb-8 px-6 md:px-10">
              <div className="text-center mb-6">
                <span className="text-5xl font-extrabold font-mono text-primary">{callsPerMonth}</span>
                <span className="text-lg text-muted-foreground ml-2">chiamate/mese</span>
              </div>

              <Slider
                value={[callsPerMonth]}
                onValueChange={(v) => setCallsPerMonth(v[0])}
                min={20}
                max={500}
                step={10}
                className="mb-8"
              />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Chiamate perse</p>
                  <p className="text-2xl font-extrabold text-destructive font-mono">{missedCalls}</p>
                  <p className="text-xs text-muted-foreground">/mese (40%)</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Fatturato perso</p>
                  <p className="text-2xl font-extrabold text-destructive font-mono">€{lostRevenue.toLocaleString("it-IT")}</p>
                  <p className="text-xs text-muted-foreground">/mese</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Risparmio annuo</p>
                  <p className="text-2xl font-extrabold text-primary font-mono">€{annualSavings.toLocaleString("it-IT")}</p>
                  <p className="text-xs text-muted-foreground">/anno</p>
                </div>
              </div>

              <div className="text-center mt-8">
                <Button size="lg" onClick={scrollToCta} className="shadow-button-green w-full sm:w-auto">
                  Scopri il Tuo Piano Personalizzato <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ═══════════════════ FAQ ═══════════════════ */}
      <AnimatedSection id="faq" className="py-20 md:py-28 bg-muted/30 relative overflow-hidden">
        <DotPattern />
        <div className="container mx-auto px-4 max-w-3xl relative z-10">
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

      {/* ═══════════════════ GARANZIA ═══════════════════ */}
      <AnimatedSection id="garanzia" className="py-20 md:py-28 relative overflow-hidden">
        <FloatingOrbs color="primary" count={2} />
        <div className="relative z-10">
          <OfferGuarantee title="Zero rischi, risultati garantiti">
            <p>
              Prova il servizio per 30 giorni. Se non sei soddisfatto dei risultati,
              ti restituiamo il 100% di quanto pagato. Nessuna domanda, nessuna
              complicazione. Il rischio è tutto nostro.
            </p>
          </OfferGuarantee>
        </div>
      </AnimatedSection>

      {/* ═══════════════════ CTA FINALE ═══════════════════ */}
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
