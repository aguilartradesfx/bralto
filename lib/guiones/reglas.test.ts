import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cambioPorAccion,
  contarFiltros,
  debeRefrescar,
  estadoEnSimple,
  filtrarGuiones,
  filtroDe,
  firmaGuiones,
  leerAccion,
  leerFiltro,
  puedeSubir,
  QUIETO_MS,
  quitarPendiente,
  resumenGuiones,
  sumarPendiente,
  sumarVideo,
  VENCE_PENDIENTE_MS,
  vigentes,
} from './reglas.ts'
import { ESTADOS, type EstadoGuion, type Pendiente, type VideoGuion } from './tipos.ts'

const ID = '3f1c2a7e-1111-4a1a-9a9a-000000000001'
const AHORA = new Date('2026-11-16T20:30:00.000Z')
const hace = (min: number) => new Date(AHORA.getTime() - min * 60_000).toISOString()
const video = (n: number): VideoGuion => ({ ruta: `${ID}/mi2k3x9fa1b2c${n}-toma-${n}.mov`, nombre: `toma-${n}.mov`, bytes: 1000 * n, subido_en: `2026-11-16T20:0${n}:00.000Z` })
const pendiente = (n: number, min = 5): Pendiente => ({ ruta: video(n).ruta, pedido_en: hace(min) })
const fila = (estado: EstadoGuion, videos: VideoGuion[] = [], pendientes: Pendiente[] = [], grabado_en: string | null = null) => ({ estado, videos, pendientes, grabado_en })

test('cada estado va en su pestaña (los que fallaron, con los que se editan) y Todos tiene todo', () => {
  assert.deepEqual(
    ESTADOS.map((e) => [e, filtroDe(e)]),
    [['listo', 'grabar'], ['subido', 'editando'], ['editando', 'editando'], ['programado', 'listos'], ['error', 'editando'], ['descartado', 'todos']],
  )
  const gs = ESTADOS.map((estado, i) => ({ id: String(i), estado }))
  assert.deepEqual(filtrarGuiones(gs, 'grabar').map((g) => g.estado), ['listo'])
  assert.deepEqual(filtrarGuiones(gs, 'editando').map((g) => g.estado), ['subido', 'editando', 'error'])
  assert.deepEqual(filtrarGuiones(gs, 'listos').map((g) => g.estado), ['programado'])
  assert.equal(filtrarGuiones(gs, 'todos').length, 6)
  assert.deepEqual(contarFiltros(gs), { grabar: 1, editando: 3, listos: 1, todos: 6 })
})

test('leerFiltro: «Por grabar» si no viene uno que exista', () => {
  assert.equal(leerFiltro('listos'), 'listos')
  assert.equal(leerFiltro('todos'), 'todos')
  for (const v of [undefined, '', 'nada', ['listos'], 3]) assert.equal(leerFiltro(v), 'grabar')
})

test('leerAccion: solo descartar o reabrir', () => {
  assert.deepEqual(leerAccion({ accion: 'descartar' }), { ok: true, accion: 'descartar' })
  assert.deepEqual(leerAccion({ accion: 'reabrir' }), { ok: true, accion: 'reabrir' })
  for (const b of [null, {}, { accion: 'borrar' }, 'descartar']) assert.deepEqual(leerAccion(b), { ok: false, error: 'Esa acción no existe' })
})

test('se sube video mientras está por grabar o ya subido', () => {
  assert.deepEqual(ESTADOS.filter(puedeSubir), ['listo', 'subido'])
})

test('descartar: por grabar, subido o con error; nunca lo que se edita o ya está programado', () => {
  for (const e of ['listo', 'subido', 'error'] as const) assert.deepEqual(cambioPorAccion(fila(e), 'descartar'), { cambios: { estado: 'descartado' } }, e)
  assert.deepEqual(cambioPorAccion(fila('editando'), 'descartar'), { status: 409, error: 'El servidor ya lo está editando: ya no se puede descartar' })
  assert.deepEqual(cambioPorAccion(fila('programado'), 'descartar'), { status: 409, error: 'Sus versiones ya están programadas: ya no se puede descartar' })
  assert.deepEqual(cambioPorAccion(fila('descartado'), 'descartar'), { status: 409, error: 'Este guion ya estaba descartado' })
})

