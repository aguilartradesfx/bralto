import { test } from 'node:test'
import assert from 'node:assert/strict'
import { COLUMNAS_CARGA, filaParaCargar, NO_ESTA, pedir, registrar, soltar, type Almacen, type Base, type FilaSubida } from './pasos.ts'
import { MAX_BYTES, SIN_TAMANO } from './subida.ts'
import type { Guion, Pendiente, VideoGuion } from './tipos.ts'

const ID = '3f1c2a7e-1111-4a1a-9a9a-000000000001'
const OTRO = '3f1c2a7e-1111-4a1a-9a9a-000000000002'
const AHORA = new Date('2026-11-16T20:30:00.000Z')
const ruta = (n: number, id = ID) => `${id}/mi2k3x9fa1b2c${n}-toma-${n}.mov`
const pend = (n: number, min = 5): Pendiente => ({ ruta: ruta(n), pedido_en: new Date(AHORA.getTime() - min * 60_000).toISOString() })
const video = (n: number, bytes = 1000): VideoGuion => ({ ruta: ruta(n), nombre: `toma-${n}.mov`, bytes, subido_en: AHORA.toISOString() })

function fila(cambios: Partial<FilaSubida> = {}): FilaSubida {
  return { estado: 'listo', videos: [], pendientes: [], grabado_en: null, actualizado_en: 'v0', ...cambios }
}

// La fila en memoria: escribe solo si actualizado_en sigue igual (como el .eq de servidor.ts) y anota cada escritura.
// `colar` mete otra escritura justo antes de la próxima (lo que haría otro pedido a la vez).
function memoria(inicial: FilaSubida | null) {
  const m = { fila: inicial, version: 0, escrituras: [] as Record<string, unknown>[], colar: null as null | ((f: FilaSubida) => Partial<FilaSubida>) }
  const base: Base = {
    async leer() {
      return m.fila ? structuredClone(m.fila) : null
    },
    async escribir(_id, cambios, actualizado_en) {
      if (m.colar && m.fila) {
        m.fila = { ...m.fila, ...m.colar(m.fila), actualizado_en: `v${++m.version}` }
        m.colar = null
      }
      if (!m.fila || m.fila.actualizado_en !== actualizado_en) return null
      m.escrituras.push(cambios)
      m.fila = { ...m.fila, ...(cambios as Partial<FilaSubida>), actualizado_en: `v${++m.version}` }
      return structuredClone(m.fila)
    },
  }
  return { m, base }
}

function storage(archivos: Record<string, { bytes: number | null; tipo: string | null }> = {}, o: { firmarFalla?: boolean } = {}) {
  const llamadas = { firmar: [] as string[], buscar: [] as string[], borrar: [] as string[] }
  const almacen: Almacen = {
    async firmar(r) {
      llamadas.firmar.push(r)
      if (o.firmarFalla) throw new Error('crudos: sin URL firmada')
      return `https://storage.example/subir/${r}?token=x`
    },
    async buscar(r) {
      llamadas.buscar.push(r)
      return archivos[r] ?? null
    },
    async borrar(r) {
      llamadas.borrar.push(r)
      delete archivos[r]
    },
  }
  return { almacen, llamadas }
}

const PEDIDO = { nombre: 'Toma 9.MOV', bytes: 1000, tipo: 'video/quicktime' as const }
const NUEVA = `${ID}/abc123def-toma-9.mov`

// ---------- La carga de la noche ----------

test('filaParaCargar: solo lo escrito; nunca estado, videos, pendientes, detalle ni horas', () => {
  const g: Guion = {
    titulo: 'Ordena tus pedidos',
    tema: 'Una hoja que se llena sola',
    comenta: 'PEDIDOS',
    guia: 'ordena-tus-pedidos',
    duracion_s: 40,
    lineas: [{ vista: 'usted', dice: 'Hola.', pantalla: '' }],
    ganchos: [{ tipo: 'mito', dice: 'Uno.' }],
  }
  const f = filaParaCargar(g, { dia: '2026-11-17', carpeta: '/srv/publicaciones/2026-11-17/guion' })
  assert.deepEqual(Object.keys(f), [...COLUMNAS_CARGA])
  for (const prohibida of ['id', 'estado', 'videos', 'pendientes', 'detalle', 'grabado_en', 'subido_en', 'editado_en', 'creado_en', 'actualizado_en']) {
    assert.equal(prohibida in f, false, prohibida)
  }
  assert.deepEqual(f, { dia: '2026-11-17', ...g, carpeta: '/srv/publicaciones/2026-11-17/guion' })
})

// ---------- Pedir la subida ----------

