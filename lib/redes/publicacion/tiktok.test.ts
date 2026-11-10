import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  conAvisoIA,
  cuerpoComentaTikTok,
  cuerpoTikTok,
  mandarATikTok,
  RESPUESTAS_TIKTOK,
  tituloFotos,
  type DatosTikTok,
  type EfectosTikTok,
  type ResultadoTikTok,
} from './tiktok.ts'
import type { Comenta } from './tipos.ts'

const texto = 'Esta IA te entrega el Excel ya hecho 📊\n\nPídele a Claude lo que necesitas.\n\nComenta ARCHIVOS y te mando la guía 📩\n\n#Claude #IA'
const reel: DatosTikTok = { tipo: 'reel', texto, laminas: [], video_url: 'https://x/reel.mp4', portada_url: 'https://x/portada.jpg', hecho_con_ia: true }
const carrusel: DatosTikTok = { tipo: 'carrusel', texto, laminas: ['https://x/l1.jpg', 'https://x/l2.jpg'], video_url: null, portada_url: null, hecho_con_ia: false }
const CUANDO = '2026-11-11T14:30:00.000Z'

test('un reel sale como video público con su texto, su portada y el aviso de IA', () => {
  const c = cuerpoTikTok(reel, 'tt-1', CUANDO)
  assert.equal(c.content, texto)
  assert.deepEqual(c.mediaItems, [{ type: 'video', url: 'https://x/reel.mp4' }])
  assert.deepEqual(c.platforms, [{ platform: 'tiktok', accountId: 'tt-1' }])
  assert.equal(c.scheduledFor, CUANDO)
  assert.equal(c.publishNow, undefined)
  assert.deepEqual(c.tiktokSettings, {
    privacyLevel: 'PUBLIC_TO_EVERYONE',
    allowComment: true,
    allowDuet: true,
    allowStitch: true,
    contentPreviewConfirmed: true,
    expressConsentGiven: true,
    videoMadeWithAi: true,
    videoCoverImageUrl: 'https://x/portada.jpg',
  })
})

test('un reel sin IA ni portada no lleva esos campos', () => {
  const c = cuerpoTikTok({ ...reel, hecho_con_ia: false, portada_url: null }, 'tt-1', CUANDO)
  const s = c.tiktokSettings as Record<string, unknown>
  assert.equal('videoMadeWithAi' in s, false)
  assert.equal('videoCoverImageUrl' in s, false)
})

test('un carrusel sale como fotos: título corto, el texto entero abajo y música de TikTok', () => {
  const c = cuerpoTikTok(carrusel, 'tt-1', CUANDO)
  assert.equal(c.content, 'Esta IA te entrega el Excel ya hecho 📊')
  assert.deepEqual(c.mediaItems, [
    { type: 'image', url: 'https://x/l1.jpg' },
    { type: 'image', url: 'https://x/l2.jpg' },
  ])
  assert.deepEqual(c.tiktokSettings, {
    privacyLevel: 'PUBLIC_TO_EVERYONE',
    allowComment: true,
    mediaType: 'photo',
    photoCoverIndex: 0,
    autoAddMusic: true,
    description: texto,
    contentPreviewConfirmed: true,
    expressConsentGiven: true,
  })
})

test('un carrusel con fotos de IA lo dice en el texto: TikTok no deja marcarlo en fotos por la API', () => {
  const c = cuerpoTikTok({ ...carrusel, hecho_con_ia: true }, 'tt-1', CUANDO)
  const s = c.tiktokSettings as Record<string, unknown>
  assert.equal('videoMadeWithAi' in s, false)
  assert.match(String(s.description), /Fotos hechas con IA/)
})

test('conAvisoIA pone el aviso antes de los hashtags, o al final si no hay', () => {
  assert.equal(conAvisoIA('Hola\n\n#IA #Claude'), 'Hola\n\n📸 Fotos hechas con IA.\n\n#IA #Claude')
  assert.equal(conAvisoIA('Hola'), 'Hola\n\n📸 Fotos hechas con IA.')
})

test('tituloFotos: la primera línea, sin hashtags y de 90 caracteres como máximo', () => {
  assert.equal(tituloFotos('\n  Primera línea #IA\nOtra'), 'Primera línea')
  const larga = 'palabra '.repeat(20).trim()
  const t = tituloFotos(larga)
  assert.ok([...t].length <= 90, `mide ${[...t].length}`)
  assert.ok(t.endsWith('…'))
  assert.ok(!t.includes('palabra…') || t.endsWith('palabra…'))
})

const comenta: Comenta = { guia: 'claude-crea-archivos', palabras: ['archivos'], tolerarErrores: true, mensaje: 'm', respuestas: ['r'] }

