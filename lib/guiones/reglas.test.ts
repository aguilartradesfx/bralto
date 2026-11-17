import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  cambioPorAccion,
  contarFiltros,
  estadoEnSimple,
  filtrarGuiones,
  filtroDe,
  leerAccion,
  leerFiltro,
  puedeSubir,
  resumenGuiones,
  sumarVideo,
} from './reglas.ts'
import { ESTADOS, type EstadoGuion, type VideoGuion } from './tipos.ts'

const ID = '3f1c2a7e-1111-4a1a-9a9a-000000000001'
const video = (n: number): VideoGuion => ({ ruta: `${ID}/mi2k3x9fa1b2c${n}-toma-${n}.mov`, nombre: `toma-${n}.mov`, bytes: 1000 * n, subido_en: `2026-11-16T20:0${n}:00.000Z` })
const fila = (estado: EstadoGuion, videos: VideoGuion[] = []) => ({ estado, videos })

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

test('sumarVideo: lo agrega, pasa a «Subido» y anota cuándo llegó', () => {
  assert.deepEqual(sumarVideo(fila('listo'), video(1)), { cambios: { videos: [video(1)], estado: 'subido', subido_en: video(1).subido_en } })
  assert.deepEqual(sumarVideo(fila('subido', [video(1)]), video(2)), { cambios: { videos: [video(1), video(2)], estado: 'subido', subido_en: video(2).subido_en } })
})

test('sumarVideo: el mismo video dos veces no se repite', () => {
  assert.deepEqual(sumarVideo(fila('subido', [video(1)]), { ...video(1), subido_en: '2026-11-16T21:00:00.000Z' }), { repetido: true })
})

test('sumarVideo: si ya no recibe videos, lo dice', () => {
  assert.deepEqual(sumarVideo(fila('editando'), video(1)), { status: 409, error: 'Este guion ya no recibe videos: ahora está «Editando»' })
  assert.deepEqual(sumarVideo(fila('descartado'), video(1)), { status: 409, error: 'Este guion ya no recibe videos: ahora está «Descartado»' })
  assert.equal('status' in sumarVideo(fila('programado'), video(1)), true)
  assert.equal('status' in sumarVideo(fila('error'), video(1)), true)
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
