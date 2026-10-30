import { test } from 'node:test'
import assert from 'node:assert/strict'
import { OTRO, PAISES, bandera, paisPorDefecto, whatsappCompleto } from './paises.ts'

test('la bandera sale del código del país', () => {
  assert.equal(bandera('CR'), '🇨🇷')
  assert.equal(bandera('MX'), '🇲🇽')
})

test('la lista va por nombre, sin repetidos, y cada país tiene su código y largo de número', () => {
  const nombres = PAISES.map((p) => p.nombre)
  assert.deepEqual(nombres, [...nombres].sort((a, b) => a.localeCompare(b, 'es')))
  assert.equal(new Set(PAISES.map((p) => p.iso)).size, PAISES.length)
  for (const p of PAISES) {
    assert.match(p.codigo, /^\d{1,3}$/, p.iso)
    assert.ok(p.digitos[0] <= p.digitos[1], p.iso)
  }
  assert.equal(PAISES.find((p) => p.iso === 'CR')?.codigo, '506')
})

test('el país por defecto es el de la persona si está en la lista; si no, Costa Rica u «Otro»', () => {
  assert.equal(paisPorDefecto('MX'), 'MX')
  assert.equal(paisPorDefecto('mx'), 'MX')
  assert.equal(paisPorDefecto('JP'), OTRO) // detectado pero fuera de la lista: que escriba su código
  assert.equal(paisPorDefecto(null), 'CR')
  assert.equal(paisPorDefecto(''), 'CR')
})

test('el número se arma con el código del país y el largo justo', () => {
  assert.equal(whatsappCompleto('CR', '8888 8888'), '+50688888888')
  assert.equal(whatsappCompleto('CR', '8888-888'), null) // le falta un dígito
  assert.equal(whatsappCompleto('CR', '8888 88888'), null) // le sobra uno
  assert.equal(whatsappCompleto('MX', '55 1234 5678'), '+525512345678')
  assert.equal(whatsappCompleto('ES', '612 34 56 78'), '+34612345678')
  assert.equal(whatsappCompleto('GB', '07700 900123'), '+447700900123') // sin el 0 de adelante
  assert.equal(whatsappCompleto('AR', '9 11 2345 6789'), '+5491123456789')
})

test('si la persona escribe el número completo con + o 00, manda ese y no el del selector', () => {
  assert.equal(whatsappCompleto('CR', '+52 55 1234 5678'), '+525512345678')
  assert.equal(whatsappCompleto('CR', '0052 55 1234 5678'), '+525512345678')
  assert.equal(whatsappCompleto(OTRO, '+81 90 1234 5678'), '+819012345678')
  assert.equal(whatsappCompleto(OTRO, '90 1234 5678'), null) // «Otro» necesita el código
  assert.equal(whatsappCompleto('CR', '+12'), null)
})
