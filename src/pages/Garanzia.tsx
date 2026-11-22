import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { usePageSEO } from "@/hooks/usePageSEO";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import { Shield, Clock, TrendingUp, CheckCircle2, XCircle, ArrowRight, Phone, BarChart3, Users, BadgePercent } from "lucide-react";

/* ───────────── DATA ───────────── */

const timeline = [
  {
    day: "Giorno 1–3",
    icon: "🔍",
    title: "Analisi e Progetto",
    desc: "Studiamo i tuoi processi e ti presentiamo il progetto del sistema: cosa fa, con quali dati e quali risultati concordiamo. Tu non tocchi nulla di tecnico.",
  },
  {
    day: "Giorno 3–7",
    icon: "⚙️",
    title: "Sviluppo e Avvio",
    desc: "Il sistema entra nei tuoi processi: telefono, preventivi, documenti, cantiere. In circa 7 giorni è attivo (un agente vocale anche in 48 ore).",
  },
  {
    day: "Giorno 8–14",
    icon: "📈",
    title: "Messa a Punto",
    desc: "Analizziamo i primi risultati, conversazioni e documenti prodotti, e miglioriamo il sistema con il tuo team.",
  },
  {
    day: "Giorno 15–30",
    icon: "🏆",
    title: "Risultati Misurati",
    desc: "Dati alla mano: richieste gestite, preventivi preparati, ore recuperate. Confrontiamo i risultati con quelli concordati nel progetto.",
  },
];

const faqs = [
  {
    q: "\"Sembra troppo bello per essere vero.\"",
    a: "Lo capiamo. Ma i numeri non mentono: su oltre 50 implementazioni, meno del 2% ha chiesto il rimborso. Non offriamo questa garanzia per sembrare generosi — la offriamo perché il rischio reale per noi è vicino allo zero. I risultati sono prevedibili quando il sistema è costruito bene.",
  },
  {
    q: "\"E se il mio settore è diverso?\"",
    a: "Lavoriamo esclusivamente con il settore edile: serramenti, infissi, fotovoltaico, ristrutturazioni, impianti, general contractor e studi tecnici di architetti, ingegneri e geometri. Non siamo un'azienda generica che fa tutto per tutti. Ogni flusso, ogni documento, ogni risposta è calibrata su come lavora il tuo settore.",
  },
  {
    q: "\"Non ho tempo per implementare qualcosa di nuovo.\"",
    a: "Perfetto, perché non devi fare nulla. Facciamo tutto noi: setup, training, collegamento numeri, test. Il tuo unico impegno? Una call di 30 minuti per capire il tuo business. Dopo, ci pensiamo noi. In circa 7 giorni il primo sistema è attivo.",
  },
  {
    q: "\"Ho già provato software che non funzionavano.\"",
    a: "Noi non siamo un software da configurare. Siamo il tuo reparto AI chiavi in mano. Non ti diamo un tool e ti lasciamo solo. Configuriamo, monitoriamo, ottimizziamo. Se qualcosa non funziona, è un nostro problema — non tuo.",
  },
  {
    q: "\"Cosa succede se non funziona davvero?\"",
    a: "Se entro 30 giorni dall'avvio il sistema non raggiunge i risultati concordati nel progetto, ti rimborsiamo quanto pagato per quel sistema. Integralmente. Senza clausole nascoste, senza \"crediti\" al posto dei soldi veri. Bonifico sul tuo conto. Fine.",
  },
  {
    q: "\"E se poi i costi aumentano?\"",
    a: "I costi li definiamo insieme dopo la consulenza gratuita, nero su bianco nel progetto. Nessun costo nascosto, nessuna sorpresa a metà strada. Se continuiamo a lavorare insieme è perché ti conviene, non perché sei obbligato.",
  },
];

const stats = [
  { value: "~7 gg", label: "Primo sistema attivo", icon: BadgePercent },
  { value: "50+", label: "Ruoli ripetitivi automatizzati", icon: Users },
  { value: "<2%", label: "Richieste rimborso", icon: Shield },
  { value: "€2.3M", label: "Risparmiati dai clienti", icon: TrendingUp },
];

