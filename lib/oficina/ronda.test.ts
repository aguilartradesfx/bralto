import { test } from 'node:test'
import assert from 'node:assert/strict'
import { argsClaude, correrRonda, entornoClaude, puedeCorrer, type DepsRonda } from './ronda.ts'
import type { DatosRonda } from './tertulia.ts'
import type { Agente, Ronda } from './tipos.ts'
import type { RondaLimpia } from './validar.ts'

const agente = (id: string): Agente => ({
  id, nombre: id.toUpperCase(), oficio: `Oficio ${id}`, area: 'Area', puesto: 1,
  aspecto: { tela: '#fff', ropa: '#000', glifo: 'x' }, personalidad: 'p', frase: 'f',
  horario: null, cada_minutos: null, ruta: null, donde: 'servidor', estado_fijo: null,
  despierto_siempre: false, dura_min: 5, ultima_revision: null, lugar: null,
})

const DATOS: DatosRonda = {
  agentes: [agente('ana'), agente('beto')], marcas: [], semana: [], pruebas: [], reels: [],
  ideasNuevas: [], foroReciente: [], conFoto: ['ana'], prohibidos: ['Cliente Secreto'], escenaEsperando: false,
}

const AHORA = new Date('2026-11-16T18:30:00Z') // 12:30 p. m. CR
const BUENA = JSON.stringify({
  is_error: false,
  result: JSON.stringify({
    chat: [{ de: 'ana', para: 'beto', texto: 'Hola, mae', rincon: null, idea: null }],
    posts: [], comentarios: [], escena: null,
  }),
})

function falsas(extra: Partial<DepsRonda> = {}) {
  const llamadas = { dormida: 0, rondaDe: 0, leerDatos: 0, preguntar: 0, guardar: 0, anotar: [] as Ronda[] }
  const deps: DepsRonda = {
    dormida: async () => { llamadas.dormida++; return false },
    rondaDe: async () => { llamadas.rondaDe++; return null },
    leerDatos: async () => { llamadas.leerDatos++; return DATOS },
    preguntar: async () => { llamadas.preguntar++; return BUENA },
    guardar: async (_l: RondaLimpia) => { llamadas.guardar++ },
    anotar: async (r) => { llamadas.anotar.push(r) },
    ...extra,
  }
  return { deps, llamadas }
}

test('puedeCorrer: de 7:00 a. m. a 6:59 p. m. de Costa Rica', () => {
  assert.equal(puedeCorrer(new Date('2026-11-16T12:59:00Z')), false) // 6:59 a. m.
  assert.equal(puedeCorrer(new Date('2026-11-16T13:00:00Z')), true)  // 7:00 a. m.
  assert.equal(puedeCorrer(new Date('2026-11-17T00:59:00Z')), true)  // 6:59 p. m.
  assert.equal(puedeCorrer(new Date('2026-11-17T01:00:00Z')), false) // 7:00 p. m.
  assert.equal(puedeCorrer(new Date('2026-11-17T01:30:00Z')), false) // 7:30 p. m.
})

test('a las 7:30 p. m. no llama a nada', async () => {
  const { deps, llamadas } = falsas()
  const r = await correrRonda(deps, new Date('2026-11-17T01:30:00Z'), { modo: 'real' })
  assert.equal(r.resultado, 'nada')
  assert.deepEqual([llamadas.dormida, llamadas.rondaDe, llamadas.leerDatos, llamadas.preguntar, llamadas.guardar, llamadas.anotar.length], [0, 0, 0, 0, 0, 0])
})

test('con ronda de hoy: nada, sin preguntar ni anotar', async () => {
  const { deps, llamadas } = falsas({ rondaDe: async () => ({ fecha: '2026-11-16', resultado: 'ok', detalle: '' }) })
  const r = await correrRonda(deps, AHORA, { modo: 'real' })
  assert.equal(r.resultado, 'nada')
  assert.equal(llamadas.preguntar, 0)
  assert.equal(llamadas.anotar.length, 0)
})

test('dormida: anota saltada y no pregunta', async () => {
  const { deps, llamadas } = falsas({ dormida: async () => true })
  const r = await correrRonda(deps, AHORA, { modo: 'real' })
  assert.equal(r.resultado, 'saltada')
  assert.deepEqual(llamadas.anotar, [{ fecha: '2026-11-16', resultado: 'saltada', detalle: 'La oficina dormía' }])
  assert.equal(llamadas.preguntar, 0)
})

test('si Claude contesta «no sé»: falla, sin guardar', async () => {
  const { deps, llamadas } = falsas({ preguntar: async () => 'no sé' })
  const r = await correrRonda(deps, AHORA, { modo: 'real' })
  assert.equal(r.resultado, 'falla')
  assert.equal(llamadas.guardar, 0)
  assert.equal(llamadas.anotar.length, 1)
  assert.equal(llamadas.anotar[0].resultado, 'falla')
  assert.ok(!llamadas.anotar[0].detalle.includes('\n'))
})

test('un error al preguntar queda como falla de una línea y de 200 letras como mucho', async () => {
  const { deps, llamadas } = falsas({ preguntar: async () => { throw new Error('mal\n' + 'x'.repeat(500)) } })
  const r = await correrRonda(deps, AHORA, { modo: 'real' })
  assert.equal(r.resultado, 'falla')
  assert.ok(llamadas.anotar[0].detalle.length <= 200)
  assert.ok(!llamadas.anotar[0].detalle.includes('\n'))
})

