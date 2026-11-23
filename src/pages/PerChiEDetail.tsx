import { useParams, Navigate, Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { XCircle, CheckCircle2, ArrowRight } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Guarantee from "@/components/sections/Guarantee";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import SectorServicesGrid from "@/components/perchie/SectorServicesGrid";
import RelatedServices from "@/components/custom/RelatedServices";
import { perChiECategories } from "@/data/perChiE";
import EditorialVisual from "@/components/custom/EditorialVisual";
import RelatedGuides from "@/components/custom/RelatedGuides";
import { SECTOR_VISUALS, visualSEO } from "@/data/siteVisuals";

/** Descrizione per Google: al massimo ~155 caratteri, tagliata su una parola intera. */
const seoDescription = (text?: string) => {
  if (!text) return "";
  if (text.length <= 158) return text;
  const cut = text.slice(0, 155);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
};

const PerChiEDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const cat = perChiECategories.find(c => c.slug === slug);
  const visual = slug ? SECTOR_VISUALS[slug] : undefined;

  const seoTags = usePageSEO({
    title: cat ? `${cat.name} — AI per l'Edilizia | Edilizia.io` : "Per Chi È | Edilizia.io",
    description: seoDescription(cat?.heroSubtitle) || "Soluzioni AI specializzate per il settore edile italiano.",
    canonical: `/per-chi-e/${slug}`,
    ...(visual ? visualSEO(visual) : {}),
    jsonLd: cat
      ? [
          {
            "@type": "Service",
            name: `Intelligenza artificiale per ${cat.name}`,
            serviceType: "Sistemi di intelligenza artificiale per l'edilizia",
            description: seoDescription(cat.heroSubtitle),
            audience: { "@type": "BusinessAudience", name: cat.name },
            areaServed: "IT",
            provider: { "@type": "Organization", name: "Edilizia.io", url: "https://edilizia.io" },
            url: `https://edilizia.io/per-chi-e/${cat.slug}`,
            hasOfferCatalog: {
              "@type": "OfferCatalog",
              name: `Soluzioni AI per ${cat.name}`,
              itemListElement: cat.services.map((sv) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: sv.title, description: sv.description } })),
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              { "@type": "ListItem", position: 1, name: "Home", item: "https://edilizia.io/" },
              { "@type": "ListItem", position: 2, name: "Per chi è", item: "https://edilizia.io/per-chi-e" },
              { "@type": "ListItem", position: 3, name: cat.name, item: `https://edilizia.io/per-chi-e/${cat.slug}` },
            ],
          },
        ]
      : undefined,
  });

  const problemsRef = useRef(null);
  const solutionsRef = useRef(null);
  const problemsInView = useInView(problemsRef, { once: true });
  const solutionsInView = useInView(solutionsRef, { once: true });

  if (!cat) return <Navigate to="/per-chi-e" replace />;

  return (
    <main className="min-h-screen bg-background">
      {seoTags}
      <Navbar />

      {/* Hero */}
      <section className="py-14 md:py-20 bg-primary-bg">
        <div className="max-w-6xl mx-auto grid items-center gap-10 px-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div>
          <AnimatedBadge>{cat.name.toUpperCase()}</AnimatedBadge>
          <motion.h1
            className="font-display text-3xl md:text-4xl lg:text-5xl font-extrabold text-foreground leading-tight mt-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {cat.heroTitle}
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-8"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            {cat.heroSubtitle}
          </motion.p>
          <motion.div
            className="space-y-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {cat.solutions.map((s, i) => (
              <div key={i} className="flex items-start gap-3 text-sm font-medium text-neutral-700">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-dark" />
                <span>{s.title}</span>
              </div>
            ))}
          </motion.div>
          <Link to="/#cta-finale" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-primary-dark px-5 py-3 font-semibold text-white">Parliamo del tuo lavoro <ArrowRight size={17} /></Link>
          </div>
          {visual && <EditorialVisual visual={visual} priority />}
        </div>
      </section>

      {/* IL PROBLEMA */}
      <section ref={problemsRef} className="py-16 md:py-24">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-wider text-destructive font-bold">Il Tuo Problema</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mt-2">
              Riconosci questa situazione?
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {cat.problems.map((p, i) => (
              <motion.div
                key={i}
                className="bg-destructive/5 border border-destructive/20 rounded-2xl p-6"
                initial={{ opacity: 0, y: 24 }}
                animate={problemsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.4 }}
              >
                <XCircle className="text-destructive mb-4" size={28} />
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{p.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* LA SOLUZIONE */}
      <section ref={solutionsRef} className="py-16 md:py-24 bg-primary-bg">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">La Nostra Soluzione</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mt-2">
              Le attività che possiamo semplificare con l'AI.
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {cat.solutions.map((s, i) => (
              <motion.div
                key={i}
                className="bg-background border border-primary/20 rounded-2xl p-6 shadow-card"
                initial={{ opacity: 0, y: 24 }}
                animate={solutionsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.12, duration: 0.4 }}
              >
                <CheckCircle2 className="text-primary mb-4" size={28} />
                <h3 className="font-display text-lg font-bold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* SERVIZI AI */}
      <SectorServicesGrid sectorName={cat.name} services={cat.services} />

      <RelatedServices pageKey={cat.slug} title={`I servizi più utili per ${cat.name}`} />


      <RelatedGuides pageKey={cat.slug} />

      <Guarantee />

      {/* CTA DARK */}
      <section className="py-16 md:py-24 bg-[hsl(var(--neutral-900))]">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white leading-tight mb-6">
            {cat.ctaLine}
          </h2>
          <p className="text-[hsl(var(--neutral-300))] text-lg mb-8">
            Partiamo da una tua attività ripetitiva e definiamo insieme dati, controlli e risultato atteso.
          </p>
          <Link
            to="/#cta-finale"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
          >
            Prenota La Tua Consulenza Gratuita <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default PerChiEDetail;
