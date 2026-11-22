import { lazy, Suspense } from "react";
import { usePageSEO } from "@/hooks/usePageSEO";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
import Navbar from "@/components/sections/Navbar";
import ScrollProgress from "@/components/custom/ScrollProgress";
import CustomCursor from "@/components/custom/CustomCursor";
import SyntraHero from "@/components/ui/syntra-hero";
import StickyMobileCTA from "@/components/sections/StickyMobileCTA";

// Lazy-load below-the-fold sections
const LogoBar = lazy(() => import("@/components/sections/LogoBar"));
const DuePercorsi = lazy(() => import("@/components/sections/DuePercorsi"));
const WorkflowSection = lazy(() => import("@/components/sections/WorkflowSection"));
const EicBand = lazy(() => import("@/components/sections/EicBand"));
const ServiziSection = lazy(() => import("@/components/sections/ServiziSection"));
const InkOrbitFeatures = lazy(() => import("@/components/ui/ink-orbit-features"));
const PainSection = lazy(() => import("@/components/sections/PainSection"));
const SolutionSection = lazy(() => import("@/components/sections/SolutionSection"));
const UseCasesGrid = lazy(() => import("@/components/sections/UseCasesGrid"));
const HowItWorks = lazy(() => import("@/components/sections/HowItWorks"));
const Results = lazy(() => import("@/components/sections/Results"));
const WhyUs = lazy(() => import("@/components/sections/WhyUs"));
const WhyDifferent = lazy(() => import("@/components/sections/WhyDifferent"));
const Guarantee = lazy(() => import("@/components/sections/Guarantee"));
const FinalCTA = lazy(() => import("@/components/sections/FinalCTA"));
const Footer = lazy(() => import("@/components/sections/Footer"));

const Index = () => {
  const seoTags = usePageSEO({
    title: "Edilizia.io — Intelligenza Artificiale per Imprese Edili e Progettisti",
    description: "Sistemi AI per imprese edili, architetti, ingegneri e geometri: automazione, preventivi, render, gare d'appalto, cantiere e consulenza. Attivi in circa 7 giorni.",
    canonical: "/",
  });

  return (
    <div className="min-h-screen bg-background">
      {seoTags}
      <CustomCursor />
      <AnnouncementBar />
      <Navbar />
      <ScrollProgress />
      <main>
        <SyntraHero />
        <Suspense fallback={null}>
          <LogoBar />
          <DuePercorsi />
          <ServiziSection />
          <InkOrbitFeatures />
          <EicBand />
          <PainSection />
          <SolutionSection />
          <UseCasesGrid />
          <WorkflowSection />
          <HowItWorks />
          <Results />
          <WhyUs />
          <WhyDifferent />
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
