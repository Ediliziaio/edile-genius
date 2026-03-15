import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { usePageSEO } from "@/hooks/usePageSEO";
import {
  Check, ArrowRight, Shield, Calculator, TrendingUp, TrendingDown, Calendar,
  Clock, Users, PiggyBank,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import { Link } from "react-router-dom";

/* ─── animation helpers ─── */
const ctnr = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 1, 0.35, 1] as const } },
};

/* ─── data ─── */
const stats = [
  { icon: Calendar, value: "+40", label: "appuntamenti / mese", color: "text-primary" },
  { icon: TrendingDown, value: "−€6.600", label: "costi / mese", color: "text-primary" },
  { icon: TrendingUp, value: "+€180K", label: "fatturato / anno", color: "text-primary" },
  { icon: Users, value: "+30%", label: "lead qualificati", color: "text-primary" },
  { icon: Clock, value: "−70%", label: "tempi di gestione", color: "text-primary" },
  { icon: PiggyBank, value: "€79.200", label: "risparmio / anno", color: "text-primary" },
];

const faqs = [
  { q: "Posso iniziare con un solo modulo e aggiungerne altri dopo?", a: "Assolutamente sì. Ogni modulo funziona in modo indipendente. Puoi partire con i soli Render AI e aggiungere l'Agente Vocale quando sei pronto. Se attivi 2 o più moduli, ti conviene passare a un Pacchetto Completo per risparmiare." },
  { q: "Cosa succede se finisco i crediti inclusi nel mio piano?", a: "Puoi acquistare pacchetti di crediti extra direttamente dalla dashboard. I crediti extra costano leggermente di più rispetto a quelli inclusi nel piano, ma non c'è nessun blocco del servizio — l'AI continua a funzionare." },
  { q: "Quanto tempo serve per attivare il servizio?", a: "Il tuo Agente Vocale AI è operativo in 48 ore dal setup. I Render AI e il Preventivatore sono attivi in giornata. Ti affianchiamo nell'onboarding con una sessione dedicata." },
  { q: "L'agente vocale parla davvero come una persona?", a: "Sì. Utilizziamo la tecnologia vocale più avanzata al mondo (ElevenLabs). L'agente parla in italiano naturale, gestisce interruzioni, e si adatta al tono della conversazione. I clienti dei nostri partner non si accorgono di parlare con un'AI." },
  { q: "Posso disdire quando voglio?", a: "Sì, zero vincoli. Puoi disdire in qualsiasi momento dalla dashboard. Il servizio resta attivo fino alla fine del periodo pagato." },
  { q: "I miei dati sono al sicuro?", a: "I dati sono ospitati su server europei (Supabase EU), crittografati e conformi al GDPR. Ogni azienda ha un ambiente completamente isolato." },
  { q: "C'è un costo di setup?", a: "Il costo di setup dipende dal piano scelto e viene discusso durante la demo gratuita. In ogni caso è un investimento una tantum che copre configurazione degli agenti, integrazione con i tuoi sistemi e sessione di onboarding personalizzata." },
];

const proofStats = [
  { value: "33+", label: "Aziende edili servite" },
  { value: "€42M+", label: "Fatturato generato ai partner" },
  { value: "6 anni", label: "Nel settore" },
  { value: "24/7", label: "Operativo" },
];

/* ─── helpers ─── */
const fmt = (n: number) => "€ " + Math.round(n).toLocaleString("it-IT");

const Section = ({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      variants={ctnr}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
    >
      {children}
    </motion.section>
  );
};

