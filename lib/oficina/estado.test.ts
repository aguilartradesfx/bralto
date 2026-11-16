import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estadoDe, numerosDe, paraTi, proximos, armarSnapshot } from './estado.ts'
import type { Agente, Marca, TipoMarca, EstadoOficina } from './tipos.ts'

const AHORA = new Date('2026-11-15T20:00:00Z')
const hace = (min: number) => new Date(AHORA.getTime() - min * 60000).toISOString()

const agente = (o: Partial<Agente> = {}): Agente => ({
  id: 'ana', nombre: 'Ana', oficio: 'revisa cosas', area: 'prueba', puesto: 1,
  aspecto: { tela: '#000', ropa: '#111', glifo: 'x' }, personalidad: '', frase: '',
  horario: null, cada_minutos: null, ruta: null, donde: 'servidor', estado_fijo: null,
  despierto_siempre: false, dura_min: 10, ultima_revision: null, ...o,
})
let n = 0
const marca = (tipo: TipoMarca, min: number, o: Partial<Marca> = {}): Marca => ({
  id: `m${++n}`, agente: 'ana', tipo, para: null, texto: 't', enlace: null, ref_tabla: null,
  ref_id: null, dura_seg: null, extra: null, visto_en: null, creado_en: hace(min), ...o,
})
const despierta: EstadoOficina = { dormida: false, desde: null, por: null }
const dormida: EstadoOficina = { dormida: true, desde: hace(5), por: 'x' }

test('empieza de hace 25 min con dura_min 10 → a-medias', () =>
  assert.equal(estadoDe(agente(), [marca('empieza', 25)], AHORA, despierta, []), 'a-medias'))
test('empieza de hace 15 min con dura_min 10 → trabajando', () =>
  assert.equal(estadoDe(agente(), [marca('empieza', 15)], AHORA, despierta, []), 'trabajando'))
test('empieza y luego pasa sigue trabajando', () =>
  assert.equal(estadoDe(agente(), [marca('pasa', 1), marca('empieza', 3)], AHORA, despierta, []), 'trabajando'))
test('durmiendo gana a todo', () => {
  const ms = [marca('empieza', 1)]
  assert.equal(estadoDe(agente({ estado_fijo: 'pendiente' }), ms, AHORA, dormida, []), 'durmiendo')
  assert.equal(estadoDe(agente(), ms, AHORA, dormida, []), 'durmiendo')
})
test('despierto_siempre sigue con su estado', () =>
  assert.equal(estadoDe(agente({ despierto_siempre: true }), [marca('empieza', 1)], AHORA, dormida, []), 'trabajando'))
test('estado_fijo pendiente', () =>
  assert.equal(estadoDe(agente({ estado_fijo: 'pendiente' }), [], AHORA, despierta, []), 'pendiente'))
test('publica reciente → publicando; vieja no', () => {
  assert.equal(estadoDe(agente(), [marca('publica', 3)], AHORA, despierta, []), 'publicando')
  assert.equal(estadoDe(agente(), [marca('publica', 30)], AHORA, despierta, []), 'descansando')
})
test('falla después de termina → fallo', () =>
  assert.equal(estadoDe(agente(), [marca('falla', 1), marca('termina', 5)], AHORA, despierta, []), 'fallo'))
test('termina después de falla → descansando', () =>
  assert.equal(estadoDe(agente(), [marca('termina', 1), marca('falla', 5)], AHORA, despierta, []), 'descansando'))
test('entrega pendiente → listo', () => {
  const e = marca('entrega', 60)
  assert.equal(estadoDe(agente(), [e], AHORA, despierta, [e]), 'listo')
})
test('estado_fijo pedido', () =>
  assert.equal(estadoDe(agente({ estado_fijo: 'pedido' }), [], AHORA, despierta, []), 'pedido'))
test('sin marcas → descansando; ignora marcas de otro agente', () => {
  assert.equal(estadoDe(agente(), [], AHORA, despierta, []), 'descansando')
  assert.equal(estadoDe(agente(), [marca('empieza', 1, { agente: 'otro' })], AHORA, despierta, []), 'descansando')
})

