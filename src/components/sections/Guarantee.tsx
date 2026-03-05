import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const Guarantee = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  return (
    <section className="bg-primary-bg py-16 md:py-24">
      <div className="max-w-2xl mx-auto px-6">
        <motion.div
          ref={ref}
          className="bg-background rounded-3xl border border-neutral-200 shadow-card p-10 md:p-14 text-center"
          style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.06), 0 0 60px rgba(62,207,110,0.08)" }}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={inView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="mx-auto w-[120px] h-[120px] rounded-full bg-primary-light flex items-center justify-center text-7xl mb-6"
            initial={{ rotateY: 0 }}
            animate={inView ? { rotateY: 360 } : {}}
            transition={{ duration: 0.9 }}
          >
            🛡️
          </motion.div>

          <h2 className="font-display text-[32px] md:text-5xl font-extrabold text-neutral-900 leading-tight mb-6">
            GARANZIA RIMBORSO<br />
            <span className="text-primary">30 GIORNI</span>
          </h2>

          <p className="text-lg text-neutral-700 leading-relaxed mb-4">
            Se dopo 30 giorni operativi il tuo Agente AI non ha prodotto almeno
            10 appuntamenti qualificati, ti rimborsiamo il primo mese.
            Integralmente. Senza domande. Senza clausole.
          </p>
          <p className="text-lg leading-relaxed">
            <span className="font-bold text-neutral-900">
              Guadagniamo bene solo quando tu guadagni.
              Questo è il nostro patto con ogni azienda edile che sceglie Edilizia.io.
            </span>
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default Guarantee;
