import Link from 'next/link'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { FaqBlock, type FaqItem } from './faq'
import { FinalCta } from './final-cta'
import { Arrow, Check } from './icons'
import { SectionHead, type Locale } from './primitives'
import { serviceHref, type MegaGroup } from './services'
import './service.css'

export type ServiceCopy = {
  badge: string
  headline: string
  headlineBold: string
  sub: string
  stats: [value: string, label: string][]
  features: { t: string; d: string }[]
  steps: { t: string; d: string }[]
  faqs: FaqItem[]
  ctaHeadline: string
  ctaBold: string
}

type Props = {
  locale: Locale
  /** Clave del servicio en Home.nav.groups (para "Otros servicios") */
  service: string
  copy: ServiceCopy
  /** La pieza única de cada servicio, entre el hero y "Qué incluye" */
  children: ReactNode
}

// Plantilla de las páginas de servicio, con el mismo lenguaje del home y /casos
export async function ServicePage({ locale, service, copy, children }: Props) {
  const t = await getTranslations({ locale, namespace: 'Home.servicePage' })

  return (
    <main className="sv">
      <section className="hm-hero hm-hero--page" aria-labelledby="sv-title">
        <div className="hm-wrap">
          <p className="hm-eyebrow hm-in">{copy.badge}</p>
          <h1 id="sv-title" className="hm-page-title">
            <span className="hm-hero__l1">{copy.headline}</span> <span className="hm-hero__l2">{copy.headlineBold}</span>
          </h1>
          <div className="sv-hero__row">
            <p className="hm-lead hm-in">{copy.sub}</p>
            <div className="hm-hero__ctas">
              <Link href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
                {t('cta')}
                <Arrow />
              </Link>
              <Link href={`/${locale}/precios`} className="hm-btn hm-btn--glass hm-glass">
                {t('all')}
              </Link>
            </div>
          </div>
          <dl className="sv-specs hm-glass">
            {copy.stats.map(([value, label]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {children}

      <section className="hm-section" aria-labelledby="sv-features-title">
        <div className="hm-wrap">
          <SectionHead
            id="sv-features-title"
            light={t('featuresLight')}
            bold={t('featuresBold')}
          />
          <ul className="sv-features hm-glass hm-glass--thick hm-rv">
            {copy.features.map((f) => (
              <li key={f.t}>
                <Check className="sv-features__check" />
                <h3>{f.t}</h3>
                <p>{f.d}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="hm-section" aria-labelledby="sv-process-title">
        <div className="hm-wrap">
          <SectionHead
            id="sv-process-title"
            eyebrow={t('processEyebrow')}
            light={t('processLight')}
            bold={t('processBold')}
          />
          <ol className="sv-steps">
            {copy.steps.map((s, i) => (
              <li key={s.t} className="sv-step hm-rv">
                <span className="sv-step__n" aria-hidden="true">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <FaqBlock
        titleId="sv-faq-title"
        light={t('faqLight')}
        bold={t('faqBold')}
        items={copy.faqs}
      />

      <RelatedServices locale={locale} current={service} label={t('related')} />

      <FinalCta locale={locale} title={{ light: copy.ctaHeadline, bold: copy.ctaBold }} />
    </main>
  )
}

// Primero los servicios del mismo grupo del megamenú, luego los del otro
async function RelatedServices({ locale, current, label }: { locale: Locale; current: string; label: string }) {
  const t = await getTranslations({ locale, namespace: 'Home.nav' })
  const groups = t.raw('groups') as MegaGroup[]
  const own = groups.find((g) => g.items.some((item) => item.key === current))
  const pool = [...(own?.items ?? []), ...groups.filter((g) => g !== own).flatMap((g) => g.items)]
  const related = pool.filter((item) => item.key !== current).slice(0, 3)

  return (
    <section className="hm-section sv-related" aria-labelledby="sv-related-title">
      <div className="hm-wrap">
        <h2 id="sv-related-title" className="hm-subtitle">
          {label}
        </h2>
        <ul className="sv-related__list">
          {related.map((item) => (
            <li key={item.key}>
              <Link href={serviceHref(locale, item.key)} className="sv-related__card hm-glass hm-rv">
                <span className="sv-related__label">{item.label}</span>
                <span className="sv-related__desc">{item.desc}</span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/** Encabezado + cuerpo de la pieza única de un servicio (va pegada al hero: sin eyebrow) */
export function Showcase({
  id,
  light,
  bold,
  children,
}: {
  id: string
  light: string
  bold: string
  children: ReactNode
}) {
  return (
    <section className="hm-section" aria-labelledby={id}>
      <div className="hm-wrap">
        <SectionHead id={id} light={light} bold={bold} />
        {children}
      </div>
    </section>
  )
}
