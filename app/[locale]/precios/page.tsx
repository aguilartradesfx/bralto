import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import PreciosView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/precios', en: '/precios' },
    titles: {
      es: 'Servicios: sitios web, automatización con IA y sistemas a la medida',
      en: 'Services: Websites, AI automation, and custom systems',
    },
    descriptions: {
      es: 'Sitios web, contenido, campañas, automatización con IA y sistemas internos. Cada proyecto se cotiza a la medida después de un diagnóstico de 30 minutos.',
      en: 'Websites, content, ad campaigns, AI automation, and internal systems. Every project is custom-quoted after a 30-minute diagnostic call.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <PreciosView locale={locale} />
}
