"use client";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { WelcomeExperience } from "@/components/welcome/WelcomeExperience";

// Lazy load heavy components for better performance
const BraltoHeroSection = dynamic(() => import("@/components/hero/BraltoHeroSection").then(m => ({ default: m.BraltoHeroSection })), { ssr: false });
const HowItWorksSection = dynamic(() => import("@/components/sections/HowItWorksSection").then(m => ({ default: m.HowItWorksSection })), { ssr: false });
const BraltoFeaturesSection = dynamic(() => import("@/components/sections/BraltoFeaturesSection").then(m => ({ default: m.BraltoFeaturesSection })), { ssr: false });
const PlatformsCentralizationSection = dynamic(() => import("@/components/sections/PlatformsCentralizationSection").then(m => ({ default: m.PlatformsCentralizationSection })), { ssr: false });
const DoneForYouSection = dynamic(() => import("@/components/sections/DoneForYouSection").then(m => ({ default: m.DoneForYouSection })), { ssr: false });
const OfferPricingSection = dynamic(() => import("@/components/sections/OfferPricingSection").then(m => ({ default: m.OfferPricingSection })), { ssr: false });
const ProblemSection = dynamic(() => import("@/components/sections/ProblemSection").then(m => ({ default: m.ProblemSection })), { ssr: false });
const AutomatedPipelineBoard = dynamic(() => import("@/components/sections/AutomatedPipelineBoard").then(m => ({ default: m.AutomatedPipelineBoard })), { ssr: false });
const FormSection = dynamic(() => import("@/components/sections/FormSection").then(m => ({ default: m.FormSection })), { ssr: false });
const GuaranteeSection = dynamic(() => import("@/components/sections/GuaranteeSection"), { ssr: false });
const TrustSection = dynamic(() => import("@/components/sections/TrustSection").then(m => ({ default: m.TrustSection })), { ssr: false });
const FloatingCTA = dynamic(() => import("@/components/ui/FloatingCTA").then(m => ({ default: m.FloatingCTA })), { ssr: false });
const VoiceWidget = dynamic(() => import("@/components/VoiceWidget").then(m => ({ default: m.VoiceWidget })), { ssr: false });

const WELCOME_STORAGE_KEY = "bralto_welcome_seen";

export default function VSLPage() {
  const [showWelcome, setShowWelcome] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (!hasSeenWelcome) {
      setShowWelcome(true);
    }
  }, []);

  const handleWelcomeComplete = () => {
    localStorage.setItem(WELCOME_STORAGE_KEY, "1");
    setShowWelcome(false);
  };

  return (
    <main className="min-h-screen bg-black">
      {/* Welcome Experience Overlay */}
      <AnimatePresence>
        {isClient && showWelcome && (
          <WelcomeExperience onComplete={handleWelcomeComplete} />
        )}
      </AnimatePresence>
      {/* Logo at the top */}

      <BraltoHeroSection />
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
