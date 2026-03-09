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
                🔥 La 1ª Agenzia di Licenziamento AI per l'Edilizia Italiana
              </AnimatedBadge>
            </motion.div>

            <motion.h1 variants={item} className="font-display text-[32px] sm:text-[32px] sm:text-[32px] sm:text-[44px] md:text-[72px] font-extrabold leading-[1.05] text-neutral-900">
              Licenzia i Costi.{" "}
              <span className="text-primary">Assumi l'AI.</span>{" "}
              Fai Esplodere la tua{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Azienda Edile.</span>
                <span className="absolute bottom-1 left-0 w-full h-3 bg-primary-light rounded-sm -z-0" />
              </span>
            </motion.h1>

            <motion.p vabase sm:text-riants={item} cbase sm:text-lassName="text-lg text-neutral-500 max-w-[540px] leading-relaxed">
              Edilizia.io è l'agenzia che sostituisce segretarie, commerciali improduttivi
              e addetti alla reportistica con Agenti AI che costano 10x meno e lavorano
              10x meglio. 24/7, 365 giorni l'anno. Senza ferie, malattie o dimissioni.
            </motion.p>

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
            className="relative hidden lg:block"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            {/* Blob */}
            <div className="absolute inset-0 bg-primary-light rounded-full blur-[60px] opacity-60" />

            {/* Dashboard Card */}
            <motion.div
              className="relative bg-background rounded-3xl shadow-card-hover p-6 space-y-4 border border-neutral-200"
              animate={{ y: [0, -12, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              style={{ willChange: "transform" }}
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500">Dipendenti Sostituiti</span>
                <span className="bg-primary text-primary-foreground font-bold text-sm px-3 py-1 rounded-full">12</span>
              </div>
              {[
                { name: "Segretaria Inbound", status: "SOSTITUITA" },
                { name: "Commerciale Lead", status: "SOSTITUITO" },
                { name: "Addetta Reportistica", status: "SOSTITUITA" },
                { name: "Operatore Assistenza", status: "SOSTITUITO" },
              ].map((a) => (
                <div key={a.name} className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
                  <span className="text-sm font-medium text-neutral-700">{a.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    <span className="font-mono text-[10px] text-primary uppercase">{a.status}</span>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <WaveformVisualizer />
              </div>
            </motion.div>

            {/* Floating Pills */}
            <FloatingCard delay={0} className="absolute -top-4 -right-4">
              📞 47 appuntamenti fissati oggi
            </FloatingCard>
            <FloatingCard delay={1.2} className="absolute top-1/2 -left-8">
              💰 -60% costi del personale
            </FloatingCard>
            <FloatingCard delay={0.6} className="absolute -bottom-4 right-8 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              🤖 Agente AI online 24/7
            </FloatingCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
