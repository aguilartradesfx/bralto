import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import CampanasView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/campanas', en: '/servicios/campanas' },
    titles: {
      es: 'Campañas de Marketing Digital: Meta, Google, LinkedIn',
      en: 'Digital Marketing Campaigns: Meta, Google, LinkedIn',
    },
    descriptions: {
      es: 'Campañas pagadas con tracking real, segmentación accionable y reportes claros. Conectadas directo a su CRM para medir cierres, no solo clicks.',
      en: 'Paid campaigns with real tracking, actionable segmentation, and clear reporting. Connected directly to your CRM to measure closes, not just clicks.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <CampanasView locale={locale} />
}
