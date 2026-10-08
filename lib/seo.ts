import type { Metadata } from 'next'

// Dominio que sirve el sitio: bralto.io (sin www) responde 307 hacia aquí, así que los
// canonical, el sitemap y los datos estructurados usan este
export const SITE_URL = 'https://www.bralto.io'

type Locale = 'es' | 'en'

type BuildPageMetadataInput = {
  locale: Locale
  /** Path after the locale segment, e.g. '/servicios'. Empty string for home. */
  pathByLocale: Record<Locale, string>
  titles: Record<Locale, string>
  descriptions: Record<Locale, string>
  keywords?: Partial<Record<Locale, string[]>>
  /** OG image path relative to domain. Default: '/og-image.jpg'. */
  ogImage?: string
}

export function buildPageMetadata(input: BuildPageMetadataInput): Metadata {
  const { locale, pathByLocale, titles, descriptions, keywords, ogImage = '/og-image.jpg' } = input

  const canonical = `${SITE_URL}/${locale}${pathByLocale[locale]}`
  const alternates = {
    canonical,
    languages: {
      es: `${SITE_URL}/es${pathByLocale.es}`,
      en: `${SITE_URL}/en${pathByLocale.en}`,
      'x-default': `${SITE_URL}/es${pathByLocale.es}`,
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
