import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { usePageSEO } from "@/hooks/usePageSEO";
import { icons } from "lucide-react";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import Guarantee from "@/components/sections/Guarantee";
import AnimatedBadge from "@/components/custom/AnimatedBadge";
import { dimensioneCategories, settoreCategories } from "@/data/perChiE";
import type { PerChiECategory } from "@/data/perChiE";

const CategoryCard = ({ cat, index }: { cat: PerChiECategory; index: number }) => {
  const IconComponent = icons[cat.icon as keyof typeof icons];

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
    >
      <Link
        to={`/per-chi-e/${cat.slug}`}
        className="group block bg-background rounded-2xl border border-border p-6 hover:border-primary hover:shadow-card transition-all duration-300"
      >
        <div className="w-12 h-12 rounded-xl bg-primary-light flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
          {IconComponent && <IconComponent size={24} className="text-primary group-hover:text-primary-foreground transition-colors" />}
        </div>
        <h3 className="font-display text-lg font-bold text-foreground mb-2">{cat.name}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2">{cat.heroSubtitle}</p>
        <span className="inline-flex items-center text-sm font-semibold text-primary mt-4 group-hover:gap-2 transition-all">
          Scopri di più →
        </span>
      </Link>
    </motion.div>
  );
};

const PerChiE = () => {
  usePageSEO({
    title: "Per Chi È — Soluzioni AI per Ogni Azienda Edile | Edilizia.io",
    description: "Soluzioni AI su misura per artigiani, PMI, grandi imprese, serramentisti, fotovoltaico, ristrutturazioni e tutti i settori dell'edilizia italiana.",
    canonical: "/per-chi-e",
  });

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Hero */}
      <section className="py-20 md:py-28 bg-primary-bg">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <AnimatedBadge>PER CHI È</AnimatedBadge>
          <motion.h1
            className="font-display text-3xl sm:text-3xl sm:text-4xl md:text-6xl font-extrabold text-foreground leading-tight mt-6 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Costruito Per Chi<br />
            <span className="text-primary">Costruisce l'Italia.</span>
          </motion.h1>
          <motion.p
            clasbase sm:text-sName="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.5 }}
          >
            Ogni tipo di azienda edile ha problemi specifici. Noi abbiamo soluzioni specifiche. 
            Trova la tua categoria e scopri come l'AI trasforma il tuo business.
          </motion.p>
        </div>
      </section>

      {/* Per Dimensione */}
      <section className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">Per Dimensione Azienda</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mt-2">
              Che tu sia un artigiano o un general contractor.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {dimensioneCategories.map((cat, i) => (
              <CategoryCard key={cat.slug} cat={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Per Settore */}
      <section className="py-16 md:py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-6">
          <div className="mb-10">
            <span className="font-mono text-xs uppercase tracking-wider text-primary font-bold">Per Settore</span>
            <h2 className="font-display text-3xl md:text-4xl font-extrabold text-foreground mt-2">
              Il tuo settore. I tuoi problemi. Le nostre soluzioni.
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {settoreCategories.map((cat, i) => (
              <CategoryCard key={cat.slug} cat={cat} index={i} />
            ))}
          </div>
        </div>
      </section>

      <Guarantee />
      <Footer />
    </main>
  );
};

export default PerChiE;
