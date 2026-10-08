import { getTranslations } from 'next-intl/server'
import { Check } from './icons'
import { SectionHead, type Locale } from './primitives'

type Tool = { name: string; price: string }

// Los más caros, con su precio; el resto va en una línea (diez renglones con línea pesaban de más).
// En los mensajes, las herramientas van de la más cara a la más barata.
const FEATURED = 5

// Lo que hoy se paga por separado, como un recibo: cada precio se tacha al pasar.
// included: el renglón final (en /plataforma muestra el precio del plan)
export async function Receipt({ locale, included }: { locale: Locale; included?: string }) {
  const t = await getTranslations({ locale, namespace: 'Home.platform' })
  const tools = t.raw('tools') as Tool[]
  const rest = new Intl.ListFormat(locale, { type: 'conjunction' }).format(tools.slice(FEATURED).map((tool) => tool.name))

  return (
    <div className="hm-receipt hm-glass hm-glass--thick hm-rv">
      <ul className="hm-receipt__list">
        {tools.slice(0, FEATURED).map((tool) => (
          <li key={tool.name} className="hm-receipt__row">
            <span>{tool.name}</span>
            <span className="hm-receipt__leader" aria-hidden="true" />
            <s className="hm-receipt__price hm-strike">{tool.price}</s>
          </li>
        ))}
      </ul>
      {tools.length > FEATURED && (
        <p className="hm-receipt__rest">
          {t('also')}: {rest}
        </p>
      )}
      <div className="hm-receipt__tear" aria-hidden="true" />
      <div className="hm-receipt__total">
        <s className="hm-receipt__old hm-strike">{t('separately')}</s>
        <p className="hm-receipt__new hm-inset">
          <Check />
          {included ?? t('included')}
        </p>
      </div>
    </div>
  )
}

export async function Platform({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.platform' })
  const features = t.raw('features') as string[]

  return (
    <section id="plataforma" className="hm-section" aria-labelledby="hm-platform-title">
      <div className="hm-wrap hm-platform">
        <div className="hm-platform__copy">
          <SectionHead id="hm-platform-title" light={t('titleLight')} bold={t('titleBold')} />
          <p className="hm-lead hm-rv">{t('lead')}</p>
          <ul className="hm-chips hm-rv">
            {features.map((f) => (
              <li key={f} className="hm-chip hm-inset">
                {f}
              </li>
            ))}
          </ul>
        </div>

        <Receipt locale={locale} />
      </div>
    </section>
  )
}
