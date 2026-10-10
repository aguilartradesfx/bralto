import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import { FinalCta } from '@/components/home/final-cta'
import { parseBody } from '@/lib/news/body'
import type { NewsRow } from '@/lib/news/types'
import authorPhoto from '../../app/[locale]/sobre-nosotros/alejandro-aguilar.webp'
import { formatNewsDate, localized, type NewsLocale } from './format'
import './news.css'

type Props = { row: NewsRow; locale: NewsLocale; preview: boolean }

// Una nota: firmada por Alejandro, con la fuente enlazada y el aviso de IA al pie
export async function NewsArticle({ row, locale, preview }: Props) {
  const t = await getTranslations({ locale, namespace: 'News' })
  const n = localized(row, locale)
  const date = formatNewsDate(row.publicada_en, locale)

  return (
    <main>
      <section className="hm-hero hm-hero--page hm-hero--fit" aria-labelledby="nw-title">
        <div className="hm-wrap nw-head">
          {preview && (
            <p className="nw-preview hm-glass" role="note">
              {t('preview')}
            </p>
          )}
          <a href={`/${locale}/noticias`} className="nw-back">
            {t('back')}
          </a>
          <p className="hm-eyebrow">{row.tipo === 'articulo' ? t('articleEyebrow') : t('eyebrow')}</p>
          <h1 id="nw-title" className="nw-title">
            {n.titulo}
          </h1>
          <p className="hm-lead">{n.resumen}</p>
          <div className="nw-byline">
            <Image src={authorPhoto} alt="" width={44} height={44} className="nw-byline__photo" />
            <span>
              <a href={`/${locale}/sobre-nosotros`} className="nw-byline__name">
                {t('author')}
              </a>
              <span className="nw-byline__meta">
                {t('role')} · <time dateTime={row.publicada_en}>{t('published', { date })}</time>
              </span>
            </span>
          </div>
        </div>
      </section>

      <section className="hm-section hm-section--tight nw-main" aria-labelledby="nw-title">
        <div className="hm-wrap">
          <figure className="nw-cover">
            <Image src={row.imagen_url} alt={n.imagenAlt} width={1600} height={900} sizes="(min-width: 1200px) 1100px, 100vw" priority />
          </figure>

          <article className="nw-body">
            {parseBody(n.cuerpo).map((block, i) =>
              block.type === 'h2' ? <h2 key={i}>{block.text}</h2> : <p key={i}>{block.text}</p>,
            )}
          </article>

          {row.fuente_url && (
            <aside className="nw-source hm-glass" aria-label={t('source')}>
              <span className="hm-eyebrow">{t('source')}</span>
              <a href={row.fuente_url} target="_blank" rel="noopener">
                {t('readSource', { name: row.fuente_nombre ?? row.fuente_url })}
              </a>
            </aside>
          )}

          <p className="nw-ai">{row.tipo === 'articulo' ? t('aiNoteOwn') : t('aiNote')}</p>
        </div>
      </section>

      <FinalCta locale={locale} />
    </main>
  )
}
