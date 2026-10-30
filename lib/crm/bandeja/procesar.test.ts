import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { AutorMensaje } from '../../knox/conversar/tipos.ts'
import type { EntradaKnox } from './knox.ts'
import { PAUSA_ALE_MS, procesarEvento, type AlmacenBandeja } from './procesar.ts'
import { leerEvento, type DatosMensaje } from './zernio.ts'

// Una base en memoria y eventos inventados
function memoria() {
  const conversaciones = new Map<string, { id: string; contactoId: string | null }>()
  const mensajes = new Map<string, { id: string; m: DatosMensaje; autor: AutorMensaje; estado?: string; error?: string | null }>()
  const pausas: { id: string; hasta: string }[] = []
  const descartes: string[] = []
  const leidas: { id: string; en: string }[] = []
  const otraApp: { id: string; en: string | null }[] = []
  const historiales: { id: string; mensajesAntes: number; antesDe: string }[] = []
  const almacen: AlmacenBandeja = {
    async conversacion(d) {
      const nueva = !conversaciones.has(d.externoId)
      const c = conversaciones.get(d.externoId) ?? { id: `conv-${conversaciones.size + 1}`, contactoId: null }
      conversaciones.set(d.externoId, c)
      return { ...c, canal: d.canal, nueva }
    },
    async historial(conv, _d, antesDe) {
      historiales.push({ id: conv.id, mensajesAntes: mensajes.size, antesDe })
    },
    async guardarMensaje(_conv, m, autor) {
      if (mensajes.has(m.externoId)) return null
      const id = `msg-${mensajes.size + 1}`
      mensajes.set(m.externoId, { id, m, autor })
      return id
    },
    async pausarKnox(id, hasta) {
      pausas.push({ id, hasta: hasta.toISOString() })
    },
    async descartarPendientes(id) {
      descartes.push(id)
    },
    async marcarLeida(id, en) {
      leidas.push({ id, en })
    },
    async otraApp(id, en) {
      otraApp.push({ id, en })
    },
    async estadoMensaje(externoId, estado, error) {
      const x = mensajes.get(externoId)
      if (!x) return false
      x.estado = estado
      x.error = error
      return true
    },
  }
  return { almacen, conversaciones, mensajes, pausas, descartes, leidas, otraApp, historiales }
}

const evento = (event: string, mensaje: Record<string, unknown> = {}, extra: Record<string, unknown> = {}) =>
  leerEvento({
    id: `ev-${Math.random()}`,
    event,
    timestamp: '2026-10-30T20:00:05Z',
    message: {
      id: 'interno-1',
      conversationId: 'interno-conv',
      platform: 'facebook',
      platformMessageId: 'mid-1',
      direction: event === 'message.sent' ? 'outgoing' : 'incoming',
      text: 'Hola',
      attachments: [],
      sender: { id: '3000000000000003', name: 'Dani Prueba' },
      sentAt: '2026-10-30T20:00:00.000Z',
      isRead: false,
      ...mensaje,
    },
    conversation: { id: 'interno-conv', platformConversationId: '3000000000000003', participantId: '3000000000000003', participantName: 'Dani Prueba' },
    account: { accountId: 'cuenta-fb', platform: 'facebook', username: 'Página Prueba' },
    metadata: null,
    ...extra,
  })

function knoxFalso() {
  const llamadas: EntradaKnox[] = []
  return { llamadas, knox: async (e: EntradaKnox) => (llamadas.push(e), 'borrador') }
}

test('message.received: guarda el mensaje y se lo pasa a Knox, una sola vez', async () => {
  const db = memoria()
  const k = knoxFalso()
  const ev = evento('message.received')
  assert.ok(ev)
  assert.equal(await procesarEvento(ev, db.almacen, k.knox), 'guardado; knox: borrador')
  assert.equal(db.mensajes.get('mid-1')?.autor, 'persona')
  assert.deepEqual(k.llamadas, [
    { conversacionId: 'conv-1', mensajeId: 'msg-1', standby: false, interactivo: false, remitente: { id: '3000000000000003', usuario: null, telefono: null } },
  ])
  assert.deepEqual(db.otraApp, [{ id: 'conv-1', en: null }])
  // Zernio reintenta: el unique dice que ya estaba y Knox no lo vuelve a ver
  assert.equal(await procesarEvento(ev, db.almacen, k.knox), 'ya estaba')
  assert.equal(k.llamadas.length, 1)
  assert.equal(db.mensajes.size, 1)
})

test('message.received en standby: se anota que otra app tiene el control', async () => {
  const db = memoria()
  const k = knoxFalso()
  const ev = evento('message.received', {}, { metadata: { standby: true } })
  assert.ok(ev)
  await procesarEvento(ev, db.almacen, k.knox)
  assert.deepEqual(db.otraApp, [{ id: 'conv-1', en: '2026-10-30T20:00:00.000Z' }])
  assert.equal(k.llamadas[0].standby, true)
})

