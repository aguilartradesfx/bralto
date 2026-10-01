import { getTranslations } from 'next-intl/server'
import { Arrow } from './icons'
import type { Locale } from './primitives'

export async function FinalCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.finalCta' })

  return (
    <section className="hm-section hm-section--last" aria-labelledby="hm-final-title">
      <div className="hm-wrap hm-final-wrap">
        <div className="hm-final__pool" aria-hidden="true" />
        <div className="hm-final hm-glass hm-glass--thick hm-rv">
          <p className="hm-eyebrow">{t('eyebrow')}</p>
          <h2 id="hm-final-title" className="hm-h2">
            <span>{t('titleLight')}</span> <span className="b">{t('titleBold')}</span>
          </h2>
          <p className="hm-lead">{t('lead')}</p>
          <a href={`/${locale}/agendar`} className="hm-btn hm-btn--solid">
            {t('cta')}
            <Arrow />
          </a>
          <p className="hm-final__note">{t('note')}</p>
        </div>
      </div>
    </section>
  )
}
