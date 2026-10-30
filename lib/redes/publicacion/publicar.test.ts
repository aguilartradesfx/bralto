import { test } from 'node:test'
import assert from 'node:assert/strict'
import { MAX_INTENTOS, probarFila, publicarFila, validar, type Cambios, type Efectos } from './publicar.ts'
import type { Publicacion, Resultado } from './tipos.ts'

function fila(extra: Partial<Publicacion> = {}): Publicacion {
  return {
    id: 'pub-1',
    titulo: 'Jarvis',
    tipo: 'carrusel',
    estado: 'publicando',
    publicar_en: '2026-10-30T16:00:00.000Z',
    texto: 'Tu propio Jarvis 🤖\n\nComenta JARVIS 📩\n\n#ClaudeCode #IA',
    laminas: ['l1', 'l2', 'l3'],
    video_url: null,
    portada_url: null,
    historias: ['h1', 'h2'],
    colaborador: 'bralto.io',
    hecho_con_ia: true,
    facebook: true,
    comenta: { guia: 'jarvis', palabras: ['jarvis'], mensaje: 'm', respuestas: ['r'] },
    resultado: {},
    intentos: 1,
    ...extra,
  }
}

// Efectos falsos que anotan cada llamada. `estados` da el estado de cada contenedor, en orden
function falsos(over: Partial<Efectos> = {}, estados: Record<string, string[]> = { 'cont-1': ['IN_PROGRESS', 'FINISHED'] }) {
  const llamadas: string[] = []
  const guardados: Cambios[] = []
  const avisos: string[] = []
  const e: Efectos = {
    async crearContenedor(p) {
      llamadas.push(`crear:${p.tipo}`)
      return 'cont-1'
    },
    async estadoContenedor(id) {
      llamadas.push(`estado:${id}`)
      return estados[id]?.shift() ?? 'FINISHED'
    },
    async publicarContenedor(id) {
      llamadas.push(`publicar:${id}`)
      return { id: 'media-1', permalink: 'https://www.instagram.com/p/X/' }
    },
    async buscarPublicado() {
      llamadas.push('buscar')
      return null
    },
    async crearComenta(origen, postId) {
      llamadas.push(`comenta:${origen}:${postId}`)
      return `auto-${origen}`
    },
    async publicarFacebook() {
      llamadas.push('facebook')
      return { postId: 'fb-1', url: 'https://facebook.com/fb-1' }
    },
    async aceptarCollab(id) {
      llamadas.push(`collab:${id}`)
    },
    async publicarHistoria(url) {
      llamadas.push(`historia:${url}`)
      return `id-${url}`
    },
    async guardar(_id, cambios) {
      guardados.push(structuredClone(cambios))
    },
    async avisar(texto) {
      avisos.push(texto)
    },
    async dormir() {},
    ahora: () => Date.parse('2026-10-30T16:00:05.000Z'),
    ...over,
  }
  return { e, llamadas, guardados, avisos }
}

const ultimo = (g: Cambios[]) => g[g.length - 1]

test('publica todo en orden: post, «Comenta», Facebook, collab e historias, y avisa', async () => {
  const { e, llamadas, guardados, avisos } = falsos()
  const r = await publicarFila(fila(), e)
  assert.deepEqual(llamadas, [
    'crear:carrusel',
    'estado:cont-1',
    'estado:cont-1',
    'publicar:cont-1',
    'comenta:ig:media-1',
    'facebook',
    'comenta:fb:fb-1',
    'collab:media-1',
    'historia:h1',
    'historia:h2',
  ])
  // El contenedor queda guardado antes de publicarlo: si la corrida se corta, no se publica dos veces
  assert.equal(guardados[0].resultado?.contenedor?.id, 'cont-1')
  assert.equal(guardados[0].resultado?.instagram, undefined)
  const fin = ultimo(guardados)
  assert.equal(fin.estado, 'publicado')
  assert.equal(fin.ultimo_error, null)
  assert.deepEqual(fin.resultado?.instagram, { id: 'media-1', permalink: 'https://www.instagram.com/p/X/', en: '2026-10-30T16:00:05.000Z' })
  assert.deepEqual(fin.resultado?.comentaIg, { id: 'auto-ig' })
  assert.deepEqual(fin.resultado?.facebook, { postId: 'fb-1', url: 'https://facebook.com/fb-1', automatizacion: 'auto-fb' })
  assert.equal(fin.resultado?.collab, 'aceptada')
  assert.deepEqual(fin.resultado?.historias, ['id-h1', 'id-h2'])
  assert.equal(avisos.length, 1)
  assert.match(avisos[0], /^✅ Ya salió Jarvis/)
  assert.equal(r, 'publicado: https://www.instagram.com/p/X/')
})

test('un reintento sigue donde quedó y no vuelve a publicar lo que ya salió', async () => {
  const hecho: Resultado = {
    contenedor: { id: 'cont-1', creado: 0 },
    instagram: { id: 'media-1', permalink: 'p', en: '2026-10-30T16:00:05.000Z' },
    comentaIg: { id: 'auto-ig' },
    facebook: { postId: 'fb-1', url: 'u', automatizacion: 'auto-fb' },
    collab: 'aceptada',
    historias: ['id-h1', 'error: se cayó'],
  }
  const { e, llamadas, guardados } = falsos()
  await publicarFila(fila({ resultado: hecho }), e)
  assert.deepEqual(llamadas, ['historia:h2'])
  assert.deepEqual(ultimo(guardados).resultado?.historias, ['id-h1', 'id-h2'])
  assert.equal(ultimo(guardados).estado, 'publicado')
})

