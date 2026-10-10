import { test } from 'node:test'
import assert from 'node:assert/strict'
import { bodyFormatProblems, copiedPhrases, countWords, findBannedTerms, publishDateProblems, validateArticle, validateDraft } from './rules.ts'
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

test('el título, el resumen, el texto alternativo y el nombre de la fuente no llevan < ni >', () => {
  for (const campo of ['titulo', 'resumen', 'imagen_alt'] as const) {
    const valor = draft()[campo].replace(/ /, ' </script><b> ')
    assert.match(validateDraft(draft({ [campo]: valor }), 'es', source).join(), /< ni >/, campo)
  }
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_nombre: 'X</script>' }).join(), /< ni >/)
})

test('el link de la fuente no lleva espacios, comillas ni < >', () => {
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_url: 'https://x.com/a</script><script>alert(1)' }).join(), /link/)
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_url: 'https://x.com/a b' }).join(), /link/)
  assert.match(validateDraft(draft(), 'es', { ...source, fuente_url: 'https://x.com/a"onmouseover' }).join(), /link/)
})

test('"ago high-level" no es la marca prohibida', () => {
  assert.deepEqual(findBannedTerms('two years ago high-level talks began'), [])
  assert.deepEqual(findBannedTerms('a cargo high level'), [])
})

// ---------- Artículos de Bralto (sin fuente) ----------
const articulo = (over: Partial<NewsDraft> = {}): NewsDraft => draft({ cuerpo: body(650), ...over })

test('un artículo válido no tiene problemas y no necesita fuente', () => {
  assert.deepEqual(validateArticle(articulo(), 'es'), [])
})

test('el artículo tiene entre 500 y 900 palabras en español y entre 430 y 1000 en inglés', () => {
  assert.match(validateArticle(articulo({ cuerpo: body(499) }), 'es').join(), /499 palabras/)
  assert.match(validateArticle(articulo({ cuerpo: body(901) }), 'es').join(), /901 palabras/)
  assert.deepEqual(validateArticle(articulo({ cuerpo: body(900) }), 'es'), [])
  assert.deepEqual(validateArticle(articulo({ cuerpo: body(435) }), 'en'), [])
  assert.match(validateArticle(articulo({ cuerpo: body(429) }), 'en').join(), /\[en\]/)
})

test('el artículo no menciona el precio del diagnóstico ni reembolsos', () => {
  for (const frase of ['el diagnóstico cuesta $97', 'son 97 USD', 'pagás $ 97 y listo', 'sin reembolso', 'no reembolsable', 'refund policy']) {
    const problemas = validateArticle(articulo({ resumen: draft().resumen.replace('herramientas', frase) }), 'es')
    assert.match(problemas.join(), /precio del diagnóstico|reembolsos/, frase)
  }
  assert.deepEqual(validateArticle(articulo({ resumen: draft().resumen.replace('herramientas', '1997 herramientas') }), 'es'), [])
})

test('el artículo sigue las reglas comunes: GoHighLevel, formato y < >', () => {
  assert.match(validateArticle(articulo({ titulo: 'Bralto y GoHighLevel' }), 'es').join(), /prohibido/)
  assert.match(validateArticle(articulo({ cuerpo: body(650) + '\n\n- uno' }), 'es').join(), /listas/)
  assert.match(validateArticle(articulo({ titulo: 'Top 10 <b>' }), 'es').join(), /< ni >/)
})

test('fecha de publicación del relleno: en el pasado y hasta 60 días atrás', () => {
  const ahora = new Date('2026-10-10T08:00:00Z')
  assert.deepEqual(publishDateProblems('2026-10-03T12:00:00Z', ahora), [])
  assert.match(publishDateProblems('2026-10-11T12:00:00Z', ahora).join(), /futuro/)
  assert.match(publishDateProblems('2026-07-01T12:00:00Z', ahora).join(), /60 días/)
  assert.match(publishDateProblems('ayer', ahora).join(), /fecha/)
})

test('el artículo nunca dice que el diagnóstico es gratis', () => {
  for (const frase of ['agende su diagnóstico gratuito', 'un diagnóstico sin costo de 30 minutos', 'el diagnóstico es gratis', 'book a free 30-minute diagnostic', 'diagnóstico sin compromiso']) {
    const problemas = validateArticle(articulo({ resumen: draft().resumen.replace('herramientas', frase) }), 'es')
    assert.match(problemas.join(), /gratis/, frase)
  }
  // La garantía sí dice "sin costo", pero no habla del diagnóstico
  assert.deepEqual(validateArticle(articulo({ resumen: draft().resumen.replace('herramientas', 'seguimos trabajando sin costo') }), 'es'), [])
})

test('el precio del diagnóstico se detecta en otros formatos', () => {
  for (const frase of ['USD 97', 'USD97', '97 dollars', '97 dólares']) {
    assert.match(validateArticle(articulo({ resumen: draft().resumen.replace('herramientas', frase) }), 'es').join(), /precio del diagnóstico/, frase)
  }
})

test('"freelancer" cerca de "diagnóstico" no cuenta como "free"', () => {
  assert.deepEqual(validateArticle(articulo({ resumen: draft().resumen.replace('herramientas', 'un freelancer con diagnóstico propio') }), 'es'), [])
})
