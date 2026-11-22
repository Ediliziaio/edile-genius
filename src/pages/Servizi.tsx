import { lazy, Suspense, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import Navbar from "@/components/sections/Navbar";
import WorkflowSection from "@/components/sections/WorkflowSection";
import { SERVIZI, METODO, FAQ_SERVIZI } from "@/data/servizi";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const InkOrbitFeatures = lazy(() => import("@/components/ui/ink-orbit-features"));
const EicBand = lazy(() => import("@/components/sections/EicBand"));
const FinalCTA = lazy(() => import("@/components/sections/FinalCTA"));
const Footer = lazy(() => import("@/components/sections/Footer"));

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const Reveal = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={fadeUp}
      transition={{ delay }}
    >
      {children}
    </motion.div>
  );
};

const Servizi = () => {
  const seoTags = usePageSEO({
    title: "Servizi AI per Imprese Edili e Progettisti | Edilizia.io",
    description:
      "12 servizi AI per imprese edili e studi tecnici: automazione, preventivi, render, gare d'appalto, sicurezza, cantiere, marketing, consulenza e formazione.",
    canonical: "/servizi",
    jsonLd: [
      {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Servizi di Edilizia.io",
        itemListElement: SERVIZI.map((s, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: {
            "@type": "Service",
            name: s.titolo,
            description: s.sintesi,
            provider: { "@type": "Organization", name: "Edilizia.io", url: "https://edilizia.io" },
            areaServed: "IT",
            url: `https://edilizia.io/servizi/${s.slug}`,
          },
        })),
      },
      {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_SERVIZI.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  });

  return (
    <div className="min-h-screen bg-background">
      {seoTags}
      <Navbar />

      <main>
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-background">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-primary-light blur-[90px] opacity-70" />
          <div className="relative max-w-6xl mx-auto px-6 pt-14 pb-16 md:pt-20 md:pb-24">
            <motion.div
              className="max-w-3xl space-y-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            >
              <motion.span variants={fadeUp} className="inline-block font-mono text-xs uppercase tracking-wider text-primary font-semibold">
                Servizi
              </motion.span>
              <motion.h1 variants={fadeUp} className="font-display text-[32px] md:text-[56px] font-extrabold leading-[1.05] text-neutral-900">
                Progettiamo l'intelligenza artificiale <span className="text-primary">per l'edilizia.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-neutral-500 leading-relaxed">
                Automazione, preventivi, render e documenti: sviluppiamo sistemi AI per imprese edili, architetti, ingegneri e geometri,
                e vi affianchiamo con la consulenza. Non facciamo progettazione edilizia: diamo ai tecnici gli strumenti per farla meglio.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#cta-finale"
                  className="inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground px-7 py-4 rounded-xl font-bold hover:bg-primary-dark hover:-translate-y-0.5 shadow-button-green transition-all"
                >
                  Prenota la consulenza gratuita <ArrowRight size={18} />
                </a>
                <a
                  href="#elenco-servizi"
                  className="inline-flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 px-6 py-4 rounded-xl font-medium hover:border-primary hover:text-primary transition-all"
                >
                  Guarda tutti i servizi
                </a>
              </motion.div>
            </motion.div>

            {/* indice rapido */}
            <motion.ul
              className="mt-12 flex flex-wrap gap-2"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.05, delayChildren: 0.5 } } }}
            >
              {SERVIZI.map((s) => (
                <motion.li key={s.slug} variants={fadeUp}>
                  <a
                    href={`#${s.slug}`}
                    className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-background px-4 py-2 text-sm text-neutral-600 hover:border-primary hover:text-primary transition-colors"
                  >
                    <s.icon size={15} className="text-primary" />
                    {s.breve}
                  </a>
                </motion.li>
              ))}
            </motion.ul>
          </div>
        </section>

        {/* ─── Elenco servizi ─── */}
        <section id="elenco-servizi" className="bg-neutral-50 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6 space-y-6">
            {SERVIZI.map((s, i) => (
              <Reveal key={s.slug}>
                <article
                  id={s.slug}
                  className="scroll-mt-28 grid gap-8 rounded-3xl border border-neutral-200 bg-background p-6 md:p-10 lg:grid-cols-[1.1fr_1fr]"
                >
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground">
                        <s.icon size={24} strokeWidth={1.8} />
                      </span>
                      <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                        {String(i + 1).padStart(2, "0")} · {s.categoria}
                      </span>
                    </div>
                    <h2 className="font-display text-2xl md:text-3xl font-extrabold leading-tight text-neutral-900">{s.titolo}</h2>
                    <p className="text-neutral-500 leading-relaxed">{s.sintesi}</p>
                    <p className="text-sm text-neutral-500">
                      <span className="font-semibold text-neutral-800">Per chi è: </span>
                      {s.perChi}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1">
                      <Link
                        to={`/servizi/${s.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary-dark transition-all"
                      >
                        Scopri il servizio <ArrowRight size={15} />
                      </Link>
                      {s.link && (
                        <Link to={s.link.href} className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary-dark hover:gap-2.5 transition-all">
                          {s.link.label} <ArrowRight size={15} />
                        </Link>
                      )}
                    </div>
                  </div>
                  <div className="rounded-2xl bg-neutral-50 p-6 space-y-4">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500">Cosa facciamo</p>
                    <ul className="space-y-3">
                      {s.cosaFacciamo.map((c) => (
                        <li key={c} className="flex gap-3 text-sm text-neutral-700">
                          <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-primary-light text-primary-dark">
                            <Check size={12} strokeWidth={3} />
                          </span>
                          {c}
                        </li>
                      ))}
                    </ul>
                    <div className="border-t border-neutral-200 pt-4">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 mb-1">Cosa ottieni</p>
                      <p className="text-sm font-medium text-neutral-800 leading-relaxed">{s.risultato}</p>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ─── Come lavora l'AI (animazione) ─── */}
        <Suspense fallback={null}>
          <InkOrbitFeatures />
        </Suspense>

        {/* ─── Editor interattivo del flusso ─── */}
        <WorkflowSection />

        <Suspense fallback={null}>
          <EicBand />
        </Suspense>

        {/* ─── Metodo ─── */}
        <section className="bg-background py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="max-w-2xl mb-12 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Il metodo</span>
              <h2 className="font-display text-[28px] md:text-[40px] font-extrabold leading-tight text-neutral-900">
                Quattro passi, dal primo incontro al sistema funzionante.
              </h2>
            </Reveal>
            <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {METODO.map((m, i) => (
                <Reveal key={m.n} delay={i * 0.08}>
                  <div className="relative h-full rounded-2xl border border-neutral-200 p-6">
                    <span className="font-display text-5xl font-extrabold text-primary/25">{m.n}</span>
                    <h3 className="mt-3 font-display text-lg font-bold text-neutral-900">{m.titolo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">{m.testo}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── FAQ ─── */}
        <section className="bg-neutral-50 py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <Reveal className="text-center mb-10 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Domande frequenti</span>
              <h2 className="font-display text-[28px] md:text-[40px] font-extrabold leading-tight text-neutral-900">Prima di iniziare</h2>
            </Reveal>
            <Accordion type="single" collapsible className="space-y-3">
              {FAQ_SERVIZI.map((f, i) => (
                <AccordionItem key={f.q} value={`faq-${i}`} className="rounded-xl border border-neutral-200 bg-background px-5">
                  <AccordionTrigger className="text-left font-semibold text-neutral-900 hover:no-underline">{f.q}</AccordionTrigger>
                  <AccordionContent className="text-neutral-500 leading-relaxed">{f.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        <Suspense fallback={null}>
          <FinalCTA />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default Servizi;
