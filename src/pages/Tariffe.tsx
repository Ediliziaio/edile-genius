import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { usePageSEO } from "@/hooks/usePageSEO";
import { Check, Calculator, TrendingUp, Clock, BarChart3, Users, Building2, Sliders, ArrowRight, Shield, Zap, Target } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Guarantee from "@/components/sections/Guarantee";
import { Link } from "react-router-dom";

const formatEuro = (n: number) =>
  "€ " + Math.round(n).toLocaleString("it-IT");

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const plans = [
  {
    name: "Starter",
    badge: "1 SOSTITUZIONE",
    sub: "Sostituisci 1 figura operativa",
    features: [
      "1 Agente AI configurato (vocale o operativo)",
      "Fino a 500 interazioni/mese gestite",
      "Qualifica inbound + calendario",
      "Dashboard reportistica base",
      "Setup dedicato (7 giorni)",
      "Supporto email",
    ],
    cta: "Richiedi Preventivo",
    ctaStyle: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    featured: false,
  },
  {
    name: "Professional",
    badge: "TEAM SOSTITUZIONE",
    sub: "Sostituisci 2-3 figure operative",
    features: [
      "2 Agenti AI (Vocale + Operativo)",
      "Interazioni illimitate",
      "Riattivazione database lead",
      "Agente AI per reportistica/analisi",
      "Integrazione CRM",
      "Analytics avanzata",
      "Setup prioritario (5 giorni)",
      "Supporto WhatsApp dedicato",
      "Review mensile performance",
    ],
    cta: "Prenota Demo Gratuita",
    ctaStyle: "bg-primary text-primary-foreground shadow-button-green hover:bg-primary-dark",
    featured: true,
  },
  {
    name: "Enterprise",
    badge: "SOSTITUZIONE TOTALE",
    sub: "Sostituisci l'intero reparto operativo",
    features: [
      "Agenti AI illimitati",
      "Architettura multi-sede",
      "Agenti AI custom per processi specifici",
      "Voce brandizzata proprietaria",
      "Training su dati aziendali interni",
      "SLA garantito",
      "Account manager dedicato",
      "API e integrazioni custom",
    ],
    cta: "Contattaci",
    ctaStyle: "bg-[hsl(var(--neutral-900))] text-white hover:bg-[hsl(var(--neutral-800))]",
    featured: false,
  },
];

const reasonCards = [
  {
    icon: <Users className="w-6 h-6 text-primary" />,
    title: "Ogni Azienda Ha un Organico Diverso",
    desc: "Un'impresa con 3 operatori ha esigenze diverse da una con 15. Il prezzo si adatta alla tua realtà, non il contrario.",
  },
  {
    icon: <Building2 className="w-6 h-6 text-primary" />,
    title: "Il Risparmio Dipende dal Tuo Settore",
    desc: "Ristrutturazioni, impiantistica, edilizia residenziale: ogni settore ha costi e volumi diversi. Calcoliamo il ROI sul tuo caso specifico.",
  },
  {
    icon: <Target className="w-6 h-6 text-primary" />,
    title: "Prima i Numeri, Poi il Prezzo",
    desc: "Non ti chiediamo soldi prima di mostrarti quanto risparmi. Calcoliamo il tuo scenario, poi decidi tu se ha senso.",
  },
];

const stats = [
  { value: "500+", label: "Aziende edili analizzate" },
  { value: "97%", label: "Tasso di rinnovo" },
  { value: "€2.3M", label: "Risparmiati dai clienti" },
  { value: "<2%", label: "Richieste di rimborso" },
];

const SliderCard = ({
  icon,
  label,
  value,
  onChange,
  min,
  max,
  step,
  display,
  unit,
}: {
  icon: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
  unit: string;
}) => (
  <div className="rounded-2xl border border-border bg-background p-5 shadow-card">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{icon}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
    </div>
    <div className="flex items-baseline gap-2 mb-4">
      <span className="font-display text-[28px] font-extrabold text-foreground leading-none">{display}</span>
      <span className="font-mono text-xs text-muted-foreground">{unit}</span>
    </div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
      className="w-full"
    />
    <div className="flex justify-between mt-1.5">
      <span className="font-mono text-[10px] text-muted-foreground">{min}</span>
      <span className="font-mono text-[10px] text-muted-foreground">{max}</span>
    </div>
  </div>
);

