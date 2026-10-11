import type { Metadata } from "next";
import { authSession } from "@/actions/user";
import { GradientPatternEffect } from "@/components/gradient-pattern-effect";

export const metadata: Metadata = {
  title: "SnackDesk - Office Snack Ordering Platform",
  description:
    "The modern snack ordering and team engagement platform. Live order windows, gamified treats, group order coordination, and spending insights.",
};
import { BenefitsSection } from "@/components/landing/BenefitsSection";
import { CTASection } from "@/components/landing/CTASection";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { FeaturesSection } from "@/components/landing/FeaturesSection";
import { Footer } from "@/components/landing/Footer";
import { HeroSection } from "@/components/landing/HeroSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { LandingNavbar } from "@/components/landing/Navbar";

export default async function Home() {
  const session = await authSession();

  return (
    <div>
      <LandingNavbar session={session} />
      <GradientPatternEffect />
      <HeroSection />
      <DashboardPreview />
      <FeaturesSection />
      <HowItWorksSection />
      <BenefitsSection />
      <CTASection />
      <Footer />
    </div>
  );
}
