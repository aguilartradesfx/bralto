import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armar, desdeGuia, desdeNota, leerSeccion, pagina, seccionDeGuia, type FilaGuia, type FilaNota } from './lista.ts'

const guia = (extra: Partial<FilaGuia> = {}): FilaGuia => ({
  slug: 'dos-cuentas-chatgpt',
  titulo: 'Dos cuentas de ChatGPT en el mismo celular',
  resumen: 'Una para su negocio y otra para usted.',
  etiqueta: 'Guía · ChatGPT',
  imagen_url: 'https://x.supabase.co/storage/v1/object/public/social-images/guias/dos-cuentas/portada.webp',
  tipo: null,
  pide_datos: false,
  creada_en: '2026-11-04T12:00:00Z',
  ...extra,
})

const nota = (extra: Partial<FilaNota> = {}): FilaNota => ({
  slug: 'pedidos-de-ventas',
  tipo: 'noticia',
  titulo_es: 'Cómo pasar pedidos de ventas a operaciones',
  resumen_es: 'Sin errores.',
  imagen_url: 'https://x.supabase.co/storage/v1/object/public/noticias/2026/pedidos.jpg',
  publicada_en: '2026-10-22T12:00:00Z',
  ...extra,
})

test('leerSeccion: sin nada es Guías, y solo acepta las tres pestañas', () => {
  assert.equal(leerSeccion(undefined), 'guias')
  assert.equal(leerSeccion([]), 'guias')
  assert.equal(leerSeccion(['noticias']), 'noticias')
  assert.equal(leerSeccion(['descargables']), 'descargables')
  assert.equal(leerSeccion(['guias']), null) // Guías vive en /recursos, sin segunda dirección
  assert.equal(leerSeccion(['otra']), null)
  assert.equal(leerSeccion(['noticias', 'extra']), null)
})

test('seccionDeGuia: lo que pide datos es Descargable aunque sea noticia; la noticia va a Noticias; lo demás a Guías', () => {
  assert.equal(seccionDeGuia({ tipo: 'noticia', pide_datos: true }), 'descargables')
  assert.equal(seccionDeGuia({ tipo: 'noticia', pide_datos: false }), 'noticias')
  assert.equal(seccionDeGuia({ tipo: 'tutorial', pide_datos: false }), 'guias')
  assert.equal(seccionDeGuia({ tipo: null, pide_datos: false }), 'guias') // sin tipo cae en Guías, nunca se pierde
  assert.equal(seccionDeGuia({ tipo: null, pide_datos: null }), 'guias')
})

test('desdeGuia: enlaza a su guía y la etiqueta dice en qué pestaña está', () => {
  const g = desdeGuia(guia({ tipo: 'noticia' }))
  assert.equal(g.href, '/es/guias/dos-cuentas-chatgpt')
  assert.equal(g.seccion, 'noticias')
  assert.equal(g.etiqueta, 'Noticia · ChatGPT')
  assert.equal(g.fecha, '2026-11-04T12:00:00Z')
  assert.equal(desdeGuia(guia()).etiqueta, 'Guía · ChatGPT')
  assert.equal(desdeGuia(guia({ pide_datos: true })).etiqueta, 'Descargable · ChatGPT')
  assert.equal(desdeGuia(guia({ etiqueta: 'Ventas' })).etiqueta, 'Guía · Ventas') // etiqueta sin «Guía ·»
})

test('desdeNota: las notas del sitio van a Noticias, en español y con su dirección de siempre', () => {
  const n = desdeNota(nota())
  assert.equal(n.seccion, 'noticias')
  assert.equal(n.href, '/es/noticias/pedidos-de-ventas')
  assert.equal(n.etiqueta, 'Noticia')
  assert.equal(n.titulo, 'Cómo pasar pedidos de ventas a operaciones')
  assert.equal(desdeNota(nota({ tipo: 'articulo' })).etiqueta, 'Artículo')
})

test('armar: reparte por pestaña, lo más nuevo primero, sin mezclar claves de guías y notas con el mismo slug', () => {
  const r = armar(
    [nota({ slug: 'a', publicada_en: '2026-10-20T00:00:00Z' }), nota({ slug: 'b', tipo: 'articulo', publicada_en: '2026-10-22T00:00:00Z' })],
    [
      guia({ slug: 'a', tipo: 'noticia', creada_en: '2026-11-04T00:00:00Z' }),
      guia({ slug: 'g1', creada_en: '2026-10-29T00:00:00Z' }),
      guia({ slug: 'g2', creada_en: '2026-11-05T00:00:00Z' }),
    ],
  )
  assert.deepEqual(r.noticias.map((x) => x.href), ['/es/guias/a', '/es/noticias/b', '/es/noticias/a'])
  assert.deepEqual(r.guias.map((x) => x.href), ['/es/guias/g2', '/es/guias/g1'])
  assert.deepEqual(r.descargables, [])
  assert.equal(new Set(r.noticias.map((x) => x.clave)).size, 3)
})

test('desdeGuia: la fecha es la del post de Instagram; sin post, la de la guía', () => {
  assert.equal(desdeGuia(guia({ publicar_en: '2026-11-05T16:00:00Z' })).fecha, '2026-11-05T16:00:00Z')
  assert.equal(desdeGuia(guia({ publicar_en: null })).fecha, '2026-11-04T12:00:00Z')
})

test('armar: la guía de un post que todavía no sale no aparece hasta su hora', () => {
  const ahora = '2026-11-05T17:00:00Z'
  const r = armar(
    [],
    [
      guia({ slug: 'ya-salio', publicar_en: '2026-11-05T16:00:00Z' }),
      guia({ slug: 'sale-en-la-noche', publicar_en: '2026-11-06T00:00:00Z' }),
      guia({ slug: 'sin-post', publicar_en: null }),
    ],
    ahora,
  )
  assert.deepEqual(r.guias.map((x) => x.href), ['/es/guias/ya-salio', '/es/guias/sin-post'])
})

test('pagina: 24 por página, dice si hay otra, y una página que no existe sale vacía', () => {
  const items = Array.from({ length: 30 }, (_, i) => i)
  assert.deepEqual(pagina(items, 1), { items: items.slice(0, 24), hayMas: true })
  assert.deepEqual(pagina(items, 2), { items: items.slice(24), hayMas: false })
  assert.deepEqual(pagina(items, 3), { items: [], hayMas: false })
  assert.deepEqual(pagina(items, 0), { items: items.slice(0, 24), hayMas: true })
})
