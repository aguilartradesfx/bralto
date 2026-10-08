import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { cn } from '@/lib/utils'
import { FinalCta } from '@/components/home/final-cta'
import { Arrow } from '@/components/home/icons'
import type { Locale } from '@/components/home/primitives'
import { serviceHref, type MegaGroup } from '@/components/home/services'
import '@/components/home/pages.css'

// Sin montos: cada servicio se cotiza a la medida después del diagnóstico
export default async function PreciosView({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'PreciosPage' })
  const nav = await getTranslations({ locale, namespace: 'Home.nav' })
  const groups = nav.raw('groups') as MegaGroup[]

  return (
    <main>
      <section className="hm-hero hm-hero--page" aria-labelledby="pr-title">
        <div className="hm-wrap">
          <p className="hm-eyebrow hm-in">{t('eyebrow')}</p>
          <h1 id="pr-title" className="hm-page-title">
            <span className="hm-hero__l1">{t('headline')}</span> <span className="hm-hero__l2">{t('headlineItalic')}</span>
          </h1>
          <p className="hm-lead hm-in">{t('desc')}</p>
        </div>
      </section>

      {groups.map((group, gi) => (
        <section
          key={group.heading}
          className={cn('hm-section pr-group', group.items.length === 3 && 'pr-group--3')}
          aria-labelledby={`pr-group-${gi}`}
        >
          <div className="hm-wrap">
            <h2 id={`pr-group-${gi}`} className="hm-subtitle">
              {group.heading}
            </h2>
            <ul className="pr-list">
              {group.items.map((item) => (
                <li key={item.key}>
                  <Link href={serviceHref(locale, item.key)} className="pr-card hm-glass hm-rv">
                    <span className="pg-tag">{item.key === 'funnelLab' ? t('free') : t('custom')}</span>
                    <h3>{item.label}</h3>
                    <p>{t(`services.${item.key}.desc`)}</p>
                    <span className="pr-card__go">
                      {t('viewDetails')}
                      <Arrow />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ))}

      <FinalCta locale={locale} title={{ light: t('ctaLight'), bold: t('ctaBold') }} />
    </main>
  )
}
