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
import { FinalCta } from '@/components/final-cta'
import { Footer } from '@/components/footer'

export default function Home() {
  return (
    <>
      <Navbar />
      <main>
        <Hero />
        <LogoCloud />
        <div className="relative bg-[#080808]">
        <HowItWorks />
        <RobotSection />
        <PlatformSection />
        <GuaranteeSection />
        <PricingSection />
        <TestimonialsSection />
        <FounderSection />
        <FaqSection />
        <FinalCta />
        </div>
      </main>
      <Footer />
    </>
  )
}