/* ═══════════════ PAGE ═══════════════ */
const Tariffe = () => {
  usePageSEO({
    title: "Quanto Puoi Risparmiare — Edilizia.io | AI per Imprese Edili",
    description: "Scopri quanto puoi risparmiare e guadagnare con l'AI di Edilizia.io: più appuntamenti, meno costi, margini maggiori. Prenota una demo gratuita di 15 minuti.",
    canonical: "/tariffe",
  });

  /* ROI calculator */
  const [leads, setLeads] = useState(150);
  const [missedCalls, setMissedCalls] = useState(5);
  const [contractValue, setContractValue] = useState(8000);

  const roi = useMemo(() => {
    const costoDipendente = 2500;
    const costoEdiliziaIo = leads <= 100 ? 297 : leads <= 250 ? 497 : 997;
    const risparmioAnnuo = (costoDipendente - costoEdiliziaIo) * 12;
    const opportunita = missedCalls * 20 * contractValue * 0.05;
    return { costoDipendente, costoEdiliziaIo, risparmioAnnuo, opportunita };
  }, [leads, missedCalls, contractValue]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── HERO ── */}
      <Section className="pt-20 pb-12 md:pt-28 md:pb-16 bg-gradient-to-b from-primary-bg to-background">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <motion.div variants={item} className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
            <Calculator className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider">Il Tuo Agente AI</span>
          </motion.div>
          <motion.h1 variants={item} className="font-display text-[32px] md:text-[52px] font-extrabold text-foreground leading-[1.1] tracking-tight">
            Il Tuo Agente AI<br />
            <span className="text-primary">a Partire da €147/mese.</span>
          </motion.h1>
          <motion.p variants={item} className="text-muted-foreground text-lg md:text-xl max-w-[680px] mx-auto leading-relaxed">
            Setup in 48 ore, nessun vincolo, disdici quando vuoi. Scopri in una chiamata di 15 minuti quanto puoi risparmiare e guadagnare.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            {["Nessun vincolo", "Disdici quando vuoi", "Setup in 48 ore"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 bg-primary-light text-primary-dark px-3 py-1 rounded-full font-semibold text-xs">
                <Check size={14} /> {t}
              </span>
            ))}
          </motion.div>
          <motion.div variants={item}>
            <a
              href="#cta-finale"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-base shadow-button-green hover:bg-primary-dark hover:scale-[1.02] transition-all"
            >
              Prenota Dimostrazione Gratuita 15 Min <ArrowRight size={16} />
            </a>
          </motion.div>
        </div>
      </Section>

      {/* ── RISULTATI ── */}
      <Section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div variants={item} className="text-center mb-12 space-y-3">
            <h2 className="font-display text-[26px] md:text-4xl font-extrabold text-foreground">
              Risultati Reali dei Nostri Partner
            </h2>
            <p className="text-muted-foreground text-base max-w-[560px] mx-auto">
              Numeri concreti, misurati sulle aziende edili che già usano l'AI di Edilizia.io.
            </p>
          </motion.div>

          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            {stats.map((s) => (
              <div
                key={s.label}
                className="group relative bg-background rounded-2xl border border-border p-6 md:p-8 shadow-card hover:shadow-card-hover hover:border-primary/30 transition-all text-center"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                  <s.icon className="w-6 h-6 text-primary" />
                </div>
                <div className="font-display text-2xl md:text-3xl font-extrabold text-foreground mb-1">
                  {s.value}
                </div>
                <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>

          <motion.p variants={item} className="text-center text-muted-foreground text-sm mt-8 max-w-lg mx-auto">
            Ti mostriamo i numeri reali per la <strong>tua</strong> azienda in soli 15 minuti. Nessun impegno.
          </motion.p>
        </div>
      </Section>

      {/* ── CALCOLATORE ROI ── */}
      <Section className="py-16 md:py-24 bg-[hsl(var(--neutral-50))]" id="calcolatore">
        <div className="max-w-6xl mx-auto px-6">
          <motion.div variants={item} className="text-center mb-12 space-y-3">
            <h2 className="font-display text-[26px] md:text-4xl font-extrabold text-foreground">
              Quanto risparmi con Edilizia.io?
            </h2>
            <p className="text-muted-foreground text-base max-w-[560px] mx-auto">
              Confronta il costo di un dipendente tradizionale con il tuo Agente AI.
            </p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <motion.div variants={item} className="space-y-5">
              {[
                { label: "Lead al mese", value: leads, set: setLeads, min: 50, max: 500, step: 10, display: `${leads}`, unit: "lead/mese" },
                { label: "Chiamate perse al giorno", value: missedCalls, set: setMissedCalls, min: 2, max: 20, step: 1, display: `${missedCalls}`, unit: "al giorno" },
                { label: "Valore medio commessa", value: contractValue, set: setContractValue, min: 2000, max: 25000, step: 500, display: fmt(contractValue), unit: "" },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl border border-border bg-background p-5 shadow-card">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-2">{s.label}</div>
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="font-display text-[26px] font-extrabold text-foreground leading-none">{s.display}</span>
                    {s.unit && <span className="font-mono text-xs text-muted-foreground">{s.unit}</span>}
                  </div>
                  <Slider value={[s.value]} onValueChange={([v]) => s.set(v)} min={s.min} max={s.max} step={s.step} className="w-full" />
                  <div className="flex justify-between mt-1.5">
                    <span className="font-mono text-[10px] text-muted-foreground">{s.min}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{s.max}</span>
                  </div>
                </div>
              ))}
            </motion.div>

            <motion.div variants={item} className="space-y-4">
              <div className="rounded-2xl border-2 border-primary/30 bg-background p-6 shadow-card-green space-y-6">
                <div className="border-b border-border pb-5">
                  <div className="text-sm text-muted-foreground mb-1">Risparmio annuo stimato</div>
                  <div className="font-display text-[36px] md:text-[44px] font-extrabold text-primary leading-none">
                    {fmt(roi.risparmioAnnuo)}
                  </div>
                </div>

                <div>
                  <div className="text-sm text-muted-foreground mb-1">Opportunità recuperate/anno</div>
                  <div className="font-display text-[28px] font-extrabold text-foreground leading-none">
                    {fmt(roi.opportunita)}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-1">
                    {missedCalls} chiamate perse × 20 gg × {fmt(contractValue)} × 5% conversione
                  </div>
                </div>
              </div>

              <a href="#cta-finale" className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-base shadow-button-green hover:bg-primary-dark hover:scale-[1.01] transition-all">
                Prenota Demo 15 Min e Verifica i Numeri <ArrowRight size={16} />
              </a>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── SOCIAL PROOF + FAQ ── */}
      <Section className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {proofStats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-extrabold text-primary mb-1">{s.value}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={item}>
            <h2 className="font-display text-[26px] md:text-4xl font-extrabold text-foreground text-center mb-10">
              Domande Frequenti
            </h2>
            <Accordion type="single" collapsible className="space-y-3">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="bg-background border border-border rounded-xl px-6 overflow-hidden">
                  <AccordionTrigger className="text-left font-bold text-foreground text-sm hover:no-underline py-5">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm pb-5 leading-relaxed">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </motion.div>
        </div>
      </Section>

      {/* ── CTA FINALE ── */}
      <section id="cta-finale" className="py-16 md:py-24 bg-[hsl(var(--neutral-900))]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider">Nessun Impegno</span>
          </div>
          <h2 className="font-display text-[28px] md:text-[44px] font-extrabold text-white leading-tight">
            Prenota una Dimostrazione<br />
            <span className="text-primary">Gratuita di 15 Minuti.</span>
          </h2>
          <p className="text-[hsl(var(--neutral-300))] text-base max-w-[520px] mx-auto">
            Ti mostriamo i numeri reali per la tua azienda in soli 15 minuti. L'Agente Vocale AI in azione sul tuo caso specifico.
          </p>
          <Link
            to="/soluzioni"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-base shadow-button-green hover:bg-primary-dark hover:scale-[1.02] transition-all"
          >
            Prenota la Tua Demo Gratuita 15 Min <ArrowRight size={16} />
          </Link>
          <p className="font-mono text-[11px] text-[hsl(var(--neutral-500))]">
            Nessun impegno. Nessuna carta di credito. Solo 15 minuti per vedere cosa può fare l'AI per il tuo business.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tariffe;
