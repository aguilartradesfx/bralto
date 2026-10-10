import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { FinalCta } from '@/components/home/final-cta'
import { Arrow } from '@/components/home/icons'
import type { Locale } from '@/components/home/primitives'
import { serviceHref, type MegaGroup } from '@/components/home/services'
import '@/components/home/pages.css'

// Índice de servicios (/servicios; /precios redirige aquí). Sin montos: cada servicio se cotiza
// a la medida después del diagnóstico, y eso se dice una vez arriba, no en cada fila
export default async function ServiciosView({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'PreciosPage' })
  const nav = await getTranslations({ locale, namespace: 'Home.nav' })
  const groups = nav.raw('groups') as MegaGroup[]

  return (
    <main>
      <section className="hm-hero hm-hero--page" aria-labelledby="si-title">
        <div className="hm-wrap">
          <p className="hm-eyebrow hm-in">{t('eyebrow')}</p>
          <h1 id="si-title" className="hm-page-title">
            <span className="hm-hero__l1">{t('headline')}</span> <span className="hm-hero__l2">{t('headlineItalic')}</span>
          </h1>
          <p className="hm-lead hm-in">{t('desc')}</p>
        </div>
      </section>

      {groups.map((group, gi) => (
        <section key={group.heading} className="hm-section si-group" aria-labelledby={`si-group-${gi}`}>
          <div className="hm-wrap">
            <h2 id={`si-group-${gi}`} className="hm-subtitle">
              {group.heading}
            </h2>
            {/* Filas, no tarjetas: "Ver detalles" queda en la misma columna en todas */}
            <ul className="si-list">
              {group.items.map((item) => (
                <li key={item.key}>
                  <Link href={serviceHref(locale, item.key)} className="si-row hm-rv">
                    <div className="si-row__name">
                      <h3>{item.label}</h3>
                      {item.key === 'funnelLab' && <span className="pg-tag">{t('free')}</span>}
                    </div>
                    <p className="si-row__desc">{t(`services.${item.key}.desc`)}</p>
                    <span className="si-row__go">
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
