import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import ProduccionContenidoPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/produccion-contenido', en: '/servicios/produccion-contenido' },
    titles: {
      es: 'Producción de Contenido para Marca y Marketing',
      en: 'Content Production for Brand and Marketing',
    },
    descriptions: {
      es: 'Producción de contenido visual y editorial alineado a la estrategia de tu marca. Listo para publicar en redes, web y campañas.',
      en: 'Visual and editorial content production aligned with your brand strategy. Ready to publish across social, web, and campaigns.',
    },
  })
}

export default function Page() {
  return <ProduccionContenidoPage />
}
