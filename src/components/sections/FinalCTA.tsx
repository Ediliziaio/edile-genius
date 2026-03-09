import { useState, FormEvent } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { Check, Loader2 } from "lucide-react";

const FinalCTA = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [form, setForm] = useState({ nome: "", email: "", telefono: "", settore: "" });

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      // Webhook placeholder
      await new Promise((r) => setTimeout(r, 1500));
      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

  const inputClass =
    "w-full bg-neutral-700 border border-neutral-600 rounded-[10px] px-4 py-3.5 text-white font-display text-[15px] placeholder:text-neutral-500 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all";

  return (
    <section id="cta-finale" className="relative bg-neutral-900 py-16 md:py-24 overflow-hidden">
      {/* Grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "linear-gradient(hsl(var(--neutral-700)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--neutral-700)) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />
      {/* Blob */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-primary/10 rounded-full blur-[120px]" />

      <motion.div
        ref={ref}
        className="relative max-w-3xl mx-auto px-6"
        initial={{ clipPath: "inset(100% 0 0 0)" }}
        animate={inView ? { clipPath: "inset(0% 0 0 0)" } : {}}
        transition={{ duration: 0.9, ease: "easeOut" }}
      >
        <div className="text-center mb-10 space-y-4">
          <div className="inline-flex items-center gap-2 bg-accent-orange/20 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-wider text-accent-orange font-semibold">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            ⚡ Posti Limitati — 12 Aziende al Mese
          </div>

          <h2 className="font-display text-[36px] md:text-[72px] font-extrabold text-white leading-[1.05]">
            Scopri Chi Puoi<br />
            <span className="text-primary">Licenziare.</span><br />
            Prenota l'Analisi.
          </h2>

          <p className="text-neutral-500 text-lg max-w-xl mx-auto leading-relaxed">
            30 minuti con uno specialista. Analizziamo il tuo organico,
            identifichiamo le figure sostituibili e ti mostriamo —
            con numeri concreti — quanto risparmieresti dal primo mese.
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-neutral-800 rounded-3xl p-8 md:p-12 border border-neutral-700">
          {status === "success" ? (
            <motion.div
              className="text-center space-y-4 py-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <div className="w-16 h-16 rounded-full bg-primary mx-auto flex items-center justify-center">
                <Check size={32} className="text-primary-foreground" />
              </div>
              <p className="text-white font-display font-bold text-xl">Prenotazione confermata!</p>
              <p className="text-neutral-500 text-sm">Ti contatteremo entro 4 ore.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="font-mono text-xs text-primary uppercase tracking-wider font-medium mb-4">
                Analisi Gratuita — Scopri Chi Puoi Sostituire
              </p>

              <input
                type="text"
                placeholder="Nome e Cognome"
                required
                className={inputClass}
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email aziendale"
                required
                className={inputClass}
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="tel"
                placeholder="Numero di telefono"
                required
                className={inputClass}
                value={form.telefono}
                onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              />
              <select
                className={inputClass}
                value={form.settore}
                onChange={(e) => setForm({ ...form, settore: e.target.value })}
                required
              >
                <option value="" disabled>Settore</option>
                <option>Serramenti</option>
                <option>Infissi</option>
                <option>Fotovoltaico</option>
                <option>Ristrutturazioni</option>
                <option>Impianti Termici</option>
                <option>General Contractor</option>
                <option>Altro</option>
              </select>

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-bold text-base hover:bg-primary-dark hover:-translate-y-0.5 shadow-button-green transition-all disabled:opacity-70 flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Invio in corso...
                  </>
                ) : (
                  "PRENOTA LA TUA ANALISI GRATUITA →"
                )}
              </button>

              <p className="font-mono text-[11px] text-neutral-500 text-center">
                🔒 Dati protetti · 📅 Risposta entro 4 ore · ✓ Nessun venditore aggressivo
              </p>
            </form>
          )}
        </div>

        {/* P.S. */}
        <div className="mt-10 space-y-4 text-[15px] italic text-neutral-500">
          <p>
            <span className="font-bold text-primary not-italic">P.S.</span> — Nel peggiore dei casi esci con una mappa chiara del tuo
            organico e delle figure che potresti sostituire subito. Nel migliore dei casi,
            inizi a risparmiare migliaia di euro al mese dal giorno dopo.
          </p>
          <p>
            <span className="font-bold text-primary not-italic">P.P.S.</span> — Lavoriamo solo con titolari e soci che prendono decisioni.
            Se sei uno di loro, questa è la tua chiamata.
          </p>
        </div>
      </motion.div>
    </section>
  );
};

export default FinalCTA;
