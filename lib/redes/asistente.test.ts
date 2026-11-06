import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  aItem,
  armarAprobar,
  armarFrenar,
  armarGrupo,
  armarHora,
  armarSacarYa,
  elegirPendiente,
  esDeNoche,
  hora12,
  leerPedido,
  mensajeGrupo,
  mensajeListo,
  secretoValido,
} from './asistente.ts'
import { NO_SE_PUEDE } from '../calendario/editar.ts'
import type { Publicacion } from './publicacion/tipos.ts'

const ID = '9d52fd9e-7d9c-4e8b-a9d2-56a7b473e7e2'
const AHORA = new Date('2026-10-31T20:00:00Z') // sábado 31, 14:00 en Costa Rica

function fila(extra: Partial<Publicacion> = {}): Publicacion {
  return {
    id: ID,
    titulo: 'Espía a tu competencia',
    tipo: 'carrusel',
    estado: 'borrador',
    publicar_en: '2026-11-01T00:00:00+00:00', // sábado 31, 18:00 en Costa Rica
    texto: 'Un texto\n\n#uno #dos',
    laminas: ['l1', 'l2'],
    video_url: null,
    portada_url: null,
    historias: [],
    colaborador: 'bralto.io',
    hecho_con_ia: false,
    facebook: true,
    comenta: null,
    resultado: {},
    intentos: 0,
    prueba: false,
    grupo: null,
    version: null,
    gancho: null,
    ...extra,
  }
}

test('el secreto se compara completo: sin secreto configurado no entra nadie', () => {
  assert.equal(secretoValido('Bearer abc123', 'abc123'), true)
  assert.equal(secretoValido('Bearer abc124', 'abc123'), false)
  assert.equal(secretoValido('abc123', 'abc123'), false)
  assert.equal(secretoValido(null, 'abc123'), false)
  assert.equal(secretoValido('Bearer ', ''), false)
  assert.equal(secretoValido('Bearer undefined', undefined), false)
})

test('listar sin fechas es de hoy a 6 días; con una sola fecha, ese día', () => {
  assert.deepEqual(leerPedido({ accion: 'listar' }, AHORA), { ok: true, pedido: { accion: 'listar', desde: '2026-10-31', hasta: '2026-11-06' } })
  assert.deepEqual(leerPedido({ accion: 'listar', desde: '2026-11-01' }, AHORA), {
    ok: true,
    pedido: { accion: 'listar', desde: '2026-11-01', hasta: '2026-11-01' },
  })
})

test('listar rechaza fechas raras, al revés o de más de un mes', () => {
  assert.equal(leerPedido({ accion: 'listar', desde: '31/10/2026' }, AHORA).ok, false)
  assert.equal(leerPedido({ accion: 'listar', desde: '2026-02-30' }, AHORA).ok, false)
  assert.equal(leerPedido({ accion: 'listar', desde: '2026-11-05', hasta: '2026-11-01' }, AHORA).ok, false)
  assert.equal(leerPedido({ accion: 'listar', desde: '2026-11-01', hasta: '2026-12-15' }, AHORA).ok, false)
})

test('aprobar y sacar_ya pueden venir sin id; frenar y cambiar_hora no', () => {
  assert.deepEqual(leerPedido({ accion: 'aprobar' }, AHORA), { ok: true, pedido: { accion: 'aprobar', id: null } })
  assert.deepEqual(leerPedido({ accion: 'sacar_ya', id: ID, confirmar: true }, AHORA), {
    ok: true,
    pedido: { accion: 'sacar_ya', id: ID, confirmar: true },
  })
  assert.equal(leerPedido({ accion: 'frenar' }, AHORA).ok, false)
  assert.equal(leerPedido({ accion: 'cambiar_hora', id: ID }, AHORA).ok, false)
  assert.deepEqual(leerPedido({ accion: 'cambiar_hora', id: ID, cuando: '2026-10-31T17:30' }, AHORA), {
    ok: true,
    pedido: { accion: 'cambiar_hora', id: ID, cuando: '2026-10-31T17:30', confirmar: false },
  })
})

test('rechaza acciones desconocidas e ids que no son de una publicación', () => {
  assert.equal(leerPedido({ accion: 'borrar', id: ID }, AHORA).ok, false)
  assert.equal(leerPedido({ accion: 'aprobar', id: '1; drop table' }, AHORA).ok, false)
  assert.equal(leerPedido(null, AHORA).ok, false)
})

test('la hora en 12 horas, como la dice la gente', () => {
  assert.equal(hora12('18:00'), '6:00 p. m.')
  assert.equal(hora12('09:05'), '9:05 a. m.')
  assert.equal(hora12('12:30'), '12:30 p. m.')
  assert.equal(hora12('00:15'), '12:15 a. m.')
})

test('cada publicación con su día y hora de Costa Rica', () => {
  assert.deepEqual(aItem(fila()), {
    id: ID,
    titulo: 'Espía a tu competencia',
    tipo: 'carrusel',
    estado: 'borrador',
    publicar_en: '2026-11-01T00:00:00+00:00',
    dia: 'sábado 31 de octubre',
    hora: '6:00 p. m.',
  })
})

