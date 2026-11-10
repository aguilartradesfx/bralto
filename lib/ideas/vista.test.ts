import { test } from 'node:test'
import assert from 'node:assert/strict'
import { haceCuanto, numerosDe, resumenPegado } from './vista.ts'
import type { Metricas } from './metricas.ts'

const base: Metricas = {
  cuenta: 'una.cuenta',
  publicado_en: '2026-11-06T00:21:49.000Z',
  tipo: 'video',
  duracion_s: 43,
  texto: '',
  vistas: 392649,
  me_gusta: 6835,
  comentarios: 8181,
  compartidos: null,
  guardados: null,
  seguidores: 15067,
  normal_me_gusta: 200,
  veces_su_publico: 26.1,
  veces_lo_normal: 34.2,
}

test('los números de Instagram: lo que no muestra lo dice en vez de poner cero', () => {
  const n = numerosDe(base, 'instagram')
  assert.deepEqual(
    n.map((x) => [x.label, x.valor]),
    [
      ['Vistas', '393 mil'],
      ['Veces su público', '26×'],
      ['Veces lo normal', '34×'],
      ['Me gusta', '6,8 mil'],
      ['Comentarios', '8,2 mil'],
      ['Compartidos', null],
      ['Guardados', null],
      ['Seguidores', '15 mil'],
    ],
  )
  assert.equal(n.find((x) => x.label === 'Guardados')?.nota, 'Instagram no los muestra')
  assert.equal(n.find((x) => x.label === 'Veces su público')?.destacado, true)
  assert.equal(n.find((x) => x.label === 'Vistas')?.destacado, false)
})

test('en TikTok sí hay guardados y compartidos; un número que falta dice «sin dato»', () => {
  const n = numerosDe({ ...base, compartidos: 980, guardados: 1002, veces_lo_normal: null, normal_me_gusta: null }, 'tiktok')
  assert.equal(n.find((x) => x.label === 'Guardados')?.valor, '1 mil')
  assert.equal(n.find((x) => x.label === 'Compartidos')?.valor, '980')
  assert.equal(n.find((x) => x.label === 'Veces lo normal')?.nota, 'Sin dato')
})

test('por debajo de 1 vez no se muestra «0×»: se dice con palabras', () => {
  const n = numerosDe({ ...base, veces_su_publico: 0.01, veces_lo_normal: 0.03 }, 'tiktok')
  const publico = n.find((x) => x.label === 'Veces su público')
  const normal = n.find((x) => x.label === 'Veces lo normal')
  assert.deepEqual([publico?.valor, publico?.nota], [null, 'Menos que sus seguidores'])
  assert.deepEqual([normal?.valor, normal?.nota], [null, 'Menos de lo normal'])
})

test('poco más de lo normal no se destaca', () => {
  const n = numerosDe({ ...base, veces_su_publico: 1.4, veces_lo_normal: 2.9 }, 'instagram')
  assert.equal(n.find((x) => x.label === 'Veces su público')?.destacado, false)
  assert.equal(n.find((x) => x.label === 'Veces lo normal')?.destacado, false)
})

test('hace cuánto salió', () => {
  const ahora = new Date('2026-11-10T20:00:00.000Z')
  assert.equal(haceCuanto('2026-11-10T15:00:00.000Z', ahora), 'hoy')
  assert.equal(haceCuanto('2026-11-09T15:00:00.000Z', ahora), 'ayer')
  assert.equal(haceCuanto('2026-11-06T00:21:49.000Z', ahora), 'hace 4 días')
  assert.equal(haceCuanto('2026-10-20T00:00:00.000Z', ahora), 'hace 3 semanas')
  assert.equal(haceCuanto('2026-07-01T00:00:00.000Z', ahora), 'hace 4 meses')
  assert.equal(haceCuanto('2025-01-01T00:00:00.000Z', ahora), 'hace más de un año')
  assert.equal(haceCuanto(null, ahora), null)
})

test('el aviso después de pegar', () => {
  assert.equal(resumenPegado({ nuevas: 3, repetidas: 0, noValidos: [], deMas: 0 }), 'Listo: 3 nuevas. Se analizan solas en 1 o 2 minutos.')
  assert.equal(resumenPegado({ nuevas: 1, repetidas: 2, noValidos: ['https://youtube.com/x'], deMas: 0 }), 'Listo: 1 nueva. 2 ya estaban. 1 enlace no es de Instagram ni de TikTok. Se analiza sola en 1 o 2 minutos.')
  assert.equal(resumenPegado({ nuevas: 0, repetidas: 1, noValidos: [], deMas: 0 }), 'Ese enlace ya estaba.')
  assert.equal(resumenPegado({ nuevas: 0, repetidas: 0, noValidos: ['x', 'y'], deMas: 0 }), 'Ninguno de los 2 enlaces es un video de Instagram o de TikTok.')
  assert.equal(resumenPegado({ nuevas: 50, repetidas: 0, noValidos: [], deMas: 4 }), 'Listo: 50 nuevas. Quedaron 4 por fuera: pega de a 50. Se analizan solas en 1 o 2 minutos.')
})
