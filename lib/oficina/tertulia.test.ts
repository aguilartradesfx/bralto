import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarContexto, ctxValidar, pedidoTertulia, leerRespuesta, type DatosRonda } from './tertulia.ts'
import type { Agente, Marca } from './tipos.ts'

const agente = (id: string, extra: Partial<Agente> = {}): Agente => ({
  id, nombre: id.toUpperCase(), oficio: `Oficio ${id}`, area: 'Area', puesto: 1,
  aspecto: { tela: '#fff', ropa: '#000', glifo: 'x' }, personalidad: `Personalidad ${id}`, frase: `Frase ${id}`,
  horario: null, cada_minutos: null, ruta: null, donde: 'servidor', estado_fijo: null,
  despierto_siempre: false, dura_min: 5, ultima_revision: null, lugar: null, ...extra,
})

const marca = (n: number, extra: Partial<Marca> = {}): Marca => ({
  id: `mk${n}`, agente: 'ana', tipo: 'entrega', para: null, texto: `Hice ${n}`, enlace: null,
  ref_tabla: null, ref_id: null, dura_seg: null, extra: null, visto_en: null,
  creado_en: new Date(Date.UTC(2026, 10, 16, 20, 0) - n * 60_000).toISOString(), ...extra,
})

const datos = (extra: Partial<DatosRonda> = {}): DatosRonda => ({
  agentes: [agente('ana'), agente('beto'), agente('cata', { estado_fijo: 'pendiente' })],
  marcas: [marca(1, { agente: 'ana', para: 'beto', texto: 'Te paso 2 reels' })],
  semana: [
    { agente: 'ana', dia: '2026-11-15', tareas: 10, falla: false },
    { agente: 'ana', dia: '2026-11-16', tareas: 8, falla: true },
    { agente: 'beto', dia: '2026-11-16', tareas: 0, falla: false },
  ],
  pruebas: [{ titulo: 'Logos v2', estado: 'ganó', actualizado_en: '2026-11-16T10:00:00Z' }],
  reels: [{ titulo: 'Mi reel', version: 2, vistas: 1200, guardados: 30, publicado_en: '2026-11-15T10:00:00Z' }],
  ideasNuevas: [{ texto: 'Un reel de café', de: 'beto' }],
  foroReciente: [{ id: 'post-1', de: 'ana', tipo: 'nota', titulo: 'Hola', comentarios: 2 }],
  conFoto: ['ana'],
  prohibidos: ['Cliente Secreto'],
  escenaEsperando: false,
  ...extra,
})

const AHORA = new Date('2026-11-16T20:30:00Z')

test('armarContexto deja fuera al pendiente, marca con_foto y numera los hechos', () => {
  const c = armarContexto(datos(), AHORA)
  assert.deepEqual(c.agentes.map(a => a.id), ['ana', 'beto'])
  assert.equal(c.agentes[0].con_foto, true)
  assert.equal(c.agentes[1].con_foto, false)
  assert.equal(c.fecha, '2026-11-16')
  assert.equal(c.hora, '2:30 p. m.')
  const porClave = Object.fromEntries(c.hechos.map(h => [h.clave, h.texto]))
  assert.equal(porClave.m1, '1:59 p. m. · ANA → BETO: Te paso 2 reels')
  assert.equal(porClave.n1, 'ANA: 18 tareas en 7 días, 1 día con falla')
  assert.ok(!Object.values(porClave).some(t => t.startsWith('BETO:')))
  assert.ok(porClave.p1.includes('Logos v2'))
  assert.equal(porClave.r1, 'Reel «Mi reel», versión 2: 1200 vistas y 30 guardados')
  assert.deepEqual(c.ideas_pendientes, [{ texto: 'Un reel de café', de: 'beto' }])
  assert.equal(c.foro_reciente.length, 1)
})

test('armarContexto deja fuera las marcas de «empieza» y las de más de 24 h, y topa en 120', () => {
  const muchas = Array.from({ length: 200 }, (_, i) => marca(i + 1))
  const c = armarContexto(datos({ marcas: [...muchas, marca(300, { tipo: 'empieza' }), marca(2000)] }), AHORA)
  assert.equal(c.hechos.filter(h => h.clave.startsWith('m')).length, 120)
  assert.ok(c.hechos.find(h => h.clave === 'm1')!.texto.includes('Hice 1'))
  assert.ok(c.hechos.find(h => h.clave === 'm120')!.texto.endsWith('Hice 120'))
})

