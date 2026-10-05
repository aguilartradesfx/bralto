import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import SitiosWebView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/sitios-web', en: '/servicios/sitios-web' },
    titles: {
      es: 'Sitios Web que Convierten — Diseño y Desarrollo',
      en: 'Websites That Convert — Design and Development',
    },
    descriptions: {
      es: 'Sitios web a medida con SEO técnico, performance optimizada y conexión directa a su CRM. Para negocios que venden, no solo informan.',
      en: 'Custom websites with technical SEO, optimized performance, and direct CRM integration. For businesses that sell, not just inform.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <SitiosWebView locale={locale} />
}
