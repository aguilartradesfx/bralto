import { getTranslations } from 'next-intl/server'
import { Arrow, Check, Shield } from './icons'
import { SectionHead, type Locale } from './primitives'

// Una sola tarjeta: el precio a la izquierda y lo que incluye a la derecha. El costo del diagnóstico
// se ve recién en /agendar, después de los datos y antes de pagar (decisión de Alejandro).
// showCommunity: el link a la comunidad aún no tiene URL; se ve solo en dev/preview
export async function Offer({ locale, showCommunity }: { locale: Locale; showCommunity: boolean }) {
  const t = await getTranslations({ locale, namespace: 'Home' })
  const includes = t.raw('offer.includes') as string[]

  return (
    <section id="inversion" className="hm-section hm-section--joined" aria-labelledby="hm-offer-title">
      <div className="hm-wrap">
        <SectionHead
          center
          size="md"
          id="hm-offer-title"
          eyebrow={t('offer.eyebrow')}
          light={t('offer.titleLight')}
          bold={t('offer.titleBold')}
        />

        <div className="hm-offer hm-glass hm-glass--thick hm-rv">
          <div className="hm-offer__price">
            <p className="hm-offer__from">{t('offer.from')}</p>
            <p className="hm-offer__amount">
              {t('offer.price')} <span>{t('offer.currency')}</span>
            </p>
            <p className="hm-offer__fin">{t('offer.financing')}</p>
            <p className="hm-offer__scope">{t('offer.scope')}</p>
            <a href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
              {t('offer.cta')}
              <Arrow />
            </a>
          </div>
          <div className="hm-offer__includes">
            <h3 className="hm-offer__label">{t('offer.includesLabel')}</h3>
            <ul className="hm-offer__list">
              {includes.map((item) => (
                <li key={item}>
                  <Check />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {showCommunity && (
          <p className="hm-offer__community">
            {t('offer.communityQuestion')}{' '}
            <a href="#" className="hm-ph" title={t('pending')}>
              {t('offer.communityLink')} →
            </a>
          </p>
        )}
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
