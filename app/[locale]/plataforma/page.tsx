import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo'
import PlataformaPage from './_view'

type Props = { params: Promise<{ locale: 'es' | 'en' }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  return buildPageMetadata({
    locale,
    pathByLocale: { es: '/plataforma', en: '/plataforma' },
    titles: {
      es: 'La Plataforma Bralto — Todo tu negocio por $87/mes',
      en: 'The Bralto Platform — Your whole business for $87/mo',
    },
    descriptions: {
      es: 'CRM, sitios web, funnels, agenda, pagos y marketing multicanal en una sola plataforma por $87/mes. Reemplaza más de 10 herramientas. 14 días gratis.',
      en: 'CRM, websites, funnels, scheduling, payments and multichannel marketing in one platform for $87/mo. Replaces 10+ tools. 14 days free.',
    },
  })
}

export default function Page() {
  return <PlataformaPage />
}