test('sin Knox (sin modo o en la carga inicial) solo guarda', async () => {
  const db = memoria()
  const ev = evento('message.received')
  assert.ok(ev)
  assert.equal(await procesarEvento(ev, db.almacen, null), 'guardado')
})

test('message.sent escrito en la app (null o human): es de Ale y pausa a Knox 12 horas', async () => {
  for (const sentVia of [null, 'human']) {
    const db = memoria()
    const ev = evento('message.sent', { sentVia, platformMessageId: `mid-ale-${sentVia}`, sender: { id: 'cuenta-fb', name: 'Página Prueba' } })
    assert.ok(ev)
    assert.equal(await procesarEvento(ev, db.almacen, knoxFalso().knox), 'guardado; contestó Ale: Knox en pausa')
    assert.equal([...db.mensajes.values()][0].autor, 'ale')
    assert.deepEqual(db.pausas, [{ id: 'conv-1', hasta: new Date(Date.parse('2026-10-30T20:00:00.000Z') + PAUSA_ALE_MS).toISOString() }])
    assert.deepEqual(db.descartes, ['conv-1'])
    assert.deepEqual(db.leidas, [{ id: 'conv-1', en: '2026-10-30T20:00:00.000Z' }])
  }
})

test('message.sent por la API o por una automatización: no pausa a Knox', async () => {
  for (const [sentVia, autor] of [
    ['api', 'automatizacion'],
    ['comment_automation', 'automatizacion'],
    ['workflow', 'automatizacion'],
  ] as const) {
    const db = memoria()
    const k = knoxFalso()
    const ev = evento('message.sent', { sentVia, sender: { id: 'cuenta-fb' } })
    assert.ok(ev)
    assert.equal(await procesarEvento(ev, db.almacen, k.knox), 'guardado')
    assert.equal(db.mensajes.get('mid-1')?.autor, autor)
    assert.equal(db.pausas.length, 0)
    assert.equal(k.llamadas.length, 0)
  }
})

test('lo que mandó el panel ya estaba guardado: el eco del webhook no hace nada', async () => {
  const db = memoria()
  const enviado = evento('message.sent', { sentVia: 'api' })
  assert.ok(enviado)
  // El panel lo guardó al mandarlo (con su autor de verdad)
  db.mensajes.set('mid-1', { id: 'msg-panel', m: (enviado as { mensaje: DatosMensaje }).mensaje, autor: 'knox' })
  assert.equal(await procesarEvento(enviado, db.almacen, null), 'ya estaba')
  assert.equal(db.mensajes.get('mid-1')?.autor, 'knox')
  assert.equal(db.pausas.length, 0)
})

test('entregado, leído y falló ponen al día el mensaje', async () => {
  const db = memoria()
  const ev = evento('message.sent', { sentVia: 'api' })
  assert.ok(ev)
  await procesarEvento(ev, db.almacen, null)
  const estado = (event: string, extra: Record<string, unknown> = {}) => leerEvento({ event, message: { platformMessageId: 'mid-1' }, ...extra })
  assert.equal(await procesarEvento(estado('message.delivered')!, db.almacen, null), 'estado: entregado')
  assert.equal(db.mensajes.get('mid-1')?.estado, 'entregado')
  assert.equal(await procesarEvento(estado('message.failed', { error: { message: 'No llegó' } })!, db.almacen, null), 'estado: fallo')
  assert.equal(db.mensajes.get('mid-1')?.error, 'No llegó')
  const ajeno = leerEvento({ event: 'message.read', message: { platformMessageId: 'otro' } })
  assert.equal(await procesarEvento(ajeno!, db.almacen, null), 'estado de un mensaje que no está')
})

test('la prueba de Zernio y los eventos que no se usan no tocan nada', async () => {
  const db = memoria()
  assert.equal(await procesarEvento({ tipo: 'prueba' }, db.almacen, null), 'prueba')
  assert.equal(await procesarEvento({ tipo: 'otro', evento: 'comment.received' }, db.almacen, null), 'sin uso: comment.received')
  assert.equal(db.conversaciones.size, 0)
})

test('una conversación nueva trae su historial después de guardar el mensaje, una sola vez', async () => {
  const db = memoria()
  const k = knoxFalso()
  const primero = evento('message.received')
  assert.ok(primero)
  await procesarEvento(primero, db.almacen, k.knox)
  // El mensaje ya estaba guardado cuando se pidió el historial (si no, el historial lo traería y Knox no lo vería)
  // y solo lo anterior a este mensaje: lo que sigue de la ráfaga entra con su webhook y Knox lo ve
  assert.deepEqual(db.historiales, [{ id: 'conv-1', mensajesAntes: 1, antesDe: '2026-10-30T20:00:00.000Z' }])
  assert.equal(k.llamadas.length, 1)
  const segundo = evento('message.received', { platformMessageId: 'mid-2' })
  assert.ok(segundo)
  await procesarEvento(segundo, db.almacen, k.knox)
  assert.equal(db.historiales.length, 1)
  assert.equal(k.llamadas.length, 2)
})
