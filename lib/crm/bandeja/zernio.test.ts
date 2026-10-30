import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHmac } from 'node:crypto'
import { firmaValida } from './firma.ts'
import { adjuntoDe, autorDe, canalDe, conversacionDeLista, esInteractivo, leerEvento, mensajeDeLista, telefonoDe } from './zernio.ts'

// Todo inventado: ids, nombres, números y textos
const recibido = (extra: Record<string, unknown> = {}, mensaje: Record<string, unknown> = {}) => ({
  id: 'evento-1',
  event: 'message.received',
  timestamp: '2026-10-30T20:00:05.000Z',
  message: {
    id: 'interno-msg-1',
    conversationId: 'interno-conv-1',
    platform: 'instagram',
    platformMessageId: 'mid-0001',
    direction: 'incoming',
    text: '  Hola, ¿cuánto cuesta una web?  ',
    attachments: [],
    sender: { id: '1000000000000001', name: 'Ana Prueba', username: 'ana.prueba', picture: 'https://cdn.ejemplo.test/ana.jpg' },
    sentAt: '2026-10-30T20:00:00.000Z',
    isRead: false,
    sentVia: null,
    ...mensaje,
  },
  conversation: {
    id: 'interno-conv-1',
    platformConversationId: '1000000000000001',
    participantId: '1000000000000001',
    participantName: 'Ana Prueba',
    participantUsername: 'ana.prueba',
    status: 'active',
  },
  account: { id: 'cuenta-ig', accountId: 'cuenta-ig', platform: 'instagram', username: 'negocio.prueba' },
  metadata: null,
  ...extra,
})

test('canalDe: Instagram, Messenger (facebook) y WhatsApp; lo demás no entra', () => {
  assert.equal(canalDe('instagram'), 'instagram')
  assert.equal(canalDe('facebook'), 'messenger')
  assert.equal(canalDe('whatsapp'), 'whatsapp')
  assert.equal(canalDe('telegram'), null)
  assert.equal(canalDe(undefined), null)
})

test('autorDe: lo que entra es de la persona; lo que sale depende de sentVia', () => {
  assert.equal(autorDe('incoming', null), 'persona')
  assert.equal(autorDe('outgoing', 'human'), 'ale')
  assert.equal(autorDe('outgoing', null), 'ale') // escrito en la app de la red
  assert.equal(autorDe('outgoing', undefined), 'ale')
  assert.equal(autorDe('outgoing', 'api'), 'api')
  for (const via of ['comment_automation', 'workflow', 'sequence', 'broadcast', 'bulk-api', 'algo-nuevo']) {
    assert.equal(autorDe('outgoing', via), 'automatizacion', via)
  }
})

test('adjuntoDe: el adjunto en una palabra', () => {
  assert.equal(adjuntoDe([{ type: 'image' }]), 'foto')
  assert.equal(adjuntoDe([{ type: 'video' }]), 'video')
  assert.equal(adjuntoDe([{ type: 'audio', payload: { voice: true } }]), 'audio')
  assert.equal(adjuntoDe([{ type: 'file' }]), 'archivo')
  assert.equal(adjuntoDe([{ type: 'sticker' }]), 'sticker')
  assert.equal(adjuntoDe([{ type: 'video', originalType: 'ig_reel' }]), 'publicación compartida')
  assert.equal(adjuntoDe([{ type: 'share', originalType: 'ig_post' }]), 'publicación compartida')
  assert.equal(adjuntoDe([{ type: 'share', originalType: 'story_mention' }]), 'historia')
  assert.equal(adjuntoDe([{ type: 'unsupported_type', mimeType: 'image/jpeg' }]), 'foto')
  assert.equal(adjuntoDe([{ type: 'template' }]), null)
  assert.equal(adjuntoDe([], { storyReply: { storyId: 's1' } }), 'historia')
  assert.equal(adjuntoDe([], { isStoryMention: true }), 'historia')
  assert.equal(adjuntoDe([], { metadata: { location: { latitude: 9.9, longitude: -84 } } }), 'ubicación')
  assert.equal(adjuntoDe([], { metadata: { contacts: [{ name: 'x' }] } }), 'contacto')
  assert.equal(adjuntoDe(undefined), null)
})

test('esInteractivo: respuestas a botones y menús (el «Comenta» de Zernio)', () => {
  assert.equal(esInteractivo({ postbackPayload: 'SI_PORFA' }), true)
  assert.equal(esInteractivo({ quickReplyPayload: 'guia' }), true)
  assert.equal(esInteractivo({ interactiveType: 'button_reply', interactiveId: 'b1' }), true)
  assert.equal(esInteractivo({ buttonPayload: 'x' }), true)
  assert.equal(esInteractivo({ quotedMessageId: 'mid-0000' }), false)
  assert.equal(esInteractivo({ standby: true }), false)
  assert.equal(esInteractivo(null), false)
})

