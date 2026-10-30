import { test } from 'node:test'
import assert from 'node:assert/strict'
import { ESTADOS_EDITABLES, mañanaVacia, sePuedeEditar } from './reglas.ts'
import type { Estado } from '../redes/publicacion/tipos.ts'

test('solo se cambian los borradores y los programados', () => {
  assert.deepEqual([...ESTADOS_EDITABLES], ['borrador', 'programado'])
  assert.equal(sePuedeEditar('borrador'), true)
  assert.equal(sePuedeEditar('programado'), true)
  for (const estado of ['publicando', 'publicado', 'error', 'cancelado'] as const) {
    assert.equal(sePuedeEditar(estado), false, estado)
  }
})

const p = (publicar_en: string, estado: Estado = 'programado') => ({ publicar_en, estado })

test('mañana vacía: mañana, en Costa Rica, no sale nada', () => {
  const ahora = new Date('2026-10-30T20:00:00Z') // viernes 30, 14:00 en Costa Rica
  assert.equal(mañanaVacia([], ahora), true)
  assert.equal(mañanaVacia([p('2026-10-31T16:00:00+00:00')], ahora), false) // sábado 10:00
  assert.equal(mañanaVacia([p('2026-11-01T05:30:00+00:00')], ahora), false) // sábado 23:30 (domingo en UTC)
  // Hoy a las 18:00 ya es 31 en UTC, pero en Costa Rica es hoy: mañana sigue vacía
  assert.equal(mañanaVacia([p('2026-10-31T00:00:00+00:00')], ahora), true)
  assert.equal(mañanaVacia([p('2026-11-01T06:00:00+00:00')], ahora), true) // domingo 00:00
})

test('un borrador, un error o uno cancelado no cuentan: no van a salir', () => {
  const ahora = new Date('2026-10-30T20:00:00Z')
  for (const estado of ['borrador', 'error', 'cancelado'] as const) {
    assert.equal(mañanaVacia([p('2026-10-31T16:00:00+00:00', estado)], ahora), true, estado)
  }
  assert.equal(mañanaVacia([p('2026-10-31T16:00:00+00:00', 'borrador'), p('2026-10-31T22:00:00+00:00')], ahora), false)
})

test('a las 11 p. m. de Costa Rica, mañana es el día siguiente de Costa Rica, no el de UTC', () => {
  const ahora = new Date('2026-10-31T05:00:00Z') // viernes 30, 23:00 en Costa Rica (sábado en UTC)
  assert.equal(mañanaVacia([p('2026-10-31T16:00:00+00:00')], ahora), false) // sábado 10:00
  assert.equal(mañanaVacia([p('2026-11-01T16:00:00+00:00')], ahora), true) // domingo 10:00
})
