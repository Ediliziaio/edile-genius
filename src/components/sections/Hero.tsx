import { motion } from "framer-motion";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import FloatingCard from "@/components/custom/FloatingCard";
import WaveformVisualizer from "@/components/custom/WaveformVisualizer";

const container = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.15, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const Hero = () => {
  return (
    <section className="relative bg-background overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24">
        <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">
          {/* Left Copy */}
          <motion.div variants={container} initial="hidden" animate="visible" className="space-y-8">
            <motion.div variants={item}>
              <AnimatedBadge variant="verde">
                🔥 La 1ª Azienda di Licenziamento AI per l'Edilizia Italiana
              </AnimatedBadge>
            </motion.div>

            <motion.h1 variants={item} className="font-display text-[22px] sm:text-[28px] md:text-[40px] font-extrabold leading-[1.15] text-neutral-900">
              Le imprese edili più avanzate hanno già <span className="text-primary">integrato l'AI</span> nella loro struttura. Hanno eliminato i costi fissi. Sostituito le figure improduttive. I margini e guadagni sono cresciuti.
            </motion.h1>

            <motion.div variants={item} className="space-y-4 text-base sm:text-lg text-neutral-500 max-w-[540px] leading-relaxed">
              <p>
                Licenzia i Costi. Assumi l'AI. Fai Esplodere la tua Azienda Edile.
              </p>
              <p>
                Edilizia.io è l'unica azienda che entra nella tua impresa, individua le figure che ti costano senza renderti, e le sostituisce con Agenti AI specializzati per il settore edile.
              </p>
              <div className="space-y-2">
                <p>Segretarie che filtrano male i lead. Commerciali che non chiudono. Addetti alla reportistica che ti mandano file Excel alle 18:00.</p>
                <p className="font-semibold text-neutral-900">Sostituiti. Con agenti che costano 10 volte meno e lavorano 10 volte meglio.</p>
                <p>24 ore su 24. 365 giorni l'anno. Senza ferie, malattie, permessi, dimissioni o buonuscite.</p>
              </div>
            </motion.div>

            <motion.div variants={item} className="flex flex-col sm:flex-row gap-4">
              <a
                href="#cta-finale"
                className="bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-bold hover:bg-primary-dark hover:-translate-y-0.5 shadow-button-green transition-all"
              >
                Prenota Demo Gratuita →
              </a>
              <a
                href="#soluzione"
                className="flex items-center gap-2 border border-neutral-200 bg-background text-neutral-700 px-6 py-4 rounded-xl text-base font-medium hover:border-primary hover:text-primary transition-all"
              >
                <span className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs">▶</span>
                Scopri Chi Puoi Sostituire
              </a>
            </motion.div>

            <motion.div variants={item} className="flex flex-wrap gap-4 font-mono text-xs text-neutral-500">
              <span><span className="text-primary">✓</span> Già 50+ dipendenti sostituiti</span>
              <span><span className="text-primary">✓</span> Setup in 7 giorni</span>
              <span><span className="text-primary">✓</span> Garanzia 30 giorni</span>
            </motion.div>
          </motion.div>

          {/* Right Visual */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Blob */}
            <div className="absolute inset-0 bg-primary-light rounded-full blur-[40px] sm:blur-[60px] opacity-40 sm:opacity-60" />

            {/* Dashboard Card */}
            <motion.div
              className="relative bg-background rounded-2xl sm:rounded-3xl shadow-card-hover p-4 sm:p-6 space-y-3 sm:space-y-4 border border-neutral-200"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ willChange: "transform" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[9px] sm:text-[10px] uppercase tracking-wider text-neutral-500">Dipendenti Sostituiti</span>
                <span className="bg-primary text-primary-foreground font-bold text-xs sm:text-sm px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full">12</span>
              </div>
              {[
                { name: "Segretaria Inbound", status: "SOSTITUITA" },
                { name: "Commerciale Lead", status: "SOSTITUITO" },
                { name: "Addetta Reportistica", status: "SOSTITUITA" },
                { name: "Operatore Assistenza", status: "SOSTITUITO" },
              ].map((a) => (
                <div key={a.name} className="flex items-center justify-between py-1.5 sm:py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-xs sm:text-sm font-medium text-neutral-700">{a.name}</span>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary" />
                    <span className="font-mono text-[9px] sm:text-[10px] text-primary uppercase">{a.status}</span>
                  </div>
                </div>
              ))}
              <div className="pt-1 sm:pt-2">
                <WaveformVisualizer />
              </div>
            </motion.div>

            {/* Floating Pills */}
            <FloatingCard delay={0} className="absolute -top-3 sm:-top-4 right-0 sm:-right-4 text-xs sm:text-sm">
              📞 47 appuntamenti fissati oggi
            </FloatingCard>
            <FloatingCard delay={1.2} className="absolute top-1/2 left-0 sm:-left-8 text-xs sm:text-sm">
              💰 -60% costi del personale
            </FloatingCard>
            <FloatingCard delay={0.6} className="absolute -bottom-3 sm:-bottom-4 right-2 sm:right-8 flex items-center gap-1.5 text-xs sm:text-sm">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
              🤖 Agente AI online 24/7
            </FloatingCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
