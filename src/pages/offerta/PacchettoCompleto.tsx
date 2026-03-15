import { usePageSEO } from "@/hooks/usePageSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  Phone, Camera, HardHat, BarChart3, CheckCircle2, ArrowRight,
  ArrowDown, XCircle, Shield,
} from "lucide-react";
import { Link } from "react-router-dom";
import Footer from "@/components/sections/Footer";
import CounterStat from "@/components/custom/CounterStat";
import {
  AnimatedSection, OfferHeader, OfferBadge, OfferCTABanner,
  OfferCountdown, LogoBarMini, PricingCard, SectionDivider, HeroBlob, DotPattern,
  OfferSectionNav, SetupFreeBanner,
  useCountdown, useNoIndex, staggerContainer, staggerItem, StarRating,
} from "@/components/offerta/shared";

const WA_LINK = "https://wa.me/3901onal?text=Ciao%2C%20sono%20interessato%20al%20pacchetto%20completo%20Edil%20Genius.%20Vorrei%20maggiori%20informazioni.";

const scrollToPricing = () => document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });

const navLinks = [
  { label: "Confronto", href: "#confronto" },
  { label: "Integrazione", href: "#integrazione" },
  { label: "Pacchetti", href: "#pricing" },
  { label: "Testimonianze", href: "#testimonianze" },
  { label: "FAQ", href: "#faq" },
  { label: "Garanzia", href: "#garanzia" },
];

const singleModules = [
  { name: "Agente Vocale Professional", price: "€297" },
  { name: "Render AI Professional", price: "€127" },
  { name: "Preventivatore Professional", price: "€97" },
  { name: "Rapportini AI Professional", price: "€67" },
  { name: "WhatsApp AI Professional", price: "€97" },
];

const bundleFeatures = [
  "2 Agenti Vocali AI (750 min/mese)", "80 Render AI al mese", "150 Preventivi AI al mese",
  "80 Rapportini AI al mese", "WhatsApp AI (500 msg/mese)", "CRM completo con pipeline",
  "Lead Scoring AI", "Dashboard unificata", "5 utenti", "Supporto prioritario",
];

const workflows = [
  {
    icon: Phone, title: "Il Lead che Arriva alle 21:30",
    steps: ["L'Agente Vocale risponde alla chiamata", "Qualifica il lead (tipo lavoro, budget, tempistiche)", "Fissa l'appuntamento sul calendario del commerciale", "Invia conferma WhatsApp AI al cliente", "Il lead scoring assegna un punteggio automatico", "La mattina dopo il commerciale apre il CRM e trova tutto pronto"],
    singlePain: "Dovresti copiare i dati a mano dall'agente vocale al CRM, mandare il WhatsApp manualmente, e il lead scoring non esiste.",
  },
  {
    icon: Camera, title: "L'Appuntamento dal Cliente",
    steps: ["Il commerciale scatta la foto dell'infisso vecchio", "Render AI genera il render in 10 secondi", "Il Preventivatore calcola il preventivo con varianti, IVA e detrazioni", "Il render viene allegato automaticamente al PDF del preventivo", "Il preventivo viene inviato via WhatsApp con un click", "Il CRM traccia l'apertura del preventivo"],
    singlePain: "Render in un'app, preventivo in un'altra, PDF fatto a mano, nessun tracking.",
  },
  {
    icon: HardHat, title: "Il Cantiere",
    steps: ["Il capo cantiere parla al telefono e descrive l'avanzamento", "Il Rapportino AI trascrive e genera il report", "Il report si collega automaticamente al progetto nel CRM", "Il titolare vede il KPI del cantiere aggiornato in dashboard", "Il cliente riceve l'aggiornamento automatico via WhatsApp"],
    singlePain: "Rapportino su un'app, progetto su un'altra, nessun collegamento, nessun aggiornamento automatico al cliente.",
  },
  {
    icon: BarChart3, title: "Fine Mese",
    steps: ["La Dashboard AI genera il report mensile", "Lead ricevuti, qualificati, appuntamenti fissati", "Preventivi inviati, aperti, convertiti in ordine", "Margine medio per tipo di lavoro", "Performance di ogni commerciale", "Cantieri attivi, rapportini consegnati, clienti soddisfatti"],
    singlePain: "Raccogli dati da 5 posti diversi e fai tutto su Excel. Buona fortuna.",
  },
];