test('si se duerme entre la pregunta y el guardado: saltada, sin guardar', async () => {
  let n = 0
  const { deps, llamadas } = falsas({ dormida: async () => ++n > 1 })
  const r = await correrRonda(deps, AHORA, { modo: 'real' })
  assert.equal(r.resultado, 'saltada')
  assert.equal(llamadas.guardar, 0)
  assert.equal(llamadas.anotar[0].detalle, 'La oficina se durmió a media ronda')
})

test('todo bien: guarda una vez y anota ok con el resumen', async () => {
  const { deps, llamadas } = falsas()
  const r = await correrRonda(deps, AHORA, { modo: 'real' })
  assert.equal(r.resultado, 'ok')
  assert.equal(llamadas.guardar, 1)
  assert.deepEqual(llamadas.anotar, [{ fecha: '2026-11-16', resultado: 'ok', detalle: '0 publicaciones, 0 comentarios, 1 línea y 0 ideas' }])
})

test('el resumen suma las botadas', async () => {
  const sucia = JSON.stringify({ is_error: false, result: JSON.stringify({
    chat: [{ de: 'ana', para: null, texto: 'Hola', rincon: null, idea: null }, { de: 'fantasma', para: null, texto: 'Hola', rincon: null, idea: null }],
    posts: [], comentarios: [], escena: null,
  }) })
  const { deps, llamadas } = falsas({ preguntar: async () => sucia })
  await correrRonda(deps, AHORA, { modo: 'real' })
  assert.ok(llamadas.anotar[0].detalle.endsWith(' · 1 botada'), llamadas.anotar[0].detalle)
})

test('si guardar falla: falla «No se pudo guardar»', async () => {
  const { deps, llamadas } = falsas({ guardar: async () => { throw new Error('se cayó') } })
  const r = await correrRonda(deps, AHORA, { modo: 'real' })
  assert.equal(r.resultado, 'falla')
  assert.equal(llamadas.anotar[0].detalle, 'No se pudo guardar: se cayó')
})

test('probar pregunta, no guarda ni anota y se salta dormida y ronda de hoy', async () => {
  const { deps, llamadas } = falsas({ dormida: async () => true, rondaDe: async () => ({ fecha: '2026-11-16', resultado: 'ok', detalle: '' }) })
  const r = await correrRonda(deps, new Date('2026-11-17T01:30:00Z'), { modo: 'probar' })
  assert.equal(llamadas.preguntar, 1)
  assert.equal(llamadas.guardar, 0)
  assert.equal(llamadas.anotar.length, 0)
  assert.equal(r.resultado, 'ok')
  assert.ok(r.limpia)
})

test('simular no pregunta: sin respuesta da el pedido; con respuesta, lo limpio', async () => {
  const a = falsas()
  const sin = await correrRonda(a.deps, AHORA, { modo: 'simular' })
  assert.equal(a.llamadas.preguntar, 0)
  assert.ok(sin.pedido && sin.pedido.includes('Contexto del día'))
  assert.equal(sin.limpia, undefined)
  const b = falsas()
  const con = await correrRonda(b.deps, AHORA, { modo: 'simular', respuesta: BUENA })
  assert.equal(b.llamadas.preguntar, 0)
  assert.equal(b.llamadas.guardar, 0)
  assert.equal(b.llamadas.anotar.length, 0)
  assert.equal(con.limpia?.chat.length, 1)
})

test('con una escena esperando su foto, la ronda bota la escena nueva', async () => {
  const conEscena = JSON.stringify({ is_error: false, result: JSON.stringify({
    chat: [], posts: [], comentarios: [],
    escena: { de: 'ana', agentes: ['ana'], titulo: 'Almuerzo', donde: 'una soda', que: 'almuerza un casado', texto: 'Casado del día', likes: 1 },
  }) })
  const esperando = await correrRonda(falsas({ leerDatos: async () => ({ ...DATOS, escenaEsperando: true }) }).deps, AHORA, { modo: 'simular', respuesta: conEscena })
  assert.equal(esperando.limpia?.escena, null)
  assert.deepEqual(esperando.limpia?.botadas, ['escena: ya hay una esperando su foto'])
  const libre = await correrRonda(falsas().deps, AHORA, { modo: 'simular', respuesta: conEscena })
  assert.equal(libre.limpia?.escena?.titulo, 'Almuerzo')
})

test('argsClaude lleva --model sonnet y nunca bypassPermissions', () => {
  const a = argsClaude()
  assert.equal(a[a.indexOf('--model') + 1], 'sonnet')
  assert.ok(!a.some(x => x.includes('bypassPermissions')))
  assert.ok(a.includes('-p'))
})

test('argsClaude no le deja a claude escribir, salir a la red, leer archivos, buscar ni lanzar otros agentes', () => {
  const a = argsClaude()
  const negadas = a.slice(a.indexOf('--disallowedTools') + 1)
  for (const h of ['Bash', 'Edit', 'Write', 'NotebookEdit', 'WebFetch', 'WebSearch', 'Read', 'Glob', 'Grep', 'Task', 'Agent']) assert.ok(negadas.includes(h), h)
})

test('entornoClaude quita las llaves de API y deja el resto', () => {
  const e = entornoClaude({ ANTHROPIC_API_KEY: 'x', ANTHROPIC_AUTH_TOKEN: 'z', CLAUDE_CODE_OAUTH_TOKEN: 'y', PATH: '/bin' })
  assert.deepEqual(e, { CLAUDE_CODE_OAUTH_TOKEN: 'y', PATH: '/bin' })
})
