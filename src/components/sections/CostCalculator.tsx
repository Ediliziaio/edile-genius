import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import { Slider } from "@/components/ui/slider";

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

const errorRows = [
  { tipo: "Mancata risposta al telefono", umano: "Frequente. In pausa, in cantiere, impegnato. Media settore: 30-40% chiamate perse ogni giorno", ai: "0% chiamate perse — risposta immediata in <2 secondi, H24, sempre", impatto: "Alto" },
  { tipo: "Dati errati o incompleti nel CRM", umano: "Media errori dati: 12-18% delle schede. Nomi sbagliati, telefoni errati, note mancanti", ai: "Trascrizione automatica verificata — accuracy >98%. Dati sempre completi e strutturati", impatto: "Medio" },
  { tipo: "Follow-up dimenticati", umano: "Frequente. \"Lo richiamo domani\" → mai richiamato. Stima: 35% dei lead caldi abbandonati", ai: "Sequenze automatiche — zero follow-up mai saltati. Ogni lead viene seguito fino alla risposta", impatto: "Alto" },
  { tipo: "Tono non professionale", umano: "Varia con umore, stress, stanchezza. Reclami in periodi di picco: +22%", ai: "Tono sempre costante, rispettoso, calibrato sul brand. Identico alle 8:00 e alle 23:00", impatto: "Medio" },
  { tipo: "Qualifica lead errata", umano: "Soggettiva e variabile. Stima: 20-25% dei lead caldi classificati freddi — o viceversa", ai: "Criteri fissi e oggettivi definiti da te. Qualifica basata su parametri reali, non impressioni", impatto: "Alto" },
  { tipo: "Appuntamenti doppi o saltati", umano: "Conflitti di calendario, dimenticanze. Media: 2-4 appuntamenti persi/mese = preventivi persi", ai: "Integrazione diretta col calendario — zero sovrapposizioni. Conferme automatiche", impatto: "Medio" },
  { tipo: "Zero copertura fuori orario", umano: "Nessuna risposta la sera, il weekend, durante le ferie. 30% dei lead arrivano fuori orario", ai: "Risposta immediata H24, sabato, domenica, festivi, agosto. Nessun lead perso per orario", impatto: "Alto" },
  { tipo: "Turnover — ricominciare da zero", umano: "Media turnover settore: ogni 2-3 anni. Costo rimpiazzo stimato: 6-9 mesi di stipendio", ai: "Zero turnover. L'agente non si dimette, non cerca altro lavoro, non va in maternità", impatto: "Alto" },
];

