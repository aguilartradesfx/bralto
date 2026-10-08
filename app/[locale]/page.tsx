import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { HomePage } from '@/components/home/home-page'
import { SITE_URL } from '@/lib/seo'

type Props = { params: Promise<{ locale: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

// Prerenderizado estático: HTML desde el caché y metadata en el <head> para cualquier visitante
export function generateStaticParams() {
  return [{ locale: 'es' }, { locale: 'en' }]
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  const t = await getTranslations({ locale, namespace: 'Home.meta' })
  const title = t('title')
  const description = t('description')

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}`,
      languages: { es: `${SITE_URL}/es`, en: `${SITE_URL}/en`, 'x-default': `${SITE_URL}/es` },
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${locale}`,
      siteName: 'Bralto',
      type: 'website',
      locale: locale === 'es' ? 'es_LA' : 'en_US',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Bralto' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.jpg'] },
  }
}

export default async function Home({ params }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  return <HomePage locale={locale} />
}