const testimonials = [
  {
    name: "Marco R.",
    role: "Titolare — Serramenti, Brescia",
    text: "In 3 settimane l'Agente ha fissato 23 appuntamenti qualificati. La segretaria che avevo prima ne fissava 8 al mese. Non torno indietro.",
  },
  {
    name: "Giuseppe T.",
    role: "Socio — Fotovoltaico, Roma",
    text: "Ero scettico. Ho detto: 'se non funziona, rivoglio i soldi'. Non ho mai dovuto chiederli. Dopo 2 mesi risparmiamo €3.200/mese di stipendio.",
  },
];

/* ───────────── COMPONENT ───────────── */

const Garanzia = () => {
  const seoTags = usePageSEO({
    title: "Garanzia sui Risultati 30 Giorni | Edilizia.io",
    description: "Se entro 30 giorni il sistema AI non raggiunge i risultati concordati, ti rimborsiamo quanto pagato per quel sistema. Per imprese edili e studi tecnici.",
    canonical: "/garanzia",
    jsonLd: {
      "@type": "FAQPage",
      mainEntity: faqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  });

  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const reasonRef = useRef(null);
  const reasonInView = useInView(reasonRef, { once: true, margin: "-60px" });
  const timelineRef = useRef(null);
  const timelineInView = useInView(timelineRef, { once: true, margin: "-60px" });
  const pactRef = useRef(null);
  const pactInView = useInView(pactRef, { once: true, margin: "-60px" });
  const faqRef = useRef(null);
  const faqInView = useInView(faqRef, { once: true, margin: "-60px" });
  const proofRef = useRef(null);
  const proofInView = useInView(proofRef, { once: true, margin: "-60px" });
  const ctaRef = useRef(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-60px" });

  return (
    <div className="min-h-screen bg-background">
      {seoTags}
      <Navbar />
      <main>
        {/* ═══════════ 1. HERO — Pattern Interrupt ═══════════ */}
        <section className="bg-primary-bg py-20 md:py-32 overflow-hidden">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, y: 30 }}
              animate={heroInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              <AnimatedBadge variant="verde" pulse>RISCHIO ZERO</AnimatedBadge>

              <motion.div
                className="mx-auto w-[120px] h-[120px] md:w-[160px] md:h-[160px] rounded-full bg-primary/15 flex items-center justify-center"
                initial={{ rotateY: 0, scale: 0.8 }}
                animate={heroInView ? { rotateY: 360, scale: 1 } : {}}
                transition={{ duration: 1, ease: "easeOut" }}
              >
                <Shield className="w-16 h-16 md:w-20 md:h-20 text-primary" strokeWidth={1.5} />
              </motion.div>

              <h1 className="font-display text-[28px] md:text-[52px] lg:text-[60px] font-extrabold text-foreground leading-[1.08]">
                Se Non Funziona, Non Paghi.<br />
                Se Funziona, Ti Cambia l'Azienda.<br />
                <span className="text-primary">In Entrambi i Casi, Vinci Tu.</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                Perché ti offriamo una garanzia che nessun competitor oserebbe dare?
                Perché sappiamo cosa succede quando un'impresa edile toglie al suo team il lavoro
                ripetitivo e lo affida a un sistema AI costruito sui suoi processi:{" "}
                <span className="font-semibold text-foreground">più veloce, sempre disponibile, misurabile.</span>
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <Link
                  to="/#cta-finale"
                  className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
                >
                  Prenota la Consulenza Gratuita <ArrowRight size={18} />
                </Link>
                <span className="text-sm text-muted-foreground">⏱ 30 min · Nessun impegno</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════ 2. REASON WHY (Kennedy) ═══════════ */}
        <section className="bg-background py-16 md:py-24">
          <motion.div
            ref={reasonRef}
            className="max-w-3xl mx-auto px-6 space-y-8"
            initial={{ opacity: 0, y: 30 }}
            animate={reasonInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-[24px] md:text-[40px] font-extrabold text-foreground leading-[1.1]">
              Non Ti Offriamo Questa Garanzia Perché Siamo Generosi.<br />
              <span className="text-primary">Te La Offriamo Perché Siamo Sicuri.</span>
            </h2>

            <div className="space-y-5 text-[17px] md:text-lg text-muted-foreground leading-relaxed">
              <p>
                Negli ultimi 18 mesi, abbiamo implementato Agenti AI in oltre{" "}
                <span className="font-bold text-foreground">50 aziende edili</span> in tutta Italia.
                Serramentisti, impiantisti, fotovoltaico, ristrutturazioni, general contractor, e oggi anche architetti, ingegneri e geometri.
              </p>
              <p>
                Su oltre 50 implementazioni, le richieste di rimborso sono state{" "}
                <span className="font-bold text-foreground">meno del 2%</span>.
                Non il 10%. Non il 5%. Meno del 2%.
              </p>
              <p>
                Questo significa una cosa sola: i risultati sono <em>prevedibili</em>.
                Non è una scommessa. È un sistema che funziona quando è costruito da chi conosce
                il tuo settore — non da un'azienda generica che ieri faceva siti web e domani farà crypto.
              </p>
              <p className="font-semibold text-foreground text-lg md:text-xl">
                Ecco perché la garanzia non è un rischio per noi. È una dichiarazione di certezza.
              </p>
            </div>
          </motion.div>
        </section>

        {/* ═══════════ 3. VALUE STACK — Timeline 30 Giorni (Abraham) ═══════════ */}
        <section className="bg-muted py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              ref={timelineRef}
              initial={{ opacity: 0, y: 20 }}
              animate={timelineInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-14 space-y-4"
            >
              <AnimatedBadge variant="arancio">I PRIMI 30 GIORNI</AnimatedBadge>
              <h2 className="font-display text-[24px] md:text-[40px] font-extrabold text-foreground leading-[1.1]">
                Ecco Cosa Succede Nei Primi 30 Giorni<br />
                <span className="text-primary">(E Perché Non Chiederai Mai Il Rimborso)</span>
              </h2>
            </motion.div>

            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-6 md:left-8 top-0 bottom-0 w-px bg-border" />

              <div className="space-y-8">
                {timeline.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={timelineInView ? { opacity: 1, x: 0 } : {}}
                    transition={{ duration: 0.5, delay: i * 0.15 }}
                    className="relative pl-16 md:pl-20"
                  >
                    {/* Dot */}
                    <div className="absolute left-[14px] md:left-[22px] top-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold z-10">
                      {i + 1}
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{item.icon}</span>
                        <div>
                          <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider">{item.day}</span>
                          <h3 className="font-display text-lg font-bold text-foreground">{item.title}</h3>
                        </div>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{item.desc}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={timelineInView ? { opacity: 1 } : {}}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-center mt-12 text-lg md:text-xl font-display font-bold text-foreground max-w-xl mx-auto"
            >
              A questo punto il 97% dei nostri clienti ha già deciso di restare.
              Non perché sono vincolati.{" "}
              <span className="text-primary">Perché tornare indietro non ha senso.</span>
            </motion.p>
          </div>
        </section>

        {/* ═══════════ 4. IL PATTO — Certificato (Risk Reversal) ═══════════ */}
        <section className="bg-background py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              ref={pactRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={pactInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.6 }}
              className="relative bg-card border-2 border-primary/30 rounded-3xl p-8 md:p-14 overflow-hidden"
              style={{
                boxShadow: "0 0 80px rgba(62,207,110,0.1), 0 4px 20px rgba(0,0,0,0.06)",
              }}
            >
              {/* Decorative corner */}
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-[60px]" />
              <div className="absolute bottom-0 left-0 w-16 h-16 bg-primary/5 rounded-tr-[40px]" />

              <div className="relative space-y-8">
                <div className="text-center space-y-2">
                  <span className="font-mono text-xs text-primary uppercase tracking-[0.15em] font-bold">Certificato di Garanzia</span>
                  <h2 className="font-display text-[24px] md:text-[36px] font-extrabold text-foreground">
                    Il Nostro Patto Con Te
                  </h2>
                </div>

                <p className="text-muted-foreground text-center text-lg leading-relaxed max-w-xl mx-auto italic">
                  "Noi, Edilizia.io, garantiamo formalmente che ogni azienda edile che attiva il nostro servizio è protetta da tre impegni non negoziabili:"
                </p>

                <div className="grid gap-6">
                  {[
                    {
                      icon: Shield,
                      title: "Rimborso Integrale",
                      text: "Se entro 30 giorni dall'avvio il sistema AI non raggiunge i risultati concordati nel progetto, ti rimborsiamo quanto pagato per quel sistema. Integralmente. Senza domande.",
                    },
                    {
                      icon: Clock,
                      title: "Costi Chiari nel Progetto",
                      text: "Costi, tempi e risultati attesi scritti nel progetto prima di partire. Nessun costo nascosto. Se continuiamo insieme, è perché ti conviene.",
                    },
                    {
                      icon: BarChart3,
                      title: "KPI Definiti Prima di Partire",
                      text: "Non misuriamo 'impressioni' o 'engagement'. Misuriamo appuntamenti fissati, lead qualificati, tempo risparmiato. Numeri veri, visibili in dashboard dal giorno 1.",
                    },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4 items-start bg-muted/50 rounded-xl p-5">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <item.icon className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display font-bold text-foreground mb-1">{item.title}</h3>
                        <p className="text-muted-foreground text-[15px] leading-relaxed">{item.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-center pt-4 border-t border-border space-y-1">
                  <p className="font-display text-xl font-extrabold text-foreground italic">Edilizia.io</p>
                  <p className="text-sm text-muted-foreground">Il sistema che usiamo noi stessi — perché funziona.</p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════ 5. FAQ — Obiezioni stile Belfort ═══════════ */}
        <section className="bg-muted py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <motion.div
              ref={faqRef}
              initial={{ opacity: 0, y: 20 }}
              animate={faqInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="text-center mb-12 space-y-4"
            >
              <h2 className="font-display text-[24px] md:text-[40px] font-extrabold text-foreground leading-[1.1]">
                Lo So Cosa Stai Pensando...
              </h2>
              <p className="text-muted-foreground text-lg max-w-lg mx-auto">
                Ecco le obiezioni che sentiamo più spesso. E le risposte dirette che meriti.
              </p>
            </motion.div>

            <div className="space-y-4">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={faqInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="bg-card border border-border rounded-2xl p-6 md:p-8 hover:border-primary/30 transition-colors"
                >
                  <h3 className="font-display text-lg font-bold text-foreground mb-3">{faq.q}</h3>
                  <p className="text-muted-foreground leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ═══════════ 6. SOCIAL PROOF — I Numeri Parlano ═══════════ */}
        <section className="bg-background py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-6">
            <motion.div
              ref={proofRef}
              initial={{ opacity: 0, y: 20 }}
              animate={proofInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5 }}
              className="space-y-12"
            >
              <h2 className="font-display text-[24px] md:text-[36px] font-extrabold text-foreground text-center">
                I Numeri Parlano.<br className="md:hidden" /> <span className="text-primary">Noi Li Lasciamo Fare.</span>
              </h2>

              {/* Stat grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {stats.map((stat) => (
                  <div key={stat.label} className="bg-muted rounded-2xl p-6 text-center space-y-2 border border-border">
                    <stat.icon className="w-6 h-6 text-primary mx-auto" />
                    <p className="font-display text-3xl md:text-4xl font-extrabold text-foreground">{stat.value}</p>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Testimonials */}
              <div className="grid md:grid-cols-2 gap-6">
                {testimonials.map((t) => (
                  <div key={t.name} className="bg-card border border-border rounded-2xl p-6 md:p-8">
                    <p className="text-foreground leading-relaxed mb-4 italic">"{t.text}"</p>
                    <div>
                      <p className="font-display font-bold text-foreground text-sm">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════ 7. CTA FINALE — Future Pacing ═══════════ */}
        <section className="bg-[hsl(var(--neutral-900))] py-16 md:py-24">
          <motion.div
            ref={ctaRef}
            className="max-w-4xl mx-auto px-6"
            initial={{ opacity: 0, y: 30 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6 }}
          >
            <h2 className="font-display text-[28px] md:text-[48px] font-extrabold text-white text-center leading-[1.08] mb-12">
              Fra 30 Giorni Sarai In Una<br />
              Di Queste Due Situazioni.
            </h2>

            {/* Two columns */}
            <div className="grid md:grid-cols-2 gap-6 mb-12">
              {/* Without */}
              <div className="bg-[hsl(var(--neutral-800))] border border-[hsl(var(--neutral-700))] rounded-2xl p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <XCircle className="w-6 h-6 text-destructive" />
                  <h3 className="font-display font-bold text-white text-lg">Se non prenoti</h3>
                </div>
                {[
                  "Stessi processi, stessi costi",
                  "Ufficio sommerso da telefonate e documenti",
                  "Lead del weekend persi per sempre",
                  "Nessuna idea di quanti soldi stai bruciando",
                  "I tuoi competitor iniziano a usare l'AI",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-destructive mt-1 text-sm">✕</span>
                    <p className="text-[hsl(var(--neutral-300))] text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>

              {/* With */}
              <div className="bg-primary/10 border border-primary/30 rounded-2xl p-8 space-y-5">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                  <h3 className="font-display font-bold text-white text-lg">Se prenoti oggi</h3>
                </div>
                {[
                  "Agente AI operativo 24/7, zero assenze",
                  "Ogni lead qualificato e in agenda",
                  "Recuperi ore ogni giorno su telefono e documenti",
                  "Dashboard con ROI in tempo reale",
                  "30 giorni di garanzia — zero rischio",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                    <p className="text-[hsl(var(--neutral-300))] text-sm leading-relaxed">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* CTA Button */}
            <div className="text-center space-y-6">
              <Link
                to="/#cta-finale"
                className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-10 py-5 rounded-xl text-lg font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
              >
                PRENOTA LA CONSULENZA GRATUITA <ArrowRight size={20} />
              </Link>

              <p className="text-[hsl(var(--neutral-500))] text-sm">
                🔒 30 minuti · Nessun impegno · Garanzia rimborso 30 giorni
              </p>
            </div>

            {/* P.S. Kennedy style */}
            <div className="mt-14 space-y-5 text-[15px] text-[hsl(var(--neutral-500))] italic max-w-2xl mx-auto">
              <p>
                <span className="font-bold text-primary not-italic">P.S.</span> — Nel peggiore dei casi, esci dalla call con una mappa chiara
                dei tuoi processi e di dove l'AI può aiutarti subito. Una consulenza completa,
                gratis. Nel migliore dei casi, hai già il progetto del sistema che ti farà risparmiare ogni mese.
              </p>
              <p>
                <span className="font-bold text-primary not-italic">P.P.S.</span> — Accettiamo solo 12 aziende al mese. Non per creare
                false urgenze, ma perché ogni implementazione richiede attenzione dedicata. Se stai leggendo questa pagina,
                i posti potrebbero essere già quasi esauriti.
              </p>
              <p>
                <span className="font-bold text-primary not-italic">P.P.P.S.</span> — Lavoriamo solo con titolari e soci che prendono decisioni.
                Se sei uno di loro, questa è la tua chiamata. Se non lo sei, inoltra questa pagina a chi decide.
              </p>
            </div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Garanzia;