test('pedir: si el guion ya no recibe videos, no firma ni anota nada', async () => {
  const { m, base } = memoria(fila({ estado: 'editando' }))
  const { almacen, llamadas } = storage()
  const r = await pedir(base, almacen, ID, PEDIDO, { unico: 'abc123def', ahora: AHORA })
  assert.deepEqual(r, { ok: false, status: 409, error: 'Este guion ya no recibe videos: ahora está «Editando»' })
  assert.deepEqual(llamadas.firmar, [])
  assert.deepEqual(m.escrituras, [])
})

test('pedir: firma una vez, deja la subida pendiente y devuelve la URL', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1)] }))
  const { almacen, llamadas } = storage()
  const r = await pedir(base, almacen, ID, PEDIDO, { unico: 'abc123def', ahora: AHORA })
  assert.deepEqual(r, { ok: true, ruta: NUEVA, url: `https://storage.example/subir/${NUEVA}?token=x` })
  assert.deepEqual(llamadas.firmar, [NUEVA])
  assert.deepEqual(m.fila?.pendientes, [pend(1), { ruta: NUEVA, pedido_en: AHORA.toISOString() }])
  assert.equal(m.fila?.estado, 'listo')
})

test('pedir: «Reintentar» suelta la pendiente del intento anterior, pero solo si es de este guion', async () => {
  const { m, base } = memoria(fila({ estado: 'subido', pendientes: [pend(1), pend(2)] }))
  await pedir(base, storage().almacen, ID, PEDIDO, { unico: 'abc123def', ahora: AHORA, reemplaza: ruta(1) })
  assert.deepEqual(m.fila?.pendientes.map((p) => p.ruta), [ruta(2), NUEVA])

  const otro = memoria(fila({ pendientes: [pend(1)] }))
  await pedir(otro.base, storage().almacen, ID, PEDIDO, { unico: 'abc123def', ahora: AHORA, reemplaza: ruta(1, OTRO) })
  assert.deepEqual(otro.m.fila?.pendientes.map((p) => p.ruta), [ruta(1), NUEVA])
})

test('pedir: si otro pedido escribió en el medio, vuelve a leer y suma encima', async () => {
  const { m, base } = memoria(fila())
  m.colar = (f) => ({ pendientes: [...f.pendientes, pend(7)] })
  const r = await pedir(base, storage().almacen, ID, PEDIDO, { unico: 'abc123def', ahora: AHORA })
  assert.equal(r.ok, true)
  assert.deepEqual(m.fila?.pendientes.map((p) => p.ruta), [ruta(7), NUEVA])
})

test('pedir: si Storage no da la URL, no queda nada pendiente', async () => {
  const { m, base } = memoria(fila())
  await assert.rejects(pedir(base, storage({}, { firmarFalla: true }).almacen, ID, PEDIDO, { unico: 'abc123def', ahora: AHORA }))
  assert.deepEqual(m.escrituras, [])
})

// ---------- Registrar lo que subió ----------

test('registrar: una ruta que no es de este guion se rechaza sin tocar Storage', async () => {
  const { m, base } = memoria(fila())
  const { almacen, llamadas } = storage({ [ruta(1, OTRO)]: { bytes: 1000, tipo: 'video/quicktime' } })
  for (const mala of [ruta(1, OTRO), `${ID}/../${OTRO}/mi2k3x9fa1b2c1-toma-1.mov`, `${ID}/toma.mov`]) {
    assert.deepEqual(await registrar(base, almacen, ID, mala, AHORA), { ok: false, status: 400, error: 'Ese video no es de este guion' })
  }
  assert.deepEqual(llamadas.buscar, [])
  assert.deepEqual(m.escrituras, [])
})

test('registrar: si el archivo no está en Storage, no anota nada', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1)] }))
  assert.deepEqual(await registrar(base, storage().almacen, ID, ruta(1), AHORA), { ok: false, status: 409, error: NO_ESTA, codigo: 'no_esta' })
  assert.deepEqual(m.escrituras, [])
})

test('registrar: si Storage no dice el tamaño, no anota 0 bytes ni borra el archivo', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1)] }))
  const { almacen, llamadas } = storage({ [ruta(1)]: { bytes: null, tipo: 'video/quicktime' } })
  assert.deepEqual(await registrar(base, almacen, ID, ruta(1), AHORA), { ok: false, status: 409, error: SIN_TAMANO })
  assert.deepEqual(llamadas.borrar, [])
  assert.deepEqual(m.escrituras, [])
})

test('registrar: lo que no sirve se borra y sale de pendientes, sin anotarlo', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1), pend(2)] }))
  const { almacen, llamadas } = storage({ [ruta(1)]: { bytes: MAX_BYTES + 1, tipo: 'video/quicktime' } })
  const r = await registrar(base, almacen, ID, ruta(1), AHORA)
  assert.equal(r.ok, false)
  assert.deepEqual(llamadas.borrar, [ruta(1)])
  assert.deepEqual(m.fila?.videos, [])
  assert.deepEqual(m.fila?.pendientes, [pend(2)])
})

