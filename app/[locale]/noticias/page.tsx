import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { NewsList } from '@/components/news/news-list'
import { listPublished } from '@/lib/news/store'
import { buildPageMetadata } from '@/lib/seo'

// Se arma en cada visita: una nota oculta desaparece al instante
export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ p?: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')
const toPage = (p?: string) => Math.max(1, Number.parseInt(p ?? '1', 10) || 1)

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const locale = toLocale((await params).locale)
  const page = toPage((await searchParams).p)
  const [es, en] = await Promise.all([
    getTranslations({ locale: 'es', namespace: 'News.meta' }),
    getTranslations({ locale: 'en', namespace: 'News.meta' }),
  ])
  const meta = buildPageMetadata({
    locale,
    pathByLocale: { es: '/noticias', en: '/noticias' },
    titles: { es: es('title'), en: en('title') },
    descriptions: { es: es('description'), en: en('description') },
  })
  // Las páginas anteriores no compiten con la primera en los buscadores
  return page > 1 ? { ...meta, robots: { index: false, follow: true } } : meta
}

export default async function NoticiasPage({ params, searchParams }: Props) {
  const locale = toLocale((await params).locale)
  setRequestLocale(locale)
  const page = toPage((await searchParams).p)
  const { items, hasMore } = await listPublished(page)
  if (page > 1 && items.length === 0) notFound()
  return <NewsList locale={locale} items={items} page={page} hasMore={hasMore} />
}
