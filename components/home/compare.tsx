import { getTranslations } from 'next-intl/server'
import { Arrow } from './icons'
import { SectionHead, type Locale } from './primitives'

type Row = { before: string; after: string }
type Group = { label: string; rows: Row[] }

export async function Compare({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.compare' })
  const groups = t.raw('groups') as Group[]

  return (
    <section className="hm-section" aria-labelledby="hm-compare-title">
      <div className="hm-wrap">
        <SectionHead center size="md" id="hm-compare-title" light={t('titleLight')} bold={t('titleBold')} />

        {/* Una tabla pareja: lo de "casi todos" tachado, lo de 2027 al lado. Dos grupos: captar y
            vender / organizar y gestionar. */}
        <div className="hm-compare hm-glass hm-glass--thick hm-rv">
          <div className="hm-compare__cols" aria-hidden="true">
            <span>{t('colBefore')}</span>
            <span />
            <span>{t('colAfter')}</span>
          </div>
          {groups.map((group) => (
            <div key={group.label}>
              <h3 className="hm-compare__label">{group.label}</h3>
              <ul className="hm-compare__rows">
                {group.rows.map((r) => (
                  <li key={r.after} className="hm-compare__row">
                    <p className="hm-compare__before">
                      <span className="sr-only">{t('colBefore')}: </span>
                      <s className="hm-strike">{r.before}</s>
                    </p>
                    <span className="hm-compare__arrow" aria-hidden="true">
                      <Arrow />
                    </span>
                    <p className="hm-compare__after">
                      <span className="sr-only">{t('colAfter')}: </span>
                      {r.after}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <p className="hm-closing hm-rv">
          {t('closingLight')} <span className="b">{t('closingBold')}</span>
        </p>
      </div>
    </section>
  )
}
