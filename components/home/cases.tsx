import { getTranslations } from 'next-intl/server'
import { PendingBadge, Ph, SectionHead, type Locale } from './primitives'

type Case = { name: string; tag: string; before: string; built: string; result: string }

// Oculto en producción hasta tener datos reales (lo decide home-page con showPending)
export async function Cases({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home' })
  const items = t.raw('cases.items') as Case[]

  return (
    <section id="casos-reales" className="hm-section hm-pending" aria-labelledby="hm-cases-title">
      <div className="hm-wrap">
        <PendingBadge label={t('pending')} />
        <SectionHead id="hm-cases-title" eyebrow={t('cases.eyebrow')} light={t('cases.titleLight')} bold={t('cases.titleBold')} />

        <ul className="hm-cases">
          {items.map((c) => (
            <li key={c.name} className="hm-case hm-glass hm-rv">
              <div className="hm-case__id">
                <h3>{c.name}</h3>
                <span className="hm-case__tag">{c.tag}</span>
              </div>
              <dl className="hm-case__facts">
                <dt>{t('cases.before')}</dt>
                <dd>
                  <Ph text={c.before} />
                </dd>
                <dt>{t('cases.built')}</dt>
                <dd>
                  <Ph text={c.built} />
                </dd>
              </dl>
              <div className="hm-case__result">
                <strong>
                  <Ph text={c.result} />
                </strong>
                <span>{t('cases.result')}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
