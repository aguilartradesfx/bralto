import type { NewsDraft, NewsLocale, SourceContext } from './types'

// Reglas de cada nota (spec 2026-10-09-noticias-ia). Las usan /api/noticias/validar y la
// publicación; n8n reescribe una vez con estos problemas antes de rendirse.
export const BODY_WORDS: Record<NewsLocale, { min: number; max: number }> = {
  es: { min: 400, max: 600 },
  en: { min: 340, max: 690 },
}
export const TITLE_MAX = 110
export const SUMMARY_LENGTH = { min: 80, max: 200 }
export const ALT_MAX = 200
export const COPY_RUN = 8
const SOURCE_MIN_WORDS = 150
const MIN_PARAGRAPHS = 3

// "high-level" es inglés común (también "ago high-level"); la marca va junta, con espacios o con guiones
const BANNED = /\bgo[\s-]*high[\s-]*level|highlevel|\bghl\b/gi

const tokens = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(Boolean)

export function countWords(text: string): number {
  return text
    .replace(/^##\s+/gm, '')
    .split(/\s+/)
    .filter((w) => /[\p{L}\p{N}]/u.test(w)).length
}

export function findBannedTerms(text: string): string[] {
  return [...text.matchAll(BANNED)].map((m) => m[0])
}

// Tramos de `run` palabras o más que el texto comparte con la fuente (normalizados)
export function copiedPhrases(text: string, source: string, run = COPY_RUN): string[] {
  const src = tokens(source)
  const grams = new Set<string>()
  for (let i = 0; i + run <= src.length; i++) grams.add(src.slice(i, i + run).join(' '))

  const words = tokens(text)
  const found: string[] = []
  let i = 0
  while (i + run <= words.length) {
    if (!grams.has(words.slice(i, i + run).join(' '))) {
      i++
      continue
    }
    // Alarga el tramo mientras siga coincidiendo
    let end = i + run
    while (end < words.length && grams.has(words.slice(end - run + 1, end + 1).join(' '))) end++
    found.push(words.slice(i, end).join(' '))
    i = end
  }
  return found
}

export function bodyFormatProblems(body: string): string[] {
  const problems: string[] = []
  if (/<\/?[a-z][^>]*>/i.test(body)) problems.push('El cuerpo tiene HTML.')
  if (/https?:\/\/|www\.|\]\(/i.test(body)) problems.push('El cuerpo tiene links; la fuente va aparte.')
  const lines = body.split('\n').map((l) => l.trim())
  if (lines.some((l) => /^([-*+•]|\d+[.)])\s/.test(l))) problems.push('El cuerpo no lleva listas.')
  if (/[*`]/.test(body)) problems.push('El cuerpo no lleva negritas, cursivas ni código.')
  if (lines.some((l) => l.startsWith('#') && !/^## \S/.test(l))) problems.push('Solo se permiten subtítulos con «## ».')
  const paragraphs = body
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter((b) => b && !b.startsWith('#'))
  if (paragraphs.length < MIN_PARAGRAPHS) problems.push(`El cuerpo necesita al menos ${MIN_PARAGRAPHS} párrafos.`)
  return problems
}

// Lo que vale para toda nota, con fuente o sin ella: largo, formato, marcado y términos prohibidos
function commonProblems(draft: NewsDraft, range: { min: number; max: number }, extra: string[]): string[] {
  const out: string[] = []
  const titulo = draft.titulo.trim()
  const resumen = draft.resumen.trim()
  const alt = draft.imagen_alt.trim()

  if (!titulo) out.push('Falta el título.')
  else if (titulo.length > TITLE_MAX) out.push(`El título tiene ${titulo.length} caracteres; máximo ${TITLE_MAX}.`)
  if (resumen.length < SUMMARY_LENGTH.min || resumen.length > SUMMARY_LENGTH.max)
    out.push(`El resumen tiene ${resumen.length} caracteres; debe tener entre ${SUMMARY_LENGTH.min} y ${SUMMARY_LENGTH.max}.`)
  if (!alt || alt.length > ALT_MAX) out.push(`Falta el texto alternativo de la imagen o pasa de ${ALT_MAX} caracteres.`)

  const n = countWords(draft.cuerpo)
  if (n < range.min || n > range.max) out.push(`El cuerpo tiene ${n} palabras; debe tener entre ${range.min} y ${range.max}.`)
  out.push(...bodyFormatProblems(draft.cuerpo))

  // Estos campos terminan en atributos y en el JSON-LD de la página: nada de marcado
  if ([titulo, resumen, alt, ...extra].some((v) => /[<>]/.test(v)))
    out.push('El título, el resumen, el texto alternativo y el nombre de la fuente no llevan < ni >.')

  const banned = findBannedTerms([titulo, resumen, draft.cuerpo, alt, ...extra].join('\n'))
  if (banned.length) out.push(`Menciona un término prohibido: ${[...new Set(banned)].join(', ')}.`)
  return out
}

export function validateDraft(draft: NewsDraft, locale: NewsLocale, source: SourceContext): string[] {
  const out = commonProblems(draft, BODY_WORDS[locale], [source.fuente_nombre])
  const add = (msg: string) => out.push(msg)

  let url: URL | null = null
  try {
    url = new URL(source.fuente_url)
  } catch {
    url = null
  }
  if (!url || url.protocol !== 'https:' || !/^https:\/\/[^\s<>"'`]+$/.test(source.fuente_url))
    add('El link de la fuente tiene que ser https, sin espacios, comillas ni < >.')
  if (!source.fuente_nombre.trim()) add('Falta el nombre de la fuente.')

  if (countWords(source.fuente_texto) < SOURCE_MIN_WORDS) {
    add(`El texto de la fuente llegó con menos de ${SOURCE_MIN_WORDS} palabras; no se puede revisar que nada esté copiado.`)
  } else {
    const copied = copiedPhrases([draft.titulo, draft.resumen, draft.cuerpo].join('\n'), source.fuente_texto)
    if (copied.length) add(`Tiene frases copiadas de la fuente: «${copied.slice(0, 3).join('», «')}».`)
  }
  return out.map((p) => `[${locale}] ${p}`)
}

