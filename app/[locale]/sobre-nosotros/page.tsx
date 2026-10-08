import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import SobreNosotrosView from './_view'
import { buildPageMetadata } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  const [es, en] = await Promise.all([
    getTranslations({ locale: 'es', namespace: 'AboutPage.meta' }),
    getTranslations({ locale: 'en', namespace: 'AboutPage.meta' }),
  ])
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/sobre-nosotros', en: '/sobre-nosotros' },
    titles: { es: es('title'), en: en('title') },
    descriptions: { es: es('description'), en: en('description') },
  })
}

export default async function SobreNosotrosPage({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <SobreNosotrosView locale={locale} />
}