const plans = [
  {
    name: "Essenziale", price: "€297", period: "/mese", setup: "€497 una tantum",
    target: "Per chi parte: serramentista o artigiano, 1-3 persone",
    features: ["1 Agente Vocale (300 min)", "30 Render AI", "50 Preventivi AI", "20 Rapportini AI", "CRM base + calendario", "2 utenti", "Supporto email"],
  },
  {
    name: "Crescita", price: "€497", period: "/mese", setup: "€997 una tantum", badge: "⭐ Più scelto",
    target: "Per chi cresce: impresa con show-room, 3-8 persone", highlighted: true,
    features: ["2 Agenti Vocali (750 min)", "80 Render AI", "150 Preventivi AI", "80 Rapportini AI", "WhatsApp AI (500 msg)", "Lead Scoring AI", "Dashboard KPI avanzata", "5 utenti", "Supporto prioritario"],
    saving: "Risparmi €188/mese vs moduli singoli",
  },
  {
    name: "Dominio", price: "€997", period: "/mese", setup: "€1.497 una tantum",
    target: "Per chi domina: azienda strutturata, multi-sede, 5-15 persone",
    features: ["3+ Agenti Vocali (2.000 min)", "250 Render AI", "500 Preventivi AI", "300 Rapportini AI", "WhatsApp AI (2.000 msg)", "Voice Cloning", "Firma Digitale", "Multi-sede / SuperAdmin", "15 utenti", "Account Manager dedicato"],
    saving: "Il pacchetto completo per chi vuole l'azienda AI-first",
  },
];

const testimonials = [
  { quote: "Ho iniziato con solo il Render AI. Dopo 2 mesi ho preso il pacchetto completo. Adesso non riesco a immaginare la mia azienda senza.", role: "Titolare, serramenti PVC, Lombardia" },
  { quote: "Il mio commerciale fa il triplo dei preventivi in metà tempo. E l'agente vocale mi ha recuperato lead che pensavo persi.", role: "Imprenditore edile, Veneto" },
  { quote: "La vera svolta è che tutto parla con tutto. Il lead entra dal telefono e arriva fino al cantiere senza che io tocchi niente.", role: "General contractor, Emilia-Romagna" },
];

const faqs = [
  { q: "Posso iniziare con un modulo singolo e passare al pacchetto dopo?", a: "Sì. Se hai già attivato un modulo singolo, puoi fare l'upgrade al pacchetto completo in qualsiasi momento. Ti scaliamo il costo del modulo dal primo mese del pacchetto. Non perdi nulla." },
  { q: "Se non uso tutti i crediti di un servizio, li perdo?", a: "I crediti non usati non si accumulano tra un mese e l'altro, ma il pacchetto è calibrato sull'uso reale delle aziende del tuo settore. La maggior parte dei nostri clienti usa il 70-90% dei crediti inclusi. Se sfori, puoi comprare crediti extra dalla dashboard." },
  { q: "Quanto tempo serve per attivare tutto?", a: "Il setup completo del pacchetto richiede 5-7 giorni lavorativi. In questo periodo configuriamo: agenti vocali con script personalizzati, catalogo prodotti nel preventivatore, listini, branding PDF, integrazioni calendario e CRM. Tu devi solo darci le informazioni — noi facciamo tutto il resto." },
  { q: "Posso far usare la piattaforma ai miei commerciali esterni?", a: "Sì. Ogni utente ha il suo accesso con permessi configurabili. Puoi dare accesso ai commerciali solo al preventivatore e ai render, senza fargli vedere i KPI o i dati finanziari." },
  { q: "E se cambio idea dopo 3 mesi?", a: "Nessun vincolo. Disdici dal dashboard con un click. Il servizio resta attivo fino a fine mese pagato. I tuoi dati (preventivi, render, contatti) restano disponibili per l'export per 30 giorni dopo la disdetta." },
];

