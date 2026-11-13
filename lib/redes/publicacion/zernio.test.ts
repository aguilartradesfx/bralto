import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cuerpoAutomatizacion, leerPostFacebook, MAX_RESPUESTAS, RESPUESTAS_GENERALES, respuestasPublicas } from './zernio.ts'
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
  assert.equal(c.commentReplyVariations[0], 'Te escribí por mensaje 🙌')
  assert.equal(c.clickTag, 'clic-jarvis')
})

test('responde en público a todos apenas comentan, no solo a quien ya recibió la guía', () => {
  const c = cuerpoAutomatizacion({ cuenta, platformPostId: 'p', titulo: 'J', comenta, origen: 'ig' })
  assert.equal(c.publicReplyPolicy, 'always')
})

test('las respuestas del reel van primero y las generales completan 6 sin repetir', () => {
  const igual = <T,>(l: T[]) => l
  const c = cuerpoAutomatizacion({ cuenta, platformPostId: 'p', titulo: 'J', comenta, origen: 'ig', mezclar: igual })
  const todas = [c.commentReply, ...c.commentReplyVariations]
  assert.equal(todas.length, MAX_RESPUESTAS)
  assert.equal(new Set(todas).size, MAX_RESPUESTAS)
  // «¡Listo! Revisa tus mensajes 📩» ya venía en el reel: no se repite
  assert.deepEqual(todas, ['¡Listo! Revisa tus mensajes 📩', 'Te escribí por mensaje 🙌', ...RESPUESTAS_GENERALES.slice(1, 5)])
})

test('si el reel ya trae 6 o más, Zernio recibe solo 6 (la principal y 5 variaciones)', () => {
  const propias = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
  assert.deepEqual(respuestasPublicas(propias), ['a', 'b', 'c', 'd', 'e', 'f'])
})

test('las generales salen en distinto orden de un reel a otro', () => {
  const ordenes = new Set(Array.from({ length: 20 }, () => respuestasPublicas([]).join('|')))
  assert.ok(ordenes.size > 1)
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

test('{enlace} se reemplaza también en las respuestas públicas y en los mensajes de seguir', () => {
  const c = cuerpoAutomatizacion({
    cuenta,
    platformPostId: 'p',
    titulo: 'J',
    comenta: { ...comenta, respuestas: ['Va: {enlace}'], seguir: { mensaje: 'Hola {enlace}', boton: 'Sí', noSigue: 'Sígueme {enlace}' } },
    origen: 'ig',
  })
  assert.equal(c.commentReply, 'Va: https://www.bralto.io/es/guias/jarvis?o=ig')
  assert.equal(c.followGate?.message, 'Hola https://www.bralto.io/es/guias/jarvis?o=ig')
  assert.equal(c.followGate?.notFollowingMessage, 'Sígueme https://www.bralto.io/es/guias/jarvis?o=ig')
})

test('Facebook publicado: id y enlace de la respuesta de Zernio', () => {
  const r = leerPostFacebook({
    post: { _id: 'z1', status: 'published', platforms: [{ platform: 'facebook', status: 'published', platformPostId: '28_99', platformPostUrl: 'https://facebook.com/28/posts/99' }] },
  })
  assert.deepEqual(r, { zernioId: 'z1', postId: '28_99', url: 'https://facebook.com/28/posts/99' })
})

test('Facebook que falló en Zernio es un error, con su motivo', () => {
  assert.throws(
    () => leerPostFacebook({ post: { _id: 'z1', status: 'failed', platforms: [{ platform: 'facebook', status: 'failed', errorMessage: 'token vencido' }] } }),
    /Zernio no publicó en Facebook \(failed\): token vencido/,
  )
})

test('Facebook que Zernio sigue publicando queda en proceso, sin inventar un id', () => {
  const r = leerPostFacebook({ post: { _id: 'z1', status: 'publishing', platforms: [{ platform: 'facebook', status: 'processing' }] } })
  assert.deepEqual(r, { zernioId: 'z1', postId: null, url: null, estado: 'processing' })
})

test('sin platformPostId, el id sale de un enlace numérico; uno «pfbid» no se adivina', () => {
  const num = leerPostFacebook({ post: { _id: 'z', status: 'published', platforms: [{ platform: 'facebook', status: 'published', platformPostUrl: 'https://www.facebook.com/281613248913342/posts/1234567' }] } })
  assert.equal(num.postId, '281613248913342_1234567')
  const pfbid = leerPostFacebook({ post: { _id: 'z', status: 'published', platforms: [{ platform: 'facebook', status: 'published', platformPostUrl: 'https://www.facebook.com/x/posts/pfbid0abc' }] } })
  assert.equal(pfbid.postId, null)
  assert.equal(pfbid.url, 'https://www.facebook.com/x/posts/pfbid0abc')
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
