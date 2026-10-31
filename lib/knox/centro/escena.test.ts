import { test } from 'node:test'
import assert from 'node:assert/strict'
import { caben, centroKnox, DISENO_DERECHA, DISENO_IZQUIERDA, medidas, repartir, SCRIPT_MEDIDAS } from './escena.ts'

test('el lienzo toma la forma de la ventana, sin bordes negros', () => {
  // 16:10 (la Mac de Ale): 1920 de ancho y más alto
  assert.deepEqual(medidas(2056, 1290), { ancho: 1920, alto: 1205, escala: 2056 / 1920 })
  assert.equal(medidas(1728, 1117).alto, 1241)
  assert.equal(medidas(1512, 982).alto, 1247)
  // 16:9 justo: el diseño tal cual
  assert.deepEqual(medidas(1920, 1080), { ancho: 1920, alto: 1080, escala: 1 })
  assert.deepEqual(medidas(3840, 2160), { ancho: 1920, alto: 1080, escala: 2 })
  // Más ancha que 16:9: 1080 de alto y más ancho
  assert.deepEqual(medidas(2560, 1080), { ancho: 2560, alto: 1080, escala: 1 })
  // Sin ventana (en el servidor): el diseño
  assert.deepEqual(medidas(0, 0), { ancho: 1920, alto: 1080, escala: 1 })
})

test('el script de antes del primer pintado calcula lo mismo', () => {
  for (const [w, h] of [
    [2056, 1290],
    [1728, 1117],
    [1512, 982],
    [1920, 1080],
    [2560, 1080],
  ]) {
    const vars: Record<string, string> = {}
    const documento = { documentElement: { style: { setProperty: (k: string, v: string) => (vars[k] = v) } } }
    new Function('document', 'innerWidth', 'innerHeight', 'addEventListener', SCRIPT_MEDIDAS)(documento, w, h, () => undefined)
    const m = medidas(w, h)
    assert.equal(Number(vars['--kc-escala']), m.escala, `${w}×${h}`)
    assert.equal(vars['--kc-ancho'], `${m.ancho}px`)
    assert.equal(vars['--kc-alto'], `${m.alto}px`)
    assert.equal(vars['--kc-extra'], `${m.alto - 1080}px`)
  }
})

test('las columnas se reparten el alto extra en proporción al diseño', () => {
  // En 1080 quedan como en el diseño
  assert.deepEqual(
    repartir(1080, DISENO_IZQUIERDA).map((t) => [t.top, t.alto]),
    [
      [108, 280],
      [406, 268],
      [692, 174],
    ],
  )
  assert.deepEqual(
    repartir(1080, DISENO_DERECHA).map((t) => [t.top, Math.round(t.alto)]),
    [
      [108, 290],
      [416, 208],
      [642, 224],
    ],
  )
  // Más alto: crecen todos y terminan donde empieza el pulso
  const alto = repartir(1247, DISENO_IZQUIERDA)
  assert.ok(alto.every((t, i) => t.alto > DISENO_IZQUIERDA[i]))
  const ultimo = alto[alto.length - 1]
  assert.equal(Math.round(ultimo.top + ultimo.alto), 1247 - 214)
})

test('el centro de Knox baja con el alto extra y queda en el medio a lo ancho', () => {
  assert.deepEqual(centroKnox({ ancho: 1920, alto: 1080 }), { x: 960, y: 398 })
  assert.deepEqual(centroKnox({ ancho: 1920, alto: 1240 }), { x: 960, y: 478 })
  assert.deepEqual(centroKnox({ ancho: 2560, alto: 1080 }), { x: 1280, y: 398 })
})

test('con más alto caben más conversaciones y más cosas del día', () => {
  assert.equal(caben.esperando(268), 3)
  assert.equal(caben.esperando(314), 4) // 16:10
  assert.equal(caben.esperando(330), 4)
  assert.equal(caben.esperando(2000), 8)
  assert.equal(caben.dia(224), 4)
  assert.equal(caben.dia(276), 5)
  assert.equal(caben.dia(100), 4)
})
