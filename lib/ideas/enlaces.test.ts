import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectarEnlaces, normalizarEnlace, resolverCorto } from './enlaces.ts'

test('un reel de Instagram queda con su código, sin el rastreo del enlace compartido', () => {
  assert.deepEqual(normalizarEnlace('https://www.instagram.com/reel/AbC123_x-9/?igsh=MWx0dGZ0eXp'), {
    url: 'https://www.instagram.com/p/AbC123_x-9/',
    red: 'instagram',
  })
})

test('/reel/, /reels/, /p/ y /tv/ del mismo código son el mismo video', () => {
  const esperado = 'https://www.instagram.com/p/AbC123/'
  for (const u of [
    'instagram.com/reel/AbC123',
    'https://instagram.com/reels/AbC123/',
    'https://m.instagram.com/p/AbC123',
    'http://www.instagram.com/tv/AbC123/#x',
    'https://www.instagram.com/una.cuenta/reel/AbC123/',
  ]) {
    assert.equal(normalizarEnlace(u)?.url, esperado, u)
  }
})

test('un video de TikTok queda con la cuenta y el número, sin lo que agrega la app al compartir', () => {
  assert.deepEqual(normalizarEnlace('https://www.tiktok.com/@una.cuenta/video/7704834703446117662?is_from_webapp=1&sender_device=pc'), {
    url: 'https://www.tiktok.com/@una.cuenta/video/7704834703446117662',
    red: 'tiktok',
  })
  assert.equal(normalizarEnlace('https://m.tiktok.com/@Otra/photo/123456789')?.url, 'https://www.tiktok.com/@otra/photo/123456789')
})

test('los enlaces cortos de TikTok se marcan para abrirlos antes de guardarlos', () => {
  for (const u of ['https://vm.tiktok.com/ZMabc123/', 'https://vt.tiktok.com/ZSxyz/', 'https://www.tiktok.com/t/ZT8abc/']) {
    const e = normalizarEnlace(u)
    assert.equal(e?.red, 'tiktok', u)
    assert.equal(e?.corto, true, u)
  }
})

test('perfiles, otras páginas y otras redes no son un video', () => {
  for (const u of [
    'https://www.instagram.com/una.cuenta/',
    'https://www.instagram.com/explore/',
    'https://www.tiktok.com/@una.cuenta',
    'https://www.youtube.com/watch?v=abc',
    'https://bralto.io/es',
    'no es un enlace',
  ]) {
    assert.equal(normalizarEnlace(u), null, u)
  }
})

test('saca los enlaces de un texto pegado, sin repetir el mismo video', () => {
  const texto = `Mira este: https://www.instagram.com/reel/AAA111/?igsh=x
y este otro https://www.instagram.com/p/AAA111/ (es el mismo)
https://www.tiktok.com/@cuenta/video/123,
https://www.youtube.com/watch?v=abc
https://www.instagram.com/reel/BBB222/`
  const r = detectarEnlaces(texto)
  assert.deepEqual(
    r.enlaces.map((e) => e.url),
    ['https://www.instagram.com/p/AAA111/', 'https://www.tiktok.com/@cuenta/video/123', 'https://www.instagram.com/p/BBB222/'],
  )
  assert.deepEqual(r.noValidos, ['https://www.youtube.com/watch?v=abc'])
})

test('un texto sin enlaces no da nada', () => {
  assert.deepEqual(detectarEnlaces('hola'), { enlaces: [], noValidos: [] })
})

test('un enlace corto de TikTok se abre y queda el enlace largo', async () => {
  const fetchFn = (async (url: string, init?: RequestInit) => {
    assert.equal(url, 'https://vm.tiktok.com/ZMabc123/')
    assert.equal(init?.redirect, 'manual')
    return new Response(null, { status: 301, headers: { location: 'https://www.tiktok.com/@cuenta/video/7704834703446117662?_r=1&_t=abc' } })
  }) as typeof fetch
  assert.deepEqual(await resolverCorto({ url: 'https://vm.tiktok.com/ZMabc123/', red: 'tiktok', corto: true }, fetchFn), {
    url: 'https://www.tiktok.com/@cuenta/video/7704834703446117662',
    red: 'tiktok',
  })
})

test('si el enlace corto no lleva a un video, da null', async () => {
  const fetchFn = (async () => new Response(null, { status: 404 })) as unknown as typeof fetch
  assert.equal(await resolverCorto({ url: 'https://vm.tiktok.com/ZMabc123/', red: 'tiktok', corto: true }, fetchFn), null)
  const falla = (async () => {
    throw new Error('sin red')
  }) as unknown as typeof fetch
  assert.equal(await resolverCorto({ url: 'https://vm.tiktok.com/ZMabc123/', red: 'tiktok', corto: true }, falla), null)
})
