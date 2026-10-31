import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clienteZernio } from './cliente.ts'

// fetch falso: anota cada pedido y contesta lo que se le diga. Nunca sale nada de verdad
function falso(respuestas: { status: number; cuerpo: unknown }[]) {
  const pedidos: { url: string; init: RequestInit }[] = []
  const f = (async (url: string | URL | Request, init: RequestInit = {}) => {
    pedidos.push({ url: String(url), init })
    const r = respuestas.shift() ?? { status: 500, cuerpo: {} }
    return new Response(JSON.stringify(r.cuerpo), { status: r.status, headers: { 'Content-Type': 'application/json' } })
  }) as typeof fetch
  return { pedidos, f }
}

test('conversaciones: activas, de a 100, con el cursor que siga', async () => {
  const { pedidos, f } = falso([
    { status: 200, cuerpo: { data: [{ id: '1000000000000001', platform: 'instagram' }], pagination: { hasMore: true, nextCursor: 'c2' } } },
    { status: 200, cuerpo: { data: [], pagination: { hasMore: false, nextCursor: null } } },
  ])
  const z = clienteZernio({ clave: 'clave-falsa', fetch: f })
  const a = await z.conversaciones()
  assert.deepEqual(a, { conversaciones: [{ id: '1000000000000001', platform: 'instagram' }], siguiente: 'c2' })
  const b = await z.conversaciones({ cursor: 'c2' })
  assert.deepEqual(b, { conversaciones: [], siguiente: null })
  assert.equal(pedidos[0].url, 'https://zernio.com/api/v1/inbox/conversations?status=active&limit=100')
  assert.equal(pedidos[1].url, 'https://zernio.com/api/v1/inbox/conversations?status=active&limit=100&cursor=c2')
  assert.deepEqual(pedidos[0].init.headers, { Authorization: 'Bearer clave-falsa' })
})

test('mensajes: de la cuenta, los más nuevos primero', async () => {
  const { pedidos, f } = falso([{ status: 200, cuerpo: { messages: [{ id: 'mid-1' }], pagination: { hasMore: false } } }])
  const r = await clienteZernio({ clave: 'k', fetch: f }).mensajes('1000000000000001', 'cuenta-ig', { limite: 50 })
  assert.deepEqual(r, { mensajes: [{ id: 'mid-1' }], siguiente: null })
  assert.equal(pedidos[0].url, 'https://zernio.com/api/v1/inbox/conversations/1000000000000001/messages?accountId=cuenta-ig&limit=50&sortOrder=desc')
})

test('un error de Zernio al leer se lanza con el código', async () => {
  const { f } = falso([{ status: 401, cuerpo: { error: 'Unauthorized' } }])
  await assert.rejects(clienteZernio({ clave: 'k', fetch: f }).conversaciones(), /HTTP 401/)
})

test('enviar: POST con la cuenta, el texto y la clave de idempotencia', async () => {
  const { pedidos, f } = falso([{ status: 200, cuerpo: { success: true, data: { messageId: 'mid-nuevo', conversationId: 'interno' } } }])
  const r = await clienteZernio({ clave: 'k', fetch: f }).enviar('1000000000000001', { accountId: 'cuenta-ig', message: 'Hola 👋' }, 'clave-1')
  assert.deepEqual(r, { ok: true, mensajeId: 'mid-nuevo' })
  const { url, init } = pedidos[0]
  assert.equal(url, 'https://zernio.com/api/v1/inbox/conversations/1000000000000001/messages')
  assert.equal(init.method, 'POST')
  assert.deepEqual(init.headers, { Authorization: 'Bearer k', 'Content-Type': 'application/json', 'Idempotency-Key': 'clave-1' })
  assert.deepEqual(JSON.parse(String(init.body)), { accountId: 'cuenta-ig', message: 'Hola 👋' })
})

test('enviar: si Meta lo rechaza, devuelve el código y el subcódigo para explicarlo', async () => {
  const { f } = falso([
    {
      status: 400,
      cuerpo: { error: 'Outside of allowed window', type: 'platform_error', code: 'platform_api_error', platform: 'instagram', platformError: { code: 10, subcode: 2534022 } },
    },
  ])
  const r = await clienteZernio({ clave: 'k', fetch: f }).enviar('x', { accountId: 'c', message: 'hola' }, 'clave-2')
  assert.deepEqual(r, { ok: false, status: 400, codigo: 'platform_api_error', detalle: 'Outside of allowed window', codigoRed: 10, subcodigoRed: 2534022 })
})

test('enviar: sin conexión no revienta', async () => {
  const f = (async () => {
    throw new Error('red caída')
  }) as typeof fetch
  const r = await clienteZernio({ clave: 'k', fetch: f }).enviar('x', { accountId: 'c', message: 'hola' }, 'clave-3')
  assert.deepEqual(r, { ok: false, status: 0, codigo: 'sin_conexion', detalle: 'red caída', codigoRed: null, subcodigoRed: null })
})
