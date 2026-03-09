import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import AnimatedBadge from "@/components/custom/AnimatedBadge";

const faqs = [
  {
    q: "Cosa succede se non funziona?",
    a: "Ti rimborsiamo il primo mese. Integralmente. Senza domande, senza clausole, senza asterischi. Se il tuo Agente AI non supera il dipendente che ha sostituito entro 30 giorni, non meriti di pagare.",
  },
  {
    q: "Come si misura il risultato?",
    a: "Definiamo insieme i KPI prima di partire: lead qualificati, appuntamenti fissati, tempo di risposta, tasso di conversione. Tutto tracciato in dashboard, con report settimanali trasparenti.",
  },
  {
    q: "Ci sono clausole nascoste?",
    a: "No. La garanzia è esattamente quello che leggi. Nessun vincolo contrattuale minimo, nessuna penale di uscita, nessun costo nascosto. Se non funziona, non paghi. Fine.",
  },
  {
    q: "E dopo i 30 giorni?",
    a: "Dopo i 30 giorni continui con il piano che hai scelto. Puoi disdire quando vuoi, con un mese di preavviso. Ma nella nostra esperienza, dopo 30 giorni non vuoi più tornare indietro.",
  },
];

const Garanzia = () => {
  const heroRef = useRef(null);
  const heroInView = useInView(heroRef, { once: true });
  const faqRef = useRef(null);
  const faqInView = useInView(faqRef, { once: true, margin: "-80px" });

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main>
        {/* Hero Garanzia */}
        <section className="bg-primary-bg py-20 md:py-28">
          <div className="max-w-3xl mx-auto px-6 text-center">
            <motion.div
              ref={heroRef}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={heroInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <AnimatedBadge variant="verde">LA NOSTRA PROMESSA</AnimatedBadge>

              <motion.div
                className="mx-auto w-[140px] h-[140px] rounded-full bg-primary-light flex items-center justify-center text-8xl"
                initial={{ rotateY: 0 }}
                animate={heroInView ? { rotateY: 360 } : {}}
                transition={{ duration: 0.9 }}
              >
                🛡️
              </motion.div>

              <h1 className="font-display text-[36px] md:text-[56px] font-extrabold text-neutral-900 leading-[1.1]">
                GARANZIA RIMBORSO<br />
                <span className="text-primary">30 GIORNI</span>
              </h1>

              <p className="text-lg md:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
                Se il tuo Agente AI non supera il dipendente che ha sostituito
                entro 30 giorni — in termini di risultati, velocità e costi —
                ti rimborsiamo il primo mese. Integralmente.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Dettaglio Garanzia */}
        <section className="bg-background py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <div className="bg-neutral-50 border border-neutral-200 rounded-3xl p-10 md:p-14 space-y-8" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.06), 0 0 60px rgba(62,207,110,0.08)" }}>
              <div className="space-y-4">
                <h2 className="font-display text-2xl md:text-3xl font-extrabold text-neutral-900">
                  Il nostro patto con te
                </h2>
                <p className="text-neutral-600 leading-relaxed text-lg">
                  Non crediamo nei contratti che ti legano per forza. Crediamo nei risultati che ti fanno restare per scelta.
                </p>
              </div>

              <div className="border-l-4 border-primary bg-primary-light/50 rounded-r-xl p-6">
                <p className="text-neutral-800 font-medium text-lg leading-relaxed italic">
                  "Guadagniamo bene solo quando tu risparmi.
                  Questo è il nostro patto con ogni azienda edile che sceglie di licenziare i costi."
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-6 pt-4">
                {[
                  { icon: "✅", title: "Nessun vincolo", text: "Disdici quando vuoi, zero penali" },
                  { icon: "📊", title: "KPI trasparenti", text: "Risultati misurabili dal giorno 1" },
                  { icon: "💸", title: "Rimborso totale", text: "Se non funziona, riavrai tutto" },
                ].map((item) => (
                  <div key={item.title} className="text-center space-y-2">
                    <div className="text-3xl">{item.icon}</div>
                    <p className="font-display font-bold text-neutral-900">{item.title}</p>
                    <p className="text-sm text-neutral-500">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Garanzia */}
        <section className="bg-neutral-50 py-16 md:py-24">
          <div ref={faqRef} className="max-w-3xl mx-auto px-6 space-y-12">
            <div className="text-center space-y-4">
              <h2 className="font-display text-[28px] md:text-4xl font-extrabold text-neutral-900">
                Domande sulla Garanzia
              </h2>
              <p className="text-neutral-500">Risposte dirette, senza giri di parole.</p>
            </div>

            <div className="space-y-6">
              {faqs.map((faq, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={faqInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-background border border-neutral-200 rounded-2xl p-6 md:p-8"
                >
                  <h3 className="font-display text-lg font-bold text-neutral-900 mb-3">{faq.q}</h3>
                  <p className="text-neutral-500 leading-relaxed">{faq.a}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-primary-bg py-16 md:py-20">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-display text-[28px] md:text-4xl font-extrabold text-neutral-900">
              Zero rischio. Solo risultati.
            </h2>
            <p className="text-neutral-500 text-lg">
              Provalo per 30 giorni. Se non funziona, ti rimborsiamo. Punto.
            </p>
            <a
              href="/soluzioni"
              className="inline-block bg-primary text-primary-foreground px-8 py-4 rounded-xl text-base font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
            >
              Prenota Demo Gratuita →
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Garanzia;
