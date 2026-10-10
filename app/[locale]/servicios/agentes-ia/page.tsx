import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import AgentesIaView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/servicios/agentes-ia', en: '/servicios/agentes-ia' },
    titles: {
      es: 'Agentes de IA para WhatsApp, Instagram y su sitio web',
      en: 'AI agents for WhatsApp, Instagram, and your website',
    },
    descriptions: {
      es: 'Agentes de IA entrenados con la información de su negocio que responden en segundos, califican contactos y agendan citas a cualquier hora.',
      en: 'AI agents trained on your business information that reply in seconds, qualify leads, and book meetings at any hour.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <AgentesIaView locale={locale} />
}
