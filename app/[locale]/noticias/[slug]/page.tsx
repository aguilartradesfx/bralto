import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { setRequestLocale } from 'next-intl/server'
import { localized } from '@/components/news/format'
import { NewsArticle } from '@/components/news/news-article'
import { NewsArticleJsonLd } from '@/components/seo/JsonLd'
import { verifyNewsToken } from '@/lib/news/links'
import { getAnyBySlug, getPublished } from '@/lib/news/store'
import { SITE_URL, buildPageMetadata } from '@/lib/seo'

// Se arma en cada visita: una nota oculta da 404 al instante
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ vista?: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

// La nota publicada, o la oculta si el link del correo trae su token de vista previa
const load = cache(async (slug: string, vista?: string) => {
  if (vista) {
    const row = await getAnyBySlug(slug)
    if (row && verifyNewsToken(process.env.NEWS_LINK_SECRET ?? '', row.id, 'ver', vista))
      return { row, preview: row.estado !== 'publicada' }
  }
  const row = await getPublished(slug)
  return row ? { row, preview: false } : null
})

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = toLocale(raw)
  const data = await load(slug, (await searchParams).vista)
  if (!data) return {}
  const { row, preview } = data
  const es = localized(row, 'es')
  const en = localized(row, 'en')
  const alt = locale === 'es' ? es.imagenAlt : en.imagenAlt
  const base = buildPageMetadata({
    locale,
    pathByLocale: { es: `/noticias/${slug}`, en: `/noticias/${slug}` },
    titles: { es: es.titulo, en: en.titulo },
    descriptions: { es: es.resumen, en: en.resumen },
    ogImage: row.imagen_url,
  })
  return {
    ...base,
    openGraph: {
      ...base.openGraph,
      type: 'article',
      publishedTime: row.publicada_en,
      modifiedTime: row.actualizada_en,
      authors: ['Alejandro Aguilar'],
      images: [{ url: row.imagen_url, width: 1600, height: 900, alt }],
    },
    twitter: { ...base.twitter, images: [row.imagen_url] },
    ...(preview ? { robots: { index: false, follow: false } } : {}),
  }
}

export default async function NoticiaPage({ params, searchParams }: Props) {
  const { locale: raw, slug } = await params
  const locale = toLocale(raw)
  setRequestLocale(locale)
  const data = await load(slug, (await searchParams).vista)
  if (!data) notFound()
  const { row, preview } = data
  const n = localized(row, locale)

  return (
    <>
      {!preview && (
        <NewsArticleJsonLd
          url={`${SITE_URL}/${locale}/noticias/${row.slug}`}
          headline={n.titulo}
          description={n.resumen}
          image={row.imagen_url}
          datePublished={row.publicada_en}
          dateModified={row.actualizada_en}
          inLanguage={locale}
          sourceUrl={row.fuente_url}
        />
      )}
      <NewsArticle row={row} locale={locale} preview={preview} />
    </>
  )
}
