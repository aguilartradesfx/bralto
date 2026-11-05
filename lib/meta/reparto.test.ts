import { test } from 'node:test'
import assert from 'node:assert/strict'
import { firmaValida } from './webhook.ts'
import { firmar, leerDestinos, repartir, type Destino } from './reparto.ts'

const CLIENTE: Destino = { nombre: 'cliente', url: 'https://cliente.example/api/meta/webhook', cuentas: ['pag-1', 'ig-1', 'waba-1'] }

test('repartir: lo de las cuentas del cliente va al cliente y lo demás se queda en Bralto', () => {
  const aviso = {
    object: 'page',
    entry: [
      { id: 'pag-1', time: 1, messaging: [{ sender: { id: 'u1' } }] },
      { id: 'pag-bralto', time: 2, changes: [{ field: 'feed', value: {} }] },
    ],
  }
  const { envios, resto } = repartir(aviso, [CLIENTE])
  assert.equal(envios.length, 1)
  assert.equal(envios[0].destino.nombre, 'cliente')
  assert.deepEqual(envios[0].aviso, { object: 'page', entry: [aviso.entry[0]] })
  assert.deepEqual(resto, { object: 'page', entry: [aviso.entry[1]] })
})

test('repartir: Instagram por el id de la cuenta y WhatsApp por el de la cuenta de WhatsApp', () => {
  const ig = { object: 'instagram', entry: [{ id: 'ig-1', changes: [{ field: 'comments', value: {} }] }] }
  const wa = { object: 'whatsapp_business_account', entry: [{ id: 'waba-1', changes: [{ field: 'messages', value: {} }] }] }
  for (const aviso of [ig, wa]) {
    const { envios, resto } = repartir(aviso, [CLIENTE])
    assert.deepEqual(envios.map((e) => e.aviso), [aviso])
    assert.equal(resto, null) // no queda nada para Bralto
  }
})

test('repartir: sin clientes, o con un aviso raro, todo se queda en Bralto tal cual', () => {
  const aviso = { object: 'page', entry: [{ id: 'pag-1' }] }
  assert.deepEqual(repartir(aviso, []), { envios: [], resto: aviso })
  assert.deepEqual(repartir('no es un aviso', [CLIENTE]), { envios: [], resto: 'no es un aviso' })
})

test('firmar: la firma que pone Bralto es la que el cliente comprueba con la misma clave de la app', () => {
  const cuerpo = JSON.stringify({ object: 'page', entry: [{ id: 'pag-1' }] })
  assert.equal(firmaValida(cuerpo, firmar(cuerpo, 'clave'), 'clave'), true)
  assert.equal(firmaValida(cuerpo, firmar(cuerpo, 'clave'), 'otra'), false)
})

test('leerDestinos: lee la lista de clientes de META_REENVIOS y descarta lo que no sirve', () => {
  assert.deepEqual(leerDestinos(JSON.stringify([CLIENTE])), [CLIENTE])
  assert.deepEqual(leerDestinos(undefined), [])
  assert.deepEqual(leerDestinos('{roto'), [])
  assert.deepEqual(
    leerDestinos(JSON.stringify([CLIENTE, { nombre: 'sin url', cuentas: ['x'] }, { nombre: 'http', url: 'http://inseguro.example', cuentas: ['y'] }, { nombre: 'vacío', url: 'https://a.example', cuentas: [] }])),
    [CLIENTE],
  )
})
