import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cuerpoAutomatizacion } from './zernio.ts'
import type { Comenta } from './tipos.ts'

const comenta: Comenta = {
  guia: 'jarvis',
  palabras: ['jarvis'],
  tolerarErrores: true,
  mensaje: '¡Buenísimo! 🎉\n\nÁbrela aquí abajo 👇',
  botones: [{ type: 'url', title: 'Abrir la guía 🔗', url: '{enlace}' }],
  respuestas: ['¡Listo! Revisa tus mensajes 📩', 'Te escribí por mensaje 🙌'],
  etiquetaClic: 'clic-jarvis',
  seguir: { mensaje: '¡Holaaa! 👋', boton: '¡Sí, porfa! 🙏', noSigue: '🔔 ¡Sígueme!' },
}
const cuenta = { profileId: 'perfil', accountId: 'cuenta' }

test('en Instagram pide seguir antes de mandar la guía, con el enlace marcado como de Instagram', () => {
  const c = cuerpoAutomatizacion({ cuenta, platformPostId: 'post-1', titulo: 'Jarvis', comenta, origen: 'ig' })
  assert.deepEqual(c.audience, { followerStatus: 'follower', whenUnknown: 'verify' })
  assert.deepEqual(c.followGate, { message: '¡Holaaa! 👋', buttonLabel: '¡Sí, porfa! 🙏', notFollowingMessage: '🔔 ¡Sígueme!' })
  assert.deepEqual(c.buttons, [{ type: 'url', title: 'Abrir la guía 🔗', url: 'https://www.bralto.io/es/guias/jarvis?o=ig' }])
  assert.equal(c.platformPostId, 'post-1')
  assert.deepEqual(c.keywords, ['jarvis'])
  assert.equal(c.typoTolerance, true)
  assert.equal(c.commentReply, '¡Listo! Revisa tus mensajes 📩')
  assert.deepEqual(c.commentReplyVariations, ['Te escribí por mensaje 🙌'])
  assert.equal(c.clickTag, 'clic-jarvis')
})

test('en Facebook manda la guía directo: Meta no dice quién sigue una página', () => {
  const c = cuerpoAutomatizacion({ cuenta, platformPostId: 'post-2', titulo: 'Jarvis', comenta, origen: 'fb' })
  assert.equal(c.followGate, undefined)
  assert.equal(c.audience, undefined)
  assert.equal(c.buttons?.[0].url, 'https://www.bralto.io/es/guias/jarvis?o=fb')
})

test('el botón para ir al perfil solo va si se pidió', () => {
  const sin = cuerpoAutomatizacion({ cuenta, platformPostId: 'p', titulo: 'J', comenta, origen: 'ig' })
  assert.equal(sin.followGate?.profileButtonLabel, undefined)
  const seguir = { ...comenta.seguir!, botonPerfil: 'Ir a mi perfil' }
  const con = cuerpoAutomatizacion({ cuenta, platformPostId: 'p', titulo: 'J', comenta: { ...comenta, seguir }, origen: 'ig' })
  assert.equal(con.followGate?.profileButtonLabel, 'Ir a mi perfil')
})

test('{enlace} se reemplaza también dentro del mensaje, y sin botones no se manda la lista vacía', () => {
  const c = cuerpoAutomatizacion({
    cuenta,
    platformPostId: 'p',
    titulo: 'J',
    comenta: { ...comenta, mensaje: 'Aquí: {enlace}', botones: [] },
    origen: 'ig',
  })
  assert.equal(c.dmMessage, 'Aquí: https://www.bralto.io/es/guias/jarvis?o=ig')
  assert.equal('buttons' in c, false)
})
