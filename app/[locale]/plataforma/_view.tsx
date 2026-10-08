import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FaqBlock, type FaqItem } from '@/components/home/faq'
import { FinalCta } from '@/components/home/final-cta'
import { Arrow, Check } from '@/components/home/icons'
import { Receipt } from '@/components/home/platform'
import { SectionHead, type Locale } from '@/components/home/primitives'
import '@/components/home/pages.css'

// La plataforma viene incluida en cada sistema (el plan suelto de $87 se eliminó el 2026-10-07).
// El catálogo de funciones vive en PlatformSection (fuente única).
const CATEGORIES = ['organizacion', 'sitios', 'multicanal'] as const

export default async function PlataformaView({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'PlataformaPage' })
  const pt = await getTranslations({ locale, namespace: 'PlatformSection' })

  return (
    <main>
      <section className="hm-hero hm-hero--page" aria-labelledby="pf-title">
        <div className="hm-wrap">
          <p className="hm-eyebrow hm-in">
            {t('badge')} · {t('badgeSub')}
          </p>
          <h1 id="pf-title" className="hm-page-title">
            <span className="hm-hero__l1">{t('headline')}</span> <span className="hm-hero__l2">{t('headlineItalic')}</span>
          </h1>
          <div className="pf-hero__row">
            <p className="hm-lead hm-in">{t('desc')}</p>
            <Link href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
              {t('cta')}
              <Arrow />
            </Link>
          </div>
        </div>
      </section>

      <section className="hm-section hm-section--tight" aria-labelledby="pf-includes-title">
        <div className="hm-wrap">
          <SectionHead compact id="pf-includes-title" light={t('includesLight')} bold={t('includesBold')} />
          <p className="hm-lead pf-sub">{t('includesDesc')}</p>
          <div className="pf-cats hm-glass hm-glass--thick hm-rv">
            {CATEGORIES.map((id) => (
              <div key={id} className="pf-cat">
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
            <SectionHead id="pf-replaces-title" light={t('replacesLight')} bold={t('replacesBold')} />
            <p className="hm-lead hm-rv">{t('replacesDesc')}</p>
          </div>
          <Receipt locale={locale} />
        </div>
      </section>

      <FaqBlock
        titleId="pf-faq-title"
        light={t('faqLight')}
        bold={t('faqBold')}
        items={t.raw('faq') as FaqItem[]}
      />

      <FinalCta locale={locale} />
    </main>
  )
}
