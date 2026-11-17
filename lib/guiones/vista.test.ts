import { test } from 'node:test'
import assert from 'node:assert/strict'
import { diaLegible, duracionLegible, enlaceGuion, etiquetaGancho, idDeAncla, momentoLegible, tamanoLegible } from './vista.ts'

test('enlaceGuion e idDeAncla: el ancla de cada guion en el panel', () => {
  const id = '3f1c2a7e-1111-4a1a-9a9a-000000000001'
  assert.equal(enlaceGuion(id), `https://admin.bralto.io/guiones#${id}`)
  assert.equal(idDeAncla(`#${id}`), id)
  assert.equal(idDeAncla(`#${id.toUpperCase()}`), id)
  for (const malo of ['', '#', '#hola', `${id}`, `#${id}x`, '#ideas']) assert.equal(idDeAncla(malo), null, malo)
})

test('diaLegible: hoy, mañana o el día con su nombre', () => {
  assert.equal(diaLegible('2026-11-16', '2026-11-16'), 'Para hoy, lunes 16 de noviembre')
  assert.equal(diaLegible('2026-11-17', '2026-11-16'), 'Para mañana, martes 17 de noviembre')
  assert.equal(diaLegible('2026-11-14', '2026-11-16'), 'Para el sábado 14 de noviembre')
  assert.equal(diaLegible('2026-12-01', '2026-11-30'), 'Para mañana, martes 1 de diciembre')
  assert.equal(diaLegible('2026-12-31', '2027-01-02'), 'Para el jueves 31 de diciembre de 2026')
})

test('duracionLegible: en palabras, sin cuentas raras', () => {
  assert.equal(duracionLegible(null), null)
  assert.equal(duracionLegible(1), '1 segundo')
  assert.equal(duracionLegible(40), '40 segundos')
  assert.equal(duracionLegible(60), '1 minuto')
  assert.equal(duracionLegible(80), '1 minuto y 20 segundos')
  assert.equal(duracionLegible(121), '2 minutos y 1 segundo')
})

test('etiquetaGancho: con mayúscula', () => {
  assert.equal(etiquetaGancho('sorpresa'), 'Sorpresa')
  assert.equal(etiquetaGancho('mito'), 'Mito')
  assert.equal(etiquetaGancho(''), 'Gancho')
})

test('tamanoLegible: KB, MB o GB', () => {
  assert.equal(tamanoLegible(900), '1 KB')
  assert.equal(tamanoLegible(850 * 1024), '850 KB')
  assert.equal(tamanoLegible(12.4 * 1024 * 1024), '12 MB')
  assert.equal(tamanoLegible(1.25 * 1024 ** 3), '1,3 GB')
  assert.equal(tamanoLegible(2 * 1024 ** 3), '2 GB')
})

test('momentoLegible: hora de Costa Rica', () => {
  const ahora = new Date('2026-11-17T02:00:00Z') // 16 nov, 8:00 p. m. en Costa Rica
  assert.equal(momentoLegible('2026-11-17T01:58:30Z', ahora), 'hace un momento')
  assert.equal(momentoLegible('2026-11-17T01:20:00Z', ahora), 'hace 40 min')
  assert.equal(momentoLegible('2026-11-16T19:05:00Z', ahora), 'hoy a la 1:05 p. m.')
  assert.equal(momentoLegible('2026-11-16T03:30:00Z', ahora), 'ayer a las 9:30 p. m.')
  assert.equal(momentoLegible('2026-11-12T15:00:00Z', ahora), 'el 12 de noviembre')
})