test('telefonoDe: en WhatsApp el id de la persona es su número', () => {
  assert.equal(telefonoDe('whatsapp', '13055550100'), '+13055550100')
  assert.equal(telefonoDe('whatsapp', null, '+50670000001'), '+50670000001')
  assert.equal(telefonoDe('whatsapp', 'US.abc123'), null)
  assert.equal(telefonoDe('instagram', '13055550100'), null)
})

test('leerEvento: un mensaje que entra por Instagram', () => {
  const ev = leerEvento(recibido())
  assert.ok(ev && ev.tipo === 'mensaje')
  assert.equal(ev.evento, 'message.received')
  assert.deepEqual(ev.conversacion, {
    externoId: '1000000000000001',
    otrosIds: ['interno-conv-1'],
    canal: 'instagram',
    cuentaId: 'cuenta-ig',
    cuenta: 'negocio.prueba',
    participante: { id: '1000000000000001', nombre: 'Ana Prueba', usuario: 'ana.prueba', foto: 'https://cdn.ejemplo.test/ana.jpg', telefono: null },
  })
  assert.deepEqual(ev.mensaje, {
    externoId: 'mid-0001',
    direccion: 'entrante',
    autoria: 'persona',
    texto: 'Hola, ¿cuánto cuesta una web?',
    adjunto: null,
    enviadoEn: '2026-10-30T20:00:00.000Z',
    meta: { zernio_id: 'interno-msg-1' },
  })
  assert.equal(ev.standby, false)
  assert.equal(ev.interactivo, false)
  assert.deepEqual(ev.remitente, { id: '1000000000000001', usuario: 'ana.prueba', telefono: null })
})

test('leerEvento: botón, standby, historia y WhatsApp con su número', () => {
  const boton = leerEvento(recibido({ metadata: { postbackPayload: 'SI', postbackTitle: '¡Sí, porfa!' } }))
  assert.ok(boton?.tipo === 'mensaje' && boton.interactivo && boton.mensaje.meta.interactivo === true)

  const espera = leerEvento(recibido({ metadata: { standby: true } }))
  assert.ok(espera?.tipo === 'mensaje' && espera.standby && espera.mensaje.meta.standby === true)

  const historia = leerEvento(recibido({ metadata: { storyReply: { storyId: 's1' } } }, { text: 'jaja buenísima' }))
  assert.ok(historia?.tipo === 'mensaje')
  assert.equal(historia.mensaje.adjunto, 'historia')
  assert.equal(historia.mensaje.meta.historia, 'respuesta')

  const wa = leerEvento(
    recibido(
      { conversation: { id: 'interno-wa', platformConversationId: 'interno-wa', participantId: '13055550100', participantName: 'Beto Prueba' }, account: { accountId: 'cuenta-wa', platform: 'whatsapp' } },
      { platform: 'whatsapp', conversationId: 'interno-wa', platformMessageId: 'wamid.0001', sender: { id: '13055550100', name: 'Beto Prueba', phoneNumber: '+13055550100' }, attachments: [{ type: 'audio', url: 'https://zernio.test/m/1' }], text: '' },
    ),
  )
  assert.ok(wa?.tipo === 'mensaje')
  assert.equal(wa.conversacion.canal, 'whatsapp')
  assert.equal(wa.conversacion.externoId, 'interno-wa')
  assert.deepEqual(wa.conversacion.otrosIds, [])
  assert.equal(wa.conversacion.participante.telefono, '+13055550100')
  assert.equal(wa.remitente.telefono, '+13055550100')
  assert.equal(wa.mensaje.texto, '')
  assert.equal(wa.mensaje.adjunto, 'audio')
})

test('leerEvento: lo que sale; la persona es siempre la de la conversación, no el remitente', () => {
  const salida = (sentVia: unknown) =>
    leerEvento(
      recibido({ event: 'message.sent' }, { direction: 'outgoing', sender: { id: 'cuenta-ig', name: 'Negocio Prueba', username: 'negocio.prueba' }, sentVia, text: 'Claro, te cuento' }),
    )
  const app = salida(null)
  assert.ok(app?.tipo === 'mensaje')
  assert.equal(app.evento, 'message.sent')
  assert.equal(app.mensaje.direccion, 'saliente')
  assert.equal(app.mensaje.autoria, 'ale')
  assert.equal(app.mensaje.meta.enviado_por, 'null')
  assert.equal(app.conversacion.participante.nombre, 'Ana Prueba')
  assert.equal(app.conversacion.participante.usuario, 'ana.prueba')
  const api = salida('api')
  assert.ok(api?.tipo === 'mensaje' && api.mensaje.autoria === 'api')
  const comenta = salida('comment_automation')
  assert.ok(comenta?.tipo === 'mensaje' && comenta.mensaje.autoria === 'automatizacion')
})

