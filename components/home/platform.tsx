import { getTranslations } from 'next-intl/server'
import { Check } from './icons'
import { SectionHead, type Locale } from './primitives'

type Tool = { name: string; price: string }

export async function Platform({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.platform' })
  const features = t.raw('features') as string[]
  const tools = t.raw('tools') as Tool[]

  return (
    <section id="plataforma" className="hm-section" aria-labelledby="hm-platform-title">
      <div className="hm-wrap hm-platform">
        <div className="hm-platform__copy">
          <SectionHead id="hm-platform-title" eyebrow={t('eyebrow')} light={t('titleLight')} bold={t('titleBold')} />
          <p className="hm-lead hm-rv">{t('lead')}</p>
          <ul className="hm-chips hm-rv">
            {features.map((f) => (
              <li key={f} className="hm-chip hm-inset">
                {f}
              </li>
            ))}
          </ul>
        </div>

        {/* Lo que hoy se paga por separado, como un recibo: cada precio se tacha al pasar */}
        <div className="hm-receipt hm-glass hm-glass--thick hm-rv">
          <ul className="hm-receipt__list">
            {tools.map((tool) => (
              <li key={tool.name} className="hm-receipt__row">
                <span>{tool.name}</span>
                <span className="hm-receipt__leader" aria-hidden="true" />
                <s className="hm-receipt__price hm-strike">{tool.price}</s>
              </li>
            ))}
          </ul>
          <div className="hm-receipt__tear" aria-hidden="true" />
          <div className="hm-receipt__total">
            <s className="hm-receipt__old hm-strike">{t('separately')}</s>
            <p className="hm-receipt__new hm-inset">
              <Check />
              {t('included')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
