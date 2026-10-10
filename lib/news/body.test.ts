import { test } from 'node:test'
import assert from 'node:assert/strict'
import { parseBody } from './body.ts'

test('párrafos separados por línea en blanco y subtítulos ##', () => {
  assert.deepEqual(parseBody('Uno\nsigue.\n\n## Por qué importa\nDos.\r\n\r\nTres.'), [
    { type: 'p', text: 'Uno sigue.' },
    { type: 'h2', text: 'Por qué importa' },
    { type: 'p', text: 'Dos.' },
    { type: 'p', text: 'Tres.' },
  ])
})

test('sin texto no hay bloques', () => {
  assert.deepEqual(parseBody('  \n\n '), [])
})
