import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import AgendarPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/agendar', en: '/agendar' },
    titles: {
      es: 'Agendar una Llamada con Bralto',
      en: 'Book a Call with Bralto',
    },
    descriptions: {
      es: 'Conversemos sobre cómo automatizar tu operación con CRM, IA y sistemas integrados. Llamada gratuita de descubrimiento.',
      en: "Let's talk about automating your operation with CRM, AI, and integrated systems. Free discovery call.",
    },
  })
}

export default function Page() {
  return <AgendarPage />
}
