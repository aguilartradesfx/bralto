import { test } from 'node:test'
import assert from 'node:assert/strict'
import { idEstado } from './servidor.ts'

test('idEstado lee OFICINA_ESTADO_ID y cae a 1', () => {
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '2' }), 2)
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '1' }), 1)
  assert.equal(idEstado({}), 1)
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '99' }), 1)
})
