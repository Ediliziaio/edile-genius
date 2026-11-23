import { lazy, Suspense, useRef, type ReactNode } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { ArrowRight, Check, ChevronRight, XCircle } from "lucide-react";
import { usePageSEO } from "@/hooks/usePageSEO";
import Navbar from "@/components/sections/Navbar";
import { SERVIZI } from "@/data/servizi";
import { getServizioDettaglio } from "@/data/serviziDettaglio";
import { solutions, settoreConfig } from "@/data/solutions";
import ServiceFlowVisual from "@/components/ui/service-flow-visual";
import FaqList from "@/components/custom/FaqList";
import EditorialVisual from "@/components/custom/EditorialVisual";
import RelatedGuides from "@/components/custom/RelatedGuides";
import { SERVICE_VISUALS, visualSEO } from "@/data/siteVisuals";

const EicBand = lazy(() => import("@/components/sections/EicBand"));
const FinalCTA = lazy(() => import("@/components/sections/FinalCTA"));
const Footer = lazy(() => import("@/components/sections/Footer"));

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, ease: [0.25, 1, 0.35, 1] as const } },
};

const Reveal = ({ children, className, delay = 0 }: { children: ReactNode; className?: string; delay?: number }) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  return (
    <motion.div ref={ref} className={className} initial="hidden" animate={inView ? "visible" : "hidden"} variants={fadeUp} transition={{ delay }}>
      {children}
    </motion.div>
  );
};

const SectionHead = ({ eyebrow, title, className = "" }: { eyebrow: string; title: ReactNode; className?: string }) => (
  <Reveal className={`max-w-2xl mb-10 space-y-3 ${className}`}>
    <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">{eyebrow}</span>
    <h2 className="font-display text-[28px] md:text-[40px] font-extrabold leading-tight text-neutral-900">{title}</h2>
  </Reveal>
);

