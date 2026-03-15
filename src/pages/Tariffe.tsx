import { useState, useMemo, useRef } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { usePageSEO } from "@/hooks/usePageSEO";
import {
  Check, Minus, Phone, Image, FileText, ClipboardList, MessageCircle,
  ArrowRight, Shield, Zap, Calculator, TrendingUp, X as XIcon
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
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
const pacchetti = [
  {
    name: "Essenziale",
    price: "€297",
    period: "/mese",
    sub: "Per il serramentista o artigiano che vuole iniziare con l'AI",
    features: [
      "1 Agente Vocale AI (300 min/mese)",
      "30 Render AI al mese",
      "50 Preventivi AI al mese",
      "20 Rapportini AI al mese",
      "CRM con pipeline e calendario",
      "2 utenti",
      "Supporto email",
    ],
    cta: "Prenota una Demo",
    style: "border-border",
    ctaCls: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    featured: false,
  },
  {
    name: "Crescita",
    price: "€497",
    period: "/mese",
    sub: "Per l'impresa che vuole crescere e automatizzare",
    features: [
      "2 Agenti Vocali AI (750 min/mese)",
      "80 Render AI al mese",
      "150 Preventivi AI al mese",
      "80 Rapportini AI al mese",
      "WhatsApp AI integrato (500 msg)",
      "Lead Scoring AI automatico",
      "Dashboard KPI avanzata",
      "5 utenti",
      "Supporto prioritario",
    ],
    cta: "Prenota una Demo",
    style: "border-2 border-primary shadow-card-green",
    ctaCls: "bg-primary text-primary-foreground shadow-button-green hover:bg-primary-dark",
    featured: true,
  },
  {
    name: "Dominio",
    price: "€997",
    period: "/mese",
    sub: "Per l'azienda strutturata che vuole dominare il mercato",
    features: [
      "3+ Agenti Vocali AI (2.000 min/mese)",
      "250 Render AI al mese",
      "500 Preventivi AI al mese",
      "300 Rapportini AI al mese",
      "WhatsApp AI (2.000 msg)",
      "Voice Cloning personalizzato",
      "Firma Digitale integrata",
      "Multi-sede / SuperAdmin",
      "15 utenti",
      "Account Manager dedicato",
    ],
    cta: "Prenota una Demo",
    style: "border-border",
    ctaCls: "border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground",
    featured: false,
  },
  {
    name: "Enterprise",
    price: "Su Misura",
    period: "",
    sub: "Per gruppi, franchising e aziende con esigenze specifiche",
    features: [
      "Agenti Vocali illimitati",
      "Tutti i moduli AI illimitati",
      "White-label disponibile",
      "Integrazioni custom",
      "SLA garantito",
      "Team dedicato",
    ],
    cta: "Contattaci",
    style: "border-border",
    ctaCls: "bg-[hsl(var(--neutral-900))] text-white hover:bg-[hsl(var(--neutral-800))]",
    featured: false,
  },
];

const moduli = [
  {
    icon: Phone,
    name: "Agente Vocale AI",
    price: "€147",
    desc: "Il tuo dipendente AI che risponde al telefono, qualifica i lead e fissa appuntamenti. 24/7.",
    includes: "200 minuti/mese · 1 agente · Integrazione calendario · Trascrizioni",
  },
  {
    icon: Image,
    name: "Render AI",
    price: "€67",
    desc: "Mostra ai tuoi clienti come staranno i nuovi infissi, il bagno o la facciata. Render fotorealistici in 10 secondi.",
    includes: "30 render/mese · Infissi, stanze, esterni · PDF · Galleria",
  },
  {
    icon: FileText,
    name: "Preventivatore AI",
    price: "€47",
    desc: "Preventivi professionali in 30 secondi. Calcola varianti, detrazioni, IVA e genera il PDF brandizzato.",
    includes: "50 preventivi/mese · Calcolo automatico · PDF · Listini",
  },
  {
    icon: ClipboardList,
    name: "Rapportini AI",
    price: "€37",
    desc: "Report cantiere da input vocale o foto. Il tuo capo cantiere parla, l'AI scrive il rapportino.",
    includes: "30 report/mese · Input vocale e foto · PDF/Excel · Dashboard",
  },
  {
    icon: MessageCircle,
    name: "WhatsApp AI",
    price: "€47",
    desc: "Follow-up automatici via WhatsApp. Ricorda appuntamenti, invia preventivi, coltiva i lead.",
    includes: "300 messaggi/mese · Follow-up · Reminder · CRM",
  },
];

const comparisonRows: { label: string; values: string[] }[] = [
  { label: "Agenti Vocali AI", values: ["1 (300 min)", "2 (750 min)", "3+ (2.000 min)", "Illimitati"] },
  { label: "Render AI", values: ["30/mese", "80/mese", "250/mese", "Illimitati"] },
  { label: "Preventivi AI", values: ["50/mese", "150/mese", "500/mese", "Illimitati"] },
  { label: "Rapportini AI", values: ["20/mese", "80/mese", "300/mese", "Illimitati"] },
  { label: "WhatsApp AI", values: ["—", "500 msg", "2.000 msg", "Illimitato"] },
  { label: "CRM Pipeline", values: ["✓", "✓", "✓", "✓"] },
  { label: "Lead Scoring AI", values: ["—", "✓", "✓", "✓"] },
  { label: "Voice Cloning", values: ["—", "—", "1 voce", "3+ voci"] },
  { label: "Firma Digitale", values: ["—", "—", "✓", "✓"] },
  { label: "Multi-sede", values: ["—", "—", "✓", "✓"] },
  { label: "Utenti", values: ["2", "5", "15", "Illimitati"] },
  { label: "Supporto", values: ["Email", "Prioritario", "Account Manager", "Team dedicato"] },
];

const faqs = [
  { q: "Posso iniziare con un solo modulo e aggiungerne altri dopo?", a: "Assolutamente sì. Ogni modulo funziona in modo indipendente. Puoi partire con i soli Render AI e aggiungere l'Agente Vocale quando sei pronto. Se attivi 2 o più moduli, ti conviene passare a un Pacchetto Completo per risparmiare." },
  { q: "Cosa succede se finisco i crediti inclusi nel mio piano?", a: "Puoi acquistare pacchetti di crediti extra direttamente dalla dashboard. I crediti extra costano leggermente di più rispetto a quelli inclusi nel piano, ma non c'è nessun blocco del servizio — l'AI continua a funzionare." },
  { q: "Quanto tempo serve per attivare il servizio?", a: "Il tuo Agente Vocale AI è operativo in 48 ore dal setup. I Render AI e il Preventivatore sono attivi in giornata. Ti affianchiamo nell'onboarding con una sessione dedicata." },
  { q: "L'agente vocale parla davvero come una persona?", a: "Sì. Utilizziamo la tecnologia vocale più avanzata al mondo (ElevenLabs). L'agente parla in italiano naturale, gestisce interruzioni, e si adatta al tono della conversazione. I clienti dei nostri partner non si accorgono di parlare con un'AI." },
  { q: "Posso disdire quando voglio?", a: "Sì, zero vincoli. Puoi disdire in qualsiasi momento dalla dashboard. Il servizio resta attivo fino alla fine del periodo pagato." },
  { q: "I miei dati sono al sicuro?", a: "I dati sono ospitati su server europei (Supabase EU), crittografati e conformi al GDPR. Ogni azienda ha un ambiente completamente isolato." },
  { q: "C'è un costo di setup?", a: "Per i Pacchetti Completi è previsto un setup una tantum (da €497 a €1.497 in base al piano) che copre la configurazione degli agenti, l'integrazione con i tuoi sistemi e la sessione di onboarding. Per i moduli singoli il setup parte da €197." },
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
    title: "Prezzi e Tariffe — Edilizia.io | AI per Imprese Edili",
    description: "Scopri i prezzi di Edilizia.io: agenti vocali AI, render, preventivi automatici per imprese edili. Da €37/mese. Prenota una demo gratuita.",
    canonical: "/tariffe",
  });

  const [view, setView] = useState<"pacchetti" | "moduli">("pacchetti");

  /* ROI calculator */
  const [leads, setLeads] = useState(150);
  const [missedCalls, setMissedCalls] = useState(5);
  const [contractValue, setContractValue] = useState(8000);

  const roi = useMemo(() => {
    const costoDipendente = 2500;
    const costoEdiliziaIo = leads <= 100 ? 297 : leads <= 250 ? 497 : 997;
    const risparmioAnnuo = (costoDipendente - costoEdiliziaIo) * 12;
    const opportunita = missedCalls * 20 * contractValue * 0.05;
    return { costoDipendente, costoEdiliziaIo, risparmioAnnuo, opportunita, piano: leads <= 100 ? "Essenziale" : leads <= 250 ? "Crescita" : "Dominio" };
  }, [leads, missedCalls, contractValue]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* ── SEZIONE 1: HERO ── */}
      <Section className="pt-20 pb-12 md:pt-28 md:pb-16 bg-gradient-to-b from-primary-bg to-background">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-6">
          <motion.h1 variants={item} className="font-display text-[32px] md:text-[52px] font-extrabold text-foreground leading-[1.1] tracking-tight">
            Investi meno di un dipendente part-time.<br />
            <span className="text-primary">Ottieni un'azienda che lavora 24 ore su 24.</span>
          </motion.h1>
          <motion.p variants={item} className="text-muted-foreground text-lg md:text-xl max-w-[680px] mx-auto leading-relaxed">
            Ogni servizio AI di Edilizia.io funziona a crediti. Scegli solo quello che ti serve — un agente vocale, i render, i preventivi — oppure prendi tutto nel pacchetto completo e risparmia.
          </motion.p>
          <motion.div variants={item} className="flex flex-wrap items-center justify-center gap-3 text-sm text-muted-foreground">
            {["Nessun vincolo", "Disdici quando vuoi", "Setup in 48 ore"].map((t) => (
              <span key={t} className="inline-flex items-center gap-1.5 bg-primary-light text-primary-dark px-3 py-1 rounded-full font-semibold text-xs">
                <Check size={14} /> {t}
              </span>
            ))}
          </motion.div>

          {/* Toggle */}
          <motion.div variants={item} className="flex items-center justify-center gap-3 pt-2">
            <span className={`font-bold text-sm transition-colors ${view === "moduli" ? "text-foreground" : "text-muted-foreground"}`}>Moduli Singoli</span>
            <Switch checked={view === "pacchetti"} onCheckedChange={(c) => setView(c ? "pacchetti" : "moduli")} />
            <span className={`font-bold text-sm transition-colors ${view === "pacchetti" ? "text-foreground" : "text-muted-foreground"}`}>Pacchetti Completi</span>
          </motion.div>
        </div>
      </Section>

      {/* ── SEZIONE 2 / 3: PRICING CARDS ── */}
      <section className="py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-6">
          <AnimatePresence mode="wait">
            {view === "pacchetti" ? (
              <motion.div key="pacchetti" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5 items-start">
                  {pacchetti.map((p) => (
                    <div key={p.name} className={`relative bg-background rounded-3xl p-7 border transition-all ${p.style} ${p.featured ? "scale-[1.03] z-10" : "shadow-card"}`}>
                      {p.featured && (
                        <div className="absolute -top-3 right-6">
                          <span className="bg-primary text-primary-foreground font-mono text-[10px] uppercase tracking-wider px-3 py-1 rounded-full font-bold">
                            ⭐ Più Popolare
                          </span>
                        </div>
                      )}
                      <h3 className="font-display text-xl font-extrabold text-foreground mb-1">{p.name}</h3>
                      <div className="flex items-baseline gap-1 mb-1">
                        <span className="font-display text-3xl font-extrabold text-foreground">{p.price}</span>
                        {p.period && <span className="text-muted-foreground text-sm">{p.period}</span>}
                      </div>
                      <p className="text-sm text-muted-foreground mb-5">{p.sub}</p>
                      <ul className="space-y-2.5 mb-7">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-foreground/80">
                            <Check size={15} className="text-primary flex-shrink-0 mt-0.5" /> {f}
                          </li>
                        ))}
                      </ul>
                      <a href="#cta-finale" className={`block text-center w-full py-3 rounded-xl font-bold text-sm transition-all ${p.ctaCls}`}>
                        {p.cta}
                      </a>
                    </div>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div key="moduli" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }}>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {moduli.map((m) => (
                    <div key={m.name} className="bg-background rounded-2xl p-6 border border-border shadow-card hover:shadow-card-hover transition-shadow">
                      <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center mb-4">
                        <m.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="font-display text-lg font-extrabold text-foreground mb-0.5">{m.name}</h3>
                      <div className="flex items-baseline gap-1 mb-2">
                        <span className="text-xs text-muted-foreground">da</span>
                        <span className="font-display text-2xl font-extrabold text-foreground">{m.price}</span>
                        <span className="text-muted-foreground text-xs">/mese</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3 leading-relaxed">{m.desc}</p>
                      <p className="text-xs text-muted-foreground mb-5">{m.includes}</p>
                      <Link to="/soluzioni" className="inline-flex items-center gap-1 text-primary font-bold text-sm hover:underline">
                        Scopri di più <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-8">
                  💡 <strong>Consiglio:</strong> Se ti servono 2 o più moduli, il Pacchetto Completo ti fa risparmiare fino al 15%.{" "}
                  <button onClick={() => setView("pacchetti")} className="text-primary font-bold hover:underline">
                    Confronta i pacchetti →
                  </button>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      {/* ── SEZIONE 4: TABELLA COMPARATIVA ── */}
      <Section className="py-12 md:py-20 bg-[hsl(var(--neutral-50))]">
        <div className="max-w-6xl mx-auto px-6">
          <motion.h2 variants={item} className="font-display text-[26px] md:text-4xl font-extrabold text-foreground text-center mb-10">
            Confronta i pacchetti nel dettaglio
          </motion.h2>
          <motion.div variants={item} className="overflow-x-auto rounded-2xl border border-border bg-background shadow-card">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-4 font-bold text-foreground sticky left-0 bg-background z-10">Feature</th>
                  {["Essenziale €297", "Crescita €497", "Dominio €997", "Enterprise"].map((h, i) => (
                    <th key={h} className={`p-4 text-center font-bold text-foreground ${i === 1 ? "bg-primary/5" : ""}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparisonRows.map((row) => (
                  <tr key={row.label} className="border-b border-border/50 last:border-0">
                    <td className="p-4 font-medium text-foreground sticky left-0 bg-background z-10">{row.label}</td>
                    {row.values.map((v, i) => (
                      <td key={i} className={`p-4 text-center ${i === 1 ? "bg-primary/5" : ""}`}>
                        {v === "✓" ? <Check size={16} className="text-primary mx-auto" /> : v === "—" ? <Minus size={16} className="text-muted-foreground/40 mx-auto" /> : <span className="text-foreground/80">{v}</span>}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </div>
      </Section>

      {/* ── SEZIONE 5: CALCOLATORE ROI ── */}
      <Section className="py-16 md:py-24" id="calcolatore">
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
                {/* Dipendente */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XIcon size={18} className="text-destructive" />
                    <span className="text-sm text-muted-foreground">Costo dipendente/mese</span>
                  </div>
                  <span className="font-display text-xl font-extrabold text-foreground">€ 2.500</span>
                </div>
                {/* Edil Genius */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={18} className="text-primary" />
                    <span className="text-sm text-muted-foreground">Costo Edil Genius ({roi.piano})</span>
                  </div>
                  <span className="font-display text-xl font-extrabold text-primary">€ {roi.costoEdilGenius}</span>
                </div>

                <div className="border-t border-border pt-5">
                  <div className="text-sm text-muted-foreground mb-1">Risparmio annuo stimato</div>
                  <div className="font-display text-[36px] md:text-[44px] font-extrabold text-primary leading-none">
                    {fmt(roi.risparmioAnnuo)}
                  </div>
                </div>

                <div className="border-t border-border pt-5">
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
                Prenota una Demo e Verifica i Numeri <ArrowRight size={16} />
              </a>
            </motion.div>
          </div>
        </div>
      </Section>

      {/* ── SEZIONE 6: SOCIAL PROOF + FAQ ── */}
      <Section className="py-16 md:py-24 bg-[hsl(var(--neutral-50))]">
        <div className="max-w-5xl mx-auto px-6">
          {/* Stats */}
          <motion.div variants={item} className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {proofStats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="font-display text-3xl md:text-4xl font-extrabold text-primary mb-1">{s.value}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </motion.div>

          {/* FAQ */}
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

      {/* ── SEZIONE 7: CTA FINALE ── */}
      <section id="cta-finale" className="py-16 md:py-24 bg-[hsl(var(--neutral-900))]">
        <div className="max-w-4xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5">
            <Shield className="w-4 h-4 text-primary" />
            <span className="font-mono text-xs text-primary font-bold uppercase tracking-wider">Nessun Impegno</span>
          </div>
          <h2 className="font-display text-[28px] md:text-[44px] font-extrabold text-white leading-tight">
            Pronto a far lavorare l'AI<br />
            <span className="text-primary">per la tua impresa?</span>
          </h2>
          <p className="text-[hsl(var(--neutral-300))] text-base max-w-[520px] mx-auto">
            Prenota una demo gratuita di 30 minuti. Ti mostriamo l'Agente Vocale in azione sul tuo caso specifico.
          </p>
          <Link
            to="/soluzioni"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl font-bold text-base shadow-button-green hover:bg-primary-dark hover:scale-[1.02] transition-all"
          >
            Prenota la Tua Demo Gratuita <ArrowRight size={16} />
          </Link>
          <p className="font-mono text-[11px] text-[hsl(var(--neutral-500))]">
            Nessun impegno. Nessuna carta di credito. Solo 30 minuti per vedere cosa può fare l'AI per il tuo business.
          </p>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Tariffe;
