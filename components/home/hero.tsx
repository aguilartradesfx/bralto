import { getTranslations } from 'next-intl/server'
import { Arrow } from './icons'
import { vars, type Locale } from './primitives'

type SystemEvent = { title: string; detail: string; time: string }

export async function Hero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.hero' })
  const events = t.raw('system.events') as SystemEvent[]

  return (
    <section id="inicio" className="hm-hero" aria-labelledby="hm-hero-title">
      <div className="hm-wrap hm-hero__inner">
        {/* El separador queda pegado a la palabra anterior: nunca abre una línea */}
        <p className="hm-eyebrow hm-in">{t('eyebrow').replaceAll(' · ', '\u00a0· ')}</p>
        <h1 id="hm-hero-title" className="hm-hero__title">
          <span className="hm-hero__l1">{t('titleLight')}</span> <span className="hm-hero__l2">{t('titleBold')}</span>
        </h1>

        <div className="hm-hero__row">
          <p className="hm-lead hm-in" style={vars({ d: 2 })}>
            {t('lead')}
          </p>
          <div className="hm-hero__ctas hm-in" style={vars({ d: 3 })}>
            <a href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
              {t('ctaPrimary')}
              <Arrow />
            </a>
            <a href="#como-funciona" className="hm-btn hm-btn--glass hm-glass">
              {t('ctaSecondary')}
            </a>
          </div>
        </div>

        {/* El sistema funcionando: ilustrativo, sin datos de clientes. Animación 100 % CSS. */}
        <figure className="hm-console hm-glass hm-glass--thick hm-in" style={vars({ d: 4 })} aria-label={t('system.label')}>
          <figcaption className="hm-console__head">
            <span>{t('system.title')}</span>
            <span className="hm-live">{t('system.live')}</span>
          </figcaption>
          <ol className="hm-track">
            {events.map((e, i) => (
              <li key={e.title} className="hm-station" data-i={i}>
                <span className="hm-station__node" aria-hidden="true">
                  <i />
                </span>
                {i < events.length - 1 && (
                  <span className="hm-station__seg" aria-hidden="true">
                    <span className="hm-station__lit" />
                    <span className="hm-station__mover">
                      <span className="hm-station__dot" />
                    </span>
                  </span>
                )}
                <div className="hm-station__tile hm-inset">
                  <div className="hm-station__meta">
                    <span>{String(i + 1).padStart(2, '0')}</span>
                    <span>{e.time}</span>
                  </div>
                  <b className="hm-station__title">{e.title}</b>
                  <span className="hm-station__detail">{e.detail}</span>
                </div>
              </li>
            ))}
          </ol>
          <p className="hm-console__note">{t('system.note')}</p>
        </figure>
      </div>
    </section>
  )
}
