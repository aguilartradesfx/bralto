import { test } from 'node:test'
import assert from 'node:assert/strict'
import { HORAS_PRUEBA, repartirHoras, usoPorHora } from './horas.ts'

// Azar con semilla, para que las pruebas den siempre lo mismo
function semilla(n: number) {
  let s = n >>> 0
  return () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const JUEVES = '2026-11-05'
const ordenadas = (h: number[]) => [...h].sort((a, b) => a - b)

test('horas: la franja de las pruebas es de 8:00 a 22:00', () => {
  assert.deepEqual(HORAS_PRUEBA, [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22])
})

test('repartir: 5 horas distintas de la franja, separadas al menos 2 horas', () => {
  const h = repartirHoras(JUEVES, [], new Map(), semilla(1))
  assert.equal(h.length, 5)
  assert.equal(new Set(h).size, 5)
  for (const x of h) assert.ok(HORAS_PRUEBA.includes(x))
  const o = ordenadas(h)
  for (let i = 1; i < o.length; i++) assert.ok(o[i] - o[i - 1] >= 2, `separación en ${o}`)
})

test('repartir: prefiere las horas que menos se han usado ese día de la semana', () => {
  const uso = new Map([8, 9, 10, 11, 12].map((h) => [`4-${h}`, 3] as const))
  const h = repartirHoras(JUEVES, [], uso, semilla(2))
  for (const x of h) assert.ok(x > 12, `salió ${x}, que ya se usó mucho los jueves`)
})

test('repartir: no repite las horas que ya tomó otra prueba ese día', () => {
  const ocupadas = [8, 10, 12, 14, 16]
  const h = repartirHoras(JUEVES, ocupadas, new Map(), semilla(3))
  assert.equal(new Set(h).size, 5)
  for (const x of h) assert.ok(!ocupadas.includes(x), `salió ${x}, que ya estaba tomada`)
})

test('usoPorHora: cuenta el día de Costa Rica, no el de UTC', () => {
  // 04:00 UTC del sábado 7 son las 22:00 del viernes 6 en Costa Rica
  const uso = usoPorHora(['2026-11-07T04:00:00.000Z', '2026-11-07T04:00:00.000Z', '2026-11-06T14:00:00.000Z'])
  assert.equal(uso.get('5-22'), 2)
  assert.equal(uso.get('5-8'), 1)
  assert.equal(uso.get('6-4'), undefined)
})

test('repartir: el azar cambia qué versión va a cada hora, no las horas', () => {
  const uso = new Map(HORAS_PRUEBA.map((h) => [`4-${h}`, h % 3] as const))
  const a = repartirHoras(JUEVES, [], uso, semilla(10))
  const b = repartirHoras(JUEVES, [], uso, semilla(99))
  assert.equal(new Set(a).size, 5)
  assert.notDeepEqual(a, b)
  // Con el mismo uso, las horas elegidas salen de las menos usadas (uso 0: 9, 12, 15, 18, 21)
  assert.deepEqual(ordenadas(a), [9, 12, 15, 18, 21])
  assert.deepEqual(ordenadas(b), [9, 12, 15, 18, 21])
})

test('repartir: si no caben con 2 horas de separación, afloja a 1 y siguen siendo 5 libres', () => {
  // Libres solo de 8 a 12: con 2 horas de separación caben 3 (8, 10, 12), así que afloja a 1
  const ocupadas = [13, 14, 15, 16, 17, 18, 19, 20, 21, 22]
  const h = repartirHoras(JUEVES, ocupadas, new Map(), semilla(4))
  assert.equal(h.length, 5)
  assert.equal(new Set(h).size, 5)
  for (const x of h) assert.ok(!ocupadas.includes(x))
  assert.deepEqual(ordenadas(h), [8, 9, 10, 11, 12])
})
