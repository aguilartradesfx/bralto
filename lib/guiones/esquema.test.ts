import { test } from 'node:test'
import assert from 'node:assert/strict'
import { leerGuion } from './esquema.ts'

// Un guion inventado, con la forma del que escribe la noche
function bueno(): Record<string, unknown> {
  return {
    titulo: 'Ordena tus pedidos en 5 minutos',
    tema: 'Una hoja de cálculo que se llena sola con cada pedido',
    comenta: 'PEDIDOS',
    guia: 'ordena-tus-pedidos',
    duracion_s: 40,
    lineas: [
      { vista: 'usted', dice: '¿Todavía anota sus pedidos en un cuaderno?', pantalla: '' },
      { vista: 'mitad', dice: 'Mire esto: cada pedido cae solo en una hoja.', pantalla: 'La hoja llenándose sola' },
      { vista: 'motion', dice: 'Son tres pasos y no paga nada.', pantalla: 'Los tres pasos, uno por uno' },
    ],
    ganchos: [
      { tipo: 'sorpresa', dice: 'Esta hoja anota los pedidos por usted.' },
      { tipo: 'mito', dice: 'No necesita un sistema caro para ordenarse.' },
      { tipo: 'advertencia', dice: 'Si anota a mano, está perdiendo ventas.' },
      { tipo: 'pregunta', dice: '¿Cuántos pedidos se le pierden por semana?' },
      { tipo: 'lista', dice: 'Tres pasos para no perder ni un pedido.' },
    ],
  }
}

function errores(json: unknown): string[] {
  const r = leerGuion(json)
  assert.equal(r.ok, false, 'debía rechazarlo')
  return r.ok ? [] : r.errores
}

test('un guion bien hecho se lee completo', () => {
  const r = leerGuion(bueno())
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.equal(r.guion.titulo, 'Ordena tus pedidos en 5 minutos')
  assert.equal(r.guion.comenta, 'PEDIDOS')
  assert.equal(r.guion.guia, 'ordena-tus-pedidos')
  assert.equal(r.guion.duracion_s, 40)
  assert.equal(r.guion.lineas.length, 3)
  assert.deepEqual(r.guion.lineas[1], { vista: 'mitad', dice: 'Mire esto: cada pedido cae solo en una hoja.', pantalla: 'La hoja llenándose sola' })
  assert.deepEqual(r.guion.ganchos.map((g) => g.tipo), ['sorpresa', 'mito', 'advertencia', 'pregunta', 'lista'])
})

test('limpia lo que viene un poco desordenado', () => {
  const g = bueno()
  g.titulo = '  Ordena tus pedidos  '
  g.comenta = ' Comenta «pedidos» '
  g.duracion_s = 41.6
  g.lineas = [{ vista: ' USTED ', dice: '  Hola.  ' }, { vista: 'Motion', dice: 'Chao.', pantalla: null }]
  g.ganchos = (g.ganchos as { tipo: string; dice: string }[]).map((x) => ({ ...x, tipo: ` ${x.tipo.toUpperCase()} ` }))
  g.extra = 'lo que no conoce se ignora'
  const r = leerGuion(g)
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.equal(r.guion.titulo, 'Ordena tus pedidos')
  assert.equal(r.guion.comenta, 'PEDIDOS')
  assert.equal(r.guion.duracion_s, 42)
  assert.deepEqual(r.guion.lineas, [
    { vista: 'usted', dice: 'Hola.', pantalla: '' },
    { vista: 'motion', dice: 'Chao.', pantalla: '' },
  ])
  assert.equal(r.guion.ganchos[0].tipo, 'sorpresa')
  assert.equal('extra' in r.guion, false)
})

test('tema, comenta, guía y duración son opcionales', () => {
  const g = bueno()
  delete g.tema
  delete g.comenta
  g.guia = ''
  g.duracion_s = null
  const r = leerGuion(g)
  assert.equal(r.ok, true)
  if (!r.ok) return
  assert.equal(r.guion.tema, '')
  assert.equal(r.guion.comenta, null)
  assert.equal(r.guion.guia, null)
  assert.equal(r.guion.duracion_s, null)
})

test('si no es un objeto lo dice', () => {
  for (const malo of [null, 'hola', 42, []]) assert.deepEqual(errores(malo), ['El guion tiene que ser un objeto JSON, con { … }'])
})

test('dice qué campo falta', () => {
  const g = bueno()
  delete g.titulo
  delete g.lineas
  delete g.ganchos
  assert.deepEqual(errores(g), ['Falta «titulo»', 'Falta «lineas»', 'Falta «ganchos»'])
})

test('dice en qué línea está el problema', () => {
  const g = bueno()
  g.lineas = [
    { vista: 'usted', dice: 'Bien.' },
    { vista: 'medio', dice: 'Mal la vista.' },
    { vista: 'motion', dice: '   ' },
    { dice: 'Sin vista.' },
  ]
  assert.deepEqual(errores(g), [
    'Línea 2: «vista» tiene que ser usted, mitad o motion (vino «medio»)',
    'Línea 3: «dice» está vacío',
    'Línea 4: falta «vista» (usted, mitad o motion)',
  ])
})

test('sin líneas no hay guion', () => {
  const g = bueno()
  g.lineas = []
  assert.deepEqual(errores(g), ['«lineas» está vacía: el guion necesita al menos una línea'])
})

test('los ganchos tienen que ser 5, cada uno con su tipo y lo que dice', () => {
  const g = bueno()
  g.ganchos = (g.ganchos as unknown[]).slice(0, 3)
  assert.deepEqual(errores(g), ['Tienen que ser 5 ganchos (vinieron 3)'])
  const h = bueno()
  ;(h.ganchos as Record<string, unknown>[])[1] = { tipo: 'mito' }
  ;(h.ganchos as Record<string, unknown>[])[4] = { dice: 'Sin tipo.' }
  assert.deepEqual(errores(h), ['Gancho 2: falta «dice»', 'Gancho 5: falta «tipo»'])
})

test('los tipos equivocados se explican', () => {
  const g = bueno()
  g.titulo = 12
  g.duracion_s = '40'
  g.lineas = 'una sola línea'
  assert.deepEqual(errores(g), ['«titulo» tiene que ser texto', '«duracion_s» tiene que ser un número de segundos', '«lineas» tiene que ser una lista'])
})

test('una duración imposible o una guía que no es slug se rechazan', () => {
  const g = bueno()
  g.duracion_s = 0
  g.guia = 'Mi Guía'
  assert.deepEqual(errores(g), [
    '«guia» tiene que ser el nombre corto de la guía (minúsculas, números y guiones)',
    '«duracion_s» tiene que ser más de 0 segundos',
  ])
  const h = bueno()
  h.duracion_s = 4000
  assert.deepEqual(errores(h), ['«duracion_s» no puede pasar de 600 segundos (10 minutos)'])
})
