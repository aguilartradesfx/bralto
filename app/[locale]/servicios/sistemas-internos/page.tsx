import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import SistemasInternosView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/sistemas-internos', en: '/servicios/sistemas-internos' },
    titles: {
      es: 'Sistemas Internos — Dashboards y Operaciones a Medida',
      en: 'Internal Systems — Custom Dashboards and Operations',
    },
    descriptions: {
      es: 'Construimos los sistemas internos que su equipo necesita: dashboards, gestores de pedidos, paneles operativos. Conectados a su stack actual.',
      en: 'We build the internal systems your team needs: dashboards, order managers, operational panels. Connected to your current stack.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <SistemasInternosView locale={locale} />
}
