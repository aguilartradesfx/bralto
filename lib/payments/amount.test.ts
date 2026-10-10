import { test } from 'node:test'
import assert from 'node:assert/strict'
import { formatMoney, parseAmount } from './amount.ts'

test('monto: números simples y con decimales de punto o de coma', () => {
  assert.equal(parseAmount('100'), 100)
  assert.equal(parseAmount('100.5'), 100.5)
  assert.equal(parseAmount('100,50'), 100.5)
})

test('monto: miles con espacio, coma o punto', () => {
  assert.equal(parseAmount(' 55 000 '), 55000)
  assert.equal(parseAmount('55,000'), 55000)
  assert.equal(parseAmount('1.000'), 1000)
  assert.equal(parseAmount('1,234.50'), 1234.5)
  assert.equal(parseAmount('1.234,50'), 1234.5)
})

test('monto: lo que no es un monto positivo da 0', () => {
  for (const bad of ['', 'abc', '-5', '0', '1,2,3.4.5']) assert.equal(parseAmount(bad), 0, bad)
})

// Intl separa con espacios de distinto tipo según la versión
const plain = (s: string) => s.replace(/\s/g, ' ')

test('colones sin decimales y dólares con dos, con su símbolo', () => {
  assert.equal(plain(formatMoney(55000, 'CRC')), '₡55 000')
  assert.equal(plain(formatMoney(181.818, 'USD')), '$181,82')
})
