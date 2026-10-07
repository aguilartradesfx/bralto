import { getTranslations } from 'next-intl/server'
import { Arrow, Shield } from './icons'
import { SectionHead, type Locale } from './primitives'

// showCommunity: el link a la comunidad aún no tiene URL; se ve solo en dev/preview
export async function Offer({ locale, showCommunity }: { locale: Locale; showCommunity: boolean }) {
  const t = await getTranslations({ locale, namespace: 'Home' })
  const includes = t.raw('offer.includes') as string[]

  return (
    <section id="inversion" className="hm-section hm-section--joined" aria-labelledby="hm-offer-title">
      <div className="hm-wrap">
        <SectionHead center id="hm-offer-title" eyebrow={t('offer.eyebrow')} light={t('offer.titleLight')} bold={t('offer.titleBold')} />

        <div className="hm-offer hm-glass hm-glass--thick hm-rv">
          <span className="hm-offer__from">{t('offer.from')}</span>
          <p className="hm-offer__price">
            <span>{t('offer.price')}</span>
            <span className="hm-offer__currency">{t('offer.currency')}</span>
          </p>
          <span className="hm-offer__fin">{t('offer.financing')}</span>
          <ul className="hm-offer__includes">
            {includes.map((item) => (
              <li key={item} className="hm-inset">
                {item}
              </li>
            ))}
          </ul>
          <a href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
            {t('offer.cta')}
            <Arrow />
          </a>
          {showCommunity && (
            <p className="hm-offer__community">
              {t('offer.communityQuestion')}{' '}
              <a href="#" className="hm-ph" title={t('pending')}>
                {t('offer.communityLink')} →
              </a>
            </p>
          )}
        </div>
      </div>
    </section>
  )
}

export async function Guarantee({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.guarantee' })

  return (
    <section className="hm-section hm-section--tight" aria-labelledby="hm-guarantee-title">
      <div className="hm-wrap">
        <div className="hm-guarantee hm-glass hm-rv">
          <div className="hm-guarantee__seal hm-inset">
            <Shield />
          </div>
          <div>
            <h2 id="hm-guarantee-title" className="hm-guarantee__title">
              {t('title')}
            </h2>
            <p>{t('body')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}
