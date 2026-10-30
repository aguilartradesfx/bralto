import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resumirBandeja, type ConversacionZernio } from './bandeja.ts'

const AHORA = new Date('2026-10-30T21:00:00Z')
const haceHoras = (h: number) => new Date(AHORA.getTime() - h * 3600_000).toISOString()

const conv = (extra: Partial<ConversacionZernio>): ConversacionZernio => ({
  platform: 'instagram',
  participantName: 'Persona',
  lastMessage: 'Hola',
  updatedTime: haceHoras(1),
  unreadCount: 1,
  ...extra,
})

test('solo cuenta lo que espera respuesta y es de los últimos 7 días', () => {
  const r = resumirBandeja(
    [
      conv({ participantName: 'Reciente' }),
      conv({ participantName: 'De julio', updatedTime: '2026-07-11T21:49:36Z', unreadCount: 3 }),
      conv({ participantName: 'Ya leída', unreadCount: 0 }),
      conv({ participantName: 'Hace 8 días', updatedTime: haceHoras(8 * 24) }),
    ],
    AHORA,
  )
  assert.equal(r.sinLeer, 1)
  assert.deepEqual(
    r.ultimas.map((u) => u.nombre),
    ['Reciente'],
  )
})

test('agrupa por canal con el nombre que se dice', () => {
  const r = resumirBandeja(
    [conv({ platform: 'instagram' }), conv({ platform: 'instagram' }), conv({ platform: 'facebook' }), conv({ platform: 'whatsapp' })],
    AHORA,
  )
  assert.deepEqual(r.porCanal, { Instagram: 2, Messenger: 1, WhatsApp: 1 })
})

test('las más nuevas primero, con su hora y el texto corto', () => {
  const r = resumirBandeja(
    [
      conv({ participantName: 'Anoche', updatedTime: haceHoras(18), lastMessage: 'Yo lo quiero es mejorar las redes' }),
      conv({ participantName: 'Hoy', updatedTime: haceHoras(2), lastMessage: { text: 'x'.repeat(300) } }),
    ],
    AHORA,
  )
  assert.deepEqual(
    r.ultimas.map((u) => u.nombre),
    ['Hoy', 'Anoche'],
  )
  assert.equal(r.ultimas[0].texto.length, 160)
  assert.equal(r.ultimas[1].texto, 'Yo lo quiero es mejorar las redes')
  assert.equal(r.ultimas[1].en, haceHoras(18))
})

test('un adjunto se describe y sin nombre usa el usuario', () => {
  const r = resumirBandeja([conv({ participantName: '', participantUsername: 'usuario.ig', lastMessage: '[Attachment]' })], AHORA)
  assert.equal(r.ultimas[0].nombre, 'usuario.ig')
  assert.equal(r.ultimas[0].texto, '(mandó un archivo o una foto)')
})
