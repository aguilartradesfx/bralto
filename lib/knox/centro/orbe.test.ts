import { test } from 'node:test'
import assert from 'node:assert/strict'
import { agitacion, avanzar, FRANJAS, hablaSimulada, leerVoz, nuevoEstado } from './orbe.ts'

const DT = 1 / 60
const quieto = { agita: 0, voz: null, reducido: false }

test('quieto cuando no habla, agitado mientras revisa y a medias mientras saluda', () => {
  assert.equal(agitacion('revisando'), 1)
  assert.equal(agitacion('cargando'), 1)
  assert.equal(agitacion('saludando'), 0.5)
  for (const f of ['hablando', 'pausado', 'terminado', 'esperando', 'error']) assert.equal(agitacion(f), 0)
})

test('la voz: el silencio no mueve nada y una voz fuerte llega al tope', () => {
  const silencio = leerVoz(new Uint8Array(256))
  assert.equal(silencio.nivel, 0)
  assert.equal(silencio.bandas.length, FRANJAS)
  assert.ok(silencio.bandas.every((b) => b === 0))
  const fuerte = leerVoz(new Uint8Array(256).fill(255))
  assert.equal(fuerte.nivel, 1)
  assert.ok(fuerte.bandas.every((b) => b === 1))
})

test('las franjas siguen dónde suena la voz: los graves en la primera, los agudos en la última', () => {
  const graves = new Uint8Array(256)
  graves.fill(200, 2, 8)
  const v = leerVoz(graves)
  assert.ok(v.bandas[0] > 0.5)
  assert.equal(v.bandas[FRANJAS - 1], 0)
  assert.ok(v.nivel > 0 && v.nivel < 1)
})

test('pasar de quieto a revisando acelera el remolino poco a poco, sin brincos', () => {
  const e = nuevoEstado()
  for (let i = 0; i < 120; i++) avanzar(e, { ...quieto, dt: DT })
  let antes = e.fase
  const pasos: number[] = []
  for (let i = 0; i < 240; i++) {
    avanzar(e, { ...quieto, agita: 1, dt: DT })
    pasos.push(e.fase - antes)
    antes = e.fase
  }
  for (let i = 1; i < pasos.length; i++) {
    assert.ok(pasos[i] >= pasos[i - 1] - 1e-12)
    assert.ok(pasos[i] - pasos[i - 1] < 0.0005)
  }
  assert.ok(pasos[pasos.length - 1] > pasos[0] * 1.5)
})

test('después de un rato sin dibujar (la ventana escondida), no brinca', () => {
  const e = nuevoEstado()
  avanzar(e, { ...quieto, agita: 1, dt: 30 })
  assert.ok(e.reloj <= 0.05)
  assert.ok(e.fase < 0.05)
})

test('la voz sube rápido y baja más despacio; la lenta va detrás', () => {
  const e = nuevoEstado()
  const fuerte = { ...quieto, voz: { nivel: 1, bandas: null }, dt: DT }
  avanzar(e, fuerte)
  const subida = e.nivel
  for (let i = 0; i < 30; i++) avanzar(e, fuerte)
  const arriba = e.nivel
  avanzar(e, { ...quieto, dt: DT })
  assert.ok(subida > (arriba - e.nivel) * 2)
  assert.ok(e.nivelLento < e.nivel)
})

test('sin el analizador, las franjas siguen al nivel y se apagan cuando calla', () => {
  const e = nuevoEstado()
  for (let i = 0; i < 60; i++) avanzar(e, { ...quieto, voz: { nivel: 0.8, bandas: null }, dt: DT })
  assert.ok(e.bandas.some((b) => b > 0.2))
  for (let i = 0; i < 240; i++) avanzar(e, { ...quieto, dt: DT })
  assert.ok(e.bandas.every((b) => b < 0.01))
})

test('con movimiento reducido, todo va al 15 %', () => {
  const normal = nuevoEstado()
  const lento = nuevoEstado()
  for (let i = 0; i < 60; i++) {
    avanzar(normal, { ...quieto, dt: DT })
    avanzar(lento, { ...quieto, reducido: true, dt: DT })
  }
  assert.ok(Math.abs(lento.fase - normal.fase * 0.15) < 1e-9)
  assert.ok(Math.abs(lento.reloj - normal.reloj * 0.15) < 1e-9)
})

test('el habla de mentira: sílabas entre 0,35 y 1, con pausas cortas', () => {
  let s = 1
  const azar = () => (s = (s * 16807) % 2147483647) / 2147483647
  const habla = hablaSimulada(azar)
  const valores = Array.from({ length: 600 }, (_, i) => habla(i / 60))
  assert.ok(valores.every((v) => v === 0.03 || (v >= 0.35 && v <= 1)))
  assert.ok(valores.includes(0.03))
  assert.ok(valores.some((v) => v >= 0.35))
})
