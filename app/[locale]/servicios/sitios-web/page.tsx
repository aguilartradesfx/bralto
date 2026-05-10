import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import SitiosWebPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/sitios-web', en: '/servicios/sitios-web' },
    titles: {
      es: 'Sitios Web que Convierten — Diseño y Desarrollo',
      en: 'Websites That Convert — Design and Development',
    },
    descriptions: {
      es: 'Sitios web a medida con SEO técnico, performance optimizada y conexión directa a tu CRM. Para negocios que venden, no solo informan.',
      en: 'Custom websites with technical SEO, optimized performance, and direct CRM integration. For businesses that sell, not just inform.',
    },
  })
}

export default function Page() {
  return <SitiosWebPage />
}
