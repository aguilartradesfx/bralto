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

// Testimonios en video: ocultos también en dev/preview hasta tener los videos reales.
// Para mostrarlos de nuevo, cambiar a true (el componente queda intacto).
const SHOW_TESTIMONIALS = false

export async function HomePage({ locale }: { locale: Locale }) {
  // El link a la comunidad tiene datos pendientes: solo en dev/preview
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
      {SHOW_TESTIMONIALS && pending && <Testimonials locale={locale} />}
      <Faq locale={locale} />
      <FinalCta locale={locale} />
    </main>
  )
}
