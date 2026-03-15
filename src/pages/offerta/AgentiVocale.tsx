import { usePageSEO } from "@/hooks/usePageSEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { motion } from "framer-motion";
import {
  Phone, Clock, Frown, Calendar, Moon, CheckCircle2, Lightbulb, ArrowRight,
} from "lucide-react";
import Footer from "@/components/sections/Footer";
import CounterStat from "@/components/custom/CounterStat";
import {
  AnimatedSection, OfferHeader, OfferBadge, OfferGuarantee, OfferCTABanner,
  OfferCountdown, LogoBarMini, PricingCard, SectionDivider, HeroBlob, DotPattern,
  useCountdown, useNoIndex, staggerContainer, staggerItem,
} from "@/components/offerta/shared";

const scrollToCta = () => document.getElementById("cta-finale")?.scrollIntoView({ behavior: "smooth" });

const plans = [
  {
    name: "Starter", price: "€147", period: "/mese", setup: "€197 una tantum",
    features: ["200 minuti/mese", "1 agente vocale", "Integrazione calendario", "Trascrizioni chiamate", "Report base", "Supporto email"],
  },
  {
    name: "Professional", price: "€297", period: "/mese", setup: "€397 una tantum", badge: "⭐ Più scelto",
    features: ["500 minuti/mese", "1 agente vocale", "Integrazione CRM + calendario", "Qualificazione lead con scoring", "WhatsApp conferma automatica", "Report settimanale AI", "Supporto prioritario"],
    highlighted: true,
  },
  {
    name: "Business", price: "€497", period: "/mese", setup: "€697 una tantum",
    features: ["1.000 minuti/mese", "2 agenti vocali (inbound + outbound)", "Integrazione completa CRM", "Lead scoring avanzato", "Recall automatico lead freddi", "Dashboard KPI real-time", "Ottimizzazione script mensile", "Supporto WhatsApp diretto"],
  },
  {
    name: "Enterprise", price: "da €997", period: "/mese", setup: "Su misura",
    features: ["2.500+ minuti/mese", "Agenti illimitati", "Voice Cloning personalizzato", "Multi-sede", "Integrazioni custom", "Account Manager dedicato", "SLA garantito"],
  },
];

const faqs = [
  { q: "Ma i miei clienti capiranno che è un robot?", a: "No. La tecnologia vocale che utilizziamo (ElevenLabs) è la più avanzata al mondo. L'agente parla in italiano naturale, con pause, esitazioni e tono conversazionale. Gestisce interruzioni e cambi di argomento. Nei test con i clienti dei nostri partner, meno del 5% si è accorto di parlare con un'AI — e quelli che se ne sono accorti hanno comunque completato la conversazione positivamente." },
  { q: "Quanto tempo serve per configurarlo?", a: "48 ore dalla firma. Ti affianchiamo nella configurazione: definiamo lo script di conversazione, lo integriamo con il tuo calendario e CRM, facciamo i test e lo attiviamo. Tu non devi fare nulla di tecnico." },
  { q: "E se il cliente ha una domanda complessa che l'AI non sa gestire?", a: "L'agente è configurato per trasferire la chiamata a un umano (te o il tuo commerciale) quando la richiesta esce dal suo ambito. In alternativa, prende nota della richiesta e fissa un richiamo. Non perdi mai il cliente." },
  { q: "Posso ascoltare le chiamate?", a: "Sì. Ogni chiamata viene registrata e trascritta. Puoi ascoltare le registrazioni, leggere le trascrizioni e vedere il punteggio di qualificazione di ogni lead dalla dashboard. Hai il controllo totale." },
  { q: "Se non funziona per il mio settore?", a: "L'agente viene personalizzato sul tuo business specifico — serramenti, ristrutturazioni, fotovoltaico, coperture, impiantistica. Se dopo 30 giorni non sei soddisfatto, ti rimborsiamo il setup. Senza domande." },
  { q: "Perché dovrei pagare €297/mese quando posso usare una segreteria telefonica?", a: "Una segreteria registra un messaggio. Il nostro agente CONVERTE il lead: risponde, qualifica, fissa l'appuntamento e manda la conferma. Sono due cose completamente diverse. Con una segreteria perdi il 70% dei lead. Con l'agente ne recuperi il 90%." },
];

const solutionFeatures = [
  "Risponde a TUTTE le chiamate in entrata — sempre, anche alle 3 di notte",
  "Parla in italiano naturale — i clienti non si accorgono che è un'AI",
  "Qualifica il lead con domande personalizzate (budget, tipo lavoro, tempistiche)",
  "Fissa l'appuntamento direttamente sul calendario del commerciale giusto",
  "Invia un SMS/WhatsApp di conferma al cliente dopo la chiamata",
  "Chiama i lead in uscita — ricontatta chi ha compilato il form o chi non ha risposto",
  "Trascrive ogni chiamata e genera un report con i punti chiave",
  "Si integra con il tuo CRM (Edilizia.io, HubSpot, Pipedrive, Google Calendar)",
];

