import { getTranslations } from 'next-intl/server'
import { SectionHead, type Locale } from './primitives'

type Item = { q: string; a: string }

// Acordeón nativo (<details name>): accesible con teclado y lector de pantalla, sin JS
export async function Faq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.faq' })
  const items = t.raw('items') as Item[]

  return (
    <section id="faq" className="hm-section" aria-labelledby="hm-faq-title">
      <div className="hm-wrap hm-faq">
        <SectionHead id="hm-faq-title" eyebrow={t('eyebrow')} light={t('titleLight')} bold={t('titleBold')} />
        <div className="hm-faq__list">
          {items.map((item) => (
            <details key={item.q} name="hm-faq" className="hm-faq__item hm-glass hm-rv">
              <summary>
                {item.q}
                <span className="hm-faq__plus" aria-hidden="true" />
              </summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