test('ctxValidar arma hechos y postsViejos, y deja prohibidos igual', () => {
  const d = datos()
  const c = armarContexto(d, AHORA)
  const v = ctxValidar(d, c, AHORA)
  assert.deepEqual([...v.hechos].sort(), c.hechos.map(h => h.clave).sort())
  assert.deepEqual([...v.postsViejos], ['post-1'])
  assert.deepEqual([...v.hablan], ['ana', 'beto'])
  assert.deepEqual([...v.conFoto], ['ana'])
  assert.deepEqual(v.prohibidos, ['Cliente Secreto'])
  assert.equal(v.ahora, AHORA)
})

test('armarContexto tapa los nombres de clientes en todo el texto libre', () => {
  const d = datos({
    marcas: [marca(1, { texto: 'Cerré con cliente secreto hoy' })],
    ideasNuevas: [{ texto: 'Reel para CLIENTE SECRETO', de: 'beto' }],
    reels: [{ titulo: 'Cliente  Sécreto v2', version: null, vistas: null, guardados: null, publicado_en: '2026-11-15T10:00:00Z' }],
    foroReciente: [{ id: 'post-1', de: 'ana', tipo: 'nota', titulo: 'Sobre Cliente Secreto', comentarios: 0 }],
    prohibidos: [null as unknown as string, '', 'Cliente Secreto'],
  })
  const c = armarContexto(d, AHORA)
  const json = JSON.stringify(c).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  assert.ok(!json.includes('cliente secreto') && !/cliente\s+secreto/.test(json))
  assert.ok(c.hechos.find(h => h.clave === 'm1')!.texto.endsWith('Cerré con un cliente hoy'))
  assert.equal(c.ideas_pendientes[0].texto, 'Reel para un cliente')
  assert.equal(c.foro_reciente[0].titulo, 'Sobre un cliente')
})

test('pedidoTertulia trae el contexto y las reglas', () => {
  const c = armarContexto(datos(), AHORA)
  const p = pedidoTertulia(c)
  for (const t of ['pana', 'tantito', 'chévere', 'mae', 'deay', 'compa', 'basada_en', 'rincon', 'usted', 'tenés', 'sin texto antes ni después', '30', '12', '120']) {
    assert.ok(p.includes(t), `falta ${t}`)
  }
  assert.ok(p.includes(JSON.stringify(c)))
})

test('la escena que ya espera su foto pasa al contexto y al validador', () => {
  for (const espera of [false, true]) {
    const d = datos({ escenaEsperando: espera })
    const c = armarContexto(d, AHORA)
    assert.equal(c.escena_esperando, espera)
    assert.equal(ctxValidar(d, c, AHORA).escenaEsperando, espera)
  }
})

test('pedidoTertulia: si ya hay una escena esperando su foto, pide "escena": null', () => {
  const p = pedidoTertulia(armarContexto(datos({ escenaEsperando: true }), AHORA))
  assert.match(p, /Si «escena_esperando» es true[^\n]*"escena": null/)
  assert.ok(p.includes('"escena_esperando":true'))
  assert.ok(pedidoTertulia(armarContexto(datos(), AHORA)).includes('"escena_esperando":false'))
})

test('pedidoTertulia: los ejemplos de escena son los del diseño (soda, playa, moto, oficina)', () => {
  const p = pedidoTertulia(armarContexto(datos(), AHORA))
  for (const t of ['almuerzo en una soda', 'la playa', 'en moto', 'la oficina']) assert.ok(p.includes(t), t)
  assert.ok(!p.includes('lugar de la oficina'))
})

test('leerRespuesta lee el resultado, con o sin cercas', () => {
  const sal = (r: string) => JSON.stringify({ type: 'result', is_error: false, result: r })
  assert.deepEqual(leerRespuesta(sal('{"chat":[]}')), { chat: [] })
  assert.deepEqual(leerRespuesta(sal('```json\n{"chat":[]}\n```')), { chat: [] })
  assert.deepEqual(leerRespuesta(sal('Claro:\n{"chat":[1]}\nlisto')), { chat: [1] })
})

test('leerRespuesta lanza si Claude falló o no hay JSON', () => {
  assert.throws(() => leerRespuesta(JSON.stringify({ is_error: true, result: 'x' })), /Claude no contestó bien/)
  assert.throws(() => leerRespuesta(JSON.stringify({ is_error: false })), /Claude no contestó bien/)
  assert.throws(() => leerRespuesta(JSON.stringify({ is_error: false, result: 'no sé' })), /La respuesta no es JSON/)
  assert.throws(() => leerRespuesta(JSON.stringify({ is_error: false, result: '{roto}' })), /La respuesta no es JSON/)
})
