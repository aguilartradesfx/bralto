import type { Metadata } from 'next'

const BASE_URL = 'https://bralto.io'

type Locale = 'es' | 'en'

type BuildPageMetadataInput = {
  locale: Locale
  /** Path after the locale segment, e.g. '/precios'. Empty string for home. */
  pathByLocale: Record<Locale, string>
  titles: Record<Locale, string>
  descriptions: Record<Locale, string>
  keywords?: Partial<Record<Locale, string[]>>
  /** OG image path relative to domain. Default: '/og-image.jpg'. */
  ogImage?: string
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const { locale, pathByLocale, titles, descriptions, keywords, ogImage = '/og-image.jpg' } = input

  const canonical = `${BASE_URL}/${locale}${pathByLocale[locale]}`
  const alternates = {
    canonical,
    languages: {
      es: `${BASE_URL}/es${pathByLocale.es}`,
      en: `${BASE_URL}/en${pathByLocale.en}`,
      'x-default': `${BASE_URL}/es${pathByLocale.es}`,
    },
  }

  return {
    title: titles[locale],
    description: descriptions[locale],
    keywords: keywords?.[locale],
    alternates,
    openGraph: {
      title: titles[locale],
      description: descriptions[locale],
      url: canonical,
      siteName: 'Bralto',
      type: 'website',
      locale: locale === 'es' ? 'es_LA' : 'en_US',
      images: [{ url: ogImage, width: 1200, height: 630, alt: 'Bralto' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[locale],
      description: descriptions[locale],
      images: [ogImage],
    },
  }
}
