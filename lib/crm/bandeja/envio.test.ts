import { test } from 'node:test'
import assert from 'node:assert/strict'
import { errorDeEnvio, FUERA_DE_SIETE_DIAS, FUERA_DE_VENTANA, planEnvio, textoParaEnviar } from './envio.ts'

const AHORA = new Date('2026-10-30T21:00:00Z')
const hace = (horas: number) => new Date(AHORA.getTime() - horas * 3600_000).toISOString()

test('planEnvio: dentro de 24 horas sale normal, por cualquier canal y de cualquiera', () => {
  for (const canal of ['instagram', 'messenger', 'whatsapp'] as const) {
    assert.deepEqual(planEnvio(canal, 'ale', hace(23), AHORA), { ok: true, etiquetaHumana: false })
    assert.deepEqual(planEnvio(canal, 'knox', hace(1), AHORA), { ok: true, etiquetaHumana: false })
  }
})

test('planEnvio: después de 24 horas Knox no manda; Ale sí por Instagram y Messenger hasta 7 días', () => {
  assert.deepEqual(planEnvio('instagram', 'knox', hace(25), AHORA), { ok: false, error: FUERA_DE_VENTANA })
  assert.deepEqual(planEnvio('whatsapp', 'ale', hace(25), AHORA), { ok: false, error: FUERA_DE_VENTANA })
  assert.deepEqual(planEnvio('instagram', 'ale', hace(30), AHORA), { ok: true, etiquetaHumana: true })
  assert.deepEqual(planEnvio('messenger', 'ale', hace(24 * 6), AHORA), { ok: true, etiquetaHumana: true })
  assert.deepEqual(planEnvio('messenger', 'ale', hace(24 * 8), AHORA), { ok: false, error: FUERA_DE_SIETE_DIAS })
  // Si no se sabe cuándo escribió la persona, Ale lo intenta (Zernio dice) y Knox no
  assert.deepEqual(planEnvio('instagram', 'ale', null, AHORA), { ok: true, etiquetaHumana: false })
  assert.deepEqual(planEnvio('instagram', 'knox', null, AHORA), { ok: false, error: FUERA_DE_VENTANA })
})

test('errorDeEnvio: lo que dijo Zernio, en palabras simples', () => {
  const r = (status: number, extra: Partial<{ codigo: string | null; detalle: string; codigoRed: number | null; subcodigoRed: number | null }> = {}) => ({
    ok: false as const,
    status,
    codigo: null,
    detalle: '',
    codigoRed: null,
    subcodigoRed: null,
    ...extra,
  })
  assert.equal(errorDeEnvio(r(400, { codigo: 'platform_api_error', codigoRed: 10, subcodigoRed: 2534022 })), FUERA_DE_VENTANA)
  assert.equal(errorDeEnvio(r(400, { codigo: 'platform_api_error', codigoRed: 10, subcodigoRed: 2018278 })), FUERA_DE_VENTANA)
  assert.equal(errorDeEnvio(r(400, { codigoRed: 131047 })), FUERA_DE_VENTANA)
  assert.equal(errorDeEnvio(r(403, { codigo: 'platform_api_error' })), FUERA_DE_VENTANA)
  assert.equal(errorDeEnvio(r(400, { detalle: 'This message is sent outside of allowed window.' })), FUERA_DE_VENTANA)
  assert.match(errorDeEnvio(r(0, { codigo: 'sin_conexion' })), /conexión/)
  assert.match(errorDeEnvio(r(401)), /clave/)
  assert.match(errorDeEnvio(r(429)), /esperar/)
  assert.match(errorDeEnvio(r(400, { codigoRed: 131056 })), /seguidos/)
  assert.match(errorDeEnvio(r(500)), /en un rato/)
  assert.match(errorDeEnvio(r(400, { detalle: 'algo raro' })), /desde la app/)
})

test('textoParaEnviar: no vacío y con un máximo', () => {
  assert.deepEqual(textoParaEnviar('  Hola\r\n¿cómo vas?  '), { ok: true, texto: 'Hola\n¿cómo vas?' })
  assert.deepEqual(textoParaEnviar('   '), { ok: false, error: 'Escribe el mensaje' })
  assert.deepEqual(textoParaEnviar(42), { ok: false, error: 'Escribe el mensaje' })
  assert.equal(textoParaEnviar('x'.repeat(2001)).ok, false)
})