test('registrar: un video bueno se anota con el tamaño de Storage, sale de pendientes y el primero anota grabado_en', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1), pend(2)] }))
  const { almacen } = storage({ [ruta(1)]: { bytes: 734_003_200, tipo: 'video/quicktime' } })
  assert.deepEqual(await registrar(base, almacen, ID, ruta(1), AHORA), { ok: true, estado: 'subido', videos: 1 })
  assert.deepEqual(m.escrituras, [
    { videos: [video(1, 734_003_200)], estado: 'subido', subido_en: AHORA.toISOString(), pendientes: [pend(2)], grabado_en: AHORA.toISOString() },
  ])
})

test('registrar: el segundo video no vuelve a tocar grabado_en', async () => {
  const { m, base } = memoria(fila({ estado: 'subido', videos: [video(1)], pendientes: [pend(2)], grabado_en: '2026-11-16T19:00:00.000Z' }))
  await registrar(base, storage({ [ruta(2)]: { bytes: 1000, tipo: 'video/mp4' } }).almacen, ID, ruta(2), AHORA)
  assert.equal('grabado_en' in m.escrituras[0], false)
  assert.equal(m.fila?.grabado_en, '2026-11-16T19:00:00.000Z')
})

test('registrar: avisar dos veces del mismo video no lo repite', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1)] }))
  const { almacen } = storage({ [ruta(1)]: { bytes: 1000, tipo: 'video/quicktime' } })
  await registrar(base, almacen, ID, ruta(1), AHORA)
  assert.deepEqual(await registrar(base, almacen, ID, ruta(1), AHORA), { ok: true, estado: 'subido', videos: 1 })
  assert.equal(m.escrituras.length, 1)
  assert.equal(m.fila?.videos.length, 1)
})

test('registrar: dos videos que terminan a la vez no se pisan', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1), pend(2)] }))
  // Mientras este se anota, otro pedido anota el 2 (y cambia actualizado_en): este vuelve a leer y se suma encima
  m.colar = () => ({ videos: [video(2)], estado: 'subido', pendientes: [pend(1)], grabado_en: AHORA.toISOString() })
  const r = await registrar(base, storage({ [ruta(1)]: { bytes: 1000, tipo: 'video/quicktime' } }).almacen, ID, ruta(1), AHORA)
  assert.deepEqual(r, { ok: true, estado: 'subido', videos: 2 })
  assert.deepEqual(m.fila?.videos.map((v) => v.ruta), [ruta(2), ruta(1)])
  assert.deepEqual(m.fila?.pendientes, [])
})

test('registrar: si el guion ya no recibe videos, no lo anota', async () => {
  const { m, base } = memoria(fila({ estado: 'editando', pendientes: [pend(1)] }))
  const { almacen, llamadas } = storage({ [ruta(1)]: { bytes: 1000, tipo: 'video/quicktime' } })
  assert.deepEqual(await registrar(base, almacen, ID, ruta(1), AHORA), { ok: false, status: 409, error: 'Este guion ya no recibe videos: ahora está «Editando»' })
  assert.deepEqual(m.escrituras, [])
  assert.deepEqual(llamadas.borrar, [])
})

// ---------- Cancelar ----------

test('soltar: una ruta de otro guion no toca nada', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1)] }))
  const { almacen, llamadas } = storage()
  assert.deepEqual(await soltar(base, almacen, ID, ruta(1, OTRO), AHORA), { ok: false, status: 400, error: 'Ese video no es de este guion' })
  assert.deepEqual([llamadas.buscar, llamadas.borrar, m.escrituras], [[], [], []])
})

test('soltar: sale de pendientes y, si el archivo alcanzó a llegar sin anotarse, se borra', async () => {
  const { m, base } = memoria(fila({ pendientes: [pend(1), pend(2)] }))
  const { almacen, llamadas } = storage({ [ruta(1)]: { bytes: 1000, tipo: 'video/quicktime' } })
  assert.deepEqual(await soltar(base, almacen, ID, ruta(1), AHORA), { ok: true })
  assert.deepEqual(m.fila?.pendientes, [pend(2)])
  assert.deepEqual(llamadas.borrar, [ruta(1)])
})

test('soltar: nunca borra un video que ya está anotado', async () => {
  const { m, base } = memoria(fila({ estado: 'subido', videos: [video(1)] }))
  const { almacen, llamadas } = storage({ [ruta(1)]: { bytes: 1000, tipo: 'video/quicktime' } })
  assert.deepEqual(await soltar(base, almacen, ID, ruta(1), AHORA), { ok: true })
  assert.deepEqual(llamadas.borrar, [])
  assert.deepEqual(m.escrituras, [])
})
