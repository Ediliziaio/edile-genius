import { lazy, Suspense } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
import Navbar from "@/components/sections/Navbar";
import ScrollProgress from "@/components/custom/ScrollProgress";
import CustomCursor from "@/components/custom/CustomCursor";
import Hero from "@/components/sections/Hero";
import StickyMobileCTA from "@/components/sections/StickyMobileCTA";

const LogoBar = lazy(() => import("@/components/sections/LogoBar"));
const PainSection = lazy(() => import("@/components/sections/PainSection"));
const SolutionSection = lazy(() => import("@/components/sections/SolutionSection"));
const UseCasesGrid = lazy(() => import("@/components/sections/UseCasesGrid"));
const ROISection = lazy(() => import("@/components/sections/ROISection"));
const CostCalculator = lazy(() => import("@/components/sections/CostCalculator"));
const HowItWorks = lazy(() => import("@/components/sections/HowItWorks"));
const Results = lazy(() => import("@/components/sections/Results"));
const WhyUs = lazy(() => import("@/components/sections/WhyUs"));
const WhyDifferent = lazy(() => import("@/components/sections/WhyDifferent"));
const Pricing = lazy(() => import("@/components/sections/Pricing"));
const Guarantee = lazy(() => import("@/components/sections/Guarantee"));
const FinalCTA = lazy(() => import("@/components/sections/FinalCTA"));
const Footer = lazy(() => import("@/components/sections/Footer"));

const OffertaUnica = () => {
  usePageSEO({
    title: "Offerta Unica — Agenti Vocali AI per Edilizia | Edilizia.io",
    description: "Scopri l'offerta esclusiva Edilizia.io: Agenti Vocali AI specializzati per serramenti, fotovoltaico e ristrutturazioni. Setup in 7 giorni, risultati garantiti.",
    canonical: "/offerta-unica",
  });

  return (
    <div className="min-h-screen bg-background">
      <CustomCursor />
      <AnnouncementBar />
      <Navbar />
      <ScrollProgress />
      <main>
        <Hero />
        <Suspense fallback={null}>
          <LogoBar />
          <PainSection />
          <SolutionSection />
          <UseCasesGrid />
          <ROISection />
          <CostCalculator />
          <HowItWorks />
          <Results />
          <WhyUs />
          <WhyDifferent />
          <Pricing />
          <Guarantee />
          <FinalCTA />
        </Suspense>
      </main>
      <Suspense fallback={null}>
        <Footer />
      </Suspense>
      <StickyMobileCTA />
    </div>
  );
};

export default OffertaUnica;
