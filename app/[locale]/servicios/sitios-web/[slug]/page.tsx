import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { clients } from '@/app/servicios/sitios-web/clients'
import { cn } from '@/lib/utils'
import { buildPageMetadata } from '@/lib/seo'
import { CaseRow } from '@/components/home/case-row'
import { FinalCta } from '@/components/home/final-cta'
import { Arrow, Check } from '@/components/home/icons'
import '@/components/home/pages.css'

type Props = { params: Promise<{ locale: string; slug: string }> }

const toLocale = (locale: string) => (locale === 'en' ? 'en' : 'es')

const COPY = {
  es: {
    back: 'Casos',
    live: 'Ver sitio en vivo',
    project: 'El proyecto',
    built: 'Lo que construimos',
    gallery: 'Galería',
    more: 'Más casos',
    ctaLight: 'Su proyecto,',
    ctaBold: 'el próximo.',
  },
  en: {
    back: 'Case studies',
    live: 'Visit the live site',
    project: 'The project',
    built: 'What we built',
    gallery: 'Gallery',
    more: 'More case studies',
    ctaLight: 'Your project,',
    ctaBold: 'could be next.',
  },
}

export function generateStaticParams() {
  return ['es', 'en'].flatMap((locale) => clients.map((c) => ({ locale, slug: c.id })))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale: raw, slug } = await params
  const locale = toLocale(raw)
  const client = clients.find((c) => c.id === slug)
  if (!client) return {}
  const path = `/servicios/sitios-web/${client.id}`
  return buildPageMetadata({
    locale,
    pathByLocale: { es: path, en: path },
    titles: { es: `${client.name}: ${client.industry.charAt(0).toLowerCase()}${client.industry.slice(1)}`, en: `${client.name}: ${client.en?.industry ?? client.industry}` },
    descriptions: { es: client.tagline, en: client.en?.tagline ?? client.tagline },
    ogImage: client.coverImage,
  })
}

// Un caso real: historia, lo que construimos, galería y más casos
export default async function CasePage({ params }: Props) {
  const { locale: raw, slug } = await params
  const locale = toLocale(raw)
  setRequestLocale(locale)
  const client = clients.find((c) => c.id === slug)
  if (!client) notFound()

  const c = COPY[locale]
  const t = await getTranslations({ locale, namespace: 'Home.cases' })
  const en = locale === 'en' ? client.en : undefined
  const industry = en?.industry ?? client.industry
  const tagline = en?.tagline ?? client.tagline
  const story = en?.story ?? client.story
  const deliverables = en?.deliverables ?? client.deliverables
  const coverAlt = en?.coverAlt ?? client.coverAlt
  const imageAlts = en?.imageAlts ?? client.imageAlts
  // La portada ya va arriba: la galería no la repite
  const gallery = client.images.filter((img) => img !== client.coverImage)
  const others = clients.filter((o) => o.id !== client.id)

  return (
    <main>
      <section className="hm-hero hm-hero--page" aria-labelledby="cs-title">
        <div className="hm-wrap">
          <Link href={`/${locale}/casos`} className="cs-back">
            <Arrow />
            {c.back}
          </Link>
          <p className="hm-eyebrow hm-in">{industry}</p>
          <h1 id="cs-title" className="hm-page-title">
            <span className="hm-hero__l2">{client.name}</span>
          </h1>
          <div className="cs-hero__row">
            <p className="hm-lead hm-in">{tagline}</p>
            {client.url && (
              <a href={client.url} target="_blank" rel="noopener noreferrer" className="hm-btn hm-btn--glass hm-glass">
                {c.live}
                <Arrow />
              </a>
            )}
          </div>
          <figure className="cs-cover hm-glass hm-glass--thick">
            <div className="cs-cover__img">
              <Image src={client.coverImage} alt={coverAlt} fill priority sizes="(min-width: 1200px) 1160px, 100vw" />
            </div>
          </figure>
        </div>
      </section>

      <section className="hm-section" aria-labelledby="cs-project-title">
        <div className="hm-wrap cs-story">
          <div>
            <h2 id="cs-project-title" className="hm-subtitle">
              {c.project}
            </h2>
            <p className="cs-story__text">{story}</p>
          </div>
          <div className="cs-built hm-glass hm-glass--thick hm-rv">
            <h3 className="pg-tag">{c.built}</h3>
            <ul>
              {deliverables.map((d) => (
                <li key={d}>
                  <Check />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {gallery.length > 0 && (
        <section className="hm-section hm-section--tight" aria-label={c.gallery}>
          <div className="hm-wrap">
            <ul className="cs-gallery">
              {gallery.map((img, i) => (
                <li key={img} className={cn('cs-shot hm-glass hm-rv', i % 3 === 0 && 'cs-shot--wide')}>
                  <div className="cs-shot__img">
                    <Image
                      src={img}
                      alt={imageAlts[client.images.indexOf(img)]}
                      fill
                      sizes={i % 3 === 0 ? '(min-width: 1200px) 1160px, 100vw' : '(min-width: 900px) 580px, 100vw'}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <section className="hm-section" aria-labelledby="cs-more-title">
        <div className="hm-wrap">
          <h2 id="cs-more-title" className="hm-subtitle">
            {c.more}
          </h2>
          <ul className="hm-cases">
            {others.map((other) => (
              <li key={other.id}>
                <CaseRow client={other} locale={locale} viewLabel={t('view')} />
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FinalCta locale={locale} title={{ light: c.ctaLight, bold: c.ctaBold }} />
    </main>
  )
}
