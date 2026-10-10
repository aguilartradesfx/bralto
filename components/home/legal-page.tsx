import type { ReactNode } from 'react'
import { LEGAL_REVIEWED } from '@/lib/legal'
import type { Locale } from './primitives'
import './legal.css'

// Privacidad y términos. El texto está en español (es el que revisa el abogado); en /en se
// avisa que la versión en inglés llega después de la revisión. Mientras sea borrador, un
// aviso arriba lo dice y los datos que faltan van entre corchetes, resaltados.

export type LegalBlock = string | string[] // párrafo o lista
export type LegalDoc = {
  title: string
  intro: string
  sections: { heading: string; body: LegalBlock[] }[]
}

const COPY = {
  es: {
    updated: 'Borrador del 7 de octubre de 2026',
    draftTitle: 'Borrador pendiente de revisión legal.',
    draftText: 'Este texto todavía no es definitivo: los datos entre corchetes faltan por completar y un abogado debe revisar el documento completo antes de publicarlo.',
    language: null,
  },
  en: {
    updated: 'Draft of October 7, 2026',
    draftTitle: 'Draft pending legal review.',
    draftText: 'This text is not final yet: the bracketed items are missing and a lawyer must review the whole document before it is published.',
    language: 'This document is in Spanish while it is under legal review. The English version will be published afterwards.',
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
          {!LEGAL_REVIEWED && <p className="hm-lead">{c.updated}</p>}
        </div>
      </section>

      <section className="hm-section lg" aria-label={doc.title}>
        <div className="hm-wrap lg__wrap">
          {!LEGAL_REVIEWED && (
            <p className="lg-draft hm-glass" role="note">
              <strong>{c.draftTitle}</strong> {c.draftText}
            </p>
          )}
          {c.language && <p className="lg-lang">{c.language}</p>}

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