test('reabrir: vuelve a «Por grabar», o a «Subido» si ya tiene videos (y se borra el error)', () => {
  assert.deepEqual(cambioPorAccion(fila('descartado'), 'reabrir'), { cambios: { estado: 'listo', detalle: null } })
  assert.deepEqual(cambioPorAccion(fila('descartado', [video(1)]), 'reabrir'), { cambios: { estado: 'subido', detalle: null } })
  assert.deepEqual(cambioPorAccion(fila('error', [video(1)]), 'reabrir'), { cambios: { estado: 'subido', detalle: null } })
  for (const e of ['listo', 'subido', 'editando', 'programado'] as const) {
    assert.deepEqual(cambioPorAccion(fila(e), 'reabrir'), { status: 409, error: 'Este guion está abierto: no hay nada que volver a abrir' }, e)
  }
})

test('sumarVideo: lo agrega, sale de las pendientes, pasa a «Subido» y el primero anota grabado_en', () => {
  assert.deepEqual(sumarVideo(fila('listo', [], [pendiente(1), pendiente(2)]), video(1), AHORA), {
    cambios: { videos: [video(1)], estado: 'subido', subido_en: video(1).subido_en, pendientes: [pendiente(2)], grabado_en: video(1).subido_en },
  })
})

test('sumarVideo: el segundo video no vuelve a tocar grabado_en', () => {
  const r = sumarVideo(fila('subido', [video(1)], [pendiente(2)], video(1).subido_en), video(2), AHORA)
  assert.deepEqual(r, { cambios: { videos: [video(1), video(2)], estado: 'subido', subido_en: video(2).subido_en, pendientes: [] } })
})

test('sumarVideo: de paso se van las pendientes vencidas (más de 2 horas)', () => {
  const r = sumarVideo(fila('subido', [], [pendiente(1), pendiente(3, 121)]), video(1), AHORA)
  assert.ok('cambios' in r && r.cambios)
  assert.deepEqual('pendientes' in r.cambios ? r.cambios.pendientes : null, [])
})

test('sumarVideo: el mismo video dos veces no se repite (solo se quita de pendientes si seguía ahí)', () => {
  assert.deepEqual(sumarVideo(fila('subido', [video(1)]), { ...video(1), subido_en: '2026-11-16T21:00:00.000Z' }, AHORA), { repetido: true, cambios: null })
  assert.deepEqual(sumarVideo(fila('subido', [video(1)], [pendiente(1), pendiente(2)]), video(1), AHORA), {
    repetido: true,
    cambios: { pendientes: [pendiente(2)] },
  })
  // aunque el guion ya esté en otro estado: ya estaba anotado
  assert.deepEqual(sumarVideo(fila('editando', [video(1)]), video(1), AHORA), { repetido: true, cambios: null })
})

test('sumarVideo: si ya no recibe videos, lo dice y no cambia nada', () => {
  assert.deepEqual(sumarVideo(fila('editando', [], [pendiente(1)]), video(1), AHORA), { status: 409, error: 'Este guion ya no recibe videos: ahora está «Editando»' })
  assert.deepEqual(sumarVideo(fila('descartado'), video(1), AHORA), { status: 409, error: 'Este guion ya no recibe videos: ahora está «Descartado»' })
  assert.equal('status' in sumarVideo(fila('programado'), video(1), AHORA), true)
  assert.equal('status' in sumarVideo(fila('error'), video(1), AHORA), true)
})

test('vigentes: una pendiente vale 2 horas (lo que vale la URL firmada)', () => {
  const justo = { ruta: 'a', pedido_en: new Date(AHORA.getTime() - VENCE_PENDIENTE_MS).toISOString() }
  const casi = { ruta: 'b', pedido_en: new Date(AHORA.getTime() - VENCE_PENDIENTE_MS + 1000).toISOString() }
  assert.deepEqual(vigentes([justo, casi, { ruta: 'c', pedido_en: 'no es fecha' }], AHORA), [casi])
})

test('sumarPendiente: al pedir la URL, la subida queda pendiente con su hora', () => {
  assert.deepEqual(sumarPendiente(fila('listo', [], [pendiente(1)]), video(2).ruta, AHORA), {
    cambios: { pendientes: [pendiente(1), { ruta: video(2).ruta, pedido_en: AHORA.toISOString() }] },
  })
})

test('sumarPendiente: «Reintentar» suelta la del intento que no subió, y las vencidas se van', () => {
  const r = sumarPendiente(fila('subido', [], [pendiente(1), pendiente(2), pendiente(3, 200)]), video(4).ruta, AHORA, video(1).ruta)
  assert.deepEqual(r, { cambios: { pendientes: [pendiente(2), { ruta: video(4).ruta, pedido_en: AHORA.toISOString() }] } })
})