export default function PacchettoCompleto() {
  usePageSEO({ title: "Pacchetto Completo Edil Genius — Offerta Riservata | Edilizia.io", description: "Agente Vocale + Render AI + Preventivatore + Rapportini + WhatsApp AI + CRM. Tutto in un'unica piattaforma, un unico prezzo. Risparmia fino al 40%." });
  useNoIndex();
  const countdown = useCountdown("offerta_pacchetto_first_visit");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OfferHeader ctaText="Scopri i Pacchetti" onCtaClick={scrollToPricing} />
      <OfferSectionNav links={navLinks} />

      {/* ══════ HERO ══════ */}
      <AnimatedSection className="relative py-20 md:py-28 overflow-hidden" stagger>
        <HeroBlob />
        <DotPattern />
        <div className="max-w-4xl mx-auto text-center px-4 relative z-10">
          <motion.div variants={staggerItem}><OfferBadge>🔒 Pagina riservata — Offerta valida per 7 giorni</OfferBadge></motion.div>

          <motion.h1 variants={staggerItem} className="mt-6 text-3xl sm:text-4xl md:text-5xl font-extrabold font-display leading-tight">
            Smetti di Comprare gli Attrezzi Uno alla Volta.{" "}
            <span className="text-primary">Prendi Tutta la Cassetta.</span>
          </motion.h1>

          <motion.p variants={staggerItem} className="text-lg text-muted-foreground max-w-2xl mx-auto mt-6">
            Agente Vocale + Render AI + Preventivatore + Rapportini + WhatsApp AI + CRM.
            Tutto in un'unica piattaforma. Un unico prezzo. E risparmi fino al 40% rispetto ai singoli moduli.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-6 max-w-xl mx-auto">
            <SetupFreeBanner setupCost="€497–€1.497" expired={countdown.expired} />
          </motion.div>

          <motion.div variants={staggerItem} className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto mt-8">
            {[
              { icon: "🧰", label: "6 strumenti AI in 1" },
              { icon: "💰", label: "Fino al 40% di risparmio" },
              { icon: "🔄", label: "Tutto integrato, zero copia-incolla" },
            ].map((s) => (
              <div key={s.label} className="bg-card border border-border/60 rounded-xl p-4 text-center hover:border-primary/30 hover:shadow-md transition-all">
                <span className="text-2xl">{s.icon}</span>
                <p className="text-sm font-semibold mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>

          <motion.div variants={staggerItem} className="mt-8 space-y-3">
            <Button size="lg" className="text-base px-8 py-6 shadow-button-green hover:-translate-y-0.5 transition-all" onClick={scrollToPricing}>
              Scopri il Tuo Pacchetto Ideale <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <p className="text-xs text-muted-foreground">Nessun vincolo. Disdici quando vuoi.</p>
          </motion.div>

          <motion.div variants={staggerItem} className="mt-6">
            <OfferCountdown countdown={countdown} variant="light" />
          </motion.div>
        </div>
      </AnimatedSection>

      <LogoBarMini />

      {/* ══════ CONFRONTO KILLER ══════ */}
      <AnimatedSection id="confronto" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-4xl mx-auto px-4 space-y-8">
          <h2 className="text-2xl md:text-4xl font-bold font-display text-center">Quanto spendi comprando tutto separatamente?</h2>

          <Card className="border-2 border-destructive/40 bg-destructive/5 shadow-lg">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 font-display">
                <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center"><XCircle className="h-4 w-4 text-destructive" /></div>
                Se compri i moduli standalone uno alla volta:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {singleModules.map((m) => (
                <div key={m.name} className="flex justify-between text-sm py-1.5 border-b border-border/30 last:border-0">
                  <span className="text-muted-foreground">{m.name}</span>
                  <span className="font-mono font-semibold">{m.price}/mese</span>
                </div>
              ))}
              <div className="h-px bg-gradient-to-r from-transparent via-destructive/30 to-transparent my-2" />
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

          <div className="flex justify-center">
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>
              <ArrowDown className="h-10 w-10 text-primary" />
            </motion.div>
          </div>

          <Card className="border-2 border-primary/40 bg-primary/5 ring-2 ring-primary/20 shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2 font-display">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center"><CheckCircle2 className="h-4 w-4 text-primary" /></div>
                Con il Pacchetto Crescita di Edil Genius:
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {bundleFeatures.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm py-1">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" /><span>{f}</span>
                </div>
              ))}
              <div className="h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent my-2" />
              <div className="flex justify-between font-bold text-lg pt-2">
                <span>PREZZO PACCHETTO CRESCITA</span>
                <span className="text-primary">€497/mese</span>
              </div>
              <div className="text-sm text-muted-foreground space-y-1 pt-2">
                <p>+ 1 solo setup = <strong className="line-through">€997 una tantum</strong> {!countdown.expired && <span className="text-primary font-bold">→ GRATIS</span>}</p>
                <p>+ TUTTO integrato in un'unica piattaforma</p>
                <p>+ Il render si allega al preventivo con 1 click</p>
                <p>+ L'agente vocale alimenta il CRM in automatico</p>
                <p>+ I rapportini si collegano al cantiere nel CRM</p>
              </div>
              <motion.div
                className="bg-primary/10 border border-primary/30 rounded-xl p-5 mt-4 text-center shadow-[0_0_30px_-10px_hsl(var(--primary)/0.2)]"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <div className="flex justify-center gap-8">
                  <CounterStat value={188} prefix="€" suffix="/mese" label="Risparmi" duration={1.5} />
                  <CounterStat value={2256} prefix="€" suffix="/anno" label="Totale" duration={2} />
                </div>
              </motion.div>
            </CardContent>
          </Card>
        </div>
      </AnimatedSection>

      {/* ══════ WORKFLOW INTEGRAZIONE ══════ */}
      <AnimatedSection id="integrazione" className="py-20 md:py-28" stagger>
        <div className="max-w-4xl mx-auto px-4 space-y-10">
          <motion.div variants={staggerItem} className="text-center space-y-2">
            <h2 className="text-2xl md:text-4xl font-bold font-display">
              Non è solo una questione di prezzo.{" "}
              <span className="text-primary">È che insieme funzionano 10 volte meglio.</span>
            </h2>
          </motion.div>

          <div className="relative">
            <div className="hidden md:block absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/40 via-primary/20 to-primary/40" />

            {workflows.map((w, i) => (
              <motion.div key={i} variants={staggerItem} className="relative mb-8 last:mb-0">
                <div className="hidden md:flex absolute left-0 top-6 w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 items-center justify-center z-10">
                  <span className="text-sm font-bold text-primary">{i + 1}</span>
                </div>

                <Card className="md:ml-20 overflow-hidden hover:shadow-lg transition-shadow">
                  <CardHeader className="bg-primary/5">
                    <CardTitle className="text-lg flex items-center gap-3 font-display">
                      <div className="md:hidden h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <w.icon className="h-5 w-5 text-primary" />
                      </div>
                      <w.icon className="hidden md:block h-5 w-5 text-primary" />
                      Scenario {i + 1} — {w.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <div className="space-y-2">
                      {w.steps.map((step, si) => (
                        <div key={si} className="flex items-start gap-2 text-sm">
                          <ArrowRight className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>{step}</span>
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
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ══════ PRICING ══════ */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/30" id="pricing">
        <div className="max-w-5xl mx-auto px-4 space-y-10">
          <h2 className="text-2xl md:text-4xl font-bold font-display text-center">Scegli il pacchetto che fa crescere la tua impresa</h2>

          <div className="mx-auto max-w-xl">
            <SetupFreeBanner setupCost="€497–€1.497" expired={countdown.expired} />
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <PricingCard key={plan.name} {...plan} setupFree={!countdown.expired} onCta={() => window.open(WA_LINK, "_blank")} />
            ))}
          </div>

          <div className="text-center bg-card border border-border rounded-lg p-4 shadow-sm">
            <p className="text-sm text-muted-foreground">
              🏢 Hai più di 15 persone o esigenze specifiche?{" "}
              <a href={WA_LINK} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline">
                Contattaci per il Piano Enterprise da €1.997/mese
              </a>
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ══════ TESTIMONIAL ══════ */}
      <AnimatedSection id="testimonianze" className="py-20 md:py-28" stagger>
        <div className="max-w-5xl mx-auto px-4 space-y-8">
          <motion.h2 variants={staggerItem} className="text-2xl md:text-4xl font-bold font-display text-center">
            Chi ha scelto il pacchetto completo non torna più indietro
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} variants={staggerItem}>
                <Card className="bg-card h-full hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <CardContent className="pt-6 space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {t.role.charAt(0)}
                      </div>
                      <StarRating />
                    </div>
                    <p className="text-sm italic text-muted-foreground leading-relaxed">"{t.quote}"</p>
                    <p className="text-xs font-semibold">— {t.role}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ══════ FAQ ══════ */}
      <AnimatedSection id="faq" className="py-20 md:py-28 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 space-y-8">
          <h2 className="text-2xl md:text-4xl font-bold font-display text-center">Domande Frequenti</h2>
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      {/* ══════ GARANZIA DOPPIA ══════ */}
      <AnimatedSection id="garanzia" className="py-20 md:py-28">
        <div className="max-w-3xl mx-auto px-4">
          <div className="rounded-2xl border-2 border-primary/40 bg-primary/5 p-8 shadow-[0_0_40px_-10px_hsl(var(--primary)/0.15)]">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Shield className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-xl font-bold font-display">🛡️ GARANZIA DOPPIA — 30 GIORNI</h3>
            </div>
            <div className="space-y-4 mt-6 max-w-xl mx-auto">
              {[
                { label: "Garanzia 1", text: "Se l'Agente Vocale non fissa almeno 10 appuntamenti nel primo mese, ti rimborsiamo il setup." },
                { label: "Garanzia 2", text: "Se la piattaforma non ti fa risparmiare almeno 10 ore a settimana, ti rimborsiamo il setup." },
              ].map((g) => (
                <div key={g.label} className="flex items-start gap-3 bg-background/50 rounded-lg p-4">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm"><strong>{g.label}:</strong> {g.text}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-muted-foreground font-medium text-center mt-4">
              Zero rischio. Zero burocrazia. La qualità dei nostri risultati parla da sola.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ══════ CTA FINALE ══════ */}
      <OfferCTABanner
        headline={<>Un'unica piattaforma. Un unico prezzo.<br /><span className="text-primary">Un'intera azienda che lavora per te 24/7.</span></>}
        subtitle="Attiva il pacchetto oggi. Tra 7 giorni avrai un'impresa che funziona anche quando tu non ci sei."
        ctaText="Attiva il Tuo Pacchetto Completo"
        ctaHref={WA_LINK}
        countdown={countdown}
        footerLink={{ label: "Preferisci partire con un singolo modulo? → Torna alla pagina Pricing", to: "/tariffe" }}
      />

      <Footer />
    </div>
  );
}