test('de noche es antes de las 7:00 y después de las 21:00 de Costa Rica', () => {
  assert.equal(esDeNoche('2026-10-31T12:59:00Z'), true) // 6:59
  assert.equal(esDeNoche('2026-10-31T13:00:00Z'), false) // 7:00
  assert.equal(esDeNoche('2026-11-01T03:00:00Z'), false) // 21:00
  assert.equal(esDeNoche('2026-11-01T03:01:00Z'), true) // 21:01
})

test('«dale» sin decir cuál: el único borrador entre 3 horas atrás y 24 adelante', () => {
  const otra = { ...fila(), id: 'b', estado: 'programado' as const }
  const vieja = { ...fila(), id: 'c', publicar_en: '2026-10-31T15:00:00Z' } // 9:00, hace 5 horas
  const lejana = { ...fila(), id: 'd', publicar_en: '2026-11-02T16:00:00Z' } // pasado mañana
  assert.deepEqual(elegirPendiente([fila(), otra, vieja, lejana], AHORA, ['borrador']), { ok: true, id: ID })
})

test('si no hay ninguno o hay varios, no elige: devuelve las opciones', () => {
  const ninguno = elegirPendiente([], AHORA, ['borrador'])
  assert.equal(ninguno.ok, false)
  if (!ninguno.ok) assert.equal(ninguno.status, 404)

  const dos = elegirPendiente([fila(), { ...fila(), id: 'b', titulo: 'El reel' }], AHORA, ['borrador'])
  assert.equal(dos.ok, false)
  if (!dos.ok) {
    assert.equal(dos.status, 409)
    assert.deepEqual(
      dos.opciones.map((o) => o.titulo),
      ['Espía a tu competencia', 'El reel'],
    )
  }
})

test('sacar ya también toma una programada', () => {
  const programada = { ...fila(), estado: 'programado' as const }
  assert.deepEqual(elegirPendiente([programada], AHORA, ['borrador', 'programado']), { ok: true, id: ID })
})

test('aprobar deja la publicación programada a su hora', () => {
  assert.deepEqual(armarAprobar(fila(), AHORA), { ok: true, cambio: { texto: fila().texto, estado: 'programado' } })
})

test('aprobar una cuya hora ya pasó pide decidir: sacarla ya o cambiarle la hora', () => {
  const r = armarAprobar(fila({ publicar_en: '2026-10-31T19:00:00Z' }), AHORA) // 13:00, hace una hora
  assert.equal(r.ok, false)
  if (!r.ok) {
    assert.equal(r.status, 409)
    assert.equal(r.motivo, 'hora_pasada')
  }
})

test('nada se cambia si ya salió o se está publicando', () => {
  for (const estado of ['publicando', 'publicado'] as const) {
    assert.deepEqual(armarAprobar(fila({ estado }), AHORA), { ok: false, status: 409, error: NO_SE_PUEDE })
    assert.deepEqual(armarFrenar(fila({ estado }), AHORA), { ok: false, status: 409, error: NO_SE_PUEDE })
    assert.deepEqual(armarSacarYa(fila({ estado }), AHORA, false), { ok: false, status: 409, error: NO_SE_PUEDE })
  }
})

test('frenar la deja en borrador, aunque su hora ya haya pasado', () => {
  const pasada = fila({ estado: 'programado', publicar_en: '2026-10-31T19:00:00Z' })
  assert.deepEqual(armarFrenar(pasada, AHORA), { ok: true, cambio: { texto: pasada.texto, estado: 'borrador' } })
})

test('cambiar la hora: la de Costa Rica pasa a UTC y el estado no cambia', () => {
  assert.deepEqual(armarHora(fila(), '2026-10-31T17:30', AHORA, false), {
    ok: true,
    cambio: { texto: fila().texto, publicar_en: '2026-10-31T23:30:00.000Z' },
  })
})

test('cambiar la hora rechaza el pasado y pide confirmar la noche', () => {
  assert.equal(armarHora(fila(), '2026-10-31T13:00', AHORA, false).ok, false)
  const noche = armarHora(fila(), '2026-10-31T22:00', AHORA, false)
  assert.equal(noche.ok, false)
  if (!noche.ok) {
    assert.equal(noche.status, 409)
    assert.equal(noche.motivo, 'noche')
  }
  assert.equal(armarHora(fila(), '2026-10-31T22:00', AHORA, true).ok, true)
  assert.equal(armarHora(fila(), '2026-10-31T25:00', AHORA, false).ok, false)
})

test('sacar ya: la aprueba con la hora de ahora', () => {
  assert.deepEqual(armarSacarYa(fila(), AHORA, false), {
    ok: true,
    cambio: { texto: fila().texto, publicar_en: '2026-10-31T20:00:00.000Z', estado: 'programado' },
  })
})

