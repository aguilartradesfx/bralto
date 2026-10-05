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
      es: 'Conversemos sobre cómo automatizar tu operación con CRM, IA y sistemas integrados. Diagnóstico de 30 minutos con el equipo.',
      en: "Let's talk about automating your operation with CRM, AI, and integrated systems. 30-minute diagnostic session with our team.",
    },
  })
}

export default function Page() {
  return <AgendarPage />
}
