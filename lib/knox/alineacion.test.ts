import { test } from 'node:test'
import assert from 'node:assert/strict'
import { inicios, unir } from './alineacion.ts'

test('une las secciones con una pausa y recuerda dónde empieza cada una', () => {
  assert.deepEqual(unir(['Hola.', 'Chao.']), { texto: 'Hola.\n\nChao.', offsets: [0, 7] })
})

test('con la alineación de ElevenLabs, cada sección empieza cuando suena su primera letra', () => {
  const { texto, offsets } = unir(['Hola.', 'Chao.'])
  const alineacion = { characters: [...texto], character_start_times_seconds: [...texto].map((_, i) => i * 0.1) }
  assert.deepEqual(inicios(offsets, texto, alineacion), [0, 0.7])
})

test('si la alineación no calza con el texto, reparte en proporción', () => {
  const { texto, offsets } = unir(['Hola.', 'Chao.'])
  const alineacion = { characters: ['a', 'b', 'c'], character_start_times_seconds: [0, 1, 2] }
  assert.deepEqual(inicios(offsets, texto, alineacion), [0, 1])
})

test('sin alineación estima por largo del texto y nunca va para atrás', () => {
  const { texto, offsets } = unir(['Hola.', 'Chao.', 'Fin.'])
  const r = inicios(offsets, texto, null)
  assert.equal(r[0], 0)
  assert.ok(r[1] > 0 && r[2] > r[1])
})
