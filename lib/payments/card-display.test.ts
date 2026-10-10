import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cardBrand, formatExpiry, maskCardNumber } from './card-display.ts'

// Lo que se ve en la tarjeta: cada posición, con puntos donde no hay que mostrar el dígito
const shown = (input: string) =>
  maskCardNumber(input)
    .map((group) => group.map((slot) => slot.ch).join(''))
    .join(' ')

const digitsShown = (input: string) => shown(input).replace(/\D/g, '')

test('un número completo muestra solo los últimos 4 dígitos', () => {
  assert.equal(shown('4111 1111 1111 1234'), '•••• •••• •••• 1234')
})

test('mientras se escribe no aparece ningún dígito hasta llegar a los últimos 4', () => {
  assert.equal(digitsShown('41111111'), '')
  assert.equal(digitsShown('411111111111'), '')
  assert.equal(digitsShown('4111111111111'), '1')
})

test('ningún prefijo del número muestra más de 4 dígitos', () => {
  const number = '5555555555554444'
  for (let i = 0; i <= number.length; i++) {
    assert.ok(digitsShown(number.slice(0, i)).length <= 4, `con ${i} dígitos se ven de más`)
  }
})

test('las posiciones escritas se marcan, las que faltan no', () => {
  const slots = maskCardNumber('41').flat()
  assert.deepEqual(slots.slice(0, 3).map((s) => s.filled), [true, true, false])
})

test('American Express: 15 dígitos en grupos de 4, 6 y 5', () => {
  assert.equal(shown('378282246310005'), '•••• •••••• •0005')
})

test('con más de 16 dígitos sigue mostrando solo 4', () => {
  assert.equal(digitsShown('4111111111111111234'), '1234')
})

test('ignora espacios, guiones y letras', () => {
  assert.equal(shown('4111-1111 1111 12ab34'), '•••• •••• •••• 1234')
})

test('reconoce la marca por los primeros dígitos', () => {
  assert.equal(cardBrand('4111'), 'visa')
  assert.equal(cardBrand('5500 0000'), 'mastercard')
  assert.equal(cardBrand('2221 00'), 'mastercard')
  assert.equal(cardBrand('3782'), 'amex')
  assert.equal(cardBrand('6011'), null)
  assert.equal(cardBrand(''), null)
})

test('el vencimiento se ve como MM/AA', () => {
  assert.equal(formatExpiry('1228'), '12/28')
  assert.equal(formatExpiry('12/28'), '12/28')
  assert.equal(formatExpiry('1'), '1')
  assert.equal(formatExpiry('123'), '12/3')
  assert.equal(formatExpiry('122899'), '12/28')
  assert.equal(formatExpiry(''), '')
})
