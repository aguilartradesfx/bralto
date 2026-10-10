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

export function validateDraft(draft: NewsDraft, locale: NewsLocale, source: SourceContext): string[] {
  const out: string[] = []
  const add = (msg: string) => out.push(`[${locale}] ${msg}`)
  const titulo = draft.titulo.trim()
  const resumen = draft.resumen.trim()
  const alt = draft.imagen_alt.trim()

  if (!titulo) add('Falta el título.')
  else if (titulo.length > TITLE_MAX) add(`El título tiene ${titulo.length} caracteres; máximo ${TITLE_MAX}.`)
  if (resumen.length < SUMMARY_LENGTH.min || resumen.length > SUMMARY_LENGTH.max)
    add(`El resumen tiene ${resumen.length} caracteres; debe tener entre ${SUMMARY_LENGTH.min} y ${SUMMARY_LENGTH.max}.`)
  if (!alt || alt.length > ALT_MAX) add(`Falta el texto alternativo de la imagen o pasa de ${ALT_MAX} caracteres.`)

  const n = countWords(draft.cuerpo)
  const range = BODY_WORDS[locale]
  if (n < range.min || n > range.max) add(`El cuerpo tiene ${n} palabras; debe tener entre ${range.min} y ${range.max}.`)
  for (const p of bodyFormatProblems(draft.cuerpo)) add(p)

  // Estos campos terminan en atributos y en el JSON-LD de la página: nada de marcado
  if ([titulo, resumen, alt, source.fuente_nombre].some((v) => /[<>]/.test(v)))
    add('El título, el resumen, el texto alternativo y el nombre de la fuente no llevan < ni >.')

  const banned = findBannedTerms([titulo, resumen, draft.cuerpo, alt, source.fuente_nombre].join('\n'))
  if (banned.length) add(`Menciona un término prohibido: ${[...new Set(banned)].join(', ')}.`)

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
    const copied = copiedPhrases([titulo, resumen, draft.cuerpo].join('\n'), source.fuente_texto)
    if (copied.length) add(`Tiene frases copiadas de la fuente: «${copied.slice(0, 3).join('», «')}».`)
  }
  return out
}
