import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crearMundo } from './mundo.ts'

const agentes = [
  { id: 'a0', puesto: 0 },
  { id: 'a1', puesto: 1 },
  { id: 'a12', puesto: 12 },
]

function revisar(m: ReturnType<typeof crearMundo>, desde: [number, number], hasta: [number, number]) {
  const r = m.ruta(desde, hasta)
  const pts = [desde, ...r]
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1]
    const [x1, y1] = pts[i]
    const largo = Math.hypot(x1 - x0, y1 - y0)
    const pasos = Math.max(1, Math.ceil(largo / 2))
    for (let j = 0; j <= pasos; j++) {
      const x = x0 + ((x1 - x0) * j) / pasos
      const y = y0 + ((y1 - y0) * j) / pasos
      assert.ok(m.libre(x, y), `punto no libre (${x}, ${y}) en el tramo ${i}`)
    }
  }
  return r
}

test('la ruta del puesto 0 al puesto 1 solo pasa por celdas libres', () => {
  const m = crearMundo(agentes)
  const r = revisar(m, m.asiento('a0'), m.visita('a1'))
  assert.ok(r.length >= 2)
})

test('del puesto 0 al puesto 12 usa el pasillo de la izquierda', () => {
  const m = crearMundo(agentes)
  const r = revisar(m, m.asiento('a0'), m.visita('a12'))
  assert.ok(r.some(([x]) => x < 30))
})

test('visita de ale es PARA_TI', () => {
  const m = crearMundo(agentes)
  assert.deepEqual(m.visita('ale'), m.PARA_TI)
  assert.deepEqual(m.visita('nadie'), m.PARA_TI)
})

test('crearMundo([]) no falla y mide 906 x 476', () => {
  const m = crearMundo([])
  assert.equal(m.W, 906)
  assert.equal(m.H, 476)
  assert.equal(m.salas.length, 24)
})
