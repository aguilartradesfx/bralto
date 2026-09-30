import { test } from 'node:test'
import assert from 'node:assert/strict'
import { editableProposalFields } from './editable.ts'

test('deja pasar solo estado, prioridad y notas internas', () => {
  assert.deepEqual(
    editableProposalFields({ status: 'aceptada', priority: 'alta', internal_notes: 'ok' }),
    { status: 'aceptada', priority: 'alta', internal_notes: 'ok' },
  )
})

test('descarta columnas que el panel no edita', () => {
  assert.deepEqual(
    editableProposalFields({ status: 'perdido', generated_url: 'https://evil', submitted_by: 'x', id: 'y' }),
    { status: 'perdido' },
  )
})

test('cuerpo inválido → nada editable', () => {
  assert.deepEqual(editableProposalFields(null), {})
  assert.deepEqual(editableProposalFields('status'), {})
  assert.deepEqual(editableProposalFields({}), {})
})
