import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cambio, contarPeriodos, leerPeriodo, nombreEtapa, salud, serieDiaria, tonoDeEtapa, turnosRespondidos, type Parte } from './calculos.ts'

// 5 nov 2026, 15:00 en Costa Rica
const AHORA = new Date('2026-11-05T21:00:00Z')

test('leerPeriodo: 7, 30 o 90; si no, 30', () => {
  assert.equal(leerPeriodo('7'), 7)
  assert.equal(leerPeriodo(['90']), 90)
  assert.equal(leerPeriodo('15'), 30)
  assert.equal(leerPeriodo(undefined), 30)
})

test('serieDiaria cuenta por día de Costa Rica y el último es hoy', () => {
  const serie = serieDiaria(['2026-11-05T05:59:00Z', '2026-11-05T06:01:00Z', '2026-11-03T18:00:00Z', '2026-10-01T00:00:00Z'], AHORA, 3)
  // 05:59Z del 5 nov todavía es el 4 en Costa Rica
  assert.deepEqual(serie, [1, 1, 1])
})

test('contarPeriodos separa el período de ahora del anterior', () => {
  const r = contarPeriodos(['2026-11-05T15:00:00Z', '2026-10-31T15:00:00Z', '2026-10-29T15:00:00Z', '2026-10-20T15:00:00Z'], AHORA, 7)
  assert.deepEqual(r, { actual: 2, anterior: 1 })
})

test('cambio: porcentaje con un decimal; null si antes fue cero', () => {
  assert.equal(cambio(9, 8), 12.5)
  assert.equal(cambio(3, 4), -25)
  assert.equal(cambio(5, 0), null)
})

test('turnosRespondidos: a tiempo, tarde y lo que todavía está en plazo', () => {
  const desde = '2026-10-01T00:00:00Z'
  const m = (conversacion_id: string, direccion: 'entrante' | 'saliente', enviado_en: string) => ({ conversacion_id, direccion, enviado_en })
  const r = turnosRespondidos(
    [
      // a tiempo (dos mensajes seguidos cuentan como una vez)
      m('a', 'entrante', '2026-11-01T10:00:00Z'),
      m('a', 'entrante', '2026-11-01T10:05:00Z'),
      m('a', 'saliente', '2026-11-01T12:00:00Z'),
      // tarde
      m('b', 'entrante', '2026-11-01T10:00:00Z'),
      m('b', 'saliente', '2026-11-03T10:00:00Z'),
      // sin respuesta y ya pasó el plazo: tarde
      m('c', 'entrante', '2026-11-02T10:00:00Z'),
      // sin respuesta pero aún en plazo: no cuenta
      m('d', 'entrante', '2026-11-05T20:00:00Z'),
      // antes del período: no cuenta
      m('e', 'entrante', '2026-09-20T10:00:00Z'),
      m('e', 'saliente', '2026-09-20T11:00:00Z'),
    ],
    AHORA,
    desde,
  )
  assert.deepEqual(r, { aTiempo: 1, total: 3 })
})

test('salud: promedio con pesos; lo que no tiene datos no cuenta; mejoras ordenadas', () => {
  const partes: Parte[] = [
    { id: 'a', nombre: 'A', peso: 40, valor: 50, detalle: '', consejo: { titulo: 'A', texto: '', href: '/a' } },
    { id: 'b', nombre: 'B', peso: 30, valor: 0, detalle: '', consejo: { titulo: 'B', texto: '', href: '/b' } },
    { id: 'c', nombre: 'C', peso: 30, valor: null, detalle: '', consejo: null },
  ]
  const s = salud(partes)
  // (50·40 + 0·30) / 70 = 28.6
  assert.equal(s.puntaje, 29)
  assert.deepEqual(s.partes.map((p) => p.pesoReal), [57, 43, 0])
  assert.deepEqual(s.mejoras.map((x) => [x.id, x.sube]), [['b', 43], ['a', 29]])
  assert.equal(salud([{ ...partes[2] }]).puntaje, null)
})

test('tonoDeEtapa: por el nombre de la etapa o por el estado', () => {
  assert.equal(tonoDeEtapa('Win'), 'verde')
  assert.equal(tonoDeEtapa('Se presentó'), 'verde')
  assert.equal(tonoDeEtapa('Perdidos'), 'rojo')
  assert.equal(tonoDeEtapa('No contestó la llamada'), 'rojo')
  assert.equal(tonoDeEtapa('Cita agendada.'), 'azul')
  assert.equal(tonoDeEtapa('Interesado/a.'), 'morado')
  assert.equal(tonoDeEtapa('Seguimiento BOT (5 Días)'), 'ambar')
  assert.equal(tonoDeEtapa('Retargeting'), 'gris')
  assert.equal(tonoDeEtapa('Retargeting', 'ganada'), 'verde')
  assert.equal(nombreEtapa('Cita agendada.'), 'Cita agendada')
})
