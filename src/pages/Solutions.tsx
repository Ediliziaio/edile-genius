import EditorialVisual from "@/components/custom/EditorialVisual";
import { SITE_VISUALS, visualSEO } from "@/data/siteVisuals";
import { useState, useEffect, useCallback, lazy, Suspense } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/sections/Navbar";
import Footer from "@/components/sections/Footer";
import ScrollProgress from "@/components/custom/ScrollProgress";
import CustomCursor from "@/components/custom/CustomCursor";
import SolutionsHero from "@/components/solutions/SolutionsHero";
import FilterBar from "@/components/solutions/FilterBar";
import SolutionCard from "@/components/solutions/SolutionCard";
import SolutionModal from "@/components/solutions/SolutionModal";
import AIComparison from "@/components/solutions/AIComparison";
import ImplementationSteps from "@/components/solutions/ImplementationSteps";
import SolutionsFAQ, { faqs as solutionsFaqs } from "@/components/solutions/SolutionsFAQ";
import SolutionsCTA from "@/components/solutions/SolutionsCTA";
import Guarantee from "@/components/sections/Guarantee";
const EicBand = lazy(() => import("@/components/sections/EicBand"));
const DuePercorsi = lazy(() => import("@/components/sections/DuePercorsi"));
import { solutions, type Solution } from "@/data/solutions";

const Solutions = () => {
  const [filterActive, setFilterActive] = useState("tutte");
  const [modalOpen, setModalOpen] = useState<Solution | null>(null);

  const seoTags = usePageSEO({
    title: "Soluzioni AI per Imprese Edili e Progettisti | Edilizia.io",
    description: "45 soluzioni AI per infissi, fotovoltaico, ristrutturazioni, imprese edili, gare d'appalto e studi tecnici: automazione, preventivi, render e cantiere.",
    canonical: "/soluzioni",
    ...visualSEO(SITE_VISUALS.documents),
    jsonLd: {
      "@type": "FAQPage",
      mainEntity: solutionsFaqs.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
  });

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (["infissi", "fotovoltaico", "ristrutturazioni", "edilizia"].includes(hash)) {
      setFilterActive(hash);
    }
  }, []);
  const filtered = filterActive === "tutte" ? solutions : solutions.filter((s) => s.settore === filterActive);

  const handleOpenDetail = useCallback((id: number) => {
    const sol = solutions.find((s) => s.id === id) || null;
    setModalOpen(sol);
  }, []);

  return (
    <div className="min-h-screen overflow-x-clip bg-background">
      {seoTags}
      <CustomCursor />
      <Navbar />
      <ScrollProgress />
      <main>
        <SolutionsHero />
        <div className="mx-auto max-w-5xl px-6 pb-10"><EditorialVisual visual={SITE_VISUALS.documents} priority sizes="(min-width: 1024px) 960px, calc(100vw - 48px)" /></div>
        <div id="solutions-grid">
          <FilterBar activeFilter={filterActive} onFilterChange={setFilterActive} totalShown={filtered.length} total={solutions.length} />
          <section className="bg-neutral-50 py-12 md:py-16">
            <div className="max-w-[1200px] mx-auto px-6">
              <motion.div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6" layout>
                <AnimatePresence>
                  {filtered.map((solution) => (
                    <motion.div
                      key={solution.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                    >
                      <SolutionCard solution={solution} onOpenDetail={handleOpenDetail} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            </div>
          </section>
        </div>
        <Suspense fallback={null}>
          <DuePercorsi />
        </Suspense>
        <AIComparison />
        <ImplementationSteps />
        <SolutionsFAQ />
        <Suspense fallback={null}>
          <EicBand />
        </Suspense>
        <SolutionsCTA />
      </main>
      <Guarantee />
      <Footer />
      <SolutionModal solution={modalOpen} onClose={() => setModalOpen(null)} />
    </div>
  );
};

export default Solutions;
