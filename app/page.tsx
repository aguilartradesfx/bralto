import { Navbar } from '@/components/navbar'
import { Hero } from '@/components/hero'
import { LogoCloud } from '@/components/ui/logo-cloud'
import { RobotSection } from '@/components/robot-section'
import { HowItWorks } from '@/components/how-it-works'
import { PlatformSection } from '@/components/platform-section'
import { GuaranteeSection } from '@/components/guarantee-section'
import { PricingSection } from '@/components/pricing-section'
import { TestimonialsSection } from '@/components/testimonials-section'
import { FounderSection } from '@/components/founder-section'
import { FaqSection } from '@/components/faq-section'
import { FunnelLabSection } from '@/components/funnel-lab-section'
import { FinalCta } from '@/components/final-cta'
import { Footer } from '@/components/footer'
import { RobotOrb } from '@/components/ui/robot-orb'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LogoCloud />
        <div className="relative bg-[#080808]">
        <HowItWorks />

        {/* Robot orb — hidden on mobile (too wide), overflow-hidden clips the canvas */}
        <section className="hidden md:flex py-16 flex-col items-center justify-center bg-[#080808] overflow-hidden">
          <p className="text-sm font-mono uppercase tracking-[0.2em] text-white/25 mb-12">
            Inteligencia que trabaja por usted
          </p>
          <RobotOrb />
        </section>

        <RobotSection />
        <PlatformSection />
        <GuaranteeSection />
        <PricingSection />
        <TestimonialsSection />
        <FunnelLabSection />
        <FounderSection />
        <FaqSection />
        <FinalCta />
        </div>
      </main>
      <Footer />
    </>
  )
}
