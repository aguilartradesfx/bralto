import { test } from 'node:test'
import assert from 'node:assert/strict'
import Anthropic from '@anthropic-ai/sdk'
import { formulateTask, TaskDraftRefusedError, TaskDraftUnavailableError } from './formulate.ts'

// Cliente falso: solo implementa lo que usa formulateTask
function stubClient(create: () => Promise<unknown>): Anthropic {
  return { beta: { messages: { create } } } as unknown as Anthropic
}

const draftJson = JSON.stringify({
  title: '  Diseñar 4 posts  ',
  description: 'Para octubre.',
  checklist: ['Las 4 piezas están en Drive', ''],
  priority: 'alta',
})

test('formulateTask: devuelve el borrador normalizado', async () => {
  const client = stubClient(async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: draftJson }] }))
  assert.deepEqual(await formulateTask('idea', client), {
    title: 'Diseñar 4 posts',
    description: 'Para octubre.',
    checklist: ['Las 4 piezas están en Drive'],
    priority: 'alta',
  })
})

test('formulateTask: un rechazo de la IA se informa como tal', async () => {
  const client = stubClient(async () => ({ stop_reason: 'refusal', content: [{ type: 'text', text: 'No puedo' }] }))
  await assert.rejects(formulateTask('idea', client), TaskDraftRefusedError)
})

test('formulateTask: respuesta cortada o inválida → no disponible', async () => {
  const cut = stubClient(async () => ({ stop_reason: 'max_tokens', content: [{ type: 'text', text: draftJson.slice(0, 20) }] }))
  await assert.rejects(formulateTask('idea', cut), TaskDraftUnavailableError)
  const bad = stubClient(async () => ({ stop_reason: 'end_turn', content: [{ type: 'text', text: '{"title": 3}' }] }))
  await assert.rejects(formulateTask('idea', bad), TaskDraftUnavailableError)
})

test('formulateTask: errores del SDK (red, timeout, 5xx) → no disponible', async () => {
  const client = stubClient(async () => { throw new Anthropic.AnthropicError('timeout') })
  await assert.rejects(formulateTask('idea', client), TaskDraftUnavailableError)
})