// Artículos de Bralto (guías, casos y comparativas): sin fuente, más largos. El costo del
// diagnóstico solo se muestra en /agendar (decisión de Alejandro) y nunca se habla de reembolsos.
export const ARTICLE_WORDS: Record<NewsLocale, { min: number; max: number }> = {
  es: { min: 500, max: 900 },
  en: { min: 430, max: 1000 },
}
const DIAGNOSTIC_PRICE = /\$\s?97\b|\b97\s?(usd|d[oó]lares|dollars)\b|\busd\s?97\b/i
// El diagnóstico tiene costo: "gratis", "sin costo" o "free" cerca de "diagnóstico" sería falso
const FREE = '\\b(gratis|gratuit[oa]s?|sin costo|sin compromiso|free|no[- ]cost|no obligation)\\b'
const FREE_DIAGNOSTIC = new RegExp(`${FREE}[^.\\n]{0,40}diagn[oó]stic|diagn[oó]stic[^.\\n]{0,40}${FREE}`, 'i')
const REFUNDS = /reembols|refund/i

export function validateArticle(draft: NewsDraft, locale: NewsLocale): string[] {
  const out = commonProblems(draft, ARTICLE_WORDS[locale], [])
  const all = [draft.titulo, draft.resumen, draft.cuerpo, draft.imagen_alt].join('\n')
  if (DIAGNOSTIC_PRICE.test(all)) out.push('No menciona el precio del diagnóstico: eso se ve recién en /agendar.')
  if (REFUNDS.test(all)) out.push('No habla de reembolsos.')
  if (FREE_DIAGNOSTIC.test(all)) out.push('No dice que el diagnóstico es gratis: tiene costo.')
  return out.map((p) => `[${locale}] ${p}`)
}

// Fecha de las notas de relleno: en el pasado (5 min de margen) y no más de 60 días atrás
export function publishDateProblems(iso: string, now: Date = new Date()): string[] {
  const t = Date.parse(iso)
  if (!/^\d{4}-\d{2}-\d{2}T/.test(iso) || Number.isNaN(t)) return ['La fecha de publicación no es una fecha ISO válida.']
  if (t > now.getTime() + 5 * 60 * 1000) return ['La fecha de publicación está en el futuro.']
  if (t < now.getTime() - 60 * 24 * 3600 * 1000) return ['La fecha de publicación es de hace más de 60 días.']
  return []
}
