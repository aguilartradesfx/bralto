import type { Metadata } from 'next'
import { getTranslations } from 'next-intl/server'
import { HomePage } from '@/components/home/home-page'

type Props = { params: Promise<{ locale: string }> }

const BASE_URL = 'https://bralto.io'

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  const t = await getTranslations({ locale, namespace: 'Home.meta' })
  const title = t('title')
  const description = t('description')

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${BASE_URL}/${locale}`,
      languages: { es: `${BASE_URL}/es`, en: `${BASE_URL}/en`, 'x-default': `${BASE_URL}/es` },
    },
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${locale}`,
      siteName: 'Bralto',
      type: 'website',
      locale: locale === 'es' ? 'es_LA' : 'en_US',
      images: [{ url: '/og-image.jpg', width: 1200, height: 630, alt: 'Bralto' }],
    },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-image.jpg'] },
  }
}

export default async function Home({ params }: Props) {
  return <HomePage locale={toLocale((await params).locale)} />
}
