import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { usePageSEO } from "@/hooks/usePageSEO";
import { XCircle, Check, ArrowRight, Clock, Brain, Headphones } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Guarantee from "@/components/sections/Guarantee";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

/* ── animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const stagger = { visible: { transition: { staggerChildren: 0.15 } } };

/* ── data ── */
const problems = [
  {
    icon: XCircle,
    title: "Software Complicati",
    text: "Dashboard infinite, mesi di onboarding, e alla fine nessuno li usa. I tuoi commerciali tornano ai post-it.",
  },
  {
    icon: XCircle,
    title: "Consulenti Generici",
    text: "Ti vendono 'AI per tutti i settori'. Non conoscono la differenza tra un ponteggio e un pluviale. Zero risultati.",
  },
  {
    icon: XCircle,
    title: "Mesi di Implementazione",
    text: "6 mesi di meeting, analisi, slide. Quando finalmente vai live, il mercato è già cambiato. E il budget è finito.",
  },
];

const steps = [
  {
    num: "01",
    icon: "🔍",
    title: "Analisi & Configurazione",
    days: "GIORNI 1–7",
    text: "Studiamo il tuo processo di vendita, il tuo mercato, i tuoi prodotti. Configuriamo ogni agente sulla tua lingua commerciale, le tue obiezioni comuni, il tuo territorio. Non un template — un sistema costruito sulla tua azienda.",
    details: [
      "Analisi approfondita del tuo ciclo di vendita attuale",
      "Mappatura prodotti, listini e margini per commessa",
      "Configurazione CRM con i tuoi campi personalizzati",
      "Setup agente vocale con il linguaggio del tuo settore",
    ],
    result: "Agente configurato sul tuo business, pronto per il training",
  },
  {
    num: "02",
    icon: "⚡",
    title: "Training & Test",
    days: "GIORNI 7–12",
    text: "Training su centinaia di scenari reali del settore edile italiano. Test su dialetti, obiezioni tecniche, situazioni complesse. L'agente va live solo dopo aver superato i nostri standard di qualità.",
    details: [
      "Simulazione di chiamate reali con scenari difficili",
      "Test su dialetti regionali e obiezioni tecniche",
      "Validazione con il tuo team prima del go-live",
      "Ottimizzazione degli script di conversazione",
    ],
    result: "Agente validato dal tuo team, pronto per andare live",
  },
  {
    num: "03",
    icon: "🚀",
    title: "Go Live & Ottimizzazione",
    days: "DAL GIORNO 14 IN POI",
    text: "L'agente è attivo. Da questo momento lavora per te ogni ora di ogni giorno. Ogni settimana analizziamo le conversazioni, ottimizziamo gli script, miglioriamo le conversioni.",
    details: [
      "Monitoraggio continuo delle performance",
      "Report settimanali con KPI e suggerimenti",
      "Ottimizzazione automatica degli script",
      "Supporto dedicato per ogni necessità",
    ],
    result: "Sistema che migliora da solo, ogni settimana",
  },
];

const valueStack = [
  { label: "Audit completo processo vendita", value: "€2.000" },
  { label: "Configurazione agente AI personalizzato", value: "€3.500" },
  { label: "Training su scenari reali del tuo settore", value: "€1.500" },
  { label: "Integrazione CRM e canali esistenti", value: "€2.000" },
  { label: "Ottimizzazione continua primo mese", value: "€1.000" },
  { label: "Supporto dedicato e report settimanali", value: "€500" },
];

const faqs = [
  {
    q: "Devo avere competenze tecniche?",
    a: "Assolutamente no. Facciamo tutto noi: configurazione, training, integrazione, manutenzione. Tu devi solo rispondere a una call di 30 minuti per raccontarci la tua azienda.",
  },
  {
    q: "Quanto tempo devo dedicare?",
    a: "30 minuti per la call iniziale di analisi. Poi zero. Il nostro team si occupa di tutto — configurazione, test, go-live e ottimizzazione continua.",
  },
  {
    q: "E se non mi piace il risultato?",
    a: "Hai la nostra Garanzia Rimborso 30 Giorni. Se l'agente non supera il dipendente che ha sostituito in termini di risultati, ti rimborsiamo integralmente. Senza domande.",
  },
  {
    q: "Funziona per il mio settore specifico?",
    a: "Lavoriamo esclusivamente con aziende del settore edile italiano. Niente generalisti. Il nostro agente conosce ponteggi, pluviali, preventivi, obiezioni tecniche e dialetti regionali.",
  },
];

const heroStats = [
  { icon: Clock, value: "14 giorni", label: "setup completo" },
  { icon: Brain, value: "0", label: "competenze tecniche" },
  { icon: Headphones, value: "100%", label: "gestito da noi" },
];

