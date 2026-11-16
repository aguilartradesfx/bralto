import { test } from 'node:test'
import assert from 'node:assert/strict'
import { idEstado, idsValidos } from './servidor.ts'

test('idEstado lee OFICINA_ESTADO_ID y cae a 1', () => {
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '2' }), 2)
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '1' }), 1)
  assert.equal(idEstado({}), 1)
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '99' }), 1)
  assert.equal(idEstado({ VERCEL_ENV: 'preview' }), 2)
  assert.equal(idEstado({ VERCEL_ENV: 'production' }), 1)
  assert.equal(idEstado({ NODE_ENV: 'development' }), 2)
  assert.equal(idEstado({ NODE_ENV: 'development', OFICINA_ESTADO_ID: '1' }), 1)
  assert.equal(idEstado({ NODE_ENV: 'production' }), 1)
  assert.equal(idEstado({ OFICINA_ESTADO_ID: '1', VERCEL_ENV: 'preview' }), 1)
})

test('idsValidos deja solo uuids de redes_publicaciones, sin repetir', () => {
  const u = '0b7e3c1a-52d4-4f8e-9a61-2c3d4e5f6a7b'
  const r = (ref_tabla: string | null, ref_id: string | null) => ({ ref_tabla, ref_id })
  assert.deepEqual(idsValidos([
    r('redes_publicaciones', u), r('redes_publicaciones', u), r('redes_publicaciones', 'abc'),
    r('redes_publicaciones', ''), r('redes_publicaciones', null), r('otra_tabla', u),
  ]), [u])
})

test('sinVacios quita nulos, vacíos, espacios y repetidos', async () => {
  const { sinVacios } = await import('./servidor.ts')
  assert.deepEqual(sinVacios(['Ana Lopez', null, '', '   ', undefined, 'Ana Lopez', ' Casa Uno ']), ['Ana Lopez', 'Casa Uno'])
})

// Una tabla de `total` filas (0, 1, 2…) detrás de un servidor que da `tope` filas por página como mucho
const tabla = (total: number, tope: number, pedidas: [number, number][] = []) => async (d: number, h: number) => {
  pedidas.push([d, h])
  return { data: Array.from({ length: Math.max(0, Math.min(h + 1, total, d + tope) - d) }, (_, i) => d + i), error: null }
}

test('leerPaginas junta 2500 filas en páginas de 1000 y se detiene en la página vacía', async () => {
  const { leerPaginas } = await import('./servidor.ts')
  const pedidas: [number, number][] = []
  const filas = await leerPaginas<number>(tabla(2500, 1000, pedidas), 'x')
  assert.deepEqual(filas, Array.from({ length: 2500 }, (_, i) => i))
  assert.deepEqual(pedidas, [[0, 999], [1000, 1999], [2000, 2999], [2500, 3499]])
})

test('leerPaginas no pierde ni salta filas si el servidor da menos de 1000 por página', async () => {
  const { leerPaginas } = await import('./servidor.ts')
  const pedidas: [number, number][] = []
  const filas = await leerPaginas<number>(tabla(2500, 300, pedidas), 'x')
  assert.deepEqual(filas, Array.from({ length: 2500 }, (_, i) => i))
  assert.deepEqual(pedidas.slice(0, 3), [[0, 999], [300, 1299], [600, 1599]])
  assert.deepEqual(pedidas.at(-1), [2500, 3499])
})

test('leerPaginas lanza si una página falla', async () => {
  const { leerPaginas } = await import('./servidor.ts')
  await assert.rejects(leerPaginas<number>(async (d) => (
    d === 1000 ? { data: null, error: { message: 'se cayó' } } : { data: Array(1000).fill(1), error: null }
  ), 'x'), /x: se cayó/)
})

test('fotoDeFila: el pie de una foto de grupo es el título de su escena; un retrato no lleva pie; sin ruta no sale', async () => {
  const { fotoDeFila } = await import('./servidor.ts')
  const grupo = { id: 'g1', tipo: 'grupo' as const, agentes: ['ana', 'beto'], ruta: 'grupo/g1.jpg', escena: { titulo: 'Almuerzo en la playa' } }
  assert.deepEqual(fotoDeFila(grupo), { id: 'g1', tipo: 'grupo', agentes: ['ana', 'beto'], ruta: 'grupo/g1.jpg', pie: 'Almuerzo en la playa' })
  assert.equal(fotoDeFila({ ...grupo, escena: null })?.pie, null)
  assert.deepEqual(fotoDeFila({ id: 'r1', tipo: 'retrato', agentes: ['ana'], ruta: 'retratos/ana.jpg', escena: null }),
    { id: 'r1', tipo: 'retrato', agentes: ['ana'], ruta: 'retratos/ana.jpg', pie: null })
  assert.equal(fotoDeFila({ ...grupo, ruta: null }), null)
})
