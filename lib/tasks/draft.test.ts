import { test } from 'node:test'
import assert from 'node:assert/strict'
import { normalizeChecklist, normalizeDraft, TaskInputSchema } from './draft.ts'

const VALID = {
  title: 'Diseñar 4 piezas para octubre',
  description: 'Para American Outlet.',
  checklist: ['Las 4 piezas están en Drive'],
  priority: 'alta',
  assignee_id: '6f1c2c4e-0b7a-4d3e-9a51-2f7c1b9d8e01',
  due_date: '2026-10-09',
}

test('normalizeChecklist: acepta textos u objetos, recorta y descarta vacíos', () => {
  assert.deepEqual(normalizeChecklist(['  a ', '', { text: 'b', done: true }, 3, { text: '  ' }]), [
    { text: 'a', done: false },
    { text: 'b', done: true },
  ])
  assert.deepEqual(normalizeChecklist('no es lista'), [])
})

test('normalizeChecklist: máximo 12 ítems', () => {
  assert.equal(normalizeChecklist(Array.from({ length: 15 }, (_, i) => `ítem ${i}`)).length, 12)
})

test('normalizeDraft: recorta título largo y limpia el checklist', () => {
  const draft = normalizeDraft({
    title: `  ${'x'.repeat(150)}  `,
    description: '  Descripción  ',
    checklist: [' uno ', '', 'dos', ...Array.from({ length: 12 }, () => 'extra')],
    priority: 'normal',
  })
  assert.equal(draft.title.length, 120)
  assert.equal(draft.description, 'Descripción')
  assert.deepEqual(draft.checklist.slice(0, 2), ['uno', 'dos'])
  assert.equal(draft.checklist.length, 10)
})

test('TaskInputSchema: acepta una tarea válida', () => {
  assert.equal(TaskInputSchema.safeParse(VALID).success, true)
  assert.equal(TaskInputSchema.safeParse({ ...VALID, assignee_id: null, due_date: null }).success, true)
})

test('TaskInputSchema: rechaza título vacío, fecha mal formada y prioridad inválida', () => {
  assert.equal(TaskInputSchema.safeParse({ ...VALID, title: '   ' }).success, false)
  assert.equal(TaskInputSchema.safeParse({ ...VALID, due_date: '09/10/2026' }).success, false)
  assert.equal(TaskInputSchema.safeParse({ ...VALID, priority: 'max' }).success, false)
  assert.equal(TaskInputSchema.safeParse({ ...VALID, assignee_id: 'ana' }).success, false)
})
