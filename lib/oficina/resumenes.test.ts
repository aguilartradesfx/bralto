import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  plural, resumenAnalisis, resumenArranques, resumenContratos, resumenPagos, resumenPruebas,
  resumenPublicar, resumenSemanal, titulosConError,
} from './resumenes.ts'

test('plural', () => {
  assert.equal(plural(1, 'post', 'posts'), '1 post')
  assert.equal(plural(3, 'post', 'posts'), '3 posts')
})

test('kash: solo «→ keep» y «falló:» no es trabajo', () => {
  const r = resumenPagos({ results: { A: 'pending → keep', B: 'error → keep' } }, { resultados: { c1: 'falló: x' } })
  assert.equal(r.hizo, false)
  assert.equal(r.fallo, undefined)
})
test('kash: un pago cerrado y una cita agendada sí', () => {
  const r = resumenPagos({ results: { A: 'paid → remove', B: 'pending → keep' } }, { resultados: { c1: 'agendada', c2: 'falló: x' } })
  assert.equal(r.hizo, true)
  assert.equal(r.resumen, 'Cerré 1 pago y 1 cita')
})

test('vero: solo estados de espera no es trabajo', () => {
  const r = resumenPruebas({ ok: true, a: 'faltan versiones por salir', b: 'todavía no', c: 'espera métricas', d: 'error: boom', e: 'sin versiones todavía' })
  assert.equal(r.hizo, false)
})
test('vero: «decidida: …» sí', () => {
  const r = resumenPruebas({ ok: true, a: 'decidida: ganó la 2', b: 'todavía no' })
  assert.equal(r.hizo, true)
  assert.equal(r.resumen, 'Ya escogí la ganadora de «a»: la versión 2')
})
test('vero habla en primera persona y dice qué hizo con la prueba', () => {
  const una = (estado: string) => resumenPruebas({ ok: true, 'Reel Gmail': estado }).resumen
  assert.equal(una('decidida: ganó la versión 3'), 'Ya escogí la ganadora de «Reel Gmail»: la versión 3')
  assert.equal(una('decidida: ninguna versión tuvo vistas'), 'Cerré la prueba de «Reel Gmail»: ninguna versión tuvo vistas')
  assert.equal(una('corriendo: decide el 2026-11-20T14:00:00Z'), 'Ya salieron todas las versiones de «Reel Gmail»; en 3 días escojo la ganadora')
  assert.equal(una('cancelada: no salió ninguna versión'), 'Cancelé la prueba de «Reel Gmail»: no salió ninguna versión')
  assert.equal(una('se cortó: vuelve a corriendo'), 'La prueba de «Reel Gmail» se cortó y la vuelvo a poner a correr')
  assert.equal(resumenPruebas({ ok: true, a: 'decidida: ganó la versión 1', b: 'corriendo: decide el x' }).resumen, 'Moví 2 pruebas de reels')
})

test('krono: sin pruebas decididas no cuenta como éxito', () => {
  const r = resumenSemanal({ ok: true, resumen: 'todavía no hay pruebas decididas' })
  assert.equal(r.hizo, false)
  assert.equal(r.resumen, 'No mandé el resumen: todavía no hay pruebas decididas')
  assert.equal(resumenSemanal({ ok: true, resumen: 'enviado' }).hizo, true)
})

test('luma: un error pone fallo', () => {
  const r = resumenArranques({ '2026-11-16': 'error: boom', fijos: 'listos' })
  assert.equal(r.hizo, false)
  assert.ok(r.fallo)
  assert.ok(!r.fallo.includes('boom'))
})
test('luma: nuevos sí, ya estaban no', () => {
  assert.equal(resumenArranques({ d: { fecha: 'd', listos: 3 }, fijos: 'listos' }).hizo, true)
  const r = resumenArranques({ d: 'ya estaban', fijos: 'listos' })
  assert.equal(r.hizo, false)
  assert.equal(r.fallo, undefined)
})

test('publicar: entradas con error se cuentan aparte y «se reintenta» no', () => {
  const x = { ok: true, Uno: 'publicado: https://x', Dos: 'error: sin video', Tres: 'se reintenta: lento', cola: 'nada por publicar' }
  assert.deepEqual(titulosConError(x), ['Dos'])
  assert.deepEqual(resumenPublicar(x, 1), { hizo: true, resumen: 'Publiqué 1 post y agendé 1 en TikTok' })
  assert.equal(resumenPublicar({ ok: true, Dos: 'error: x' }).hizo, false)
})

test('quark e inko', () => {
  assert.ok(resumenAnalisis({ ok: false, actualizados: 0, errores: ['x'] }).fallo)
  assert.equal(resumenAnalisis({ ok: true, actualizados: 2, errores: [] }).hizo, true)
  assert.equal(resumenContratos(0).hizo, false)
  assert.equal(resumenContratos(2).resumen, 'Mandé 2 recordatorios de contrato')
})