test('leerEvento: estados de entrega, la prueba y lo que no sirve', () => {
  const base = { message: { platformMessageId: 'mid-0002' }, statusAt: '2026-10-30T20:01:00Z' }
  assert.deepEqual(leerEvento({ ...base, event: 'message.delivered' }), { tipo: 'estado', estado: 'entregado', externoId: 'mid-0002', error: null })
  assert.deepEqual(leerEvento({ ...base, event: 'message.read' }), { tipo: 'estado', estado: 'leido', externoId: 'mid-0002', error: null })
  assert.deepEqual(leerEvento({ ...base, event: 'message.failed', error: { code: 131047, title: 'Re-engagement message', explanation: 'Pasó la ventana' } }), {
    tipo: 'estado',
    estado: 'fallo',
    externoId: 'mid-0002',
    error: 'Pasó la ventana',
  })
  assert.deepEqual(leerEvento({ id: 't', event: 'webhook.test', message: 'hola', timestamp: '2026-10-30T20:00:00Z' }), { tipo: 'prueba' })
  assert.deepEqual(leerEvento({ event: 'comment.received' }), { tipo: 'otro', evento: 'comment.received' })
  assert.equal(leerEvento(null), null)
  assert.equal(leerEvento('texto'), null)
  assert.equal(leerEvento({ event: 'message.delivered', message: {} }), null)
  // Otra red (Telegram) no entra a la bandeja
  assert.equal(leerEvento(recibido({}, { platform: 'telegram' })), null)
  // Sin id del mensaje no se puede guardar sin repetir
  assert.equal(leerEvento(recibido({}, { platformMessageId: '' })), null)
})

test('conversacionDeLista y mensajeDeLista: la carga inicial desde la API', () => {
  assert.deepEqual(
    conversacionDeLista({ id: '2000000000000002', platform: 'facebook', accountId: 'cuenta-fb', accountUsername: 'Página Prueba', participantId: '2000000000000002', participantName: 'Carla Prueba' }),
    {
      externoId: '2000000000000002',
      otrosIds: [],
      canal: 'messenger',
      cuentaId: 'cuenta-fb',
      cuenta: 'Página Prueba',
      participante: { id: '2000000000000002', nombre: 'Carla Prueba', usuario: null, foto: null, telefono: null },
    },
  )
  assert.equal(conversacionDeLista({ id: 'x', platform: 'twitter' }), null)

  assert.deepEqual(mensajeDeLista({ id: 'mid-0003', message: 'Gracias!', direction: 'outgoing', sentAt: '2026-10-29T10:00:00.000Z', sentVia: null, deliveryStatus: 'read' }), {
    externoId: 'mid-0003',
    direccion: 'saliente',
    autoria: 'ale',
    texto: 'Gracias!',
    adjunto: null,
    enviadoEn: '2026-10-29T10:00:00.000Z',
    meta: { enviado_por: 'null', estado: 'leido' },
  })
  const historia = mensajeDeLista({ id: 'mid-0004', message: '', direction: 'incoming', createdAt: '2026-10-29T11:00:00Z', isStoryMention: true })
  assert.equal(historia?.adjunto, 'historia')
  assert.equal(historia?.meta.historia, 'mencion')
  assert.equal(mensajeDeLista({ id: 'mid-0005', direction: 'incoming' }), null) // sin fecha
})

test('firmaValida: HMAC-SHA256 del cuerpo crudo en hex, comparado en tiempo constante', () => {
  const cuerpo = JSON.stringify(recibido())
  const secreto = 'secreto-de-prueba'
  const firma = createHmac('sha256', secreto).update(cuerpo).digest('hex')
  assert.equal(firmaValida(cuerpo, firma, secreto), true)
  assert.equal(firmaValida(Buffer.from(cuerpo), firma.toUpperCase(), secreto), true)
  assert.equal(firmaValida(`${cuerpo} `, firma, secreto), false)
  assert.equal(firmaValida(cuerpo, firma, 'otro-secreto'), false)
  assert.equal(firmaValida(cuerpo, null, secreto), false)
  assert.equal(firmaValida(cuerpo, firma, ''), false)
  assert.equal(firmaValida(cuerpo, 'no-es-hex', secreto), false)
  assert.equal(firmaValida(cuerpo, firma.slice(0, 32), secreto), false)
})
