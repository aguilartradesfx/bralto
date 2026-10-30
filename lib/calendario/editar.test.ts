import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarCambio, guardarCambio, NO_SE_PUEDE, type Actualizar } from './editar.ts'
import type { Publicacion } from '../redes/publicacion/tipos.ts'

function fila(extra: Partial<Publicacion> = {}): Publicacion {
  return {
    id: 'pub-1',
    titulo: 'Prueba',
    tipo: 'carrusel',
    estado: 'programado',
    publicar_en: '2026-10-31T00:00:00+00:00', // viernes 30, 18:00 en Costa Rica
    texto: 'Un texto\n\n#uno #dos',
    laminas: ['l1', 'l2'],
    video_url: null,
    portada_url: null,
    historias: [],
    colaborador: null,
    hecho_con_ia: true,
    facebook: true,
    comenta: null,
    resultado: {},
    intentos: 0,
    ...extra,
  }
}

const AHORA = new Date('2026-10-30T20:00:00Z') // viernes 30, 14:00 en Costa Rica

test('guarda el texto y la nueva hora de Costa Rica, pasada a UTC', () => {
  assert.deepEqual(armarCambio({ texto: 'Otro texto', cuando: '2026-11-02T10:00' }, fila(), AHORA), {
    ok: true,
    cambio: { texto: 'Otro texto', publicar_en: '2026-11-02T16:00:00.000Z' },
  })
})

test('si la hora no cambió, no la toca, aunque ya haya pasado', () => {
  // Un borrador viejo: se le corrige el texto sin moverle la hora
  const viejo = fila({ estado: 'borrador', publicar_en: '2026-10-29T16:00:00+00:00' })
  assert.deepEqual(armarCambio({ texto: 'Otro', cuando: '2026-10-29T10:00' }, viejo, AHORA), { ok: true, cambio: { texto: 'Otro' } })
  // Los segundos que traiga la fila no cuentan como cambio: el campo solo tiene minutos
  const conSegundos = fila({ publicar_en: '2026-10-31T00:00:30+00:00' })
  assert.deepEqual(armarCambio({ texto: 'Otro', cuando: '2026-10-30T18:00' }, conSegundos, AHORA), { ok: true, cambio: { texto: 'Otro' } })
})

test('rechaza una hora que ya pasó, también la de este mismo minuto', () => {
  const pasada = { ok: false, status: 400, error: 'Esa hora ya pasó. Elegí una más adelante.' }
  assert.deepEqual(armarCambio({ texto: 'x', cuando: '2026-10-30T13:59' }, fila(), AHORA), pasada)
  assert.deepEqual(armarCambio({ texto: 'x', cuando: '2026-10-30T14:00' }, fila(), AHORA), pasada)
  assert.equal(armarCambio({ texto: 'x', cuando: '2026-10-30T14:01' }, fila(), AHORA).ok, true)
})

test('aprobar lo deja programado; frenar, en borrador', () => {
  assert.deepEqual(armarCambio({ texto: 't', cuando: '2026-10-30T18:00', estado: 'programado' }, fila({ estado: 'borrador' }), AHORA), {
    ok: true,
    cambio: { texto: 't', estado: 'programado' },
  })
  assert.deepEqual(armarCambio({ texto: 't', cuando: '2026-10-30T18:00', estado: 'borrador' }, fila(), AHORA), {
    ok: true,
    cambio: { texto: 't', estado: 'borrador' },
  })
})

test('no se aprueba con la hora ya pasada; frenarlo sí se puede', () => {
  const viejo = fila({ estado: 'borrador', publicar_en: '2026-10-29T16:00:00+00:00' })
  assert.deepEqual(armarCambio({ texto: 't', cuando: '2026-10-29T10:00', estado: 'programado' }, viejo, AHORA), {
    ok: false,
    status: 400,
    error: 'Esa hora ya pasó. Cambiala antes de aprobar.',
  })
  assert.equal(armarCambio({ texto: 't', cuando: '2026-10-29T10:00', estado: 'borrador' }, fila({ publicar_en: viejo.publicar_en }), AHORA).ok, true)
})

test('lo que ya salió, se está publicando o quedó cerrado no se cambia', () => {
  for (const estado of ['publicando', 'publicado', 'error', 'cancelado'] as const) {
    assert.deepEqual(armarCambio({ texto: 't', cuando: '2026-10-30T18:00' }, fila({ estado }), AHORA), { ok: false, status: 409, error: NO_SE_PUEDE }, estado)
  }
})

test('revisa el texto como lo revisa la publicación, antes de guardarlo', () => {
  const error = (texto: string) => {
    const r = armarCambio({ texto, cuando: '2026-10-30T18:00' }, fila(), AHORA)
    return r.ok ? null : r.error
  }
  assert.equal(error('   '), 'No tiene texto')
  assert.match(error('a'.repeat(2201)) ?? '', /^El texto tiene 2201 caracteres/)
  assert.match(error('#a #b #c #d #e #f') ?? '', /6 hashtags/)
})

test('pide el texto y la fecha, y solo deja aprobar o frenar', () => {
  for (const malo of [null, 'x', {}, { texto: 't' }, { cuando: '2026-10-30T18:00' }, { texto: 1, cuando: '2026-10-30T18:00' }]) {
    assert.deepEqual(armarCambio(malo, fila(), AHORA), { ok: false, status: 400, error: 'Faltan el texto o la fecha' }, JSON.stringify(malo))
  }
  assert.deepEqual(armarCambio({ texto: 't', cuando: 'mañana' }, fila(), AHORA), { ok: false, status: 400, error: 'La fecha no es válida' })
  assert.deepEqual(armarCambio({ texto: 't', cuando: '2026-10-30T18:00', estado: 'publicado' }, fila(), AHORA), {
    ok: false,
    status: 400,
    error: 'Solo se puede aprobar o frenar',
  })
})

test('los saltos de línea de Windows quedan como saltos normales', () => {
  assert.deepEqual(armarCambio({ texto: 'uno\r\ndos', cuando: '2026-10-30T18:00' }, fila(), AHORA), { ok: true, cambio: { texto: 'uno\ndos' } })
})

test('guardarCambio: la actualización exige que la fila siga en borrador o programado', async () => {
  const llamadas: unknown[] = []
  const actualizar: Actualizar = async (id, cambio, estados) => {
    llamadas.push({ id, cambio, estados: [...estados] })
    return { filas: 1 }
  }
  assert.deepEqual(await guardarCambio('pub-1', { texto: 't', estado: 'programado' }, actualizar), { ok: true })
  assert.deepEqual(llamadas, [{ id: 'pub-1', cambio: { texto: 't', estado: 'programado' }, estados: ['borrador', 'programado'] }])
})

test('guardarCambio: si no cambió ninguna fila, ya salió o se está publicando', async () => {
  assert.deepEqual(await guardarCambio('pub-1', { texto: 't' }, async () => ({ filas: 0 })), { ok: false, status: 409, error: NO_SE_PUEDE })
  assert.deepEqual(await guardarCambio('pub-1', { texto: 't' }, async () => ({ error: 'se cayó la base' })), {
    ok: false,
    status: 500,
    error: 'se cayó la base',
  })
})
