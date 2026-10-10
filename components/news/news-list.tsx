import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { FinalCta } from '@/components/home/final-cta'
import type { NewsRow } from '@/lib/news/types'
import { formatNewsDate, localized, type NewsLocale } from './format'
import './news.css'

type Props = { locale: NewsLocale; items: NewsRow[]; page: number; hasMore: boolean }

// /noticias: la última nota primero, 24 por página
export async function NewsList({ locale, items, page, hasMore }: Props) {
  const t = await getTranslations({ locale, namespace: 'News' })
  const base = `/${locale}/noticias`

  return (
    <main>
      <section className="hm-hero hm-hero--page" aria-labelledby="nw-list-title">
        <div className="hm-wrap">
          <p className="hm-eyebrow">{t('eyebrow')}</p>
          <h1 id="nw-list-title" className="hm-page-title">
            <span className="hm-hero__l1">{t('titleLight')}</span>{' '}
            <span className="hm-hero__l2">{t('titleBold')}</span>
          </h1>
          <p className="hm-lead">{t('lead')}</p>
        </div>
      </section>

      <section className="hm-section hm-section--tight" aria-labelledby="nw-list-title">
        <div className="hm-wrap">
          {items.length === 0 ? (
            <p className="nw-empty">{t('empty')}</p>
          ) : (
            <ul className="nw-grid">
              {items.map((row, i) => {
                const n = localized(row, locale)
                return (
                  <li key={row.id}>
                    <a href={`${base}/${row.slug}`} className="nw-card hm-glass">
                      <Image
                        src={row.imagen_url}
                        alt={n.imagenAlt}
                        width={1600}
                        height={900}
                        sizes="(min-width: 1100px) 33vw, (min-width: 700px) 50vw, 100vw"
                        priority={page === 1 && i < 3}
                      />
                      <span className="nw-card__text">
                        <time className="nw-date" dateTime={row.publicada_en}>
                          {formatNewsDate(row.publicada_en, locale)}
                        </time>
                        <h2 className="nw-card__title">{n.titulo}</h2>
                        <span className="nw-card__lead">{n.resumen}</span>
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          )}

          {(page > 1 || hasMore) && (
            <nav className="nw-pager" aria-label={t('eyebrow')}>
              {page > 1 ? <a href={page === 2 ? base : `${base}?p=${page - 1}`}>{t('newer')}</a> : <span />}
              {hasMore && <a href={`${base}?p=${page + 1}`}>{t('older')}</a>}
            </nav>
          )}
        </div>
      </section>

      <FinalCta locale={locale} />
    </main>
  )
}
