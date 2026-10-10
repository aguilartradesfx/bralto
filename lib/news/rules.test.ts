import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bodyFormatProblems, copiedPhrases, countWords, findBannedTerms, validateDraft } from './rules.ts'
import type { NewsDraft, SourceContext } from './types.ts'

const words = (n: number, w = 'palabra') => Array.from({ length: n }, (_, i) => `${w}${i}`).join(' ')
// Cuerpo válido: 3 párrafos y un subtítulo, n palabras en total sin contar el "##"
const body = (n: number) => `${words(n - 3 - 100, 'a')}\n\n## Por qué importa\n\n${words(50, 'b')}\n\n${words(50, 'c')}`
const source: SourceContext = {
  fuente_url: 'https://openai.com/index/algo',
  fuente_nombre: 'OpenAI',
  fuente_texto: words(300, 'fuente'),
}
const draft = (over: Partial<NewsDraft> = {}): NewsDraft => ({
  titulo: 'OpenAI lanza una función nueva para negocios',
  resumen: 'Qué cambia para las empresas que usan herramientas de IA en sus ventas y su atención, y por dónde empezar a aprovecharlo.',
  cuerpo: body(480),
  imagen_alt: 'Una consola de vidrio iluminada en naranja sobre fondo oscuro',
  ...over,
})

test('countWords cuenta palabras y números, no signos ni el ## de los subtítulos', () => {
  assert.equal(countWords('## Por qué importa\n\nHola, mundo: 3 veces — sí.'), 8)
})

test('una nota válida no tiene problemas', () => {
  assert.deepEqual(validateDraft(draft(), 'es', source), [])
})

test('el cuerpo en español tiene que tener entre 400 y 600 palabras', () => {
  assert.match(validateDraft(draft({ cuerpo: body(399) }), 'es', source).join('\n'), /\[es\].*399 palabras/)
  assert.match(validateDraft(draft({ cuerpo: body(601) }), 'es', source).join('\n'), /601 palabras/)
  assert.deepEqual(validateDraft(draft({ cuerpo: body(400) }), 'es', source), [])
  assert.deepEqual(validateDraft(draft({ cuerpo: body(600) }), 'es', source), [])
})

test('en inglés el rango es 340 a 690', () => {
  assert.deepEqual(validateDraft(draft({ cuerpo: body(345) }), 'en', source), [])
  assert.match(validateDraft(draft({ cuerpo: body(339) }), 'en', source).join('\n'), /\[en\]/)
})

test('título hasta 110 caracteres y resumen de 80 a 200', () => {
  assert.match(validateDraft(draft({ titulo: 'x'.repeat(111) }), 'es', source).join(), /título/)
  assert.match(validateDraft(draft({ resumen: 'corto' }), 'es', source).join(), /resumen/)
  assert.match(validateDraft(draft({ resumen: 'x'.repeat(201) }), 'es', source).join(), /resumen/)
  assert.match(validateDraft(draft({ imagen_alt: ' ' }), 'es', source).join(), /texto alternativo/)
})

test('GoHighLevel no aparece en ninguna forma; "high-level" sí se permite', () => {
  for (const t of ['GoHighLevel', 'Go High Level', 'go-high-level', 'HighLevel', 'el CRM GHL']) {
    assert.notDeepEqual(findBannedTerms(t), [], t)
  }
  assert.deepEqual(findBannedTerms('a high-level overview and a high level plan'), [])
  assert.match(validateDraft(draft({ resumen: draft().resumen.replace('herramientas', 'GoHighLevel') }), 'es', source).join(), /GoHighLevel/i)
})

test('copiedPhrases encuentra 8 palabras seguidas iguales, sin importar acentos, mayúsculas ni puntuación', () => {
  const src = 'La empresa anunció hoy que su nuevo modelo responde más rápido que nunca.'
  assert.deepEqual(copiedPhrases('Según dicen, la empresa anuncio HOY que su nuevo modelo responde, y punto.', src), [
    'la empresa anuncio hoy que su nuevo modelo responde',
  ])
  assert.deepEqual(copiedPhrases('La empresa anunció hoy que su modelo es rápido.', src), [])
})

test('una nota con una frase copiada de la fuente no pasa', () => {
  const copied = 'fuente10 fuente11 fuente12 fuente13 fuente14 fuente15 fuente16 fuente17'
  const problems = validateDraft(draft({ cuerpo: `${copied} ${body(480)}` }), 'es', source)
  assert.match(problems.join('\n'), /copiad/)
})

test('si la fuente llegó casi vacía no se puede revisar el copiado: no pasa', () => {
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_texto: words(149) }).join(), /fuente/)
})

test('la fuente necesita link https y nombre', () => {
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_url: 'http://x.com/a' }).join(), /link/)
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_url: 'no es un link' }).join(), /link/)
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_nombre: '' }).join(), /nombre de la fuente/)
})

test('el cuerpo no lleva HTML, links, listas, negritas ni otros títulos', () => {
  assert.match(bodyFormatProblems('Hola <b>mundo</b>').join(), /HTML/)
  assert.match(bodyFormatProblems('Vea https://x.com').join(), /links/)
  assert.match(bodyFormatProblems('Vea [esto](x)').join(), /links/)
  assert.match(bodyFormatProblems('- uno\n- dos').join(), /listas/)
  assert.match(bodyFormatProblems('1. uno').join(), /listas/)
  assert.match(bodyFormatProblems('Esto es **clave**').join(), /negritas/)
  assert.match(bodyFormatProblems('# Título\n\nTexto').join(), /subtítulos/)
  assert.match(bodyFormatProblems('### Título\n\nTexto').join(), /subtítulos/)
  assert.deepEqual(bodyFormatProblems('Uno.\n\n## Dos\n\nTres.\n\nCuatro.'), [])
})

test('el cuerpo necesita al menos 3 párrafos', () => {
  assert.match(bodyFormatProblems('Uno solo.\n\n## Sub\n\nDos.').join(), /párrafos/)
})
