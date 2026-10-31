import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cuantasCuentas, detalleVoz, estadoBandeja, estadoCorreo, etiquetaCorreo, haceLargo, motivo } from './conexiones.ts'

const AHORA = new Date('2026-10-30T23:42:00Z')
const antes = (ms: number) => new Date(AHORA.getTime() - ms).toISOString()

test('hace cuánto, con palabras', () => {
  assert.equal(haceLargo(antes(20_000), AHORA), 'hace un momento')
  assert.equal(haceLargo(antes(5 * 60_000), AHORA), 'hace 5 min')
  assert.equal(haceLargo(antes(2 * 3600_000), AHORA), 'hace 2 h')
  assert.equal(haceLargo(antes(26 * 3600_000), AHORA), 'hace 1 día')
  assert.equal(haceLargo(antes(3 * 86_400_000), AHORA), 'hace 3 días')
})

test('el correo: conectado con las dos cuentas; si responde una sola, se nota', () => {
  assert.deepEqual(estadoCorreo([{ ok: true }, { ok: true }]), { estado: 'conectado', conectadas: 2, total: 2 })
  assert.deepEqual(estadoCorreo([{ ok: true }, { ok: false }]), { estado: 'caido', conectadas: 1, total: 2 })
  assert.deepEqual(estadoCorreo([]), { estado: 'por-conectar', conectadas: 0, total: 0 })
  assert.equal(etiquetaCorreo({ conectadas: 2, total: 2 }), 'Conectado (2)')
  assert.equal(etiquetaCorreo({ conectadas: 1, total: 2 }), '1 de 2')
  assert.equal(etiquetaCorreo({ conectadas: 0, total: 2 }), null)
  assert.equal(etiquetaCorreo(null), null)
})

test('la bandeja: lo último que entró; más de dos días sin nada se avisa', () => {
  assert.deepEqual(estadoBandeja(antes(5 * 60_000), AHORA), { estado: 'conectado', detalle: 'Último mensaje hace 5 min' })
  assert.deepEqual(estadoBandeja(antes(3 * 86_400_000), AHORA), { estado: 'caido', detalle: 'Último mensaje hace 3 días' })
  assert.equal(estadoBandeja(null, AHORA).estado, 'por-conectar')
})

test('la voz, las cuentas y los errores', () => {
  assert.equal(detalleVoz(18_415, 90_000), '18.415 de 90.000 caracteres este mes')
  assert.equal(cuantasCuentas(1, 'de anuncios'), 'Ve 1 cuenta de anuncios')
  assert.equal(cuantasCuentas(3, 'de anuncios'), 'Ve 3 cuentas de anuncios')
  // Nunca el mensaje de afuera (puede traer enlaces con claves)
  assert.equal(motivo(new Error('https://graph.facebook.com/x?access_token=SECRETO')), 'No respondió')
  assert.equal(motivo(new Error('no respondió en 8 s')), 'No respondió a tiempo')
})
