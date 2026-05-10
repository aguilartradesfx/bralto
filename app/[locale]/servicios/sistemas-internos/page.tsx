import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import SistemasInternosPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/sistemas-internos', en: '/servicios/sistemas-internos' },
    titles: {
      es: 'Sistemas Internos — Dashboards y Operaciones a Medida',
      en: 'Internal Systems — Custom Dashboards and Operations',
    },
    descriptions: {
      es: 'Construimos los sistemas internos que tu equipo necesita: dashboards, gestores de pedidos, paneles operativos. Conectados a tu stack actual.',
      en: 'We build the internal systems your team needs: dashboards, order managers, operational panels. Connected to your current stack.',
    },
  })
}

export default function Page() {
  return <SistemasInternosPage />
}
