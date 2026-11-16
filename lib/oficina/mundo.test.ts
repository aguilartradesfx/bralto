import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Rincon } from './tipos.ts'
import { CUPO, MUNDO_H, MUNDO_W, crearMundo, type Punto } from './mundo.ts'

const agentes = [
  { id: 'a0', puesto: 0 },
  { id: 'a1', puesto: 1 },
  { id: 'a12', puesto: 12 },
]
const RINCONES = Object.keys(CUPO) as Rincon[]

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

// Los puntos por donde pasa una ruta, cada 2 px (no solo donde dobla)
function camino(desde: Punto, r: Punto[]): Punto[] {
  const pts = [desde, ...r], todos: Punto[] = []
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], pasos = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2))
    for (let j = 0; j <= pasos; j++) todos.push([x0 + ((x1 - x0) * j) / pasos, y0 + ((y1 - y0) * j) / pasos])
  }
  return todos
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

test('crearMundo([]) no falla y mide 906 x 586: la sala es la franja de abajo, con sus tres rincones de 240 px', () => {
  const m = crearMundo([])
  assert.equal(m.W, 906)
  assert.equal(m.H, 586)
  assert.deepEqual([MUNDO_W, MUNDO_H], [906, 586])
  assert.equal(m.salas.length, 24)
  assert.deepEqual(m.sala, { x: 30, y: 476, w: 720, h: 104 })
  assert.deepEqual(RINCONES, ['cafe', 'platica', 'siesta'])
  assert.deepEqual(RINCONES.map((r) => m.rincon(r)), [
    { x: 30, y: 476, w: 240, h: 104 },
    { x: 270, y: 476, w: 240, h: 104 },
    { x: 510, y: 476, w: 240, h: 104 },
  ])
  assert.deepEqual(CUPO, { cafe: 4, platica: 4, siesta: 3 })
  // las oficinas siguen donde estaban: la fila de abajo termina en 470
  assert.equal(m.salas[23].ry + m.medidas.RH, m.medidas.HO)
  assert.equal(m.medidas.HO, 470)
})

test('cada sitio de la sala está libre, dentro de su rincón y a 16 px o más de los otros (4, 4 y 3)', () => {
  const m = crearMundo([])
  const todos: { nom: string; p: Punto }[] = []
  for (const r of RINCONES) {
    const c = m.rincon(r)
    for (let i = 0; i < CUPO[r]; i++) {
      const p = m.sitio(r, i)
      assert.ok(m.libre(p[0], p[1]), `${r} ${i} no está libre`)
      assert.ok(p[0] >= c.x && p[0] < c.x + c.w && p[1] >= c.y && p[1] < c.y + c.h, `${r} ${i} se sale de su rincón`)
      todos.push({ nom: `${r} ${i}`, p })
    }
  }
  assert.equal(todos.length, 11)
  for (let i = 0; i < todos.length; i++)
    for (let j = i + 1; j < todos.length; j++) {
      const d = Math.hypot(todos[i].p[0] - todos[j].p[0], todos[i].p[1] - todos[j].p[1])
      assert.ok(d >= 16, `${todos[i].nom} y ${todos[j].nom} quedan a ${d} px`)
    }
})

test('de los puestos 0, 5, 18 y 23 a cada sitio de la sala, y de vuelta, la ruta solo pasa por celdas libres', () => {
  const ags = [0, 5, 18, 23].map((puesto) => ({ id: `p${puesto}`, puesto }))
  const m = crearMundo(ags)
  for (const a of ags)
    for (const r of RINCONES)
      for (let i = 0; i < CUPO[r]; i++) {
        const ida = revisar(m, m.asiento(a.id), m.sitio(r, i))
        assert.deepEqual(ida[ida.length - 1], m.sitio(r, i))
        const vuelta = revisar(m, m.sitio(r, i), m.asiento(a.id))
        assert.deepEqual(vuelta[vuelta.length - 1], m.asiento(a.id))
      }
})

test('a la sala se entra por el pasillo de la izquierda, que baja junto a la fila de abajo, o por el fondo de tu oficina', () => {
  const m = crearMundo([{ id: 'p18', puesto: 18 }, { id: 'p23', puesto: 23 }])
  const { HO, AX, AW } = m.medidas
  // del puesto 18 al café: baja por el pasillo de la izquierda, junto a la fila de abajo
  const al18 = camino(m.asiento('p18'), revisar(m, m.asiento('p18'), m.sitio('cafe', 0)))
  assert.ok(al18.some(([x, y]) => x < 30 && y > HO - 60 && y < HO))
  // del puesto 23 a la siesta: cruza tu oficina y sale por su puerta del fondo
  const al23 = camino(m.asiento('p23'), revisar(m, m.asiento('p23'), m.sitio('siesta', 1)))
  assert.ok(al23.some(([x, y]) => x > AX && x < AX + AW && y > HO - 40 && y < HO))
  assert.ok(al23.some(([x, y]) => x > AX && x < AX + AW && y > HO))
})

test('desde la sala también se va de visita: a otra oficina y a la tuya', () => {
  const m = crearMundo([{ id: 'p0', puesto: 0 }, { id: 'p23', puesto: 23 }])
  for (const r of RINCONES) {
    revisar(m, m.sitio(r, 0), m.visita('p0'))
    revisar(m, m.sitio(r, 0), m.visita('p23'))
    revisar(m, m.sitio(r, 0), m.PARA_TI)
  }
})