const Tariffe = () => {
  usePageSEO({
    title: "Tariffe Agenti AI per l'Edilizia — Calcola il Risparmio | Edilizia.io",
    description: "Confronta i piani Starter, Growth e Scale per agenti AI nell'edilizia. Calcolatore ROI integrato: scopri quanto risparmi rispetto a un dipendente tradizionale.",
    canonical: "/tariffe",
  });

  const [dipendenti, setDipendenti] = useState(2);
  const [stipendio, setStipendio] = useState(1800);
  const [leadMensili, setLeadMensili] = useState(60);
  const [conversioneAttuale, setConversioneAttuale] = useState(5);

  const heroRef = useRef(null);
  const calcRef = useRef(null);
  const plansRef = useRef(null);
  const reasonRef = useRef(null);
  const ctaRef = useRef(null);

  const heroInView = useInView(heroRef, { once: true, margin: "-50px" });
  const calcInView = useInView(calcRef, { once: true, margin: "-50px" });
  const plansInView = useInView(plansRef, { once: true, margin: "-50px" });
  const reasonInView = useInView(reasonRef, { once: true, margin: "-50px" });
  const ctaInView = useInView(ctaRef, { once: true, margin: "-50px" });

  const results = useMemo(() => {
    // Risparmio annuo personale: costo totale dipendente - costo AI stimato
    const costoAnnuoDipendente = stipendio * 13 * 1.45; // lordo + contributi
    const risparmioPers = dipendenti * costoAnnuoDipendente - dipendenti * 890 * 12; // 890€/mese canone AI medio
    
    // Fatturato aggiuntivo: lead persi recuperati × valore medio commessa
    const conversioneAI = Math.min(conversioneAttuale + 8, 25); // l'AI migliora conversione di ~8pp
    const leadRecuperati = leadMensili * ((conversioneAI - conversioneAttuale) / 100);
    const valoreCommessaMedia = 8500; // valore medio commessa edilizia
    const fatturatoAggiuntivo = leadRecuperati * valoreCommessaMedia * 12;

    // Ore/anno liberate
    const oreGiornoRipetitive = 4.5; // media ore su attività ripetitive
    const oreLiberate = dipendenti * oreGiornoRipetitive * 220;

    // ROI primo anno
    const investimentoAnnuo = dipendenti * 890 * 12;
    const valoreGenerato = Math.max(risparmioPers, 0) + fatturatoAggiuntivo;
    const roi = investimentoAnnuo > 0 ? Math.round((valoreGenerato / investimentoAnnuo) * 100) : 0;

    return {
      risparmioPers: Math.max(risparmioPers, 0),
      fatturatoAggiuntivo,
      oreLiberate: Math.round(oreLiberate),
      roi,
    };
  }, [dipendenti, stipendio, leadMensili, conversioneAttuale]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* HERO */}
      <motion.section
        ref={heroRef}
        className="pt-20 pb-12 md:pt-28 md:pb-16"
        variants={containerVariants}
        initial="hidden"
        animate={heroInView ? "visible" : "hidden"}
      >
        <div className="max-w-5xl mx-auto px-6 text-center space-y-5">
          <motion.div variants={itemVariants}>
            <AnimatedBadge variant="verde" pulse>TARIFFE PERSONALIZZATE</AnimatedBadge>
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="font-display text-[36px] md:text-[56px] font-extrabold text-foreground leading-[1.08] tracking-tight"
          >
            Non Ti Diciamo Quanto Costa.<br />
            <span className="text-primary">Ti Mostriamo Quanto Risparmi.</span>
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-muted-foreground text-lg md:text-xl max-w-[640px] mx-auto leading-relaxed"
          >
            Ogni azienda edile è diversa. Per questo il prezzo è calibrato sui tuoi numeri reali.
            Usa il calcolatore qui sotto e scopri il tuo risparmio in 30 secondi.
          </motion.p>
          <motion.div variants={itemVariants}>
            <a
              href="#calcolatore"
              className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-7 py-3.5 rounded-xl font-bold text-base shadow-button-green hover:bg-primary-dark hover:scale-[1.02] transition-all"
            >
              <Calculator className="w-5 h-5" />
              Calcola il Tuo Risparmio
            </a>
          </motion.div>
        </div>
      </motion.section>

      {/* CALCOLATORE INTERATTIVO */}
      <section id="calcolatore" className="py-16 md:py-24 bg-[hsl(var(--neutral-50))]">
        <motion.div
          ref={calcRef}
          className="max-w-6xl mx-auto px-6"
          variants={containerVariants}
          initial="hidden"
          animate={calcInView ? "visible" : "hidden"}
        >
          <motion.div variants={itemVariants} className="text-center mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 text-primary">
              <Sliders className="w-5 h-5" />
              <span className="font-mono text-xs uppercase tracking-wider font-bold">Calcolatore di Risparmio</span>
            </div>
            <h2 className="font-display text-[28px] md:text-4xl font-extrabold text-foreground">
              Inserisci i Tuoi Numeri. Scopri il Risultato.
            </h2>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-8 items-start">
            {/* Sliders */}
            <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SliderCard
                icon="👥"
                label="DIPENDENTI DA SOSTITUIRE"
                value={dipendenti}
                onChange={setDipendenti}
                min={1}
                max={10}
                step={1}
                display={`${dipendenti}`}
                unit="persone"
              />
              <SliderCard
                icon="💰"
                label="STIPENDIO LORDO MEDIO / MESE"
                value={stipendio}
                onChange={setStipendio}
                min={1400}
                max={3500}
                step={50}
                display={`€ ${stipendio.toLocaleString("it-IT")}`}
                unit="lordi"
              />
              <SliderCard
                icon="📞"
                label="LEAD MENSILI GESTITI"
                value={leadMensili}
                onChange={setLeadMensili}
                min={10}
                max={200}
                step={5}
                display={`${leadMensili}`}
                unit="lead/mese"
              />
              <SliderCard
                icon="📊"
                label="TASSO CONVERSIONE ATTUALE"
                value={conversioneAttuale}
                onChange={setConversioneAttuale}
                min={1}
                max={15}
                step={1}
                display={`${conversioneAttuale}%`}
                unit="dei lead"
              />
            </motion.div>

            {/* Results Panel */}
            <motion.div variants={itemVariants} className="space-y-4">
              <div className="rounded-2xl border-2 border-primary/30 bg-background p-6 shadow-card-green">
                <div className="font-mono text-[10px] uppercase tracking-wider text-primary-dark font-bold mb-5 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  IL TUO SCENARIO DI RISPARMIO
                </div>

                {/* Risparmio Personale */}
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">Risparmio annuo su personale</span>
                  </div>
                  <div className="font-display text-[36px] md:text-[44px] font-extrabold text-primary leading-none">
                    {formatEuro(results.risparmioPers)}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-1">
                    = {formatEuro(results.risparmioPers / 12)} / mese risparmiati
                  </div>
                </div>

                {/* Fatturato Aggiuntivo */}
                <div className="mb-6 pb-6 border-b border-border">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--accent-gold))]/10 flex items-center justify-center">
                      <BarChart3 className="w-4 h-4 text-[hsl(var(--accent-gold))]" />
                    </div>
                    <span className="text-sm text-muted-foreground">Fatturato aggiuntivo stimato</span>
                  </div>
                  <div className="font-display text-[28px] md:text-[32px] font-extrabold text-foreground leading-none">
                    {formatEuro(results.fatturatoAggiuntivo)}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground mt-1">
                    Lead recuperati × valore medio commessa (€8.500)
                  </div>
                </div>

                {/* Ore + ROI */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-[hsl(var(--accent-blue))]" />
                      <span className="text-xs text-muted-foreground">Ore/anno liberate</span>
                    </div>
                    <div className="font-display text-2xl font-extrabold text-foreground">
                      {results.oreLiberate.toLocaleString("it-IT")}h
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4 text-primary" />
                      <span className="text-xs text-muted-foreground">ROI primo anno</span>
                    </div>
                    <div className="font-display text-2xl font-extrabold text-primary">
                      {results.roi}%
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA sotto risultati */}
              <a
                href="#cta-finale"
                className="flex items-center justify-center gap-2 w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-base shadow-button-green hover:bg-primary-dark hover:scale-[1.01] transition-all"
              >
                Richiedi il Tuo Preventivo Personalizzato
                <ArrowRight className="w-4 h-4" />
              </a>

              <p className="text-center font-mono text-[10px] text-muted-foreground">
                📌 Stime basate su INPS 2024, CCNL Edilizia, valore commesse medie Nord Italia
              </p>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* PIANI — SENZA PREZZI */}
      <section className="py-16 md:py-24 bg-background">
        <motion.div
          ref={plansRef}
          className="max-w-6xl mx-auto px-6"
          variants={containerVariants}
          initial="hidden"
          animate={plansInView ? "visible" : "hidden"}
        >
          <motion.div variants={itemVariants} className="text-center mb-12 space-y-4">
            <AnimatedBadge variant="verde">COSA INCLUDE OGNI PIANO</AnimatedBadge>
            <h2 className="font-display text-[28px] md:text-4xl font-extrabold text-foreground">
              Tre Piani. <span className="text-primary">Un Obiettivo: Tagliare i Costi.</span>
            </h2>
            <p className="text-muted-foreground text-base max-w-[560px] mx-auto">
              Il prezzo dipende dal tuo scenario. Qui vedi cosa ottieni — il costo lo calcoliamo insieme.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-5 items-start">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative bg-background rounded-3xl p-8 border transition-all ${
                  plan.featured
                    ? "border-2 border-primary shadow-card-green scale-[1.03] z-10"
                    : "border-border shadow-card"
                }`}
              >
                {plan.featured && (
                  <div className="absolute -top-3 right-6 rotate-[15deg]">
                    <span className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                      PIÙ SCELTO
                    </span>
                  </div>
                )}

                <div className="mb-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-primary font-bold bg-primary-light px-2.5 py-1 rounded-full">
                    {plan.badge}
                  </span>
                </div>

                <h3 className="font-display text-2xl font-extrabold text-foreground mb-1">{plan.name}</h3>
                <p className="font-display text-3xl font-extrabold text-foreground mb-1">Su Richiesta</p>
                <p className="text-sm text-muted-foreground mb-6">{plan.sub}</p>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                      <Check size={16} className="text-primary flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <a
                  href="#cta-finale"
                  className={`block text-center w-full py-3 rounded-xl font-bold text-sm transition-all ${plan.ctaStyle}`}
                >
                  {plan.cta}
                </a>
              </div>
            ))}
          </motion.div>

          <p className="text-center font-mono text-[11px] text-muted-foreground mt-8">
            Tutti i piani: setup incluso · aggiornamenti continui · garanzia rimborso 30 giorni · GDPR compliant
          </p>
        </motion.div>
      </section>

      {/* PERCHÉ NESSUN PREZZO FISSO? */}
      <section className="py-16 md:py-24 bg-[hsl(var(--neutral-50))]">
        <motion.div
          ref={reasonRef}
          className="max-w-5xl mx-auto px-6"
          variants={containerVariants}
          initial="hidden"
          animate={reasonInView ? "visible" : "hidden"}
        >
          <motion.div variants={itemVariants} className="text-center mb-12 space-y-4">
            <h2 className="font-display text-[28px] md:text-4xl font-extrabold text-foreground">
              Perché Non Trovi un Prezzo Fisso?
            </h2>
            <p className="text-muted-foreground text-base max-w-[560px] mx-auto">
              Non è un trucco. È rispetto per la tua azienda.
            </p>
          </motion.div>

          <motion.div variants={itemVariants} className="grid md:grid-cols-3 gap-6">
            {reasonCards.map((card) => (
              <div
                key={card.title}
                className="bg-background rounded-2xl p-7 border border-border shadow-card hover:shadow-card-hover transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                  {card.icon}
                </div>
                <h3 className="font-display text-lg font-extrabold text-foreground mb-2">{card.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* SOCIAL PROOF + CTA FINALE */}
      <section id="cta-finale" className="py-16 md:py-24 bg-[hsl(var(--neutral-900))]">
        <motion.div
          ref={ctaRef}
          className="max-w-5xl mx-auto px-6"
          variants={containerVariants}
          initial="hidden"
          animate={ctaInView ? "visible" : "hidden"}
        >
          {/* Stats bar */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-extrabold text-primary mb-1">
                  {s.value}
                </div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--neutral-300))]">
                  {s.label}
                </div>
              </div>
            ))}
          </motion.div>

          {/* CTA */}
          <motion.div variants={itemVariants} className="text-center space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
              <Shield className="w-4 h-4 text-primary" />
              <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider">Garanzia Rimborso 30 Giorni</span>
            </div>
            <h2 className="font-display text-[28px] md:text-[44px] font-extrabold text-white leading-tight">
              Richiedi il Tuo Preventivo<br />
              <span className="text-primary">Personalizzato in 24h.</span>
            </h2>
            <p className="text-[hsl(var(--neutral-300))] text-base max-w-[500px] mx-auto">
              Analizziamo il tuo scenario, calcoliamo il risparmio reale e ti proponiamo il piano migliore.
              Zero impegno. Zero sorprese.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <Link
                to="/soluzioni"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-base shadow-button-green hover:bg-primary-dark hover:scale-[1.02] transition-all"
              >
                Prenota Demo Gratuita
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/garanzia"
                className="inline-flex items-center gap-2 border border-[hsl(var(--neutral-700))] text-[hsl(var(--neutral-300))] px-6 py-4 rounded-xl font-bold text-sm hover:border-primary/50 hover:text-primary transition-all"
              >
                <Shield className="w-4 h-4" />
                Scopri la Garanzia
              </Link>
            </div>
          </motion.div>
        </motion.div>
      </section>

      <Guarantee />
      <Footer />
    </div>
  );
};

export default Tariffe;
