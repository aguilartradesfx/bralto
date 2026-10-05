import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import AsesoriaView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/asesoria', en: '/servicios/asesoria' },
    titles: {
      es: 'Asesoría en Infraestructura Digital y Automatización',
      en: 'Advisory on Digital Infrastructure and Automation',
    },
    descriptions: {
      es: 'Sesiones de asesoría con el equipo de Bralto para diseñar su stack digital, plan de automatización y arquitectura de datos.',
      en: 'Advisory sessions with the Bralto team to design your digital stack, automation roadmap, and data architecture.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <AsesoriaView locale={locale} />
}
