import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import FaqList from "@/components/custom/FaqList";
import { FAQ_HOME } from "@/data/faqHome";

/** Domande frequenti della Home (lo schema FAQPage è in Index.tsx). */
const HomeFAQ = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <section ref={ref} id="domande-frequenti" className="bg-neutral-50 py-16 md:py-24">
      <div className="max-w-3xl mx-auto px-6">
        <motion.div
          className="text-center mb-10 space-y-3"
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.55 }}
        >
          <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Domande frequenti</span>
          <h2 className="font-display text-[28px] md:text-[40px] font-extrabold leading-tight text-neutral-900">
            L'intelligenza artificiale per l'edilizia, <span className="text-primary">in breve.</span>
          </h2>
        </motion.div>
        <FaqList items={FAQ_HOME} group="faq-home" />
      </div>
    </section>
  );
};

export default HomeFAQ;
