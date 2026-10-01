import { getTranslations } from 'next-intl/server'
import { SectionHead, type Locale } from './primitives'

type Row = { before: string; after: string }

export async function Compare({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.compare' })
  const rows = t.raw('rows') as Row[]

  return (
    <section className="hm-section" aria-labelledby="hm-compare-title">
      <div className="hm-wrap">
        <SectionHead center id="hm-compare-title" eyebrow={t('eyebrow')} light={t('titleLight')} bold={t('titleBold')} />

        {/* Lo de "casi todos" queda tachado sobre el fondo; lo de 2027, sobre una placa de vidrio */}
        <div className="hm-compare hm-rv">
          <div className="hm-compare__slab hm-glass hm-glass--thick" aria-hidden="true" />
          <div className="hm-compare__head" aria-hidden="true">
            <span>{t('colBefore')}</span>
            <span>{t('colAfter')}</span>
          </div>
          <ul className="hm-compare__rows">
            {rows.map((r) => (
              <li key={r.after} className="hm-compare__row">
                <p className="hm-compare__before">
                  <span className="sr-only">{t('colBefore')}: </span>
                  <s className="hm-strike">{r.before}</s>
                </p>
                <p className="hm-compare__after">
                  <span className="hm-compare__dot" aria-hidden="true" />
                  <span>
                    <span className="sr-only">{t('colAfter')}: </span>
                    {r.after}
                  </span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <p className="hm-closing hm-rv">
          {t('closingLight')} <span className="b">{t('closingBold')}</span>
        </p>
      </div>
    </section>
  )
}
