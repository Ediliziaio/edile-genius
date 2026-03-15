import { lazy, Suspense } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
import Navbar from "@/components/sections/Navbar";
import ScrollProgress from "@/components/custom/ScrollProgress";
import CustomCursor from "@/components/custom/CustomCursor";
import Hero from "@/components/sections/Hero";
import StickyMobileCTA from "@/components/sections/StickyMobileCTA";

// Lazy-load below-the-fold sections
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

const Index = () => {
  usePageSEO({
    title: "Edilizia.io — Agenti Vocali AI per il Settore Edile | Italia",
    description: "La prima azienda AI specializzata per serramenti, infissi, fotovoltaico e ristrutturazioni. Agenti Vocali AI 24/7, riduzione costi operativi -60%, setup in 7 giorni.",
    canonical: "/",
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

export default Index;