test('sacar ya revisa lo mismo que el publicador y pide confirmar de noche', () => {
  const r = armarSacarYa(fila({ laminas: ['solo-una'] }), AHORA, false)
  assert.equal(r.ok, false)
  if (!r.ok) assert.equal(r.status, 400)
  const noche = new Date('2026-11-01T04:00:00Z') // 22:00
  const n = armarSacarYa(fila(), noche, false)
  assert.equal(n.ok, false)
  if (!n.ok) assert.equal(n.motivo, 'noche')
  assert.equal(armarSacarYa(fila(), noche, true).ok, true)
})

test('lo que el asistente le contesta, con día y hora de Costa Rica', () => {
  const p = fila({ estado: 'programado' })
  assert.equal(mensajeListo('aprobar', p), 'Listo: «Espía a tu competencia» quedó aprobado y sale el sábado 31 de octubre a las 6:00 p. m.')
  assert.equal(mensajeListo('frenar', fila()), 'Listo: «Espía a tu competencia» quedó en borrador y no sale hasta que lo apruebes.')
  assert.equal(
    mensajeListo('cambiar_hora', fila({ publicar_en: '2026-10-31T23:30:00.000Z' })),
    'Listo: «Espía a tu competencia» ahora sale el sábado 31 de octubre a las 5:30 p. m. Sigue en borrador: falta aprobarlo.',
  )
  assert.equal(mensajeListo('sacar_ya', p), '«Espía a tu competencia» se está publicando ya. Te aviso por aquí cuando salga.')
})

// Las 5 versiones de un reel de prueba, mañana (domingo 1) de 8:00 a 16:00 en Costa Rica
const versionPrueba = (n: number, extra: Partial<Publicacion> = {}) =>
  fila({
    id: `00000000-0000-4000-8000-00000000000${n}`,
    titulo: `Prueba ${n}/5 · Radar`,
    tipo: 'reel',
    estado: 'programado',
    publicar_en: new Date(Date.UTC(2026, 10, 1, 14 + 2 * (n - 1))).toISOString(),
    laminas: [],
    video_url: `v${n}.mp4`,
    colaborador: null,
    facebook: false,
    historias: [],
    prueba: true,
    grupo: 'g-1',
    version: n,
    ...extra,
  })
const grupoDe5 = () => [1, 2, 3, 4, 5].map((n) => versionPrueba(n))

test('frenar grupo: las 5 versiones quedan en borrador', () => {
  const r = armarGrupo('frenar', grupoDe5(), AHORA)
  assert.ok(r.ok)
  assert.equal(r.cambios.length, 5)
  for (const c of r.cambios) assert.equal(c.cambio.estado, 'borrador')
})

test('frenar grupo a medias: las que ya salieron no se tocan', () => {
  const filas = grupoDe5().map((v, i) => (i < 2 ? { ...v, estado: 'publicado' as const } : v))
  const r = armarGrupo('frenar', filas, AHORA)
  assert.ok(r.ok)
  assert.deepEqual(
    r.cambios.map((c) => c.id),
    filas.slice(2).map((f) => f.id),
  )
})

test('aprobar grupo: la que ya pasó su hora queda fuera; si pasaron todas, no se puede', () => {
  const filas = grupoDe5().map((v, i) => ({ ...v, estado: 'borrador' as const, ...(i === 0 ? { publicar_en: '2026-10-31T19:00:00.000Z' } : {}) }))
  const r = armarGrupo('aprobar', filas, AHORA)
  assert.ok(r.ok)
  assert.equal(r.cambios.length, 4)
  for (const c of r.cambios) assert.equal(c.cambio.estado, 'programado')

  const pasadas = filas.map((f) => ({ ...f, publicar_en: '2026-10-31T19:00:00.000Z' }))
  const no = armarGrupo('aprobar', pasadas, AHORA)
  assert.equal(no.ok, false)
  if (!no.ok) {
    assert.equal(no.status, 409)
    assert.equal(no.motivo, 'hora_pasada')
  }
})

test('dale sin id: las 5 versiones de una prueba cuentan como una sola opción', () => {
  const carrusel = fila({ id: '00000000-0000-4000-8000-000000000009', publicar_en: '2026-11-01T16:00:00.000Z' })
  const conCarrusel = elegirPendiente([...grupoDe5(), carrusel], AHORA, ['programado', 'borrador'])
  assert.equal(conCarrusel.ok, false)
  if (!conCarrusel.ok) assert.equal(conCarrusel.opciones.length, 2)

  const soloPrueba = elegirPendiente([...grupoDe5()].reverse(), AHORA, ['programado'])
  assert.deepEqual(soloPrueba, { ok: true, id: versionPrueba(1).id })
})

test('mensajeGrupo: dice cuántas versiones cambiaron', () => {
  assert.equal(
    mensajeGrupo('frenar', 'Radar', 3),
    'Listo: las 3 versiones de prueba de «Radar» quedaron en borrador y no salen hasta que las apruebes.',
  )
  assert.equal(mensajeGrupo('aprobar', 'Radar', 5), 'Listo: las 5 versiones de prueba de «Radar» quedaron aprobadas y salen cada una a su hora.')
})
