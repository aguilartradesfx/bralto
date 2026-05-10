import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import AutomatizacionPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/automatizacion', en: '/servicios/automatizacion' },
    titles: {
      es: 'Automatización de Procesos con IA y Workflows',
      en: 'Process Automation with AI and Workflows',
    },
    descriptions: {
      es: 'Automatizamos ventas, atención al cliente y operaciones internas con agentes de IA, CRM y workflows integrados.',
      en: 'We automate sales, customer service, and internal operations with AI agents, CRM, and integrated workflows.',
    },
  })
}

export default function Page() {
  return <AutomatizacionPage />
}
