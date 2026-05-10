import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import CampanasPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/campanas', en: '/servicios/campanas' },
    titles: {
      es: 'Campañas de Marketing Digital — Meta, Google, LinkedIn',
      en: 'Digital Marketing Campaigns — Meta, Google, LinkedIn',
    },
    descriptions: {
      es: 'Campañas pagadas con tracking real, segmentación accionable y reportes claros. Conectadas directo a tu CRM para medir cierres, no solo clicks.',
      en: 'Paid campaigns with real tracking, actionable segmentation, and clear reporting. Connected directly to your CRM to measure closes, not just clicks.',
    },
  })
}

export default function Page() {
  return <CampanasPage />
}
