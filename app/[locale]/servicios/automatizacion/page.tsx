import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import AutomatizacionView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/automatizacion', en: '/servicios/automatizacion' },
    titles: {
      es: 'Automatización de procesos con IA y workflows',
      en: 'Process automation with AI and workflows',
    },
    descriptions: {
      es: 'Automatizamos ventas, atención al cliente y operaciones internas con agentes de IA, CRM y workflows integrados.',
      en: 'We automate sales, customer service, and internal operations with AI agents, CRM, and integrated workflows.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <AutomatizacionView locale={locale} />
}
