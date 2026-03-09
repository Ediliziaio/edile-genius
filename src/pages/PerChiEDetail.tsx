import { useParams, Navigate, Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { icons, XCircle, CheckCircle2, ArrowRight, Quote } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Guarantee from "@/components/sections/Guarantee";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import { perChiECategories } from "@/data/perChiE";

const PerChiEDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const cat = perChiECategories.find(c => c.slug === slug);
  const problemsRef = useRef(null);
  const solutionsRef = useRef(null);
  const roiRef = useRef(null);
  const caseRef = useRef(null);
  const problemsInView = useInView(problemsRef, { once: true });
  const solutionsInView = useInView(solutionsRef, { once: true });
  const roiInView = useInView(roiRef, { once: true });
  const caseInView = useInView(caseRef, { once: true });

  if (!cat) return <Navigate to="/per-chi-e" replace />;

  const IconComponent = icons[cat.icon as keyof typeof icons];

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="py-20 md:py-28 bg-primary-bg">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <AnimatedBadge text={cat.name.toUpperCase()} />
          <motion.h1
            className="font-display text-3xl md:text-5xl lg:text-[56px] font-extrabold text-foreground leading-tight mt-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {cat.heroTitle}
          </motion.h1>
          <motion.p
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            {cat.heroSubtitle}
          </motion.p>

          {/* Mini stats */}
          <motion.div
            className="grid grid-cols-3 gap-4 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            {cat.stats.map((s, i) => (
              <div key={i} className="bg-background rounded-xl border border-border p-4">
                <div className="font-display text-2xl md:text-3xl font-extrabold text-primary">{s.value}</div>
                <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{s.label}</div>
              </div>
            ))}
          </motion.div>
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
              Ecco Come l'AI Risolve Tutto.
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

      {/* ROI */}
      <section ref={roiRef} className="py-16 md:py-20">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            className="bg-neutral-900 rounded-3xl p-10 md:p-14 text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={roiInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">I Numeri Parlano</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white mt-3 mb-10">
              Risultati Concreti Per {cat.name}
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {cat.roi.map((r, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 16 }}
                  animate={roiInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.4 }}
                >
                  <div className="font-display text-3xl md:text-4xl font-extrabold text-primary">{r.value}</div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 mt-2">{r.metric}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CASO STUDIO */}
      <section ref={caseRef} className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-6">
          <motion.div
            className="bg-background rounded-3xl border border-border p-10 md:p-14"
            initial={{ opacity: 0, y: 20 }}
            animate={caseInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <Quote className="text-primary mb-4" size={36} />
            <blockquote className="font-display text-xl md:text-2xl font-bold text-foreground leading-snug mb-6">
              "{cat.caseStudy.quote}"
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                {IconComponent && <IconComponent size={18} className="text-primary" />}
              </div>
              <div>
                <div className="font-bold text-foreground text-sm">{cat.caseStudy.company}</div>
                <div className="text-xs text-muted-foreground">{cat.caseStudy.location}</div>
              </div>
            </div>
            <div className="mt-6 inline-block bg-primary-light text-primary-dark font-mono text-sm font-bold px-4 py-2 rounded-full">
              {cat.caseStudy.result}
            </div>
          </motion.div>
        </div>
      </section>

      <Guarantee />

      {/* CTA DARK */}
      <section className="py-16 md:py-24 bg-neutral-900">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="font-display text-3xl md:text-4xl font-extrabold text-white leading-tight mb-6">
            {cat.ctaLine}
          </h2>
          <p className="text-neutral-400 text-lg mb-8">
            Ogni giorno che aspetti, un tuo competitor chiude un contratto in più.
          </p>
          <Link
            to="/soluzioni"
            className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-dark hover:scale-[1.02] shadow-button-green transition-all"
          >
            Prenota La Tua Demo Gratuita <ArrowRight size={20} />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default PerChiEDetail;
