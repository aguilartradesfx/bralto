import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import ProduccionContenidoView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/produccion-contenido', en: '/servicios/produccion-contenido' },
    titles: {
      es: 'Producción de Contenido para Marca y Marketing',
      en: 'Content Production for Brand and Marketing',
    },
    descriptions: {
      es: 'Producción de contenido visual y editorial alineado a la estrategia de su marca. Listo para publicar en redes, web y campañas.',
      en: 'Visual and editorial content production aligned with your brand strategy. Ready to publish across social, web, and campaigns.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <ProduccionContenidoView locale={locale} />
}
