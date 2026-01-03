"use client";
import dynamic from "next/dynamic";
import { AnimatePresence } from "framer-motion";
import React, { useState, useEffect, Suspense } from "react";
import { WelcomeExperience } from "@/components/welcome/WelcomeExperience";

// Lazy load heavy components
const BraltoHeroSection = dynamic(() => import("@/components/hero/BraltoHeroSection").then(mod => ({ default: mod.BraltoHeroSection })), { ssr: false });
const HowItWorksSection = dynamic(() => import("@/components/sections/HowItWorksSection").then(mod => ({ default: mod.HowItWorksSection })), { ssr: false });
const BraltoFeaturesSection = dynamic(() => import("@/components/sections/BraltoFeaturesSection").then(mod => ({ default: mod.BraltoFeaturesSection })), { ssr: false });
const PlatformsCentralizationSection = dynamic(() => import("@/components/sections/PlatformsCentralizationSection").then(mod => ({ default: mod.PlatformsCentralizationSection })), { ssr: false });
const DoneForYouSection = dynamic(() => import("@/components/sections/DoneForYouSection").then(mod => ({ default: mod.DoneForYouSection })), { ssr: false });
const OfferPricingSection = dynamic(() => import("@/components/sections/OfferPricingSection").then(mod => ({ default: mod.OfferPricingSection })), { ssr: false });
const ProblemSection = dynamic(() => import("@/components/sections/ProblemSection").then(mod => ({ default: mod.ProblemSection })), { ssr: false });
const AutomatedPipelineBoard = dynamic(() => import("@/components/sections/AutomatedPipelineBoard").then(mod => ({ default: mod.AutomatedPipelineBoard })), { ssr: false });
const FormSection = dynamic(() => import("@/components/sections/FormSection").then(mod => ({ default: mod.FormSection })), { ssr: false });
const GuaranteeSection = dynamic(() => import("@/components/sections/GuaranteeSection"), { ssr: false });
const TrustSection = dynamic(() => import("@/components/sections/TrustSection").then(mod => ({ default: mod.TrustSection })), { ssr: false });
const FloatingCTA = dynamic(() => import("@/components/ui/FloatingCTA").then(mod => ({ default: mod.FloatingCTA })), { ssr: false });
const VoiceWidget = dynamic(() => import("@/components/VoiceWidget").then(mod => ({ default: mod.VoiceWidget })), { ssr: false });

const WELCOME_STORAGE_KEY = "bralto_welcome_seen";

export default function VSLPage() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const hasSeenWelcome = localStorage.getItem(WELCOME_STORAGE_KEY);
    if (hasSeenWelcome) {
      setShowWelcome(false);
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
