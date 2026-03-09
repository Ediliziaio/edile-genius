import { useState, useMemo, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Slider } from "@/components/ui/slider";
import type { CalculatorDefaults } from "@/data/perChiE";

const formatEuro = (n: number) => "€ " + Math.round(n).toLocaleString("it-IT");

interface Props {
  sectorName: string;
  defaults: CalculatorDefaults;
}

const SectorCalculator = ({ sectorName, defaults }: Props) => {
  const [stipendio, setStipendio] = useState(defaults.defaultStipendio);
  const [leadMensili, setLeadMensili] = useState(defaults.defaultLeadMensili);
  const [oreRipetitive, setOreRipetitive] = useState(defaults.defaultOreRipetitive);

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  const results = useMemo(() => {
    // Human costs
    const stipAnno = stipendio * 13;
    const contributi = stipAnno * 0.3035;
    const tfr = stipAnno * 0.0741;
    const costoUmanoAnno = stipAnno + contributi + tfr + 1800; // +admin/tools
    const costoUmanoMese = costoUmanoAnno / 12;

    // AI costs
    const canoneAI = leadMensili <= 20 ? 297 : leadMensili <= 40 ? 590 : leadMensili <= 60 ? 890 : 1190;
    const costoAIAnno = canoneAI * 12;

    // Savings
    const risparmioAnnuo = costoUmanoAnno - costoAIAnno;
    const oreLiberate = Math.round(oreRipetitive * 22 * 12);

    // Lead recovery
    const leadRecuperati = Math.round(leadMensili * 0.4); // 40% in più
    const fatturatoRecuperato = leadRecuperati * defaults.valoreCommessaMedia * 0.3; // 30% conversion

    return {
      costoUmanoMese,
      costoUmanoAnno,
      canoneAI,
      costoAIAnno,
      risparmioAnnuo,
      percentualeRisparmio: Math.round((risparmioAnnuo / costoUmanoAnno) * 100),
      oreLiberate,
      leadRecuperati,
      fatturatoRecuperato,
    };
  }, [stipendio, leadMensili, oreRipetitive, defaults.valoreCommessaMedia]);

  return (
    <section ref={ref} className="py-16 md:py-24 bg-primary-bg">
      <motion.div
        className="max-w-4xl mx-auto px-6"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.5 }}
      >
        <div className="text-center mb-10">
          <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">
            Calcolatore Di Risparmio
          </span>
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mt-2">
            Quanto Risparmi Con l'AI?
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl mx-auto">
            Valori pre-impostati per {sectorName}. Adattali alla tua realtà.
          </p>
        </div>

        {/* Sliders */}
        <div className="grid sm:grid-cols-3 gap-5 mb-10">
          <SliderCard
            emoji="💰"
            label="Stipendio lordo / mese"
            value={stipendio}
            onChange={setStipendio}
            min={1200}
            max={3500}
            step={50}
            display={formatEuro(stipendio)}
          />
          <SliderCard
            emoji="📋"
            label="Lead / richieste al mese"
            value={leadMensili}
            onChange={setLeadMensili}
            min={5}
            max={200}
            step={5}
            display={`${leadMensili}`}
          />
          <SliderCard
            emoji="⏱"
            label="Ore ripetitive / giorno"
            value={oreRipetitive}
            onChange={setOreRipetitive}
            min={1}
            max={8}
            step={0.5}
            display={`${oreRipetitive}h`}
          />
        </div>

        {/* Results */}
        <div className="bg-[hsl(var(--neutral-900))] rounded-3xl p-8 md:p-10">
          {/* Top comparison */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--neutral-300))] mb-1">
                Costo Dipendente / Anno
              </div>
              <div className="font-display text-2xl md:text-3xl font-extrabold text-destructive">
                {formatEuro(results.costoUmanoAnno)}
              </div>
              <div className="text-xs text-[hsl(var(--neutral-500))]">
                = {formatEuro(results.costoUmanoMese)} / mese
              </div>
            </div>
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-background/10 flex items-center justify-center font-display font-extrabold text-sm text-[hsl(var(--neutral-300))]">
                VS
              </div>
            </div>
            <div className="text-center">
              <div className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--neutral-300))] mb-1">
                Agente AI / Anno
              </div>
              <div className="font-display text-2xl md:text-3xl font-extrabold text-primary">
                {formatEuro(results.costoAIAnno)}
              </div>
              <div className="text-xs text-[hsl(var(--neutral-500))]">
                = {formatEuro(results.canoneAI)} / mese
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 my-6" />

          {/* Bottom stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <ResultStat
              value={formatEuro(results.risparmioAnnuo)}
              label="Risparmio annuo"
              highlight
            />
            <ResultStat
              value={`${results.percentualeRisparmio}%`}
              label="Riduzione costi"
              highlight
            />
            <ResultStat
              value={`${results.oreLiberate}h`}
              label="Ore liberate / anno"
            />
            <ResultStat
              value={`+${results.leadRecuperati}/mese`}
              label="Lead recuperati"
            />
          </div>

          {/* Extra revenue */}
          {results.fatturatoRecuperato > 0 && (
            <div className="mt-8 bg-primary/10 rounded-2xl p-5 text-center">
              <div className="font-mono text-[10px] uppercase tracking-wider text-primary mb-1">
                Fatturato Aggiuntivo Stimato / Anno
              </div>
              <div className="font-display text-3xl md:text-4xl font-extrabold text-primary">
                {formatEuro(results.fatturatoRecuperato * 12)}
              </div>
              <div className="text-xs text-primary/70 mt-1">
                Dai lead che oggi perdi e che l'AI recupererebbe per te
              </div>
            </div>
          )}
        </div>

        {/* Methodology */}
        <div className="mt-6 bg-primary-light border border-primary/25 rounded-xl p-4 text-[12px] text-primary-dark leading-relaxed">
          📌 <strong>Nota:</strong> Calcolo basato su dati INPS 2024 (contributi ~30%, TFR ~7.4%).
          Canone AI stimato sui piani Edilizia.io. Il fatturato aggiuntivo assume un tasso di conversione del 30% sui lead recuperati
          con valore commessa media di {formatEuro(defaults.valoreCommessaMedia)} per {sectorName.toLowerCase()}.
        </div>
      </motion.div>
    </section>
  );
};

/* ── Sub-components ── */

const SliderCard = ({
  emoji, label, value, onChange, min, max, step, display,
}: {
  emoji: string; label: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; display: string;
}) => (
  <div className="bg-background rounded-2xl border border-border p-5">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-lg">{emoji}</span>
      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{label}</span>
    </div>
    <div className="font-display text-2xl font-extrabold text-foreground mb-3">{display}</div>
    <Slider
      value={[value]}
      onValueChange={([v]) => onChange(v)}
      min={min}
      max={max}
      step={step}
    />
  </div>
);

const ResultStat = ({ value, label, highlight }: { value: string; label: string; highlight?: boolean }) => (
  <div className="text-center">
    <div className={`font-display text-xl md:text-2xl font-extrabold ${highlight ? "text-primary" : "text-white"}`}>
      {value}
    </div>
    <div className="font-mono text-[10px] uppercase tracking-wider text-[hsl(var(--neutral-500))] mt-1">
      {label}
    </div>
  </div>
);

export default SectorCalculator;