test('sumarPendiente: solo mientras el guion recibe videos, y con un tope', () => {
  assert.deepEqual(sumarPendiente(fila('editando'), video(1).ruta, AHORA), { status: 409, error: 'Este guion ya no recibe videos: ahora está «Editando»' })
  const muchas = Array.from({ length: 30 }, (_, i) => ({ ruta: `r${i}`, pedido_en: hace(1) }))
  assert.equal(sumarPendiente(fila('listo', [], muchas), 'otra', AHORA).hasOwnProperty('status'), true)
})

test('quitarPendiente: al cancelar sale de la lista; si no estaba, no hay nada que escribir', () => {
  assert.deepEqual(quitarPendiente(fila('subido', [], [pendiente(1), pendiente(2)]), video(1).ruta, AHORA), { cambios: { pendientes: [pendiente(2)] } })
  assert.equal(quitarPendiente(fila('subido', [], [pendiente(2)]), video(1).ruta, AHORA), null)
})

test('debeRefrescar: pregunta mientras se ve y algo cambió o alguien hizo algo en los últimos 15 minutos', () => {
  const t = AHORA.getTime()
  assert.equal(debeRefrescar({ ahora: t, visible: true, ultimoCambio: t - 60_000, ultimaActividad: 0 }), true)
  assert.equal(debeRefrescar({ ahora: t, visible: false, ultimoCambio: t - 60_000, ultimaActividad: 0 }), false)
  assert.equal(debeRefrescar({ ahora: t, visible: true, ultimoCambio: t - QUIETO_MS, ultimaActividad: t - QUIETO_MS - 1 }), false)
  assert.equal(debeRefrescar({ ahora: t, visible: true, ultimoCambio: t - 2 * QUIETO_MS, ultimaActividad: t - 1000 }), true)
})

test('firmaGuiones: cambia cuando cambia un estado o una hora, no cuando solo se reordena la lista', () => {
  const a = { id: 'a', estado: 'subido' as const, actualizado_en: '2026-11-16T20:00:00Z' }
  const b = { id: 'b', estado: 'listo' as const, actualizado_en: '2026-11-16T19:00:00Z' }
  assert.equal(firmaGuiones([a, b]), firmaGuiones([b, a]))
  assert.notEqual(firmaGuiones([a, b]), firmaGuiones([{ ...a, estado: 'editando' }, b]))
  assert.notEqual(firmaGuiones([a, b]), firmaGuiones([{ ...a, actualizado_en: '2026-11-16T20:05:00Z' }, b]))
  assert.notEqual(firmaGuiones([a]), firmaGuiones([a, b]))
})

test('estadoEnSimple: cada estado dicho en simple', () => {
  assert.deepEqual(
    ESTADOS.map((estado) => estadoEnSimple({ estado, detalle: null }).texto),
    [
      'Por grabar',
      'Subido: el servidor lo edita en unos minutos',
      'Editando',
      'Listo: sus 5 versiones ya están programadas',
      'Algo falló: el servidor no dijo qué pasó',
      'Descartado',
    ],
  )
  assert.equal(estadoEnSimple({ estado: 'error', detalle: 'El video no tiene sonido' }).texto, 'Algo falló: El video no tiene sonido')
  assert.equal(estadoEnSimple({ estado: 'programado', detalle: 'una nota' }).texto, 'Listo: sus 5 versiones ya están programadas')
})

test('resumenGuiones: lo que hay, sin ceros', () => {
  assert.equal(resumenGuiones([]), 'Cada noche te llega un guion para grabar a cámara. Aquí lo lees y subes tu video.')
  assert.equal(resumenGuiones([{ estado: 'listo' }]), '1 por grabar')
  assert.equal(
    resumenGuiones([{ estado: 'listo' }, { estado: 'listo' }, { estado: 'subido' }, { estado: 'editando' }, { estado: 'error' }, { estado: 'programado' }, { estado: 'descartado' }]),
    '2 por grabar · 2 en edición · 1 falló · 1 listo',
  )
  assert.equal(resumenGuiones([{ estado: 'error' }, { estado: 'error' }, { estado: 'programado' }, { estado: 'programado' }]), '2 fallaron · 2 listos')
  assert.equal(resumenGuiones([{ estado: 'descartado' }, { estado: 'descartado' }]), '2 descartados')
})
