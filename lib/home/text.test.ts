import { test } from 'node:test'
import assert from 'node:assert/strict'
import { firstSentence } from './text.ts'

test('devuelve la primera frase de la historia de un caso', () => {
  assert.equal(
    firstSentence('Nanku tenía presencia digital, pero no la operación que un restaurante de su nivel necesita. Llegamos a reestructurarlo todo.'),
    'Nanku tenía presencia digital, pero no la operación que un restaurante de su nivel necesita.',
  )
})

test('no corta en una abreviatura como U.S.', () => {
  assert.equal(
    firstSentence('AO is the official supplier of liquidation merchandise from U.S. retailers in Costa Rica: Amazon and Target. We built its site.'),
    'AO is the official supplier of liquidation merchandise from U.S. retailers in Costa Rica: Amazon and Target.',
  )
})

test('corta antes de una pregunta o exclamación en español', () => {
  assert.equal(firstSentence('Primera frase. ¿Y la segunda?'), 'Primera frase.')
  assert.equal(firstSentence('Primera frase. ¡Segunda!'), 'Primera frase.')
})

test('si hay una sola frase, la devuelve completa y sin espacios sobrantes', () => {
  assert.equal(firstSentence('  Una sola frase sin punto final  '), 'Una sola frase sin punto final')
})
