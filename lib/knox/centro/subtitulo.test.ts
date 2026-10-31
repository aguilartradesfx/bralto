import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enVivo, fijo, marcar, oraciones, trozos } from './subtitulo.ts'

test('las oraciones no se cortan en los números', () => {
  assert.deepEqual(oraciones('Tu Instagram tiene unos 4.450 seguidores. Ayer no llegaron nuevos.'), [
    'Tu Instagram tiene unos 4.450 seguidores.',
    'Ayer no llegaron nuevos.',
  ])
  assert.deepEqual(oraciones('¡Buenas tardes, Ale! Hoy es viernes 30 de octubre… ¿Les escribo yo?'), [
    '¡Buenas tardes, Ale!',
    'Hoy es viernes 30 de octubre…',
    '¿Les escribo yo?',
  ])
  assert.deepEqual(oraciones('Alguien escribió «yo quiero.» Y nada más'), ['Alguien escribió «yo quiero.»', 'Y nada más'])
})

test('los trozos juntan oraciones cortas y cortan las largas en una coma', () => {
  assert.deepEqual(trozos('Buenas tardes, Ale. Hoy llegaron 12 personas nuevas y 3 quieren hablar contigo. ¿Les escribo yo?'), [
    'Buenas tardes, Ale. Hoy llegaron 12 personas nuevas y 3 quieren hablar contigo. ¿Les escribo yo?',
  ])
  const larga =
    'Tienes 11 mensajes sin responder en Instagram de gente que quiere saber más de lo que haces, y lo primero es una persona que quiere mejorar sus redes y atraer más clientes este mes.'
  const partes = trozos(larga)
  assert.equal(partes.length, 2)
  assert.ok(partes.every((p) => p.length <= 110))
  assert.equal(partes.join(' '), larga)
  // Sin comas: en el espacio de la mitad
  const sinComas = 'palabra '.repeat(30).trim()
  assert.ok(trozos(sinComas).every((p) => p.length <= 110))
  assert.equal(trozos(sinComas).join(' '), sinComas)
})

test('marcar: lo dicho, la palabra de ahora y lo que falta; los números aparte', () => {
  // «Hoy » y «llegaron » son 13 de 24 letras: a 0,6 va por el «12»
  const p = marcar('Hoy llegaron 12 personas', 0.6)
  assert.deepEqual(
    p.map((x) => x.estado),
    ['dicha', 'dicha', 'actual', 'falta'],
  )
  assert.deepEqual(
    p.map((x) => x.numero),
    [false, false, true, false],
  )
  assert.ok(marcar('Hola Ale', 0).every((x, i) => (i === 0 ? x.estado === 'actual' : x.estado === 'falta')))
  assert.ok(fijo('  Todo   dicho ').every((x) => x.estado === 'dicha'))
})

test('en vivo: la sección según el segundo del audio y el trozo según el largo', () => {
  const secciones = ['Buenas tardes, Ale.', 'El dólar está a 455 colones.', 'Uno. ' + 'Dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos dos.']
  const inicios = [0, 3, 8]
  assert.equal(enVivo(secciones, inicios, 20, 0)?.seccion, 0)
  assert.equal(enVivo(secciones, inicios, 20, 2.99)?.seccion, 1) // con un poquito de adelanto
  const dolar = enVivo(secciones, inicios, 20, 5.5)
  assert.equal(dolar?.seccion, 1)
  assert.equal(dolar?.palabras.find((p) => p.numero)?.texto, '455')
  // La última sección se reparte hasta el final del audio
  const fin = enVivo(secciones, inicios, 20, 19.99)
  assert.equal(fin?.seccion, 2)
  assert.equal(fin?.trozo, 1)
  assert.equal(enVivo(secciones, inicios, 20, 30)?.palabras.every((p) => p.estado === 'dicha'), true)
  assert.equal(enVivo([], [], 20, 1), null)
  // Sin la duración del audio, igual responde
  assert.equal(enVivo(secciones, inicios, Number.NaN, 9)?.seccion, 2)
})
