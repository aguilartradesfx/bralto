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
      es: 'Agendar diagnóstico',
      en: 'Book a diagnostic call',
    },
    descriptions: {
      es: 'Diagnóstico de 30 minutos con el equipo de Bralto para revisar su operación y definir qué automatizar. $97 USD que se descuentan del proyecto si decide contratar.',
      en: 'A 30-minute diagnostic call with the Bralto team to review your operation and decide what to automate. $97 USD, deducted from the project if you hire us.',
    },
  })
}

export default function Page() {
  return <AgendarPage />
}
