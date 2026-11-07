import type { Metadata } from "next";
import { authSession } from "@/actions/user";

export const metadata: Metadata = {
  title: "SnackDesk - Office Snack Ordering Platform",
  description:
    "Office snacks without the group chat. Open an order window, let everyone order, split what's shared, and spin to decide who pays the shop.",
};
import { CTASection } from "@/components/landing/CTASection";
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
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
      <Footer />
    </div>
  );
}
