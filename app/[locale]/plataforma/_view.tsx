import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FaqBlock, type FaqItem } from '@/components/home/faq'
import { Arrow, Check } from '@/components/home/icons'
import { Receipt } from '@/components/home/platform'
import { SectionHead, type Locale } from '@/components/home/primitives'
import { TrialButton } from '@/components/home/trial-button'
import '@/components/home/pages.css'

// El catálogo de funciones vive en PlatformSection (fuente única)
const CATEGORIES = ['organizacion', 'sitios', 'multicanal'] as const

export default async function PlataformaView({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'PlataformaPage' })
  const pt = await getTranslations({ locale, namespace: 'PlatformSection' })
  const details = t.raw('details') as { title: string; desc: string }[]
  const trial = { locale, redirecting: t('redirecting'), error: t('error') }

  return (
    <main>
      <section className="hm-hero hm-hero--page" aria-labelledby="pf-title">
        <div className="hm-wrap pf-hero">
          <div>
            <p className="hm-eyebrow hm-in">
              {t('badge')} · {t('badgeSub')}
            </p>
            <h1 id="pf-title" className="hm-page-title">
              <span className="hm-hero__l1">{t('headline')}</span> <span className="hm-hero__l2">{t('headlineItalic')}</span>
            </h1>
            <p className="hm-lead hm-in">{t('desc')}</p>
          </div>

          <div className="pf-price hm-glass hm-glass--thick hm-in">
            <span className="pf-price__from">{t('priceLabel')}</span>
            <p className="pf-price__amount">
              <span>{t('price')}</span>
              <span className="pf-price__period">{t('period')}</span>
            </p>
            <p className="pf-price__note">{t('priceNote')}</p>
            <TrialButton {...trial} label={t('ctaPrimary')} />
            <Link href={`/${locale}/agendar`} className="pf-price__alt">
              {t('ctaSecondary')}
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      <section className="hm-section" aria-labelledby="pf-includes-title">
        <div className="hm-wrap">
          <SectionHead compact id="pf-includes-title" eyebrow={t('includesLabel')} light={t('includesLight')} bold={t('includesBold')} />
          <p className="hm-lead pf-sub">{t('includesDesc')}</p>
          <div className="pf-cats">
            {CATEGORIES.map((id) => (
              <div key={id} className="pf-cat hm-glass hm-rv">
                <h3>{pt(`tabs.${id}.label`)}</h3>
                <ul>
                  {(pt.raw(`tabs.${id}.features`) as string[]).map((feature) => (
                    <li key={feature}>
                      <Check />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="hm-section" aria-labelledby="pf-replaces-title">
        <div className="hm-wrap hm-platform">
          <div className="hm-platform__copy">
            <SectionHead id="pf-replaces-title" eyebrow={t('replacesLabel')} light={t('replacesLight')} bold={t('replacesBold')} />
            <p className="hm-lead hm-rv">{t('replacesDesc')}</p>
          </div>
          <Receipt locale={locale} included={t('withLabel')} />
        </div>
      </section>

      <section className="hm-section" aria-labelledby="pf-details-title">
        <div className="hm-wrap">
          <SectionHead id="pf-details-title" eyebrow={t('detailsLabel')} light={t('detailsLight')} bold={t('detailsBold')} />
          <ul className="pg-checks pf-details hm-glass hm-glass--thick hm-rv">
            {details.map((d) => (
              <li key={d.title}>
                <Check />
                <h3>{d.title}</h3>
                <p>{d.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <FaqBlock
        titleId="pf-faq-title"
        eyebrow={t('faqLabel')}
        light={t('faqLight')}
        bold={t('faqBold')}
        items={t.raw('faq') as FaqItem[]}
      />

      <section className="hm-section hm-section--last" aria-labelledby="pf-final-title">
        <div className="hm-wrap hm-final-wrap">
          <div className="hm-final__pool" aria-hidden="true" />
          <div className="hm-final hm-glass hm-glass--thick hm-rv">
            <p className="hm-eyebrow">{t('finalLabel')}</p>
            <h2 id="pf-final-title" className="hm-h2">
              <span>{t('finalHeadline')}</span> <span className="b">{t('finalHeadlineItalic')}</span>
            </h2>
            <p className="hm-lead">{t('finalDesc')}</p>
            <div className="pf-final__ctas">
              <TrialButton {...trial} label={t('finalCtaPrimary')} />
              <Link href={`/${locale}/agendar`} className="hm-btn hm-btn--glass hm-glass">
                {t('finalCtaSecondary')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