export default function OffertaAgenteVocale() {
  usePageSEO({ title: "Offerta Agente Vocale AI — Edilizia.io", description: "Attiva il tuo Agente Vocale AI per non perdere mai più una chiamata. Offerta riservata." });
  useNoIndex();
  const countdown = useCountdown("offerta_av_first_visit");

  return (
    <div className="min-h-screen bg-background text-foreground">
      <OfferHeader ctaText="Attiva il Tuo Agente Vocale" onCtaClick={scrollToCta} />

      {/* ===== HERO ===== */}
      <AnimatedSection className="relative py-20 md:py-28 overflow-hidden" stagger>
        <HeroBlob />
        <DotPattern />
        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div variants={staggerItem}>
            <OfferBadge>🔒 Pagina riservata — Offerta valida per 7 giorni</OfferBadge>
          </motion.div>

          <motion.h1 variants={staggerItem} className="mx-auto mt-6 max-w-4xl text-3xl font-extrabold font-display leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Il Dipendente AI Che Non Si Ammala Mai,
            <br className="hidden md:block" />
            <span className="text-primary">Non Chiede Ferie e Lavora Anche di Notte.</span>
          </motion.h1>

          <motion.p variants={staggerItem} className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Il tuo Agente Vocale AI risponde al telefono, qualifica i lead e fissa appuntamenti — 24 ore su 24, 7 giorni su 7. Per meno della metà del costo di un dipendente part-time.
          </motion.p>

          <motion.div variants={staggerItem} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            {[
              { icon: Phone, text: "Risposta in <3 secondi" },
              { icon: Calendar, text: "Appuntamenti fissati in automatico" },
              { icon: Moon, text: "Attivo anche alle 22:30" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-sm font-medium text-muted-foreground bg-card border border-border/60 rounded-full px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </motion.div>

          <motion.div variants={staggerItem}>
            <Button size="lg" className="mt-10 text-base px-8 py-6 shadow-button-green hover:-translate-y-0.5 transition-all" onClick={scrollToCta}>
              Attiva il Tuo Agente Vocale <ArrowRight className="ml-1" />
            </Button>
            <p className="mt-3 text-sm text-muted-foreground">Setup in 48 ore. Disdici quando vuoi. Nessun vincolo.</p>
          </motion.div>
        </div>
      </AnimatedSection>

      <LogoBarMini />

      {/* ===== IL PROBLEMA ===== */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/40" stagger>
        <div className="container mx-auto px-4">
          <motion.h2 variants={staggerItem} className="text-center text-2xl font-bold font-display md:text-4xl">
            Quanti clienti stai perdendo ogni giorno?
          </motion.h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: Phone, title: "5-15 chiamate perse al giorno", text: "Ogni chiamata che va a vuoto è un potenziale cliente da €5.000-€20.000 che finisce dal tuo concorrente. Fuori orario, pausa pranzo, mentre sei in cantiere — il telefono squilla e nessuno risponde." },
              { icon: Clock, title: "€6-12 per ogni chiamata gestita da un umano", text: "Il tuo commerciale o la segretaria spendono 4-6 minuti per chiamata tra risposta, qualificazione e fissare appuntamento. Moltiplica per 30 chiamate al giorno. Quanto ti costa?" },
              { icon: Frown, title: "Il 40% dei lead non viene mai richiamato", text: "Il form compilato alle 21:30, il messaggio WhatsApp del sabato, la richiesta arrivata durante il sopralluogo. Nessuno li richiama in tempo e il lead si raffredda." },
            ].map(({ icon: Icon, title, text }) => (
              <motion.div key={title} variants={staggerItem}>
                <Card className="h-full border-destructive/20 bg-destructive/5 hover:shadow-md transition-shadow duration-300">
                  <CardHeader className="flex-row items-start gap-4 space-y-0">
                    <div className="rounded-full bg-destructive/10 p-3">
                      <Icon className="h-6 w-6 text-destructive" />
                    </div>
                    <CardTitle className="text-lg">{title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== LA SOLUZIONE ===== */}
      <AnimatedSection className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Ecco cosa fa il tuo Agente Vocale AI</h2>

          <div className="mx-auto mt-12 max-w-2xl space-y-4">
            {solutionFeatures.map((feat, i) => (
              <motion.div
                key={feat}
                className="flex items-start gap-3 bg-card border border-border/50 rounded-lg px-4 py-3 hover:border-primary/30 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
              >
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-base leading-relaxed">{feat}</span>
              </motion.div>
            ))}
          </div>

          <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-primary/30 bg-primary/5 p-6 shadow-[0_0_30px_-10px_hsl(var(--primary)/0.1)]">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed">
                <strong>In pratica:</strong> tu arrivi in ufficio la mattina e trovi nella dashboard gli appuntamenti già fissati, le trascrizioni delle chiamate e il punteggio di qualificazione di ogni lead. Zero tempo perso. Solo clienti pronti a comprare.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== CASO STUDIO ===== */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">
            Come un'impresa edile ha raddoppiato gli appuntamenti in 30 giorni
          </h2>

          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border shadow-lg">
            <div className="grid md:grid-cols-2">
              <div className="bg-destructive/5 p-8 border-r border-border/50">
                <h3 className="mb-4 font-bold text-destructive text-lg font-display">PRIMA dell'Agente Vocale AI</h3>
                <ul className="space-y-2.5 text-sm leading-relaxed">
                  <li>• 40% delle chiamate perse (fuori orario + pausa)</li>
                  <li>• 25% tasso di conversione lead → appuntamento</li>
                  <li>• 3-4 ore/giorno del commerciale al telefono</li>
                  <li>• Costo: €2.500/mese (segretaria part-time)</li>
                </ul>
              </div>
              <div className="bg-primary/5 p-8">
                <h3 className="mb-4 font-bold text-primary text-lg font-display">DOPO l'Agente Vocale AI</h3>
                <ul className="space-y-2.5 text-sm leading-relaxed">
                  <li>• 0% chiamate perse — risposta in 3 secondi, 24/7</li>
                  <li>• 43% tasso di conversione lead → appuntamento</li>
                  <li>• 0 ore del commerciale al telefono per qualificazione</li>
                  <li>• Costo: €297/mese (Agente Vocale Edilizia.io)</li>
                </ul>
              </div>
            </div>
            <div className="border-t bg-background p-8">
              <div className="grid grid-cols-2 gap-8 max-w-md mx-auto">
                <CounterStat value={72} prefix="+" suffix="%" label="Appuntamenti qualificati" duration={1.5} />
                <CounterStat value={88} prefix="-" suffix="%" label="Costo" duration={1.5} />
              </div>
              <p className="mt-6 text-sm italic text-muted-foreground text-center">
                "Non tornerei mai indietro. È come avere 3 segretarie che non dormono mai."
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== PRICING ===== */}
      <AnimatedSection className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Scegli il pacchetto giusto per la tua azienda</h2>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((plan) => (
              <PricingCard
                key={plan.name}
                {...plan}
                ctaText={plan.name === "Enterprise" ? "Contattaci" : undefined}
                onCta={scrollToCta}
              />
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Tutti i prezzi sono IVA esclusa. Crediti extra disponibili in qualsiasi momento dalla dashboard.
            <br />Minuti extra: da €0,45/min (Starter) a €0,35/min (Enterprise).
          </p>
        </div>
      </AnimatedSection>

      <SectionDivider />

      {/* ===== FAQ ===== */}
      <AnimatedSection className="py-20 md:py-28 bg-muted/40">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold font-display md:text-4xl">Le domande che ci fanno tutti (prima di attivarlo)</h2>
          <Accordion type="single" collapsible className="mt-10">
            {faqs.map((faq, i) => (
              <AccordionItem key={i} value={`faq-${i}`}>
                <AccordionTrigger className="text-left text-base font-medium">{faq.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </AnimatedSection>

      {/* ===== GARANZIA ===== */}
      <AnimatedSection className="py-20 md:py-28">
        <div className="container mx-auto px-4">
          <OfferGuarantee title="Garanzia Soddisfatto o Rimborsato — 30 Giorni">
            <p>
              Attiva il tuo Agente Vocale AI. Usalo per 30 giorni.
              <br />Se non sei soddisfatto dei risultati, ti rimborsiamo il costo di setup al 100%.
              <br />Nessuna domanda. Nessuna burocrazia.
            </p>
            <p className="mt-4 text-sm">Il canone mensile puoi disdirlo in qualsiasi momento con un click dalla dashboard.</p>
          </OfferGuarantee>
        </div>
      </AnimatedSection>

      {/* ===== CTA FINALE ===== */}
      <OfferCTABanner
        headline="Ogni giorno senza Agente Vocale è un giorno di clienti persi."
        subtitle="Attivalo oggi. In 48 ore il tuo telefono non perderà più una chiamata."
        ctaText="Attiva il Tuo Agente Vocale Ora"
        ctaOnClick={() => window.open("https://wa.me/393000000000?text=Ciao%2C%20vorrei%20attivare%20l%27Agente%20Vocale%20AI", "_blank")}
        countdown={countdown}
      />

      <Footer />
    </div>
  );
}
