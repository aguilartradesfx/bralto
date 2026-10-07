import { test } from 'node:test'
import assert from 'node:assert/strict'
import { canCharge, expectedEnvironment, readInitEnvironment } from './environment.ts'

test('ambiente esperado: producción en el despliegue de producción, pruebas en el resto', () => {
  assert.equal(expectedEnvironment({ VERCEL_ENV: 'production' }), 'PROD')
  assert.equal(expectedEnvironment({ VERCEL_ENV: 'preview' }), 'TEST')
  assert.equal(expectedEnvironment({}), 'TEST')
})

test('ambiente esperado: PAYMENTS_EXPECTED_ENV lo fija a mano; un valor inválido se ignora', () => {
  assert.equal(expectedEnvironment({ VERCEL_ENV: 'preview', PAYMENTS_EXPECTED_ENV: 'PROD' }), 'PROD')
  assert.equal(expectedEnvironment({ VERCEL_ENV: 'production', PAYMENTS_EXPECTED_ENV: 'test' }), 'TEST')
  assert.equal(expectedEnvironment({ VERCEL_ENV: 'production', PAYMENTS_EXPECTED_ENV: 'quizás' }), 'PROD')
})

test('Init: lee environment (lo real) y, si no viene, el campo test de la documentación', () => {
  assert.equal(readInitEnvironment({ environment: 'TEST' }), 'TEST')
  assert.equal(readInitEnvironment({ environment: 'PROD' }), 'PROD')
  assert.equal(readInitEnvironment({ test: 1 }), 'TEST')
  assert.equal(readInitEnvironment({ test: '0' }), 'PROD')
})

test('Init: ante la duda es producción (el default seguro bloquea el cobro en pruebas)', () => {
  assert.equal(readInitEnvironment({}), 'PROD')
  assert.equal(readInitEnvironment({ environment: 'sandbox' }), 'PROD')
  assert.equal(readInitEnvironment(null), 'PROD')
})

test('solo se cobra si el ambiente real coincide con el esperado', () => {
  assert.equal(canCharge('TEST', 'TEST'), true)
  assert.equal(canCharge('PROD', 'PROD'), true)
  assert.equal(canCharge('PROD', 'TEST'), false)
  assert.equal(canCharge('TEST', 'PROD'), false)
})
