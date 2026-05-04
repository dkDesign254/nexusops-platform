/**
 * NexusOps — LandingPage
 *
 * Public-facing marketing page. Assembles all nine landing sections
 * in order. No auth required.
 *
 * Route: /
 */
import { NavBar } from "@/components/landing/navbar";
import { Hero } from "@/components/landing/hero";
import { ProblemStrip } from "@/components/landing/problem-strip";
import { FeaturesGrid } from "@/components/landing/features-grid";
import { HowItWorks } from "@/components/landing/how-it-works";
import { Ecosystem } from "@/components/landing/ecosystem";
import { PricingSection } from "@/components/landing/pricing-section";
import { StatsStrip } from "@/components/landing/stats-strip";
import { CTABanner } from "@/components/landing/cta-banner";
import { Footer } from "@/components/landing/footer";

export default function LandingPage(): JSX.Element {
  return (
    <div style={{ minHeight: "100vh", background: "var(--color-bg-base)", color: "var(--color-text-primary)" }}>
      <NavBar />
      <main>
        <Hero />
        <ProblemStrip />
        <FeaturesGrid />
        <HowItWorks />
        <Ecosystem />
        <PricingSection />
        <StatsStrip />
        <CTABanner />
      </main>
      <Footer />
    </div>
  );
}
