import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import AsesoriaPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/asesoria', en: '/servicios/asesoria' },
    titles: {
      es: 'Asesoría en Infraestructura Digital y Automatización',
      en: 'Advisory on Digital Infrastructure and Automation',
    },
    descriptions: {
      es: 'Sesiones de asesoría con el equipo de Bralto para diseñar tu stack digital, plan de automatización y arquitectura de datos.',
      en: 'Advisory sessions with the Bralto team to design your digital stack, automation roadmap, and data architecture.',
    },
  })
}

export default function Page() {
  return <AsesoriaPage />
}
