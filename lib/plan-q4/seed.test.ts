import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseTeamEmails, planSeedChanges, type ExistingTask } from './seed.ts'
import type { SeedTask } from './types.ts'

const seedTask = (id: string, titulo: string): SeedTask => ({
  id, bloque: 'b8', titulo, responsable: 'soshil', apoyo: null, fecha: '2026-10-16', tipo: 'unica', estado: 'pendiente',
})

test('planSeedChanges: nuevas, títulos, choques con tareas del panel y las que solo están en la base', () => {
  const file = [seedTask('B8-01', 'Tarea uno'), seedTask('B8-02', 'Tarea dos v2'), seedTask('B8-13', 'Nueva del plan'), seedTask('B8-14', 'Otra')]
  const existing: ExistingTask[] = [
    { id: 'B8-01', titulo: 'Tarea uno', origen: 'plan', nombre: null, descripcion: null, instrucciones: null },
    { id: 'B8-02', titulo: 'Tarea dos', origen: 'plan', nombre: null, descripcion: null, instrucciones: null },
    { id: 'B8-13', titulo: 'Creada en el panel', origen: 'panel', nombre: null, descripcion: null, instrucciones: null },
    { id: 'B8-09', titulo: 'Quitada del plan', origen: 'plan', nombre: null, descripcion: null, instrucciones: null },
  ]
  const c = planSeedChanges(file, existing)
  assert.deepEqual(c.nuevas.map((t) => t.id), ['B8-14'])
  assert.deepEqual(c.actualizadas.map((t) => [t.id, t.titulo]), [['B8-02', 'Tarea dos v2']])
  assert.deepEqual(c.choques, ['B8-13'])
  assert.deepEqual(c.soloEnBase, ['B8-09'])
  assert.equal(c.sinCambios, 1)
})

test('planSeedChanges: qué es y cómo hacerlo cuentan como cambio solo si el archivo los trae', () => {
  const file = [
    { ...seedTask('B8-01', 'Uno'), descripcion: 'Nueva', instrucciones: '1. Paso' },
    seedTask('B8-02', 'Dos'),
    { ...seedTask('B8-03', 'Tres'), descripcion: 'Igual', instrucciones: '1. Igual' },
  ]
  const existing: ExistingTask[] = [
    { id: 'B8-01', titulo: 'Uno', origen: 'plan', nombre: null, descripcion: 'Vieja', instrucciones: '1. Paso' },
    { id: 'B8-02', titulo: 'Dos', origen: 'plan', nombre: null, descripcion: 'Algo', instrucciones: 'x' },
    { id: 'B8-03', titulo: 'Tres', origen: 'plan', nombre: null, descripcion: 'Igual', instrucciones: '1. Igual' },
  ]
  const c = planSeedChanges(file, existing)
  assert.deepEqual(c.actualizadas.map((t) => t.id), ['B8-01'])
  assert.equal(c.sinCambios, 2)
  assert.deepEqual(c.sinTextos, ['B8-02'])
})

test('planSeedChanges: el nombre corto cuenta como cambio si el archivo lo trae', () => {
  const file = [{ ...seedTask('B8-01', 'Título largo'), nombre: 'Corto' }, seedTask('B8-02', 'Dos')]
  const existing: ExistingTask[] = [
    { id: 'B8-01', titulo: 'Título largo', origen: 'plan', nombre: null, descripcion: null, instrucciones: null },
    { id: 'B8-02', titulo: 'Dos', origen: 'plan', nombre: 'Viejo', descripcion: null, instrucciones: null },
  ]
  const c = planSeedChanges(file, existing)
  assert.deepEqual(c.actualizadas.map((t) => t.id), ['B8-01'])
  assert.equal(c.sinCambios, 1)
})

test('parseTeamEmails: slug:correo separados por coma, ignora lo inválido', () => {
  assert.deepEqual(parseTeamEmails(' ale:A@x.com , soshil:s@x.com,pedro:p@x.com,alina:'), { ale: 'a@x.com', soshil: 's@x.com' })
  assert.deepEqual(parseTeamEmails(undefined), {})
})
