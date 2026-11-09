import { test } from 'node:test'
import assert from 'node:assert/strict'
import { aVista, type Fila } from './vista.ts'
import type { Prueba } from '../redes/pruebas/tipos.ts'

function fila(extra: Partial<Fila> = {}): Fila {
  return {
    id: 'pub-1',
    titulo: 'Prueba',
    tipo: 'reel',
    estado: 'publicado',
    publicar_en: '2026-10-30T19:00:00+00:00',
    texto: 'Un texto',
    laminas: [],
    video_url: 'v.mp4',
    portada_url: 'p.jpg',
    historias: ['h1.jpg'],
    colaborador: 'otra.cuenta',
    hecho_con_ia: true,
    facebook: true,
    comenta: { guia: 'g', palabras: ['palabra', 'otra'], mensaje: 'm', respuestas: ['r'] },
    resultado: {
      instagram: { id: 'ig-1', permalink: 'https://www.instagram.com/reel/X/', en: '2026-10-30T19:00:05.000Z' },
      facebook: { postId: 'fb-1', url: 'https://www.facebook.com/watch/?v=1' },
    },
    intentos: 1,
    prueba: false,
    grupo: null,
    version: null,
    gancho: null,
    ultimo_error: null,
    ...extra,
  }
}

test('aVista: la primera palabra del «Comenta» y los enlaces de lo que ya salió', () => {
  const v = aVista(fila())
  assert.equal(v.palabra, 'palabra')
  assert.equal(v.instagram, 'https://www.instagram.com/reel/X/')
  assert.equal(v.facebookUrl, 'https://www.facebook.com/watch/?v=1')
  assert.equal(v.video_url, 'v.mp4')
  assert.deepEqual(v.historias, ['h1.jpg'])
})

test('aVista: lo interno (mensajes del «Comenta», pasos de la publicación) no viaja a la página', () => {
  const v = aVista(fila())
  for (const clave of ['comenta', 'resultado', 'intentos']) assert.equal(clave in v, false, clave)
})

test('aVista: sin «Comenta» ni enlaces, todo en null', () => {
  const v = aVista(fila({ comenta: null, resultado: {}, ultimo_error: 'Meta: caído' }))
  assert.equal(v.palabra, null)
  assert.equal(v.instagram, null)
  assert.equal(v.facebookUrl, null)
  assert.equal(v.ultimo_error, 'Meta: caído')
  // Instagram a veces no devuelve el enlace
  assert.equal(aVista(fila({ resultado: { instagram: { id: 'ig-1', permalink: null, en: '' } } })).instagram, null)
})

const grupo = (extra: Partial<Prueba> = {}): Prueba => ({
  grupo: 'g-1',
  titulo: 'Radar',
  origen: 'ia',
  estado: 'corriendo',
  facebook: true,
  decidir_en: '2026-11-09T21:00:00.000Z',
  ganadora: null,
  resultado: {},
  intentos: 0,
  actualizado_en: '2026-11-06T21:00:00.000Z',
  ...extra,
})

test('aVista: una versión de prueba dice cuál es, cuándo decide y si ganó', () => {
  const version = fila({ prueba: true, grupo: 'g-1', version: 2, colaborador: null, facebook: false, historias: [] })
  const corriendo = aVista(version, grupo())
  assert.deepEqual(corriendo.prueba, { version: 2, total: 5, estado: 'corriendo', decidir_en: '2026-11-09T21:00:00.000Z', final: null })
  assert.equal(aVista(version, grupo({ estado: 'decidida', ganadora: 'pub-1' })).prueba?.final, 'gano')
})

test('aVista: el Calendario solo dice «se borró» si de verdad se borró', () => {
  const salio = { instagram: { id: 'm', permalink: null, en: '2026-11-05T14:00:00.000Z' } }
  const version = fila({ prueba: true, grupo: 'g-1', version: 2, colaborador: null, facebook: false, historias: [], resultado: salio })
  const final = (resultado: Prueba['resultado'], ganadora: string | null = 'otra') =>
    aVista(version, grupo({ estado: 'decidida', ganadora, resultado })).prueba?.final
  assert.equal(final({ borradas: { 'pub-1': 'ok' } }), 'borrada')
  assert.equal(final({ borradas: { 'pub-1': 'Meta: no se pudo' } }), 'sin_borrar')
  assert.equal(final({ metricas: { 'pub-1': 'no_existe' } }), 'ya_no_estaba')
  assert.equal(final({}, null), 'sin_ganadora')
  const noSalio = fila({ prueba: true, grupo: 'g-1', version: 2, colaborador: null, facebook: false, historias: [], resultado: {} })
  assert.equal(aVista(noSalio, grupo({ estado: 'decidida', ganadora: 'otra' })).prueba?.final, 'no_salio')
})

test('aVista: una publicación normal no es prueba', () => {
  assert.equal(aVista(fila()).prueba, null)
})