const ServizioDetail = () => {
  const { slug = "" } = useParams<{ slug: string }>();
  const base = SERVIZI.find((s) => s.slug === slug);
  const d = getServizioDettaglio(slug);
  const visual = SERVICE_VISUALS[slug];

  const seoTags = usePageSEO({
    title: d?.seoTitle ?? "Servizi | Edilizia.io",
    description: d?.seoDescription ?? "Servizi di intelligenza artificiale per imprese edili e progettisti.",
    canonical: `/servizi/${slug}`,
    ...(visual ? visualSEO(visual) : {}),
    jsonLd: d
      ? [
          {
            "@context": "https://schema.org",
            "@type": "Service",
            name: base?.titolo ?? d.eyebrow,
            description: d.seoDescription,
            serviceType: d.eyebrow,
            areaServed: "IT",
            url: `https://edilizia.io/servizi/${slug}`,
            provider: { "@type": "Organization", name: "Edilizia.io", url: "https://edilizia.io" },
          },
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://edilizia.io/" },
              { "@type": "ListItem", position: 2, name: "Servizi", item: "https://edilizia.io/servizi" },
              { "@type": "ListItem", position: 3, name: d.eyebrow, item: `https://edilizia.io/servizi/${slug}` },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: [...d.faq, { q: "Quanto costa?", a: "Non abbiamo un listino: ogni progetto è diverso. Dopo la consulenza gratuita ti presentiamo il progetto con costi, tempi e risparmio atteso." }].map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
          },
        ]
      : undefined,
  });

  if (!base || !d) return <Navigate to="/servizi" replace />;

  const Icon = base.icon;
  const correlate = d.soluzioni.map((id) => solutions.find((s) => s.id === id)).filter((s): s is (typeof solutions)[number] => !!s);
  const altri = SERVIZI.filter((s) => s.slug !== slug);

  return (
    <div className="min-h-screen bg-background">
      {seoTags}
      <Navbar />

      <main>
        {/* ─── Hero ─── */}
        <section className="relative overflow-hidden bg-background">
          <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[520px] rounded-full bg-primary-light blur-[90px] opacity-70" />
          <div className="relative max-w-6xl mx-auto px-6 pt-10 pb-16 md:pt-14 md:pb-24">
            <nav aria-label="Percorso" className="mb-10 flex items-center gap-1.5 text-sm text-neutral-400">
              <Link to="/" className="hover:text-primary">Home</Link>
              <ChevronRight size={14} />
              <Link to="/servizi" className="hover:text-primary">Servizi</Link>
              <ChevronRight size={14} />
              <span className="text-neutral-600">{d.eyebrow}</span>
            </nav>
            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
            <motion.div
              className="max-w-3xl space-y-6"
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12 } } }}
            >
              <motion.div variants={fadeUp} className="flex items-center gap-3">
                <span className="grid size-11 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <Icon size={22} strokeWidth={1.8} />
                </span>
                <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">{d.eyebrow}</span>
              </motion.div>
              <motion.h1 variants={fadeUp} className="font-display text-[32px] md:text-[48px] font-extrabold leading-[1.05] text-neutral-900">
                {d.heroTitolo} <span className="text-primary-dark">{d.heroEvidenza}</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-lg md:text-xl text-neutral-500 leading-relaxed">
                {d.heroSottotitolo}
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-col sm:flex-row gap-3 pt-2">
                <a
                  href="#cta-finale"
                  className="inline-flex items-center justify-center gap-2 bg-primary-dark text-white px-7 py-4 rounded-xl font-bold hover:bg-primary-dark hover:-translate-y-0.5 shadow-button-green transition-all"
                >
                  Prenota la consulenza gratuita <ArrowRight size={18} />
                </a>
                <a
                  href="#cosa-fa"
                  className="inline-flex items-center justify-center gap-2 border border-neutral-200 text-neutral-700 px-6 py-4 rounded-xl font-medium hover:border-primary hover:text-primary transition-all"
                >
                  Cosa fa nel dettaglio
                </a>
              </motion.div>
              <motion.ul variants={fadeUp} className="flex flex-wrap gap-2 pt-4">
                {d.perChi.map((p) => (
                  <li key={p} className="rounded-full border border-neutral-200 bg-background px-3 py-1.5 text-xs text-neutral-600">
                    {p}
                  </li>
                ))}
              </motion.ul>
            </motion.div>
            {visual && <EditorialVisual visual={visual} priority className="mx-auto w-full max-w-[560px]" />}
            </div>
          </div>
        </section>

        {/* ─── Problemi ─── */}
        <section className="bg-neutral-50 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHead eyebrow="Il problema" title="Ti riconosci in una di queste situazioni?" />
            <div className="grid gap-5 md:grid-cols-3">
              {d.problemi.map((p, i) => (
                <Reveal key={p.titolo} delay={i * 0.08}>
                  <div className="h-full rounded-2xl border border-neutral-200 bg-background p-6">
                    <XCircle className="mb-4 text-destructive" size={26} strokeWidth={1.6} />
                    <h3 className="font-display text-lg font-bold text-neutral-900">{p.titolo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">{p.testo}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Cosa fa ─── */}
        <section id="cosa-fa" className="scroll-mt-24 bg-background py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHead eyebrow="Cosa fa" title={<>Cosa fa per te, <span className="text-primary">concretamente.</span></>} />
            <div className="mb-10 grid items-center gap-6 rounded-2xl border border-neutral-200 bg-neutral-50 p-5 md:p-8 lg:grid-cols-2">
              <div>
                <h3 className="font-display text-xl font-bold text-neutral-900">Dai tuoi dati al lavoro pronto da controllare.</h3>
                <p className="mt-3 leading-relaxed text-neutral-500">Definiamo i materiali di partenza, i passaggi affidati all'AI e ciò che il team deve verificare prima di confermare il risultato.</p>
              </div>
              <ServiceFlowVisual slug={slug} className="mx-auto w-full max-w-[520px]" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {d.capacita.map((c, i) => (
                <Reveal key={c.titolo} delay={(i % 3) * 0.08}>
                  <div className="group h-full rounded-2xl border border-neutral-200 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-card-hover">
                    <span className="mb-4 grid size-9 place-items-center rounded-full bg-primary-light text-primary-dark transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                      <Check size={16} strokeWidth={3} />
                    </span>
                    <h3 className="font-display text-lg font-bold text-neutral-900">{c.titolo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-500">{c.testo}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal className="mt-8 rounded-2xl bg-primary-light/60 p-6 md:p-8">
              <p className="font-mono text-[11px] uppercase tracking-wider text-primary-dark mb-1">Cosa ottieni</p>
              <p className="font-display text-lg md:text-xl font-bold text-neutral-900 leading-snug">{base.risultato}</p>
            </Reveal>
          </div>
        </section>

        {/* ─── Come funziona ─── */}
        <section className="bg-neutral-900 py-16 md:py-24">
          <div className="max-w-6xl mx-auto px-6">
            <Reveal className="max-w-2xl mb-12 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Come partiamo</span>
              <h2 className="font-display text-[28px] md:text-[40px] font-extrabold leading-tight text-white">
                Passo dopo passo, <span className="text-primary">senza fermare il lavoro.</span>
              </h2>
            </Reveal>
            <div className={`grid gap-5 md:grid-cols-2 ${d.passi.length === 4 ? "lg:grid-cols-4" : "lg:grid-cols-3"}`}>
              {d.passi.map((p, i) => (
                <Reveal key={p.titolo} delay={i * 0.08}>
                  <div className="relative h-full rounded-2xl border border-neutral-800 bg-neutral-800/50 p-6">
                    <span className="font-display text-4xl font-extrabold text-primary/40">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="mt-3 font-display text-lg font-bold text-white">{p.titolo}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-neutral-400">{p.testo}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Soluzioni collegate ─── */}
        {correlate.length > 0 && (
          <section className="bg-background py-16 md:py-24">
            <div className="max-w-6xl mx-auto px-6">
              <SectionHead eyebrow="Esempi pronti" title="Alcune soluzioni di questo servizio" />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {correlate.map((s, i) => {
                  const cfg = settoreConfig[s.settore];
                  return (
                    <Reveal key={s.id} delay={(i % 3) * 0.08}>
                      <div className="flex h-full flex-col rounded-2xl border border-neutral-200 p-6">
                        <div className="mb-4 flex items-center justify-between">
                          <span className="text-2xl" aria-hidden>
                            {s.icon}
                          </span>
                          <span
                            className="rounded-full px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
                            style={{ background: cfg.colorBg, color: cfg.colorDark }}
                          >
                            {cfg.label}
                          </span>
                        </div>
                        <h3 className="font-display text-base font-bold leading-snug text-neutral-900">{s.title}</h3>
                        <ul className="mt-3 flex-1 space-y-1.5">
                          {s.bullets.slice(0, 3).map((b) => (
                            <li key={b} className="flex gap-2 text-sm text-neutral-500">
                              <span className="text-primary">✓</span> {b}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </Reveal>
                  );
                })}
              </div>
              <Reveal className="mt-8">
                <Link to="/soluzioni" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-dark hover:gap-3 transition-all">
                  Vedi tutte le soluzioni <ArrowRight size={16} />
                </Link>
              </Reveal>
            </div>
          </section>
        )}

        {d.eic && (
          <Suspense fallback={null}>
            <EicBand />
          </Suspense>
        )}

        {/* ─── FAQ ─── */}
        <section className="bg-neutral-50 py-16 md:py-24">
          <div className="max-w-3xl mx-auto px-6">
            <Reveal className="text-center mb-10 space-y-3">
              <span className="font-mono text-xs uppercase tracking-wider text-primary font-semibold">Domande frequenti</span>
              <h2 className="font-display text-[28px] md:text-[40px] font-extrabold leading-tight text-neutral-900">{d.eyebrow}: le domande più comuni</h2>
            </Reveal>
            <FaqList
              items={[
                ...d.faq,
                { q: "Quanto costa?", a: "Non abbiamo un listino: ogni progetto è diverso. Dopo la consulenza gratuita ti presentiamo il progetto con costi, tempi e risparmio atteso." },
              ]}
              group={`faq-${slug}`}
            />
          </div>
        </section>

        {/* ─── Altri servizi ─── */}
        <section className="bg-background py-16 md:py-20">
          <div className="max-w-6xl mx-auto px-6">
            <SectionHead eyebrow="Altri servizi" title="Si combina con" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {altri.map((s) => (
                <Link
                  key={s.slug}
                  to={`/servizi/${s.slug}`}
                  className="group flex items-center gap-3 rounded-xl border border-neutral-200 p-4 transition-all hover:border-primary/50 hover:shadow-card"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-light text-primary-dark">
                    <s.icon size={18} strokeWidth={1.8} />
                  </span>
                  <span className="flex-1 text-sm font-semibold text-neutral-800">{s.breve}</span>
                  <ArrowRight size={15} className="text-neutral-300 transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Suspense fallback={null}>
          <RelatedGuides pageKey={slug} />
          <FinalCTA />
        </Suspense>
      </main>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </div>
  );
};

export default ServizioDetail;
