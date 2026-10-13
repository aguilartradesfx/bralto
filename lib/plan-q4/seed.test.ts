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
    { id: 'B8-01', titulo: 'Tarea uno', origen: 'plan' },
    { id: 'B8-02', titulo: 'Tarea dos', origen: 'plan' },
    { id: 'B8-13', titulo: 'Creada en el panel', origen: 'panel' },
    { id: 'B8-09', titulo: 'Quitada del plan', origen: 'plan' },
  ]
  const c = planSeedChanges(file, existing)
  assert.deepEqual(c.nuevas.map((t) => t.id), ['B8-14'])
  assert.deepEqual(c.renombradas.map((t) => [t.id, t.titulo]), [['B8-02', 'Tarea dos v2']])
  assert.deepEqual(c.choques, ['B8-13'])
  assert.deepEqual(c.soloEnBase, ['B8-09'])
  assert.equal(c.sinCambios, 1)
})

test('parseTeamEmails: slug:correo separados por coma, ignora lo inválido', () => {
  assert.deepEqual(parseTeamEmails(' ale:A@x.com , soshil:s@x.com,pedro:p@x.com,alina:'), { ale: 'a@x.com', soshil: 's@x.com' })
  assert.deepEqual(parseTeamEmails(undefined), {})
})
