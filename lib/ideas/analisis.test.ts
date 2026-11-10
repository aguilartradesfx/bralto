import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leerAnalisis, promptIdea, sinElCreador, type Analisis } from './analisis.ts'

const contexto = {
  red: 'instagram' as const,
  tipo: 'video' as const,
  texto: 'Texto original del video, con @una.cuenta y su marca',
  vistas: 392649,
  vecesSuPublico: 26.1,
  vecesLoNormal: 34.2,
  compartidos: null,
  guardados: null,
  soloImagen: false,
}

test('el prompt pide la versión propia en tico, con tú, para negocios, sin copiar ni nombrar al creador', () => {
  const p = promptIdea(contexto)
  assert.match(p, /tú/)
  assert.match(p, /nunca de vos/i)
  assert.match(p, /pana/)
  assert.match(p, /niño de 5/)
  assert.match(p, /negocio/)
  assert.match(p, /nunca copies/i)
  assert.match(p, /no nombres al creador/i)
  assert.match(p, /393 mil vistas/)
  assert.match(p, /26× su público/)
  assert.match(p, /34× lo normal/)
})

test('el prompt pide la palabra del «Comenta» en español y fuera del guion', () => {
  const p = promptIdea(contexto)
  assert.match(p, /sin el cierre del «Comenta»/)
  assert.match(p, /palabra en español/)
  assert.match(p, /no WEB, VISTO ni WHATSAPP/)
})

test('si el guion igual trae el «Comenta» al final, se quita (ya va en su línea)', () => {
  const a = leerAnalisis({ ...crudo, tu_version: { ...crudo.tu_version, guion: ['Abres Claude', 'Te da el Excel', 'Comenta EXCEL y te mando la guía'] } })
  assert.deepEqual(a.tu_version.guion, ['Abres Claude', 'Te da el Excel'])
})

test('el prompt pide el gancho del original traducido al español', () => {
  assert.match(promptIdea(contexto), /traducido al español/)
})

test('el prompt avisa si Gemini solo ve la portada', () => {
  assert.match(promptIdea({ ...contexto, soloImagen: true }), /solo la portada/i)
  assert.doesNotMatch(promptIdea(contexto), /solo la portada/i)
})

test('el prompt no lleva el nombre de la cuenta (solo el texto que escribió, recortado)', () => {
  const largo = promptIdea({ ...contexto, texto: 'x'.repeat(5000) })
  assert.ok(largo.length < 5000)
})

const crudo = {
  tema: 'Cómo hacer que una IA te arme un Excel',
  formato: 'a_camara',
  gancho: { texto: '¿Todavía haces tus cotizaciones a mano?', por_que: 'Toca un dolor diario' },
  partes: ['Gancho con una pregunta', 'Muestra el resultado', 'Explica 3 pasos', 'Cierre con «Comenta»'],
  por_que_pego: ['Promete ahorrar horas', 'Se ve el resultado en 3 segundos'],
  por_que_guardan: 'Son pasos para hacerlo después',
  herramientas: ['Claude', null],
  de_tu_tema: 9,
  tu_version: {
    titulo: 'Tu cotización en 1 minuto',
    idea: 'Una IA te deja la cotización lista en Excel',
    ganchos: ['¿Cotizas a mano?', 'Esto te ahorra 2 horas al día', 'Mae, deja de copiar y pegar', 'uno de más'],
    guion: ['Abres Claude', 'Le pegas lo que vendes', 'Te da el Excel'],
    comenta: 'EXCEL',
  },
}

test('lee el análisis de Gemini: quita los vacíos y deja 3 ganchos', () => {
  const a = leerAnalisis(crudo)
  assert.equal(a.tema, 'Cómo hacer que una IA te arme un Excel')
  assert.equal(a.formato, 'a_camara')
  assert.deepEqual(a.herramientas, ['Claude'])
  assert.equal(a.tu_version.ganchos.length, 3)
  assert.equal(a.tu_version.comenta, 'EXCEL')
})

test('un formato que no conoce queda como mixto; sin palabra de «Comenta» queda null', () => {
  const a = leerAnalisis({ ...crudo, formato: 'baile', tu_version: { ...crudo.tu_version, comenta: '' } })
  assert.equal(a.formato, 'mixto')
  assert.equal(a.tu_version.comenta, null)
})

test('sin ganchos o sin guion no sirve', () => {
  assert.throws(() => leerAnalisis({ ...crudo, tu_version: { ...crudo.tu_version, ganchos: [] } }))
  assert.throws(() => leerAnalisis({ ...crudo, tu_version: { ...crudo.tu_version, guion: [] } }))
  assert.throws(() => leerAnalisis({ tema: 'x' }))
})

test('si la versión propia nombra al creador, se le quita', () => {
  const a: Analisis = leerAnalisis({
    ...crudo,
    tu_version: { ...crudo.tu_version, idea: 'Como hace @Una.Cuenta, la IA te deja el Excel', guion: ['Abres Claude como una.cuenta', 'Listo'] },
  })
  const limpio = sinElCreador(a, 'una.cuenta')
  assert.equal(limpio.tu_version.idea, 'Como hace, la IA te deja el Excel')
  assert.equal(limpio.tu_version.guion[0], 'Abres Claude como')
  assert.deepEqual(sinElCreador(a, null), a)
})

test('la marca del creador no pasa como herramienta (la usa Knox)', () => {
  const a = leerAnalisis({ ...crudo, herramientas: ['Claude', 'Instagram', 'Excelia', 'Marcax'] })
  assert.deepEqual(sinElCreador(a, 'soymarcax').herramientas, ['Claude', 'Instagram', 'Excelia'])
  assert.deepEqual(sinElCreador(a, 'excelia.oficial').herramientas, ['Claude', 'Instagram', 'Marcax'])
})
