import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import PreciosPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/precios', en: '/precios' },
    titles: {
      es: 'Precios — Plataforma e Implementación Integral',
      en: 'Pricing — Platform and Full-Service Implementation',
    },
    descriptions: {
      es: 'Plataforma desde $87/mes o implementación integral desde $849. CRM, automatización, IA y más en un solo sistema.',
      en: 'Platform starting at $87/mo or full-service implementation from $849. CRM, automation, AI, and more in a single system.',
    },
  })
}

export default function Page() {
  return <PreciosPage />
}
