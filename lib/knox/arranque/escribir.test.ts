import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mensajeArranques, POR_DIA, tiposDelDia, validarArranques } from './escribir.ts'

const BIEN = {
  tipo: 'idea' as const,
  saludo: '¡Qué tal, Ale! Ya estoy revisando todo para darte el reporte.',
  frase:
    'Mientras tanto me quedé pensando en algo loco, bro: los humanos guardan fotos para no olvidar, pero casi nunca las vuelven a ver. Como si el recuerdo fuera la foto y no lo que vivieron.',
}

test('cada día trae los tres tipos, y el primero cambia de un día al siguiente', () => {
  const hoy = tiposDelDia('2026-11-02')
  const manana = tiposDelDia('2026-11-03')
  assert.equal(hoy.length, POR_DIA)
  assert.deepEqual(new Set(hoy), new Set(['idea', 'ciencia', 'empujon']))
  assert.notEqual(hoy[0], manana[0])
})

test('deja los que están bien y les quita lo que la voz leería mal', () => {
  const [a] = validarArranques({ arranques: [{ ...BIEN, frase: `${BIEN.frase} 🚀` }] })
  assert.equal(a.tipo, 'idea')
  assert.equal(a.saludo, BIEN.saludo)
  assert.doesNotMatch(a.frase, /🚀/)
})

test('quita los que saludan según la hora o dicen el día, porque no sabe a qué hora lo vas a abrir', () => {
  const malos = [
    { ...BIEN, saludo: 'Buenos días, Ale. Ya estoy revisando todo para darte el reporte.' },
    { ...BIEN, saludo: '¡Buenas tardes, mae! Reviso todo y ya te doy el reporte.' },
    { ...BIEN, frase: `Hoy es lunes y ${BIEN.frase}` },
    { ...BIEN, frase: `${BIEN.frase} Feliz 2 de noviembre.` },
  ]
  assert.equal(validarArranques({ arranques: [BIEN, ...malos] }).length, 1)
})

test('quita los que hablan de plata y los que no dicen que está revisando para el reporte', () => {
  const malos = [
    { ...BIEN, frase: `${BIEN.frase} Y vas por buen camino con esos 5 mil dólares.` },
    { ...BIEN, saludo: '¡Qué tal, Ale! ¿Cómo va todo?' },
  ]
  assert.equal(validarArranques({ arranques: [BIEN, ...malos] }).length, 1)
})

test('quita los que quedaron muy cortos o muy largos para el tiempo que tarda en cargar', () => {
  const malos = [
    { ...BIEN, frase: 'Los humanos son raros.' },
    { ...BIEN, frase: BIEN.frase.repeat(5) },
  ]
  assert.equal(validarArranques({ arranques: [BIEN, ...malos] }).length, 1)
})

test('el pedido lleva los tipos en orden y las frases de antes, para no repetirlas', () => {
  const m = mensajeArranques(['ciencia', 'idea'], ['La entropía siempre gana.', 'El caos ordena.'])
  assert.match(m, /2 arranques/)
  assert.match(m, /ciencia, idea/)
  assert.match(m, /La entropía siempre gana\./)
  assert.match(m, /El caos ordena\./)
  assert.doesNotMatch(mensajeArranques(['idea'], []), /anteriores/)
})
