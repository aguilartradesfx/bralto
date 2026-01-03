"use client";
import { BraltoHeroSectionNoVideo } from "@/components/hero/BraltoHeroSectionNoVideo";
import { HowItWorksSection } from "@/components/sections/HowItWorksSection";
import { BraltoFeaturesSection } from "@/components/sections/BraltoFeaturesSection";
import { PlatformsCentralizationSection } from "@/components/sections/PlatformsCentralizationSection";
import { DoneForYouSection } from "@/components/sections/DoneForYouSection";
import { OfferPricingSection } from "@/components/sections/OfferPricingSection";
import { ProblemSection } from "@/components/sections/ProblemSection";
import { AutomatedPipelineBoard } from "@/components/sections/AutomatedPipelineBoard";
import { FormSection } from "@/components/sections/FormSection";
import { TrustSection } from "@/components/sections/TrustSection";
import GuaranteeSection from "@/components/sections/GuaranteeSection";
import { FloatingCTA } from "@/components/ui/FloatingCTA";
import { Navbar } from "@/components/navigation/Navbar";
import { VoiceWidget } from "@/components/VoiceWidget";

export default function Page() {
  return (
    <main className="min-h-screen bg-black">
      <Navbar />

      <BraltoHeroSectionNoVideo />
      <HowItWorksSection />
      <BraltoFeaturesSection />
      <PlatformsCentralizationSection />
      <DoneForYouSection />
      <OfferPricingSection />
      <ProblemSection />
      <AutomatedPipelineBoard />
      <FormSection />
      <GuaranteeSection />
      <TrustSection />
      {/* Logo at the bottom */}
      <div className="w-full flex justify-center py-8 border-t" style={{ background: '#0D0D0D', borderColor: 'rgba(255,255,255,0.08)' }}>
        <img
          src="https://storage.googleapis.com/msgsndr/hdVpvshZP3RGJQbxx8GA/media/6823c9f977a9d4672be32ac7.png"
          alt="Bralto Logo"
          className="h-8 w-auto opacity-70"
        />
      </div>
      <FloatingCTA />
      <VoiceWidget />
    </main>
  );
}
