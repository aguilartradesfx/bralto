import { test } from 'node:test'
import assert from 'node:assert/strict'
import { dialCodeOptions, guessDialCode, invalidContactFields, isValidEmail, isValidPhone } from './contact.ts'

test('correo: acepta direcciones reales', () => {
  for (const ok of ['ana@empresa.com', 'a.b+c@sub.dominio.co.cr', 'ANA@EMPRESA.COM', ' ana@empresa.com ']) {
    assert.equal(isValidEmail(ok), true, ok)
  }
})

test('correo: rechaza los incompletos', () => {
  for (const bad of ['a@b', 'ana@', '@empresa.com', 'ana empresa@x.com', 'ana@empresa', 'ana@empresa.c', 'ana@@empresa.com', '']) {
    assert.equal(isValidEmail(bad), false, bad)
  }
})

test('teléfono: acepta números con espacios, guiones o paréntesis', () => {
  for (const ok of ['8888 8888', '8888-8888', '(312) 847-1928', '55 1234 5678']) {
    assert.equal(isValidPhone(ok), true, ok)
  }
})

test('teléfono: rechaza letras, el código de país con + y largos imposibles', () => {
  // El servidor no acepta el +: el código va en su propio selector
  for (const bad of ['abc', '+506 8888 8888', '12345', '1234567890123456', '']) {
    assert.equal(isValidPhone(bad), false, bad)
  }
})

test('datos de contacto: devuelve los campos inválidos en el orden del formulario', () => {
  assert.deepEqual(invalidContactFields({ nombre: '', apellido: ' ', telefono: 'x', email: 'a@b' }), [
    'nombre',
    'apellido',
    'telefono',
    'email',
  ])
  assert.deepEqual(
    invalidContactFields({ nombre: 'Ana', apellido: 'Mora', telefono: '8888 8888', email: 'ana@empresa.com' }),
    [],
  )
})

test('código de país: primero el país que dice el idioma del navegador', () => {
  assert.equal(guessDialCode({ languages: ['es-MX', 'es'], timeZone: 'America/Costa_Rica', locale: 'es' }), '+52')
  assert.equal(guessDialCode({ languages: ['en-US'], timeZone: 'Europe/Madrid', locale: 'en' }), '+1')
})

test('código de país: si el idioma no dice el país, la zona horaria', () => {
  assert.equal(guessDialCode({ languages: ['es'], timeZone: 'America/Bogota', locale: 'es' }), '+57')
  assert.equal(guessDialCode({ languages: ['es-419'], timeZone: 'America/Costa_Rica', locale: 'es' }), '+506')
  assert.equal(guessDialCode({ languages: ['es'], timeZone: 'Europe/Madrid', locale: 'es' }), '+34')
  assert.equal(guessDialCode({ languages: ['es'], timeZone: 'America/Argentina/Buenos_Aires', locale: 'es' }), '+54')
  assert.equal(guessDialCode({ languages: ['en'], timeZone: 'America/Chicago', locale: 'en' }), '+1')
})

test('código de país: sin pistas, Costa Rica en español y EE. UU. en inglés', () => {
  assert.equal(guessDialCode({ languages: ['fr-FR'], timeZone: 'Europe/Paris', locale: 'es' }), '+506')
  assert.equal(guessDialCode({ languages: [], timeZone: undefined, locale: 'en' }), '+1')
})

test('países en el idioma de la página, en orden alfabético', () => {
  const es = dialCodeOptions('es')
  assert.equal(es[0].label, '+54 · Argentina')
  assert.ok(es.some((o) => o.code === '+52' && o.label === '+52 · México'))
  assert.ok(es.some((o) => o.code === '+1' && o.label === '+1 · Estados Unidos / Canadá'))
  assert.ok(es.some((o) => o.code === '+44' && o.label === '+44 · Reino Unido'))
  assert.ok(dialCodeOptions('en').some((o) => o.code === '+34' && o.label === '+34 · Spain'))
})

test('los códigos tienen el formato que exige el servidor', () => {
  for (const o of dialCodeOptions('es')) assert.match(o.code, /^\+\d{1,4}$/)
})