test('si el contenedor ya salió pero no se guardó el post, lo busca en vez de publicar otra vez', async () => {
  const { e, llamadas, guardados } = falsos(
    { buscarPublicado: async () => ({ id: 'media-9', permalink: 'p9' }) },
    { 'cont-1': ['PUBLISHED'] },
  )
  await publicarFila(fila({ resultado: { contenedor: { id: 'cont-1', creado: 0 } } }), e)
  assert.ok(!llamadas.includes('publicar:cont-1'))
  assert.equal(ultimo(guardados).resultado?.instagram?.id, 'media-9')
  assert.equal(ultimo(guardados).estado, 'publicado')
})

test('si ya salió y no aparece el post, queda en error para no duplicarlo', async () => {
  const { e, llamadas, guardados, avisos } = falsos({}, { 'cont-1': ['PUBLISHED'] })
  await publicarFila(fila({ intentos: 1, resultado: { contenedor: { id: 'cont-1', creado: 0 } } }), e)
  assert.ok(!llamadas.includes('publicar:cont-1'))
  assert.equal(ultimo(guardados).estado, 'error')
  assert.equal(avisos[0], '❌ Jarvis: Instagram dice que ya salió, pero no encontré el post. Revísalo antes de volver a programarlo.')
})

test('un contenedor vencido se rehace', async () => {
  const { e, llamadas } = falsos({}, { viejo: ['EXPIRED'], 'cont-1': ['FINISHED'] })
  await publicarFila(fila({ resultado: { contenedor: { id: 'viejo', creado: 0 } } }), e)
  assert.deepEqual(llamadas.slice(0, 4), ['estado:viejo', 'crear:carrusel', 'estado:cont-1', 'publicar:cont-1'])
})

test('si Instagram falla, vuelve a la cola sin avisar hasta el último intento', async () => {
  const cae = { crearContenedor: async () => Promise.reject(new Error('Meta: caído')) }
  const a = falsos(cae)
  await publicarFila(fila({ intentos: 1 }), a.e)
  assert.equal(ultimo(a.guardados).estado, 'programado')
  assert.equal(ultimo(a.guardados).ultimo_error, 'Meta: caído')
  assert.equal(a.avisos.length, 0)

  const b = falsos(cae)
  await publicarFila(fila({ intentos: MAX_INTENTOS }), b.e)
  assert.equal(ultimo(b.guardados).estado, 'error')
  assert.deepEqual(b.avisos, [`❌ Jarvis no salió (intento ${MAX_INTENTOS} de ${MAX_INTENTOS}): Meta: caído`])
})

test('un contenedor que Instagram rechaza cuenta como falla', async () => {
  const { e, guardados } = falsos({}, { 'cont-1': ['ERROR'] })
  await publicarFila(fila(), e)
  assert.equal(ultimo(guardados).estado, 'programado')
  assert.match(ultimo(guardados).ultimo_error ?? '', /ERROR/)
})

test('lo que falla después de publicar no tumba la publicación: queda anotado y en el aviso', async () => {
  const { e, guardados, avisos } = falsos({
    crearComenta: async () => Promise.reject(new Error('Zernio 500')),
    publicarFacebook: async () => Promise.reject(new Error('HTTP 502')),
    aceptarCollab: async () => Promise.reject(new Error('sin permiso')),
  })
  await publicarFila(fila(), e)
  const fin = ultimo(guardados)
  assert.equal(fin.estado, 'publicado')
  assert.deepEqual(fin.resultado?.comentaIg, { error: 'Zernio 500' })
  assert.equal(fin.resultado?.facebook?.error, 'HTTP 502')
  assert.equal(fin.resultado?.collab, 'pendiente: sin permiso')
  assert.match(avisos[0], /FALLARON \(Zernio 500\)/)
})

test('un reel se crea como reel; sin Facebook, sin collab y sin «Comenta» se salta eso', async () => {
  const { e, llamadas } = falsos()
  await publicarFila(fila({ tipo: 'reel', laminas: [], video_url: 'v.mp4', facebook: false, colaborador: null, comenta: null, historias: [] }), e)
  assert.deepEqual(llamadas, ['crear:reel', 'estado:cont-1', 'estado:cont-1', 'publicar:cont-1'])
})

test('lo que no se puede publicar no se reintenta: queda en error y avisa', async () => {
  const { e, llamadas, guardados, avisos } = falsos()
  await publicarFila(fila({ laminas: ['solo-una'] }), e)
  assert.deepEqual(llamadas, [])
  assert.equal(ultimo(guardados).estado, 'error')
  assert.equal(avisos[0], '❌ Jarvis no salió: un carrusel lleva de 2 a 10 láminas (tiene 1)')
})

test('validar revisa láminas, video, largo del texto y hashtags', () => {
  assert.equal(validar(fila()), null)
  assert.match(validar(fila({ laminas: Array(11).fill('l') })) ?? '', /de 2 a 10 láminas \(tiene 11\)/)
  assert.match(validar(fila({ tipo: 'reel', video_url: null })) ?? '', /el reel no tiene video/)
  assert.match(validar(fila({ texto: '  ' })) ?? '', /no tiene texto/)
  assert.match(validar(fila({ texto: 'a'.repeat(2201) })) ?? '', /2201 caracteres/)
  assert.match(validar(fila({ texto: '#a #b #c #d #e #f' })) ?? '', /6 hashtags/)
})

test('probar arma y procesa el contenedor sin publicar nada', async () => {
  const { e, llamadas, guardados } = falsos()
  const r = await probarFila(fila({ estado: 'programado' }), e)
  assert.deepEqual(llamadas, ['crear:carrusel', 'estado:cont-1', 'estado:cont-1'])
  assert.deepEqual(guardados, [])
  assert.equal(r, 'contenedor listo (cont-1): Instagram lo aceptó, no se publicó nada')
})
