import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  REDIRECCION,
  codigoValido,
  crearCodigo,
  falloDeVuelta,
  firmarEstado,
  invitacionVigente,
  leerCuentas,
  leerEstado,
  urlDialogo,
} from './conectar.ts'

const SECRETO = 'secreto-de-prueba'
const AHORA = Date.UTC(2026, 10, 9, 12)
const MINUTO = 60_000
const DATOS = { codigo: 'abcDEF123_-abcDEF123_-ab', nonce: 'n0nce-de-prueba', idioma: 'es' as const }

test('leerEstado: devuelve lo que se firmó', () => {
  assert.deepEqual(leerEstado(firmarEstado(DATOS, SECRETO, AHORA), SECRETO, AHORA + 5 * MINUTO), DATOS)
})

test('leerEstado: rechaza lo alterado o firmado con otra clave', () => {
  const estado = firmarEstado(DATOS, SECRETO, AHORA)
  assert.equal(leerEstado(estado.replace(DATOS.codigo, 'otro-codigo-de-otra-gente'), SECRETO, AHORA), null)
  assert.equal(leerEstado(firmarEstado({ ...DATOS, idioma: 'en' }, 'otra-clave', AHORA), SECRETO, AHORA), null)
  assert.equal(leerEstado(estado.slice(0, -2), SECRETO, AHORA), null)
  assert.equal(leerEstado('nada.que.ver', SECRETO, AHORA), null)
  assert.equal(leerEstado(null, SECRETO, AHORA), null)
  assert.equal(leerEstado(estado, '', AHORA), null) // sin clave configurada no se acepta nada
})

test('leerEstado: vence a los 15 minutos y no acepta fechas del futuro', () => {
  const estado = firmarEstado(DATOS, SECRETO, AHORA)
  assert.ok(leerEstado(estado, SECRETO, AHORA + 15 * MINUTO))
  assert.equal(leerEstado(estado, SECRETO, AHORA + 15 * MINUTO + 1), null)
  assert.equal(leerEstado(estado, SECRETO, AHORA - 2 * MINUTO), null)
})

test('urlDialogo: pide el código a Facebook con la configuración y vuelve a nuestra dirección', () => {
  const url = new URL(urlDialogo({ appId: '123', configId: '456', estado: 'est' }))
  assert.equal(url.origin + url.pathname, 'https://www.facebook.com/v26.0/dialog/oauth')
  assert.equal(url.searchParams.get('client_id'), '123')
  assert.equal(url.searchParams.get('config_id'), '456')
  assert.equal(url.searchParams.get('state'), 'est')
  assert.equal(url.searchParams.get('response_type'), 'code')
  assert.equal(url.searchParams.get('redirect_uri'), REDIRECCION)
})

test('leerCuentas: una por página, con su Instagram si tiene', () => {
  const cuentas = leerCuentas({
    data: [
      { id: '1', name: 'Con IG', access_token: 'tok1', instagram_business_account: { id: '91', username: 'con_ig' } },
      { id: '2', name: 'Sin IG', access_token: 'tok2' },
    ],
  })
  assert.deepEqual(cuentas, [
    { paginaId: '1', nombre: 'Con IG', token: 'tok1', instagramId: '91', instagramUsuario: 'con_ig' },
    { paginaId: '2', nombre: 'Sin IG', token: 'tok2', instagramId: null, instagramUsuario: null },
  ])
})

test('leerCuentas: lo que no trae id, nombre o clave no cuenta', () => {
  assert.deepEqual(leerCuentas({ data: [{ id: '1', name: 'Sin clave' }, { name: 'Sin id', access_token: 't' }, 'basura', null] }), [])
  assert.deepEqual(leerCuentas({}), [])
  assert.deepEqual(leerCuentas(null), [])
})

test('invitacionVigente: sirve hasta que vence', () => {
  const vence = new Date(AHORA + MINUTO).toISOString()
  assert.equal(invitacionVigente(vence, AHORA), true)
  assert.equal(invitacionVigente(vence, AHORA + 2 * MINUTO), false)
  assert.equal(invitacionVigente('no es fecha', AHORA), false)
})

test('codigoValido: solo acepta códigos con la forma de los que se crean', () => {
  assert.equal(codigoValido(crearCodigo()), true)
  assert.equal(codigoValido('corto'), false)
  assert.equal(codigoValido('con espacios y cosas raras!!'), false)
  assert.equal(codigoValido(undefined), false)
})

test('crearCodigo: nunca repite', () => {
  assert.notEqual(crearCodigo(), crearCodigo())
})

test('falloDeVuelta: si la persona dijo que no en Facebook, se lo decimos así', () => {
  assert.equal(falloDeVuelta(new URLSearchParams('error=access_denied&error_reason=user_denied')), 'cancelado')
  assert.equal(falloDeVuelta(new URLSearchParams('error=server_error')), 'fallo')
  assert.equal(falloDeVuelta(new URLSearchParams('state=x')), 'fallo') // volvió sin código
  assert.equal(falloDeVuelta(new URLSearchParams('code=abc&state=x')), null)
})
