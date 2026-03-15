import { useEffect, useMemo, useState } from "react";
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
  Phone,
  Clock,
  Frown,
  Calendar,
  Moon,
  CheckCircle2,
  Lightbulb,
  Shield,
  Star,
  Timer,
  ArrowRight,
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

const COUNTDOWN_KEY = "offerta_av_first_visit";
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

/* ---------- pricing data ---------- */
const plans = [
  {
    name: "Starter",
    price: "€147",
    period: "/mese",
    setup: "€197 una tantum",
    features: [
      "200 minuti/mese",
      "1 agente vocale",
      "Integrazione calendario",
      "Trascrizioni chiamate",
      "Report base",
      "Supporto email",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "€297",
    period: "/mese",
    setup: "€397 una tantum",
    badge: "⭐ Più scelto",
    features: [
      "500 minuti/mese",
      "1 agente vocale",
      "Integrazione CRM + calendario",
      "Qualificazione lead con scoring",
      "WhatsApp conferma automatica",
      "Report settimanale AI",
      "Supporto prioritario",
    ],
    highlighted: true,
  },
  {
    name: "Business",
    price: "€497",
    period: "/mese",
    setup: "€697 una tantum",
    features: [
      "1.000 minuti/mese",
      "2 agenti vocali (inbound + outbound)",
      "Integrazione completa CRM",
      "Lead scoring avanzato",
      "Recall automatico lead freddi",
      "Dashboard KPI real-time",
      "Ottimizzazione script mensile",
      "Supporto WhatsApp diretto",
    ],
    highlighted: false,
  },
  {
    name: "Enterprise",
    price: "da €997",
    period: "/mese",
    setup: "Su misura",
    features: [
      "2.500+ minuti/mese",
      "Agenti illimitati",
      "Voice Cloning personalizzato",
      "Multi-sede",
      "Integrazioni custom",
      "Account Manager dedicato",
      "SLA garantito",
    ],
    highlighted: false,
  },
];

/* ---------- FAQ data ---------- */
const faqs = [
  {
    q: "Ma i miei clienti capiranno che è un robot?",
    a: "No. La tecnologia vocale che utilizziamo (ElevenLabs) è la più avanzata al mondo. L'agente parla in italiano naturale, con pause, esitazioni e tono conversazionale. Gestisce interruzioni e cambi di argomento. Nei test con i clienti dei nostri partner, meno del 5% si è accorto di parlare con un'AI — e quelli che se ne sono accorti hanno comunque completato la conversazione positivamente.",
  },
  {
    q: "Quanto tempo serve per configurarlo?",
    a: "48 ore dalla firma. Ti affianchiamo nella configurazione: definiamo lo script di conversazione, lo integriamo con il tuo calendario e CRM, facciamo i test e lo attiviamo. Tu non devi fare nulla di tecnico.",
  },
  {
    q: "E se il cliente ha una domanda complessa che l'AI non sa gestire?",
    a: "L'agente è configurato per trasferire la chiamata a un umano (te o il tuo commerciale) quando la richiesta esce dal suo ambito. In alternativa, prende nota della richiesta e fissa un richiamo. Non perdi mai il cliente.",
  },
  {
    q: "Posso ascoltare le chiamate?",
    a: "Sì. Ogni chiamata viene registrata e trascritta. Puoi ascoltare le registrazioni, leggere le trascrizioni e vedere il punteggio di qualificazione di ogni lead dalla dashboard. Hai il controllo totale.",
  },
  {
    q: "Se non funziona per il mio settore?",
    a: "L'agente viene personalizzato sul tuo business specifico — serramenti, ristrutturazioni, fotovoltaico, coperture, impiantistica. Se dopo 30 giorni non sei soddisfatto, ti rimborsiamo il setup. Senza domande.",
  },
  {
    q: "Perché dovrei pagare €297/mese quando posso usare una segreteria telefonica?",
    a: "Una segreteria registra un messaggio. Il nostro agente CONVERTE il lead: risponde, qualifica, fissa l'appuntamento e manda la conferma. Sono due cose completamente diverse. Con una segreteria perdi il 70% dei lead. Con l'agente ne recuperi il 90%.",
  },
];

/* ---------- solution features ---------- */
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

/* ========== PAGE COMPONENT ========== */

export default function OffertaAgenteVocale() {
  usePageSEO({
    title: "Offerta Agente Vocale AI — Edilizia.io",
    description: "Attiva il tuo Agente Vocale AI per non perdere mai più una chiamata. Offerta riservata.",
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
            Attiva il Tuo Agente Vocale <ArrowRight className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* ===== HERO ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 border-primary/40 bg-primary-light text-primary-dark px-4 py-1.5 text-sm">
            🔒 Pagina riservata — Offerta valida per 7 giorni
          </Badge>

          <h1 className="mx-auto max-w-4xl text-3xl font-extrabold leading-tight tracking-tight md:text-5xl lg:text-6xl">
            Il Dipendente AI Che Non Si Ammala Mai,
            <br className="hidden md:block" />
            Non Chiede Ferie e Lavora Anche di Notte.
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Il tuo Agente Vocale AI risponde al telefono, qualifica i lead e fissa appuntamenti — 24 ore su 24, 7 giorni su 7. Per meno della metà del costo di un dipendente part-time.
          </p>

          {/* Mini stats */}
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-8">
            {[
              { icon: Phone, text: "Risposta in <3 secondi" },
              { icon: Calendar, text: "Appuntamenti fissati in automatico" },
              { icon: Moon, text: "Attivo anche alle 22:30" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Icon className="h-5 w-5 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>

          <Button size="lg" className="mt-10 text-base px-8 py-6" onClick={scrollToCta}>
            Attiva il Tuo Agente Vocale <ArrowRight className="ml-1" />
          </Button>

          <p className="mt-3 text-sm text-muted-foreground">
            Setup in 48 ore. Disdici quando vuoi. Nessun vincolo.
          </p>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== IL PROBLEMA ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Quanti clienti stai perdendo ogni giorno?
          </h2>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: Phone,
                title: "5-15 chiamate perse al giorno",
                text: "Ogni chiamata che va a vuoto è un potenziale cliente da €5.000-€20.000 che finisce dal tuo concorrente. Fuori orario, pausa pranzo, mentre sei in cantiere — il telefono squilla e nessuno risponde.",
              },
              {
                icon: Clock,
                title: "€6-12 per ogni chiamata gestita da un umano",
                text: "Il tuo commerciale o la segretaria spendono 4-6 minuti per chiamata tra risposta, qualificazione e fissare appuntamento. Moltiplica per 30 chiamate al giorno. Quanto ti costa?",
              },
              {
                icon: Frown,
                title: "Il 40% dei lead non viene mai richiamato",
                text: "Il form compilato alle 21:30, il messaggio WhatsApp del sabato, la richiesta arrivata durante il sopralluogo. Nessuno li richiama in tempo e il lead si raffredda.",
              },
            ].map(({ icon: Icon, title, text }) => (
              <Card key={title} className="border-destructive/20 bg-destructive/5">
                <CardHeader className="flex-row items-start gap-4 space-y-0">
                  <div className="rounded-lg bg-destructive/10 p-2.5">
                    <Icon className="h-6 w-6 text-destructive" />
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

      {/* ===== LA SOLUZIONE ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Ecco cosa fa il tuo Agente Vocale AI
          </h2>

          <div className="mx-auto mt-12 max-w-2xl space-y-4">
            {solutionFeatures.map((feat) => (
              <div key={feat} className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-base leading-relaxed">{feat}</span>
              </div>
            ))}
          </div>

          {/* highlight box */}
          <div className="mx-auto mt-10 max-w-2xl rounded-xl border border-primary/30 bg-primary/5 p-6">
            <div className="flex items-start gap-3">
              <Lightbulb className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm leading-relaxed">
                <strong>In pratica:</strong> tu arrivi in ufficio la mattina e trovi nella dashboard gli appuntamenti già fissati, le trascrizioni delle chiamate e il punteggio di qualificazione di ogni lead. Zero tempo perso. Solo clienti pronti a comprare.
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== CASO STUDIO ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Come un'impresa edile ha raddoppiato gli appuntamenti in 30 giorni
          </h2>

          <div className="mx-auto mt-12 max-w-4xl overflow-hidden rounded-2xl border">
            <div className="grid md:grid-cols-2">
              {/* PRIMA */}
              <div className="bg-destructive/5 p-8">
                <h3 className="mb-4 font-bold text-destructive">PRIMA dell'Agente Vocale AI</h3>
                <ul className="space-y-2 text-sm leading-relaxed">
                  <li>• 40% delle chiamate perse (fuori orario + pausa)</li>
                  <li>• 25% tasso di conversione lead → appuntamento</li>
                  <li>• 3-4 ore/giorno del commerciale al telefono</li>
                  <li>• Costo: €2.500/mese (segretaria part-time)</li>
                </ul>
              </div>
              {/* DOPO */}
              <div className="bg-primary/5 p-8">
                <h3 className="mb-4 font-bold text-primary">DOPO l'Agente Vocale AI</h3>
                <ul className="space-y-2 text-sm leading-relaxed">
                  <li>• 0% chiamate perse — risposta in 3 secondi, 24/7</li>
                  <li>• 43% tasso di conversione lead → appuntamento</li>
                  <li>• 0 ore del commerciale al telefono per qualificazione</li>
                  <li>• Costo: €297/mese (Agente Vocale Edilizia.io)</li>
                </ul>
              </div>
            </div>
            {/* Risultato */}
            <div className="border-t bg-background p-8 text-center">
              <p className="text-lg font-bold md:text-xl">
                Risultato: <span className="text-primary">+72% di appuntamenti qualificati</span>, <span className="text-primary">-88% di costo</span>
              </p>
              <p className="mt-3 text-sm italic text-muted-foreground">
                "Non tornerei mai indietro. È come avere 3 segretarie che non dormono mai."
              </p>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== PRICING ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Scegli il pacchetto giusto per la tua azienda
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
                  <Button
                    className="mt-4 w-full"
                    variant={plan.highlighted ? "default" : "outline"}
                    onClick={scrollToCta}
                  >
                    {plan.name === "Enterprise" ? "Contattaci" : `Attiva ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground">
            Tutti i prezzi sono IVA esclusa. Crediti extra disponibili in qualsiasi momento dalla dashboard.
            <br />
            Minuti extra: da €0,45/min (Starter) a €0,35/min (Enterprise).
          </p>
        </div>
      </AnimatedSection>

      <Separator />

      {/* ===== FAQ ===== */}
      <AnimatedSection className="py-16 md:py-24 bg-muted/40">
        <div className="container mx-auto max-w-3xl px-4">
          <h2 className="text-center text-2xl font-bold md:text-4xl">
            Le domande che ci fanno tutti (prima di attivarlo)
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

      {/* ===== GARANZIA ===== */}
      <AnimatedSection className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl rounded-2xl border-2 border-primary/30 bg-primary/5 p-8 text-center">
            <Shield className="mx-auto h-12 w-12 text-primary" />
            <h2 className="mt-4 text-2xl font-bold">
              Garanzia Soddisfatto o Rimborsato — 30 Giorni
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              Attiva il tuo Agente Vocale AI. Usalo per 30 giorni.
              <br />
              Se non sei soddisfatto dei risultati, ti rimborsiamo il costo di setup al 100%.
              <br />
              Nessuna domanda. Nessuna burocrazia.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Il canone mensile puoi disdirlo in qualsiasi momento con un click dalla dashboard.
            </p>
          </div>
        </div>
      </AnimatedSection>

      {/* ===== CTA FINALE ===== */}
      <section id="cta-finale" className="bg-foreground py-16 md:py-24">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-background md:text-4xl">
            Ogni giorno senza Agente Vocale è un giorno di clienti persi.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-background/70">
            Attivalo oggi. In 48 ore il tuo telefono non perderà più una chiamata.
          </p>

          <Button
            size="lg"
            variant="secondary"
            className="mt-8 text-base px-8 py-6"
            onClick={() => window.open("https://wa.me/393000000000?text=Ciao%2C%20vorrei%20attivare%20l%27Agente%20Vocale%20AI", "_blank")}
          >
            Attiva il Tuo Agente Vocale Ora <ArrowRight className="ml-1" />
          </Button>

          <p className="mt-4 text-sm text-background/60">
            ⏰ Questa offerta è riservata e valida per 7 giorni dalla ricezione.
            <br />
            Setup incluso solo per le attivazioni entro la scadenza.
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
