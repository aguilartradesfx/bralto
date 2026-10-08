import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'
import { buildPageMetadata } from '@/lib/seo'
import PlataformaView from './_view'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/plataforma', en: '/plataforma' },
    titles: {
      es: 'La Plataforma Bralto: todo su negocio en una sola plataforma',
      en: 'The Bralto Platform: Your whole business in one platform',
    },
    descriptions: {
      es: 'CRM, sitios web, funnels, agenda, pagos y marketing multicanal en una sola plataforma, incluida en cada sistema que construimos. Reemplaza más de 10 herramientas.',
      en: 'CRM, websites, funnels, scheduling, payments and multichannel marketing in one platform, included with every system we build. Replaces 10+ tools.',
    },
  })
}

export default async function Page({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <PlataformaView locale={locale} />
}
