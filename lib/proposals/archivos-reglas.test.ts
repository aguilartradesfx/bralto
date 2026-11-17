import { test } from 'node:test'
import assert from 'node:assert/strict'
import { enDias, esEstado, esUuid, etiquetaDe, hoyCR, leerPedidoPdf, MAX_PDF_BYTES, nombreSeguro, peso, ultimoDia, venceAlFinalDe, vigente } from './archivos-reglas.ts'

test('nombre seguro para Storage', () => {
  assert.equal(nombreSeguro('propuesta-cliente-ES.pdf'), 'propuesta-cliente-ES.pdf')
  assert.equal(nombreSeguro('Propuesta Café 2.PDF'), 'Propuesta-Cafe-2.pdf')
  assert.equal(nombreSeguro('../../x.pdf'), 'x.pdf')
  assert.equal(nombreSeguro('***.pdf'), 'propuesta.pdf')
})

test('etiqueta con el idioma cuando el nombre lo trae', () => {
  assert.equal(etiquetaDe('propuesta-cliente-ES.pdf'), 'PDF · ES')
  assert.equal(etiquetaDe('proposal-portal-EN 2.pdf'), 'PDF · EN')
  assert.equal(etiquetaDe('proposal_app_en.pdf'), 'PDF · EN')
  assert.equal(etiquetaDe('propuesta-portal 2.pdf'), 'PDF')
  assert.equal(etiquetaDe('presentes.pdf'), 'PDF')
})

test('pedido de subida: solo PDF, no vacío y hasta 50 MB', () => {
  assert.deepEqual(leerPedidoPdf({ nombre: 'a.pdf', bytes: 10 }), { ok: true, pedido: { nombre: 'a.pdf', bytes: 10 } })
  assert.equal(leerPedidoPdf({ nombre: 'a.png', bytes: 10 }).ok, false)
  assert.equal(leerPedidoPdf({ nombre: 'a.pdf', bytes: 0 }).ok, false)
  assert.equal(leerPedidoPdf({ nombre: 'a.pdf', bytes: MAX_PDF_BYTES + 1 }).ok, false)
  assert.equal(leerPedidoPdf(null).ok, false)
})

test('vence al final del día en Costa Rica', () => {
  assert.equal(venceAlFinalDe('2026-12-15'), '2026-12-16T06:00:00.000Z')
  assert.equal(venceAlFinalDe('2026-12-31'), '2027-01-01T06:00:00.000Z')
  assert.equal(venceAlFinalDe('2026-02-30'), null)
  assert.equal(venceAlFinalDe('15/12/2026'), null)
})

test('último día en que sirve el link', () => {
  assert.equal(ultimoDia('2026-12-16T06:00:00.000Z'), '2026-12-15')
  assert.equal(ultimoDia('2026-11-18T06:00:00.000Z'), '2026-11-17')
  // Las viejas vencían a la hora en que se crearon
  assert.equal(ultimoDia('2026-10-30T20:59:00.000Z'), '2026-10-30')
  assert.equal(ultimoDia(venceAlFinalDe('2026-03-01')!), '2026-03-01')
})

test('vigente, hoy y en n días (Costa Rica)', () => {
  const ahora = new Date('2026-11-17T05:00:00.000Z') // 16 de noviembre, 11 p. m. en Costa Rica
  assert.equal(hoyCR(ahora), '2026-11-16')
  assert.equal(enDias(ahora, 14), '2026-11-30')
  assert.equal(vigente('2026-11-17T06:00:00.000Z', ahora), true)
  assert.equal(vigente('2026-11-17T05:00:00.000Z', ahora), false)
})

test('estados, ids y pesos', () => {
  assert.equal(esEstado('enviada'), true)
  assert.equal(esEstado('propuesta_enviada'), false)
  assert.equal(esUuid('0b6f3c2e-4a1d-4c9b-9e8f-1a2b3c4d5e6f'), true)
  assert.equal(esUuid('Ab3dE5gH9jK1'), false)
  assert.equal(peso(2_332_706), '2.2 MB')
  assert.equal(peso(846_794), '827 KB')
  assert.equal(peso(null), '')
})
