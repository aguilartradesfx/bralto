import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_NOTA, parseNewTask, parseTaskPatch, parseWeekToggle } from './validate.ts'

test('parseTaskPatch: toma solo los campos que vienen', () => {
  assert.deepEqual(parseTaskPatch({ estado: 'en_curso' }), { ok: true, value: { estado: 'en_curso' } })
  assert.deepEqual(parseTaskPatch({ responsable: 'alina', apoyo: null, fecha: '2026-10-20' }), {
    ok: true, value: { responsable: 'alina', apoyo: null, fecha: '2026-10-20' },
  })
})

test('parseTaskPatch: la nota se recorta y vacía queda en null', () => {
  assert.deepEqual(parseTaskPatch({ nota: '  ojo con el pixel  ' }), { ok: true, value: { nota: 'ojo con el pixel' } })
  assert.deepEqual(parseTaskPatch({ nota: '   ' }), { ok: true, value: { nota: null } })
  assert.equal(parseTaskPatch({ nota: 'x'.repeat(MAX_NOTA + 1) }).ok, false)
})

test('parseTaskPatch: rechaza valores inválidos y cuerpos vacíos', () => {
  for (const body of [null, [], {}, { estado: 'listo' }, { responsable: 'pedro' }, { apoyo: 'pedro' }, { fecha: '2026-02-30' }, { nota: 5 }]) {
    assert.equal(parseTaskPatch(body).ok, false, JSON.stringify(body))
  }
})

test('parseNewTask: limpia el título y descarta apoyo igual al responsable', () => {
  assert.deepEqual(
    parseNewTask({ bloque: 'b8', titulo: '  Revisar EMQ ', responsable: 'soshil', apoyo: 'soshil', fecha: '2026-10-22', tipo: 'unica', descripcion: ' Qué es ', instrucciones: ' 1. Paso ' }, ['b8']),
    { ok: true, value: { bloque: 'b8', titulo: 'Revisar EMQ', responsable: 'soshil', apoyo: null, fecha: '2026-10-22', tipo: 'unica', descripcion: 'Qué es', instrucciones: '1. Paso' } },
  )
})

test('parseNewTask: bloque que no es de acción, título vacío, tipo raro', () => {
  const base = { bloque: 'b8', titulo: 'X', responsable: 'ale', fecha: '2026-10-22', tipo: 'unica', descripcion: 'D', instrucciones: 'I' }
  assert.equal(parseNewTask({ ...base, bloque: 'b0' }, ['b8']).ok, false)
  assert.equal(parseNewTask({ ...base, titulo: '  ' }, ['b8']).ok, false)
  assert.equal(parseNewTask({ ...base, tipo: 'mensual' }, ['b8']).ok, false)
  assert.equal(parseNewTask({ ...base, apoyo: '' }, ['b8']).ok, true)
  assert.equal(parseNewTask({ ...base, descripcion: '  ' }, ['b8']).ok, false)
  assert.equal(parseNewTask({ ...base, instrucciones: undefined }, ['b8']).ok, false)
})

test('parseTaskPatch: qué es y cómo hacerlo se recortan y no pueden quedar vacíos', () => {
  assert.deepEqual(parseTaskPatch({ descripcion: ' Nueva ', instrucciones: '1. A' }), { ok: true, value: { descripcion: 'Nueva', instrucciones: '1. A' } })
  assert.equal(parseTaskPatch({ descripcion: '  ' }).ok, false)
  assert.equal(parseTaskPatch({ instrucciones: 7 }).ok, false)
})

test('parseWeekToggle: semana en lunes y done booleano', () => {
  assert.deepEqual(parseWeekToggle({ week_start: '2026-10-12', done: true }), { ok: true, value: { week_start: '2026-10-12', done: true } })
  assert.equal(parseWeekToggle({ week_start: '2026-10-13', done: true }).ok, false)
  assert.equal(parseWeekToggle({ week_start: '2026-10-12', done: 'sí' }).ok, false)
})