test('el «Comenta» de TikTok solo responde en público, atado al post de Zernio antes de que salga', () => {
  const c = cuerpoComentaTikTok({ cuenta: { profileId: 'perfil', accountId: 'tt-1' }, postId: 'z'.repeat(24), titulo: 'Archivos', comenta })
  assert.equal(c.postId, 'z'.repeat(24))
  assert.equal('platformPostId' in c, false)
  assert.deepEqual(c.keywords, ['archivos'])
  assert.equal(c.matchMode, 'word')
  assert.equal(c.typoTolerance, true)
  assert.equal(c.commentReply, RESPUESTAS_TIKTOK[0])
  assert.deepEqual(c.commentReplyVariations, RESPUESTAS_TIKTOK.slice(1))
  for (const campo of ['dmMessage', 'buttons', 'followGate', 'audience', 'dmDelaySeconds', 'commentReplyDelaySeconds', 'publicReplyPolicy']) {
    assert.equal(campo in c, false, `${campo} no va en TikTok`)
  }
})

test('las respuestas de TikTok mandan al enlace del perfil, sin enlaces en el comentario', () => {
  assert.ok(RESPUESTAS_TIKTOK.length >= 2)
  for (const r of RESPUESTAS_TIKTOK) {
    assert.match(r, /perfil/)
    assert.doesNotMatch(r, /https?:|\.io|pana/i)
  }
})

// mandarATikTok: programa el post y arma su «Comenta», guardando después de cada paso
function falsoTikTok(over: Partial<EfectosTikTok> = {}) {
  const llamadas: string[] = []
  const guardados: ResultadoTikTok[] = []
  const tt: EfectosTikTok = {
    async programar(_p, cuando) {
      llamadas.push(`programar:${cuando}`)
      return 'zp-1'
    },
    async comenta(id) {
      llamadas.push(`comenta:${id}`)
      return 'auto-tt'
    },
    ...over,
  }
  return { tt, llamadas, guardados, guardar: async (t: ResultadoTikTok) => void guardados.push(structuredClone(t)) }
}
const pieza = { ...reel, titulo: 'Archivos', comenta }
const AHORA = Date.parse('2026-11-11T16:00:00.000Z')

test('mandarATikTok programa a los 3 minutos y arma el «Comenta» con el id de Zernio', async () => {
  const { tt, llamadas, guardados, guardar } = falsoTikTok()
  const t = await mandarATikTok(pieza, undefined, tt, AHORA, guardar)
  assert.deepEqual(llamadas, ['programar:2026-11-11T16:03:00.000Z', 'comenta:zp-1'])
  assert.deepEqual(t, { zernioId: 'zp-1', programado: '2026-11-11T16:03:00.000Z', automatizacion: 'auto-tt' })
  assert.equal(guardados.length, 2)
})

test('mandarATikTok sin «Comenta» solo programa', async () => {
  const { tt, llamadas, guardar } = falsoTikTok()
  await mandarATikTok({ ...pieza, comenta: null }, undefined, tt, AHORA, guardar)
  assert.deepEqual(llamadas, ['programar:2026-11-11T16:03:00.000Z'])
})

test('mandarATikTok no repite lo hecho: con post ya programado solo falta el «Comenta»', async () => {
  const { tt, llamadas, guardar } = falsoTikTok()
  const t = await mandarATikTok(pieza, { zernioId: 'zp-9', programado: 'x', errorComenta: 'falló' }, tt, AHORA, guardar)
  assert.deepEqual(llamadas, ['comenta:zp-9'])
  assert.deepEqual(t, { zernioId: 'zp-9', programado: 'x', automatizacion: 'auto-tt' })
  const de = falsoTikTok()
  await mandarATikTok(pieza, { zernioId: 'zp-9', automatizacion: 'a' }, de.tt, AHORA, de.guardar)
  assert.deepEqual(de.llamadas, [])
})

test('mandarATikTok anota los errores sin tirar la publicación', async () => {
  const mal = falsoTikTok({
    async programar() {
      throw new Error('Zernio /posts: HTTP 400')
    },
  })
  assert.deepEqual(await mandarATikTok(pieza, undefined, mal.tt, AHORA, mal.guardar), { zernioId: null, error: 'Zernio /posts: HTTP 400' })
  const sinComenta = falsoTikTok({
    async comenta() {
      throw new Error('no')
    },
  })
  const t = await mandarATikTok(pieza, undefined, sinComenta.tt, AHORA, sinComenta.guardar)
  assert.equal(t.zernioId, 'zp-1')
  assert.equal(t.errorComenta, 'no')
})

test('mandarATikTok reintenta un post que falló antes', async () => {
  const { tt, llamadas, guardar } = falsoTikTok()
  const t = await mandarATikTok(pieza, { zernioId: null, error: 'antes' }, tt, AHORA, guardar)
  assert.equal(llamadas[0], 'programar:2026-11-11T16:03:00.000Z')
  assert.equal(t.error, undefined)
})