const ComeFunziona = () => {
  usePageSEO({
    title: "Come Funziona — Agenti AI Operativi in 7 Giorni | Edilizia.io",
    description: "Scopri il processo in 3 step per attivare il tuo Agente Vocale AI: setup in 48 ore, prime chiamate gestite, ottimizzazione continua. Zero configurazione da parte tua.",
    canonical: "/come-funziona",
  });

  const problemRef = useRef(null);
  const stepsRef = useRef(null);
  const valueRef = useRef(null);
  const faqRef = useRef(null);

  const problemInView = useInView(problemRef, { once: true, margin: "-50px" });
  const stepsInView = useInView(stepsRef, { once: true, margin: "-50px" });
  const valueInView = useInView(valueRef, { once: true, margin: "-50px" });
  const faqInView = useInView(faqRef, { once: true, margin: "-50px" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* ── HERO ── */}
        <section className="bg-primary-bg py-20 md:py-28">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-8">
            <AnimatedBadge variant="verde">OPERATIVO IN 14 GIORNI</AnimatedBadge>
            <h1 className="font-display text-[32px] md:text-[52px] font-extrabold text-neutral-900 leading-[1.1]">
              Mentre Tu Leggi Questa Pagina,<br />
              Un Tuo Competitor Sta Già Usando l'AI.<br />
              <span className="text-primary">Tu Quanto Vuoi Aspettare?</span>
            </h1>
            <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
              Nessuna configurazione complicata. Nessun consulente che non conosce il tuo settore.
              Dal primo contatto al go-live in 14 giorni — e noi facciamo tutto.
            </p>

            {/* 3 mini-stats */}
            <div className="flex flex-wrap justify-center gap-6 pt-4">
              {heroStats.map((s) => (
                <div key={s.label} className="flex items-center gap-3 bg-background rounded-xl border border-border px-5 py-3 shadow-card">
                  <s.icon className="w-5 h-5 text-primary" />
                  <div className="text-left">
                    <p className="font-display font-extrabold text-neutral-900 text-lg leading-none">{s.value}</p>
                    <p className="text-xs text-muted-foreground">{s.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── IL PROBLEMA ── */}
        <section className="bg-background py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-14 space-y-4">
              <AnimatedBadge variant="verde">IL PROBLEMA</AnimatedBadge>
              <h2 className="font-display text-[28px] md:text-[42px] font-extrabold text-neutral-900 leading-tight">
                Perché Le Altre Soluzioni<br />
                <span className="text-destructive">Ti Hanno Deluso</span>
              </h2>
            </div>

            <motion.div
              ref={problemRef}
              className="grid md:grid-cols-3 gap-6"
              initial="hidden"
              animate={problemInView ? "visible" : "hidden"}
              variants={stagger}
            >
              {problems.map((p) => (
                <motion.div
                  key={p.title}
                  variants={fadeUp}
                  className="bg-neutral-50 border border-neutral-200 rounded-2xl p-7 space-y-4"
                >
                  <p.icon className="w-8 h-8 text-destructive" />
                  <h3 className="font-display text-xl font-bold text-neutral-900">{p.title}</h3>
                  <p className="text-neutral-500 leading-relaxed text-sm">{p.text}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* ── 3 STEP VERTICALI CON LINEA ── */}
        <section className="bg-neutral-50 py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <div className="text-center mb-14 space-y-4">
              <AnimatedBadge variant="verde">IL PROCESSO</AnimatedBadge>
              <h2 className="font-display text-[28px] md:text-[42px] font-extrabold text-neutral-900 leading-tight">
                3 Step. 14 Giorni.<br />
                <span className="text-primary">Zero Mal di Testa.</span>
              </h2>
            </div>

            <motion.div
              ref={stepsRef}
              className="relative"
              initial="hidden"
              animate={stepsInView ? "visible" : "hidden"}
              variants={stagger}
            >
              {/* Vertical connector line */}
              <div className="hidden md:block absolute left-[39px] top-8 bottom-8 w-[3px] bg-gradient-to-b from-primary via-primary/60 to-primary/20 rounded-full" />

              <div className="space-y-10">
                {steps.map((step, i) => (
                  <motion.div key={step.num} variants={fadeUp} className="flex gap-4 sm:gap-6 md:gap-10">
                    {/* Left: number circle */}
                    <div className="flex-shrink-0 flex flex-col items-center">
                      <div className="w-[56px] h-[56px] sm:w-[80px] sm:h-[80px] rounded-full bg-primary text-primary-foreground font-display font-extrabold text-lg sm:text-2xl flex items-center justify-center relative z-10 shadow-card-green">
                        {step.num}
                      </div>
                      <span className="mt-2 sm:mt-3 font-mono text-[8px] sm:text-[9px] uppercase tracking-wider bg-primary-light text-primary-dark px-2 sm:px-3 py-1 rounded-full font-medium whitespace-nowrap">
                        {step.days}
                      </span>
                    </div>

                    {/* Right: card */}
                    <div className="flex-1 bg-background border border-border rounded-2xl p-5 sm:p-7 md:p-8 space-y-4 shadow-card">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{step.icon}</span>
                        <h3 className="font-display text-lg sm:text-2xl font-bold text-neutral-900">{step.title}</h3>
                      </div>
                      <p className="text-neutral-500 leading-relaxed">{step.text}</p>
                      <ul className="grid sm:grid-cols-2 gap-2.5 pt-1">
                        {step.details.map((d, j) => (
                          <li key={j} className="flex items-start gap-2 text-sm text-neutral-600">
                            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                            {d}
                          </li>
                        ))}
                      </ul>
                      <div className="pt-2 border-t border-border">
                        <p className="text-sm font-bold text-primary flex items-center gap-2">
                          <ArrowRight className="w-4 h-4" />
                          Risultato: {step.result}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── VALUE STACK ── */}
        <section className="bg-background py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              ref={valueRef}
              initial="hidden"
              animate={valueInView ? "visible" : "hidden"}
              variants={stagger}
              className="space-y-10"
            >
              <motion.div variants={fadeUp} className="text-center space-y-4">
                <AnimatedBadge variant="verde">COSA RICEVI</AnimatedBadge>
                <h2 className="font-display text-[28px] md:text-[42px] font-extrabold text-neutral-900 leading-tight">
                  Ecco Cosa Ti Consegniamo.<br />
                  <span className="text-primary">Prima Di Chiederti Un Euro.</span>
                </h2>
              </motion.div>

              <motion.div variants={fadeUp} className="bg-neutral-50 border border-border rounded-2xl overflow-hidden">
                {valueStack.map((item, i) => (
                  <div
                    key={i}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-7 py-4 sm:py-5 ${i < valueStack.length - 1 ? "border-b border-border" : ""}`}
                  >
                    <div className="flex items-center gap-3">
                      <Check className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-neutral-700 font-medium">{item.label}</span>
                    </div>
                    <span className="font-display font-bold text-neutral-400 line-through text-sm">{item.value}</span>
                  </div>
                ))}
                <div className="bg-primary-light px-7 py-6 flex items-center justify-between">
                  <div>
                    <p className="font-display font-extrabold text-neutral-900 text-lg">Valore totale: <span className="line-through text-neutral-400">€10.500</span></p>
                    <p className="text-sm text-neutral-500 mt-1">Incluso nel tuo piano personalizzato</p>
                  </div>
                  <span className="font-display font-extrabold text-primary text-2xl">INCLUSO</span>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── FAQ ── */}
        <section className="bg-neutral-50 py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              ref={faqRef}
              initial="hidden"
              animate={faqInView ? "visible" : "hidden"}
              variants={stagger}
              className="space-y-10"
            >
              <motion.div variants={fadeUp} className="text-center space-y-4">
                <AnimatedBadge variant="verde">DOMANDE FREQUENTI</AnimatedBadge>
                <h2 className="font-display text-[28px] md:text-[42px] font-extrabold text-neutral-900 leading-tight">
                  Le Domande Che Ci Fanno<br />
                  <span className="text-primary">Tutte Le Aziende Edili</span>
                </h2>
              </motion.div>

              <motion.div variants={fadeUp}>
                <Accordion type="single" collapsible className="space-y-3">
                  {faqs.map((faq, i) => (
                    <AccordionItem
                      key={i}
                      value={`faq-${i}`}
                      className="bg-background border border-border rounded-xl px-6 overflow-hidden"
                    >
                      <AccordionTrigger className="font-display font-bold text-neutral-900 text-left hover:no-underline py-5">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-neutral-500 leading-relaxed pb-5">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ── CTA FINALE DARK ── */}
        <section className="bg-neutral-900 py-16 md:py-24">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
            <h2 className="font-display text-[28px] md:text-[42px] font-extrabold text-white leading-tight">
              Ogni Giorno Che Aspetti,<br />
              <span className="text-primary">Paghi Uno Stipendio In Più.</span>
            </h2>
            <p className="text-neutral-400 text-lg leading-relaxed max-w-xl mx-auto">
              Prenota una call di analisi gratuita. In 30 minuti ti mostriamo esattamente
              quanto puoi risparmiare — con i numeri della tua azienda.
            </p>
            <a
              href="/soluzioni"
              className="inline-block bg-primary text-primary-foreground px-10 py-4 rounded-xl text-base font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
            >
              Prenota La Tua Demo Gratuita →
            </a>
            <p className="text-neutral-500 text-sm italic pt-4 max-w-md mx-auto">
              P.S. — Il 73% delle aziende edili che prenota la demo decide di partire
              entro 48 ore. Non perché vendiamo bene, ma perché i numeri parlano da soli.
            </p>
          </div>
        </section>
      </main>
      <Guarantee />
      <Footer />
    </div>
  );
};

export default ComeFunziona;
