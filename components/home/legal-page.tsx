import type { ReactNode } from 'react'
import { LEGAL_REVIEWED } from '@/lib/legal'
import type { Locale } from './primitives'
import './legal.css'

// Privacidad y términos. El texto está en español (es el que revisó el abogado); en /en se
// avisa que el documento está solo en español. Mientras sea borrador, un aviso arriba lo
// dice y los datos que faltan van entre corchetes, resaltados.

export type LegalBlock = string | string[] // párrafo o lista
export type LegalDoc = {
  title: string
  intro: string
  sections: { heading: string; body: LegalBlock[] }[]
}

const COPY = {
  es: {
    updated: 'Actualizado el 9 de octubre de 2026',
    draft: 'Borrador del 7 de octubre de 2026',
    draftTitle: 'Borrador pendiente de revisión legal.',
    draftText: 'Este texto todavía no es definitivo: los datos entre corchetes faltan por completar y un abogado debe revisar el documento completo antes de publicarlo.',
    language: null,
    draftLanguage: null,
  },
  en: {
    updated: 'Updated October 9, 2026',
    draft: 'Draft of October 7, 2026',
    draftTitle: 'Draft pending legal review.',
    draftText: 'This text is not final yet: the bracketed items are missing and a lawyer must review the whole document before it is published.',
    language: 'This document is available in Spanish only.',
    draftLanguage: 'This document is in Spanish while it is under legal review. The English version will be published afterwards.',
  },
}

// "[dato que falta]" resaltado para que se vea al revisar
function withPlaceholders(text: string): ReactNode {
  return text.split(/(\[[^\]]+\])/g).map((part, i) =>
    part.startsWith('[') ? (
      <mark key={i} className="lg-ph">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export function LegalPage({ locale, doc }: { locale: Locale; doc: LegalDoc }) {
  const c = COPY[locale]
  return (
    <main>
      <section className="hm-hero hm-hero--page hm-hero--fit" aria-labelledby="lg-title">
        <div className="hm-wrap">
          <h1 id="lg-title" className="hm-page-title lg-title" lang="es">
            {doc.title}
          </h1>
          <p className="hm-lead">{LEGAL_REVIEWED ? c.updated : c.draft}</p>
        </div>
      </section>

      <section className="hm-section lg" aria-label={doc.title}>
        <div className="hm-wrap lg__wrap">
          {!LEGAL_REVIEWED && (
            <p className="lg-draft hm-glass" role="note">
              <strong>{c.draftTitle}</strong> {c.draftText}
            </p>
          )}
          {c.language && <p className="lg-lang">{LEGAL_REVIEWED ? c.language : c.draftLanguage}</p>}

          <article className="lg-doc" lang="es">
            <p>{withPlaceholders(doc.intro)}</p>
            {doc.sections.map((section) => (
              <section key={section.heading}>
                <h2>{section.heading}</h2>
                {section.body.map((block, i) =>
                  typeof block === 'string' ? (
                    <p key={i}>{withPlaceholders(block)}</p>
                  ) : (
                    <ul key={i}>
                      {block.map((item) => (
                        <li key={item}>{withPlaceholders(item)}</li>
                      ))}
                    </ul>
                  ),
                )}
              </section>
            ))}
          </article>
        </div>
      </section>
    </main>
  )
}