test('paraTi: filtra vistas, resueltas y viejas sin referencia', () => {
  const ok23 = marca('entrega', 23 * 60)
  const vieja = marca('entrega', 25 * 60)
  const vista = marca('entrega', 10, { visto_en: hace(1) })
  const resuelta = marca('entrega', 10, { ref_tabla: 'posts', ref_id: '1' })
  const conRef = marca('entrega', 3 * 24 * 60, { ref_tabla: 'posts', ref_id: '2' })
  const otra = marca('termina', 10)
  const r = paraTi([ok23, vieja, vista, resuelta, conRef, otra], new Set(['posts:1']), AHORA)
  assert.deepEqual(r.map((m) => m.id), [ok23.id, conRef.id])
})
test('paraTi: la más nueva primero', () => {
  const a = marca('entrega', 50), b = marca('entrega', 5)
  assert.deepEqual(paraTi([a, b], new Set(), AHORA).map((m) => m.id), [b.id, a.id])
})

test('numerosDe', () => {
  assert.deepEqual(numerosDe(undefined, AHORA), { tareas: 0, horas: 0, diasSinFallar: 0 })
  assert.equal(numerosDe({ agente: 'a', tareas: 3, segundos: 5400, ultima_falla: null, primera: null }, AHORA).horas, 1.5)
  const f = { agente: 'a', tareas: '4' as unknown as number, segundos: '360' as unknown as number, ultima_falla: hace(3 * 24 * 60 + 5), primera: hace(10 * 24 * 60) }
  assert.deepEqual(numerosDe(f, AHORA), { tareas: 4, horas: 0.1, diasSinFallar: 3 })
  assert.equal(numerosDe({ agente: 'a', tareas: 1, segundos: 0, ultima_falla: null, primera: hace(2 * 24 * 60) }, AHORA).diasSinFallar, 2)
  assert.equal(numerosDe({ agente: 'a', tareas: 1, segundos: 0, ultima_falla: '2030-01-01T00:00:00Z', primera: null }, AHORA).diasSinFallar, 0)
})

test('proximos: deja fuera cada_minutos 5, incluye la noche', () => {
  const ags = [
    agente({ id: 'rapido', horario: '*/5 * * * *', cada_minutos: 5 }),
    agente({ id: 'noche', oficio: 'produce de noche', horario: '0 1 * * *' }),
    agente({ id: 'fijo', horario: '0 2 * * *', estado_fijo: 'pedido' }),
    agente({ id: 'sin' }),
  ]
  const r = proximos(ags, [], AHORA)
  assert.deepEqual(r, [{ cuando: '7:00 p. m.', agente: 'noche', texto: 'produce de noche' }])
})
test('proximos: deja fuera cada_minutos 60 (cada hora es frecuente)', () => {
  const r = proximos([agente({ id: 'vero', horario: '0 * * * *', cada_minutos: 60 })], [], AHORA)
  assert.deepEqual(r, [])
})
test('proximos: publicaciones, pruebas, orden y límite', () => {
  const ags = [agente({ id: 'noche', oficio: 'o', horario: '0 1 * * *' })]
  const pubs = [
    { id: '1', titulo: 'Tarde', publicar_en: '2026-11-15T23:00:00Z', prueba: false },
    { id: '2', titulo: 'Prueba', publicar_en: '2026-11-15T22:00:00Z', prueba: true },
    { id: '3', titulo: 'Pasada', publicar_en: '2026-11-15T19:00:00Z', prueba: false },
  ]
  const r = proximos(ags, pubs, AHORA)
  assert.deepEqual(r.map((p) => [p.agente, p.texto]), [
    ['vero', 'prueba de «Prueba»'], ['zap', '«Tarde»'], ['noche', 'o'],
  ])
  assert.ok(!r.some((p) => p.texto.includes('Pasada')))
  assert.equal(proximos(ags, pubs, AHORA, 1).length, 1)
})

const base = { numeros: [], oficina: despierta, pubs: [], resueltas: new Set<string>() }
test('armarSnapshot con catálogo vacío no rompe', () => {
  const s = armarSnapshot({ ...base, agentes: [], marcas: [marca('empieza', 1)], entregas: [] }, AHORA)
  assert.deepEqual(s.agentes, [])
  assert.equal(s.ahora, AHORA.toISOString())
})
test('armarSnapshot ignora huérfanas', () => {
  const huerfana = marca('empieza', 1, { agente: 'fantasma' })
  const eh = marca('entrega', 1, { agente: 'fantasma' })
  const mia = marca('entrega', 2)
  const s = armarSnapshot({ ...base, agentes: [agente()], marcas: [huerfana, mia], entregas: [eh, mia] }, AHORA)
  assert.deepEqual(s.marcas.map((m) => m.id), [mia.id])
  assert.deepEqual(s.paraTi.map((m) => m.id), [mia.id])
  assert.equal(s.agentes[0].estado, 'listo')
  assert.deepEqual(s.agentes[0].numeros, { tareas: 0, horas: 0, diasSinFallar: 0 })
})
