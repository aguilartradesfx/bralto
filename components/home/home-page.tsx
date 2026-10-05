import { showPending } from '@/lib/home/pending'
import { Cases } from './cases'
import { Circuit } from './circuit'
import { Compare } from './compare'
import { Faq } from './faq'
import { FinalCta } from './final-cta'
import { Hero } from './hero'
import { Guarantee, Offer } from './offer'
import { Platform } from './platform'
import type { Locale } from './primitives'
import { Testimonials } from './testimonials'

export async function HomePage({ locale }: { locale: Locale }) {
  // Testimonios y el link a la comunidad tienen datos pendientes: solo en dev/preview
  const pending = showPending(process.env)

  return (
    <main>
      <Hero locale={locale} />
      <Compare locale={locale} />
      <Circuit locale={locale} />
      <Cases locale={locale} />
      <Platform locale={locale} />
      <Offer locale={locale} showCommunity={pending} />
      <Guarantee locale={locale} />
      {pending && <Testimonials locale={locale} />}
      <Faq locale={locale} />
      <FinalCta locale={locale} />
    </main>
  )
}
