import { test } from 'node:test'
import assert from 'node:assert/strict'
import { claveDe, leerFiltro, ordenar, pctVisto, puestos, realDeInsights, realDePrueba, spearman, tipoDe, umbralCasualidad, veredicto, MIN_REELS } from './calculos.ts'
import type { Prediccion, Real } from './tipos.ts'

test('la clave sale de la carpeta del video, con la versión si es de prueba', () => {
  const base = 'https://x.supabase.co/storage/v1/object/public/videos/redes'
  assert.equal(claveDe(`${base}/2026-11-06/reel-lo-legal/reel.mp4`, null), '2026-11-06-reel-lo-legal')
  assert.equal(claveDe(`${base}/2026-11-10/reel-claude-crea-archivos/versiones/3/reel.mp4`, 3), '2026-11-10-reel-claude-crea-archivos-v3')
  assert.equal(claveDe(`${base}/camara-2026-11-10/c001-programas-gratis/versiones/2/reel.mp4`, 2), 'camara-2026-11-10-c001-programas-gratis-v2')
  assert.equal(claveDe('https://otro.com/video.mp4', null), null)
})

test('tipo: rehecho manda; si no, prueba o normal', () => {
  assert.equal(tipoDe({ prueba: true }, null), 'prueba')
  assert.equal(tipoDe({ prueba: false }, null), 'normal')
  assert.equal(tipoDe({ prueba: null }, null), 'normal')
  assert.equal(tipoDe({ prueba: true }, '2026-11-09-reel-resenas-google'), 'rehecho')
})

test('los números de Instagram: milisegundos a segundos con un decimal', () => {
  const r = realDeInsights({ views: 239, reach: 176, reels_skip_rate: 60.8, ig_reels_avg_watch_time: 8866, saved: 3, likes: 3, shares: 0, comments: 0 }, 'ahora')
  assert.deepEqual(r, { vistas: 239, alcance: 176, salto: 60.8, promedio_s: 8.9, guardados: 3, me_gusta: 3, compartidos: 0, comentarios: 0, leido_en: 'ahora', fuente: 'instagram' })
  assert.equal(realDeInsights({ reach: 3 }, 'ahora'), null)
  assert.equal(realDeInsights({ views: 5 }, 'ahora')?.salto, null)
})

test('lo guardado al decidir una prueba también se puede leer', () => {
  const r = realDePrueba({ views: 109, reach: 102, skip: 69.3, promedioMs: 4700, shares: 0, saved: 3, leidas_en: 'ayer' })
  assert.equal(r.promedio_s, 4.7)
  assert.equal(r.fuente, 'prueba')
  assert.equal(r.me_gusta, null)
})

test('qué parte del video vieron', () => {
  const real = { promedio_s: 8.9 } as Real
  assert.equal(pctVisto({ real, duracion_s: 38.4 }), 23)
  assert.equal(pctVisto({ real: null, duracion_s: 38.4 }), null)
  assert.equal(pctVisto({ real, duracion_s: null }), null)
})

test('puestos con empates', () => {
  assert.deepEqual(puestos([10, 30, 20]), [1, 3, 2])
  assert.deepEqual(puestos([5, 5, 1]), [2.5, 2.5, 1])
})

test('spearman: igual orden 1, orden contrario -1, muy pocos datos null', () => {
  assert.equal(spearman([1, 2, 3, 4], [10, 20, 30, 40]), 1)
  assert.equal(spearman([1, 2, 3, 4], [40, 30, 20, 10]), -1)
  assert.equal(spearman([1, 2], [1, 2]), null)
  assert.equal(spearman([1, 1, 1], [1, 2, 3]), null)
})

const pred = (gancho: number) => ({ gancho }) as Prediccion
const real = (salto: number, vistas = 200) => ({ salto, vistas }) as Real

test('veredicto: con pocos reels todavía no se sabe', () => {
  const v = veredicto([{ prediccion: pred(30), real: real(60) }])
  assert.equal(v.nivel, 'pocos')
  assert.match(v.texto, /Hay 1 reel con/)
})

test('veredicto: no cuenta reels sin vistas suficientes ni sin predicción', () => {
  const filas = Array.from({ length: MIN_REELS }, (_, i) => ({ prediccion: pred(i * 10), real: real(80 - i * 5, 50) }))
  assert.equal(veredicto(filas).nivel, 'pocos')
  assert.equal(veredicto([...filas.map((f) => ({ ...f, prediccion: null }))]).n, 0)
})

test('veredicto: más gancho y menos salto es que le atina; al revés, que no', () => {
  const atina = Array.from({ length: 8 }, (_, i) => ({ prediccion: pred(20 + i * 8), real: real(90 - i * 4) }))
  assert.equal(veredicto(atina).nivel, 'atina')
  const no = Array.from({ length: 8 }, (_, i) => ({ prediccion: pred(20 + i * 8), real: real(50 + i * 4) }))
  assert.equal(veredicto(no).nivel, 'no')
})

test('veredicto: una relación floja con pocos reels puede ser casualidad', () => {
  // Los 12 reels del 11/11: gancho de 28 a 32 contra el salto real (rho ≈ −0.37, el umbral con 12 es 0.59)
  const datos: [number, number][] = [[32, 57.4], [32, 60.7], [30, 61.2], [30, 69.2], [32, 69.6], [31, 73.7], [28, 75.7], [28, 76.1], [30, 77.6], [31, 79.1], [30, 82.6], [31, 87.7]]
  const v = veredicto(datos.map(([g, s]) => ({ prediccion: pred(g), real: real(s) })))
  assert.equal(v.nivel, 'no_se_nota')
  assert.match(v.texto, /casualidad/)
  assert.ok(Math.abs(umbralCasualidad(12) - 0.591) < 0.01)
})

test('filtro desconocido es «todos»', () => {
  assert.equal(leerFiltro('prueba'), 'prueba')
  assert.equal(leerFiltro(['rehecho']), 'rehecho')
  assert.equal(leerFiltro('x'), 'todos')
  assert.equal(leerFiltro(undefined), 'todos')
})

test('orden: lo que no ha salido arriba, después lo más nuevo', () => {
  const filas = [
    { clave: 'a', publicado_en: '2026-11-05T19:00:00Z' },
    { clave: 'b', publicado_en: null },
    { clave: 'c', publicado_en: '2026-11-09T19:00:00Z' },
  ]
  assert.deepEqual(ordenar(filas).map((f) => f.clave), ['b', 'c', 'a'])
})
