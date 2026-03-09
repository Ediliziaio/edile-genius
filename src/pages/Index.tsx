import { usePageSEO } from "@/hooks/usePageSEO";
import AnnouncementBar from "@/components/sections/AnnouncementBar";
import Navbar from "@/components/sections/Navbar";
import ScrollProgress from "@/components/custom/ScrollProgress";
import CustomCursor from "@/components/custom/CustomCursor";
import Hero from "@/components/sections/Hero";
import LogoBar from "@/components/sections/LogoBar";
import PainSection from "@/components/sections/PainSection";
import SolutionSection from "@/components/sections/SolutionSection";
import UseCasesGrid from "@/components/sections/UseCasesGrid";
import ROISection from "@/components/sections/ROISection";
import CostCalculator from "@/components/sections/CostCalculator";
import HowItWorks from "@/components/sections/HowItWorks";
import Results from "@/components/sections/Results";
import WhyUs from "@/components/sections/WhyUs";
import WhyDifferent from "@/components/sections/WhyDifferent";
import Pricing from "@/components/sections/Pricing";
import Guarantee from "@/components/sections/Guarantee";
import FinalCTA from "@/components/sections/FinalCTA";
import Footer from "@/components/sections/Footer";

const Index = () => {
  usePageSEO({
    title: "Edilizia.io — Agenti Vocali AI per il Settore Edile | Italia",
    description: "La prima agenzia AI specializzata per serramenti, infissi, fotovoltaico e ristrutturazioni. Agenti Vocali AI 24/7, riduzione costi operativi -60%, setup in 7 giorni.",
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
      </main>
      <Footer />
    </div>
  );
};

export default Index;
