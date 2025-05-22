import React from "react";
import HeroSection from "@/components/home/HeroSection";
import ProblemSolution from "@/components/home/ProblemSolution";
import AudienceHighlight from "@/components/home/AudienceHighlight";
import FeatureShowcaseSection from "@/components/home/FeatureShowcaseSection";
import CreativeCtaSection from "@/components/home/GeneralCTASection";
import FaqSection from "@/components/home/FaqSection";

export default function HomePage() {
  return (
    <main className="flex flex-col min-h-screen">
      <HeroSection />
      <FeatureShowcaseSection />
      <ProblemSolution />
      <AudienceHighlight type="admin" />
      <AudienceHighlight type="parent" />
      {/* <TestimonialsSection /> */}
      <FaqSection />
      <CreativeCtaSection />
    </main>
  );
}