const CostCalculator = () => {
  const [stipLordo, setStipLordo] = useState(1800);
  const [attivita, setAttivita] = useState(25);
  const [orePerd, setOrePerd] = useState(4);
  const [anni, setAnni] = useState(3);

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const humanCosts = useMemo(() => {
    const stipAnno = stipLordo * 13;
    const inps = stipAnno * 0.3035;
    const tfr = stipAnno * 0.0741;
    const irap = stipAnno * 0.039;
    const formazione = anni < 2 ? 800 : 400;
    const pasto = 7 * 22 * 12;
    const tools = 1200;
    const admin = 600;
    const total = stipAnno + inps + tfr + irap + formazione + pasto + tools + admin;
    return { stipAnno, inps, tfr, irap, formazione, pasto, tools, admin, total };
  }, [stipLordo, anni]);

  const aiCosts = useMemo(() => {
    const canone = attivita <= 20 ? 590 : attivita <= 40 ? 890 : attivita <= 60 ? 1190 : 1490;
    const setupAmmort = 125;
    const total = (canone + setupAmmort) * 12;
    return { canone, setupAmmort, total };
  }, [attivita]);

  const savings = useMemo(() => ({
    annuo: humanCosts.total - aiCosts.total,
    percentuale: Math.round(((humanCosts.total - aiCosts.total) / humanCosts.total) * 100),
    oreLiberate: Math.round(orePerd * 220),
  }), [humanCosts, aiCosts, orePerd]);

  const humanBreakdown = [
    { label: "Stipendio lordo annuo", desc: "13ª mensilità inclusa", value: humanCosts.stipAnno },
    { label: "Contributi INPS (azienda)", desc: "~30% del lordo — obbligatori", value: humanCosts.inps },
    { label: "TFR accantonato", desc: "Liquidazione — accantonamento mensile", value: humanCosts.tfr },
    { label: "IRAP dipendente", desc: "Imposta regionale sulle attività produttive", value: humanCosts.irap },
    { label: "Formazione obbligatoria", desc: "Sicurezza, aggiornamenti normativi", value: humanCosts.formazione },
    { label: "Buoni pasto", desc: "€7/giorno × 22 giorni × 12 mesi", value: humanCosts.pasto },
    { label: "Postazione, PC, tools", desc: "Hardware + licenze software", value: humanCosts.tools },
    { label: "Gestione HR & admin", desc: "Cedolini, scadenze, consulente del lavoro", value: humanCosts.admin },
  ];

  const aiBreakdown = [
    { label: "Canone mensile Agente AI", desc: "Piano Professional — in base al volume", value: aiCosts.canone * 12 },
    { label: "Setup e configurazione", desc: "Una tantum — ammort. €125/mese", value: aiCosts.setupAmmort * 12 },
    { label: "Ottimizzazione continua", desc: "Inclusa nel canone mensile", value: 0 },
    { label: "Formazione", desc: "Non necessaria — aggiornamenti automatici", value: 0 },
    { label: "Contributi INPS", desc: "Non applicabile", value: 0 },
    { label: "TFR / ferie / malattie", desc: "Non applicabile — mai assente", value: 0 },
    { label: "Hardware / postazione", desc: "Non necessaria — cloud-based", value: 0 },
    { label: "Gestione HR / admin", desc: "Zero overhead amministrativo", value: 0 },
  ];

  return (
    <section className="bg-background py-16 md:py-24">
      <motion.div
        ref={ref}
        className="max-w-6xl mx-auto px-6"
        variants={containerVariants}
        initial="hidden"
        animate={inView ? "visible" : "hidden"}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-12 space-y-4">
          <AnimatedBadge variant="verde" pulse>CALCOLA IL TUO LICENZIAMENTO</AnimatedBadge>
          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-foreground leading-tight">
            Quanto Ti Costa il Dipendente<br />
            <span className="text-primary">Che Potresti Sostituire Oggi?</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-[580px] mx-auto leading-relaxed">
            Inserisci i dati del dipendente da sostituire e scopri in tempo reale
            il risparmio annuo per ogni sostituzione con un Agente AI.
          </p>
        </motion.div>

        {/* PART 1 — Sliders */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
          <SliderCard
            icon="💰" label="STIPENDIO LORDO DIPENDENTE / MESE"
            value={stipLordo} onChange={setStipLordo}
            min={1400} max={3500} step={50}
            display={`€ ${stipLordo.toLocaleString("it-IT")}`} unit="lordi"
          />
          <SliderCard
            icon="📋" label="N° ATTIVITÀ GESTITE / GIORNO"
            value={attivita} onChange={setAttivita}
            min={10} max={80} step={5}
            display={`${attivita}`} unit="contatti / assistenze"
          />
          <SliderCard
            icon="⏱" label="ORE/GIORNO SU ATTIVITÀ RIPETITIVE"
            value={orePerd} onChange={setOrePerd}
            min={1} max={8} step={0.5}
            display={`${orePerd}`} unit="ore/giorno"
          />
          <SliderCard
            icon="📅" label="ANNI DI ANZIANITÀ DIPENDENTE"
            value={anni} onChange={setAnni}
            min={0} max={10} step={1}
            display={`${anni}`} unit="anni"
          />
        </motion.div>

        {/* PART 2 — Comparison */}
        <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-6 mb-8">
          {/* Human Card */}
          <div className="rounded-2xl border-2 border-[hsl(0_80%_92%)] overflow-hidden">
            <div className="bg-[hsl(0_86%_97%)] p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[hsl(0_80%_92%)] flex items-center justify-center text-lg">👤</div>
              <div>
                <div className="font-display font-extrabold text-foreground text-base">Dipendente Umano</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-destructive">COSTO REALE ANNUO</div>
              </div>
            </div>
            <div className="p-5 space-y-1">
              <div className="font-mono text-xs text-muted-foreground">Costo totale annuo stimato</div>
              <div className="font-display font-extrabold text-[36px] md:text-[44px] text-destructive leading-none" role="status" aria-live="polite">
                {formatEuro(humanCosts.total)}
              </div>
              <div className="text-xs text-muted-foreground">= {formatEuro(humanCosts.total / 12)} / mese</div>
            </div>
            <div className="px-5 pb-2">
              {humanBreakdown.map((r) => (
                <div key={r.label} className="flex justify-between items-start py-2.5 border-b border-border">
                  <div>
                    <div className="text-sm font-medium text-foreground/80">{r.label}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{r.desc}</div>
                  </div>
                  <div className="font-mono text-[13px] font-bold text-destructive whitespace-nowrap">{formatEuro(r.value)}</div>
                </div>
              ))}
            </div>
            {/* Hidden costs */}
            <div className="mx-5 mb-5 mt-3 rounded-xl bg-[hsl(30_100%_97%)] border-t border-[hsl(30_90%_80%)] p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[hsl(30_80%_40%)] mb-2">⚠ COSTI NASCOSTI NON INCLUSI NEL CALCOLO</div>
              {[
                "Ferie: 20-26 gg/anno di attività ferme o sostituzione",
                "Malattie: media 11 gg/anno di copertura extra",
                "Assenteismo imprevedibile (media settore: +4%)",
                "Errori umani → rilavori stimati +8% costi operativi",
                "Licenziamento: preavviso + potenziale contenzioso",
              ].map((t) => (
                <div key={t} className="text-[13px] text-[hsl(30_60%_30%)] flex items-start gap-1.5 mb-1">
                  <span>⚠</span><span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          {/* VS Divider — desktop only */}
          <div className="hidden lg:flex flex-col items-center pt-24">
            <div className="w-px flex-1 border-l-2 border-dashed border-primary/20" />
            <div className="w-[52px] h-[52px] rounded-full bg-background border-2 border-border flex items-center justify-center font-display font-extrabold text-sm text-muted-foreground my-3">VS</div>
            <div className="w-px flex-1 border-l-2 border-dashed border-primary/20" />
          </div>

          {/* AI Card */}
          <div className="rounded-2xl border-2 border-primary/35 overflow-hidden">
            <div className="bg-primary-light p-5 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-lg">🤖</div>
              <div>
                <div className="font-display font-extrabold text-foreground text-base">Agente AI Edilizia.io</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-primary-dark">COSTO TOTALE ANNUO</div>
              </div>
            </div>
            <div className="p-5 space-y-1">
              <div className="font-mono text-xs text-muted-foreground">Costo totale annuo stimato</div>
              <div className="font-display font-extrabold text-[36px] md:text-[44px] text-primary leading-none" role="status" aria-live="polite">
                {formatEuro(aiCosts.total)}
              </div>
              <div className="text-xs text-muted-foreground">= {formatEuro(aiCosts.total / 12)} / mese</div>
            </div>
            <div className="px-5 pb-2">
              {aiBreakdown.map((r) => (
                <div key={r.label} className="flex justify-between items-start py-2.5 border-b border-border">
                  <div>
                    <div className="text-sm font-medium text-foreground/80">{r.label}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">{r.desc}</div>
                  </div>
                  <div className="font-mono text-[13px] font-bold text-primary-dark whitespace-nowrap">{r.value === 0 ? "€ 0" : formatEuro(r.value)}</div>
                </div>
              ))}
            </div>
            {/* AI advantages */}
            <div className="mx-5 mb-5 mt-3 rounded-xl bg-primary-bg border-t border-primary/20 p-4">
              <div className="font-mono text-[10px] uppercase tracking-wider text-primary-dark mb-2">✓ COSA NON PAGHI MAI</div>
              {[
                "Ferie — lavora ininterrottamente 365 giorni l'anno",
                "Malattie — disponibile H24, 7 giorni su 7",
                "Formazione — si aggiorna senza costi aggiuntivi",
                "Preavviso / licenziamento — zero rischi legali",
              ].map((t) => (
                <div key={t} className="text-[13px] text-primary-dark flex items-start gap-1.5 mb-1">
                  <span className="text-primary">✓</span><span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* PART 3 — Saving Box */}
        <motion.div variants={itemVariants} className="bg-[hsl(var(--neutral-900))] rounded-3xl p-5 md:p-10 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:divide-x md:divide-[rgba(255,255,255,0.1)]">
            <div className="text-center">
              <div className="font-display font-extrabold text-3xl md:text-5xl text-primary mb-1" role="status" aria-live="polite">
                {formatEuro(savings.annuo)}
              </div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-[hsl(var(--neutral-400,0_0%_63%))]">RISPARMIO ANNUO STIMATO</div>
            </div>
            <div className="text-center">
              <div className="font-display font-extrabold text-3xl md:text-5xl text-primary mb-1">
                {savings.percentuale}%
              </div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-[hsl(var(--neutral-400,0_0%_63%))]">RIDUZIONE COSTO OPERATIVO</div>
            </div>
            <div className="text-center">
              <div className="font-display font-extrabold text-3xl md:text-5xl text-primary mb-1">
                {savings.oreLiberate}h
              </div>
              <div className="font-mono text-[11px] uppercase tracking-wider text-[hsl(var(--neutral-400,0_0%_63%))]">ORE/ANNO LIBERATE PER VENDERE</div>
            </div>
          </div>
        </motion.div>

        {/* PART 4 — Error Table */}
        <motion.div variants={itemVariants} className="mb-8">
          <h3 className="font-display text-2xl md:text-[28px] font-extrabold text-foreground mb-2">Il Costo degli Errori Umani</h3>
          <p className="text-muted-foreground text-base max-w-2xl mb-6">
            Oltre ai costi fissi, il fattore umano introduce errori sistematici con
            impatto diretto su clienti, reputazione e fatturato. Questi costi non
            appaiono mai in nessun contratto — ma li paghi comunque.
          </p>
          {/* Desktop table */}
          <div className="hidden md:block rounded-[20px] overflow-hidden shadow-card border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[hsl(var(--neutral-900))]">
                  <th className="text-left p-4 font-mono text-[11px] uppercase tracking-wider text-[hsl(var(--neutral-400,0_0%_63%))]">Tipo di Errore</th>
                  <th className="text-left p-4 font-mono text-[11px] uppercase tracking-wider text-destructive">👤 Con Dipendente</th>
                  <th className="text-left p-4 font-mono text-[11px] uppercase tracking-wider text-primary">🤖 Con Agente AI</th>
                  <th className="text-left p-4 font-mono text-[11px] uppercase tracking-wider text-[hsl(var(--neutral-400,0_0%_63%))]">Impatto</th>
                </tr>
              </thead>
              <tbody>
                {errorRows.map((r, i) => (
                  <tr key={i} className={`border-b border-border hover:bg-muted/50 ${i % 2 === 1 ? "bg-muted/30" : "bg-background"}`}>
                    <td className="p-4 font-semibold text-foreground">{r.tipo}</td>
                    <td className="p-4 text-[13px] text-destructive/80">{r.umano}</td>
                    <td className="p-4 text-[13px] font-bold text-primary-dark">{r.ai}</td>
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
                        r.impatto === "Alto"
                          ? "bg-[hsl(0_80%_92%)] text-destructive"
                          : "bg-[hsl(30_100%_97%)] text-[hsl(30_80%_40%)]"
                      }`}>
                        {r.impatto}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {errorRows.map((r, i) => (
              <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-semibold text-sm text-foreground">{r.tipo}</span>
                  <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${
                    r.impatto === "Alto"
                      ? "bg-[hsl(0_80%_92%)] text-destructive"
                      : "bg-[hsl(30_100%_97%)] text-[hsl(30_80%_40%)]"
                  }`}>
                    {r.impatto}
                  </span>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-destructive mb-1">👤 Dipendente</div>
                  <p className="text-[13px] text-destructive/80">{r.umano}</p>
                </div>
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-primary mb-1">🤖 Agente AI</div>
                  <p className="text-[13px] font-bold text-primary-dark">{r.ai}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* PART 5 — Methodology Note */}
        <motion.div variants={itemVariants}>
          <div className="bg-primary-light border border-primary/25 rounded-2xl p-6 text-[13px] text-primary-dark leading-relaxed">
            📌 <strong>Nota metodologica:</strong> I calcoli si basano su dati INPS 2024, CCNL Commercio/Metalmeccanico,
            costi medi aziendali per dipendente in Nord Italia. Il canone Agente AI è stimativo e varia
            in base al piano scelto. I costi nascosti (impatto ferie, malattie, errori, turnover) NON sono
            inclusi nel totale — il risparmio reale nella maggior parte dei casi è superiore a quanto
            mostrato dal calcolatore.
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
};

/* Slider Card sub-component */
interface SliderCardProps {
  icon: string;
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  display: string;
  unit: string;
}

const SliderCard = ({ icon, label, value, onChange, min, max, step, display, unit }: SliderCardProps) => (
  <div className="bg-muted rounded-2xl border border-border p-6 hover:border-primary/50 transition-colors">
    <div className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-3">
      {icon} {label}
    </div>
    <div className="flex items-baseline gap-2 mb-4">
      <span className="font-display font-extrabold text-[28px] text-foreground">{display}</span>
      <span className="text-base text-muted-foreground">{unit}</span>
    </div>
    <Slider
      value={[value]}
      onValueChange={(v) => onChange(v[0])}
      min={min}
      max={max}
      step={step}
      aria-label={label}
      className="[&_[data-orientation=horizontal]]:h-1 [&_span[role=slider]]:h-5 [&_span[role=slider]]:w-5 [&_span[role=slider]]:border-primary [&_span[role=slider]]:shadow-[0_0_8px_rgba(62,207,110,0.35)] hover:[&_span[role=slider]]:scale-110 [&_span[role=slider]]:transition-transform"
    />
    <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-2">
      <span>{min}</span>
      <span>{max}</span>
    </div>
  </div>
);

export default CostCalculator;
