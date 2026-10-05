import { getTranslations } from 'next-intl/server'
import { SectionHead, type Locale } from './primitives'

export type FaqItem = { q: string; a: string }

type BlockProps = { id?: string; titleId: string; eyebrow: string; light: string; bold: string; items: FaqItem[] }

// Acordeón nativo (<details name>): accesible con teclado y lector de pantalla, sin JS
export function FaqBlock({ id, titleId, eyebrow, light, bold, items }: BlockProps) {
  return (
    <section id={id} className="hm-section" aria-labelledby={titleId}>
      <div className="hm-wrap hm-faq">
        <SectionHead id={titleId} eyebrow={eyebrow} light={light} bold={bold} />
        <div className="hm-faq__list">
          {items.map((item) => (
            <details key={item.q} name={titleId} className="hm-faq__item hm-glass hm-rv">
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

export async function Faq({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: 'Home.faq' })

  return (
    <FaqBlock
      id="faq"
      titleId="hm-faq-title"
      eyebrow={t('eyebrow')}
      light={t('titleLight')}
      bold={t('titleBold')}
      items={t.raw('items') as FaqItem[]}
    />
  )
}
