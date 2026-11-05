import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { firmaValida, leerEventos, respuestaVerificacion } from './webhook.ts'

const SECRETO = 'secreto-de-prueba'
const firmar = (cuerpo: string, s = SECRETO) => `sha256=${createHmac('sha256', s).update(cuerpo).digest('hex')}`

test('firmaValida: acepta la firma de Meta del cuerpo exacto y rechaza todo lo demás', () => {
  const cuerpo = '{"object":"instagram","entry":[]}'
  assert.equal(firmaValida(cuerpo, firmar(cuerpo), SECRETO), true)
  assert.equal(firmaValida(cuerpo + ' ', firmar(cuerpo), SECRETO), false) // un espacio de más ya no es lo que firmó Meta
  assert.equal(firmaValida(cuerpo, firmar(cuerpo, 'otro'), SECRETO), false)
  assert.equal(firmaValida(cuerpo, null, SECRETO), false)
  assert.equal(firmaValida(cuerpo, 'sha256=corta', SECRETO), false)
  assert.equal(firmaValida(cuerpo, firmar(cuerpo).replace('sha256=', 'sha1='), SECRETO), false)
})

test('respuestaVerificacion: devuelve el challenge solo si el token es el nuestro', () => {
  const p = (o: Record<string, string>) => new URLSearchParams(o)
  assert.equal(respuestaVerificacion(p({ 'hub.mode': 'subscribe', 'hub.verify_token': 'tok', 'hub.challenge': '123' }), 'tok'), '123')
  assert.equal(respuestaVerificacion(p({ 'hub.mode': 'subscribe', 'hub.verify_token': 'otro', 'hub.challenge': '123' }), 'tok'), null)
  assert.equal(respuestaVerificacion(p({ 'hub.mode': 'unsubscribe', 'hub.verify_token': 'tok', 'hub.challenge': '123' }), 'tok'), null)
  assert.equal(respuestaVerificacion(p({ 'hub.mode': 'subscribe', 'hub.verify_token': '', 'hub.challenge': '123' }), ''), null) // sin token configurado no se verifica nada
})

test('leerEventos: un evento por cambio o mensaje, con la cuenta y el campo', () => {
  const eventos = leerEventos({
    object: 'instagram',
    entry: [
      {
        id: '1784',
        time: 1,
        changes: [{ field: 'comments', value: { id: 'c1', text: 'JARVIS', from: { id: 'u1', username: 'ana' }, media: { id: 'm1' } } }],
      },
      { id: '1784', time: 2, messaging: [{ sender: { id: 'u1' }, recipient: { id: '1784' }, postback: { payload: 'SI' } }] },
    ],
  })
  assert.deepEqual(
    eventos.map((e) => [e.objeto, e.cuenta, e.campo]),
    [
      ['instagram', '1784', 'comments'],
      ['instagram', '1784', 'messaging'],
    ],
  )
  assert.equal((eventos[0].datos as { text: string }).text, 'JARVIS')
})

test('leerEventos: WhatsApp trae sus mensajes como cambios de la cuenta de WhatsApp', () => {
  const eventos = leerEventos({
    object: 'whatsapp_business_account',
    entry: [{ id: '2216', changes: [{ field: 'messages', value: { messages: [{ from: '506', text: { body: 'hola' } }] } }] }],
  })
  assert.deepEqual(eventos.map((e) => [e.objeto, e.cuenta, e.campo]), [['whatsapp_business_account', '2216', 'messages']])
})

test('leerEventos: lo que no tiene forma de aviso de Meta no rompe nada y no da eventos', () => {
  assert.deepEqual(leerEventos(null), [])
  assert.deepEqual(leerEventos({ object: 'page' }), [])
  assert.deepEqual(leerEventos({ object: 'page', entry: 'x' }), [])
  assert.deepEqual(leerEventos({ entry: [{ id: '1', changes: [{ field: 'feed' }] }] }), [])
})
