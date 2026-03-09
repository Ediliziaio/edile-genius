import { useState, useEffect, useCallback } from "react";
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
import SolutionsFAQ from "@/components/solutions/SolutionsFAQ";
import SolutionsCTA from "@/components/solutions/SolutionsCTA";
import Guarantee from "@/components/sections/Guarantee";
import { solutions, type Solution } from "@/data/solutions";

const Solutions = () => {
  const [filterActive, setFilterActive] = useState("tutte");
  const [modalOpen, setModalOpen] = useState<Solution | null>(null);

  usePageSEO({
    title: "20 Soluzioni AI per l'Edilizia | Edilizia.io",
    description: "Scopri 20 agenti AI specializzati per infissi, fotovoltaico, ristrutturazioni e imprese edili. Automazione vendite, assistenza clienti e gestione cantieri.",
    canonical: "/soluzioni",
  });

  useEffect(() => {
    const hash = window.location.hash.replace("#", "");
    if (["infissi", "fotovoltaico", "ristrutturazioni", "edilizia"].includes(hash)) {
      setFilterActive(hash);
    }
  }, []);

  useEffect(() => {
    document.title = "Soluzioni AI per l'Edilizia — 20 Agenti AI | Edilizia.io";
  }, []);

  const filtered = filterActive === "tutte" ? solutions : solutions.filter((s) => s.settore === filterActive);

  const handleOpenDetail = useCallback((id: number) => {
    const sol = solutions.find((s) => s.id === id) || null;
    setModalOpen(sol);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <CustomCursor />
      <Navbar />
      <ScrollProgress />
      <main>
        <SolutionsHero />
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
        <AIComparison />
        <ImplementationSteps />
        <SolutionsFAQ />
        <SolutionsCTA />
      </main>
      <Guarantee />
      <Footer />
      <SolutionModal solution={modalOpen} onClose={() => setModalOpen(null)} />
    </div>
  );
};

export default Solutions;
