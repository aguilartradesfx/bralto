import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { AgenteSnap, LineaTertulia, Rincon } from './tipos.ts'
import { deNoche, libreParaSala, repartirSala, textoSala, type LugarSala } from './sala.ts'
import { fnv1a } from './social.ts'

const MIN = 60_000
// Lunes 16/11/2026, 10:42 a. m. en Costa Rica: la media hora 21 (impar), la de turno va al café
const MANANA = new Date('2026-11-16T16:42:00Z')
// 2:00 p. m. en Costa Rica: hora de siesta
const SIESTA = new Date('2026-11-16T20:00:00Z')
const CUATRO = '2026-11-16T22:00:00.000Z' // 4:00 p. m. en Costa Rica

function ag(id: string, extra: Partial<AgenteSnap> = {}): AgenteSnap {
  return {
    id, nombre: id.charAt(0).toUpperCase() + id.slice(1), oficio: 'Oficio', area: 'Contenido', puesto: 0,
    aspecto: { tela: '#cccccc', ropa: '#333333', glifo: 'lineas' }, personalidad: '', frase: '', horario: null, cada_minutos: null,
    ruta: null, donde: 'sitio', estado_fijo: null, despierto_siempre: false, dura_min: 10, ultima_revision: null, lugar: null,
    estado: 'descansando', numeros: { tareas: 0, horas: 0, diasSinFallar: 0 }, semana: [], ...extra,
  }
}

// Una línea de la tertulia que salió hace `hace` minutos (negativo: todavía no sale)
function linea(id: string, de: string, para: string | null, rincon: 'cafe' | 'platica' | null, hace: number, ahora = MANANA): LineaTertulia {
  return { id, de, para, texto: '¿Un cafecito?', rincon, idea_id: null, mostrar_desde: new Date(ahora.getTime() - hace * MIN).toISOString() }
}

const repartir = (agentes: AgenteSnap[], lineas: LineaTertulia[], ahora = MANANA) => repartirSala({ agentes, lineas, ahora, dormida: false })
const por = (r: Record<string, LugarSala>, p: LugarSala['por']) => Object.keys(r).filter((id) => r[id].por === p).sort()
const en = (r: Record<string, LugarSala>, rincon: Rincon) =>
  Object.fromEntries(Object.entries(r).filter(([, l]) => l.rincon === rincon).map(([id, l]) => [id, l.sitio]))
// el orden fijo de cada día: los ids ordenados por su fnv1a
const ordenFijo = (ids: string[], clave: (id: string) => string) => [...ids].sort((x, y) => (fnv1a(clave(x)) < fnv1a(clave(y)) ? -1 : 1))

test('con la oficina dormida, nadie va a la sala', () => {
  const agentes = [ag('krono'), ag('quark'), ag('noche', { horario: '0 1 * * *' })]
  const lineas = [linea('l1', 'krono', 'quark', 'cafe', 5, SIESTA)]
  assert.deepEqual(repartirSala({ agentes, lineas, ahora: SIESTA, dormida: true }), {})
})

test('libre para la sala: descansando, con algo para ti o cuando lo pidas, y sin trabajo en 10 min o menos', () => {
  for (const estado of ['descansando', 'listo', 'pedido'] as const) assert.equal(libreParaSala(ag('a', { estado }), MANANA), true, estado)
  for (const estado of ['trabajando', 'publicando', 'a-medias', 'fallo', 'pendiente', 'durmiendo'] as const) {
    assert.equal(libreParaSala(ag('a', { estado }), MANANA), false, estado)
  }
  // corre a las 10:50, 10:52 y 10:53 a. m.: en 8, 10 y 11 min
  assert.equal(libreParaSala(ag('a', { horario: '50 16 * * *' }), MANANA), false)
  assert.equal(libreParaSala(ag('a', { horario: '52 16 * * *' }), MANANA), false)
  assert.equal(libreParaSala(ag('a', { horario: '53 16 * * *' }), MANANA), true)
  // a quien revisa cada 5 min no se le mira la próxima revisión: una revisión vacía no es trabajo
  assert.equal(libreParaSala(ag('a', { horario: '*/5 * * * *', cada_minutos: 5 }), MANANA), true)
})

test('el ocupado nunca va: ni trabajando, publicando, a medias, con una falla, sin empezar o con trabajo en 8 min', () => {
  const ocupados = [
    ag('t', { estado: 'trabajando' }), ag('p', { estado: 'publicando' }), ag('m', { estado: 'a-medias' }), ag('f', { estado: 'fallo' }),
    ag('pe', { estado: 'pendiente', estado_fijo: 'pendiente' }), ag('c8', { horario: '50 16 * * *' }),
  ]
  const cada5 = ag('r5', { horario: '*/5 * * * *', cada_minutos: 5 })
  // aunque una línea de la tertulia los invite al café o a la plática
  const lineas = ocupados.map((a, i) => linea(`l${i}`, a.id, i % 2 ? 'krono' : null, i % 2 ? 'cafe' : 'platica', 2 + i))
  const r = repartir([...ocupados, ag('krono'), cada5], lineas)
  for (const a of ocupados) assert.equal(r[a.id], undefined, a.id)
  // el que revisa cada 5 min y está descansando sí va (de turno, que no hay nada más)
  assert.equal(r.r5?.por, 'turno')
})

test('una línea al café de hace 5 min junta a los dos, cada uno con el otro, hasta 20 min después de la línea', () => {
  const l = linea('l1', 'krono', 'quark', 'cafe', 5)
  const hasta = new Date(Date.parse(l.mostrar_desde) + 20 * MIN).toISOString()
  assert.deepEqual(repartir([ag('krono'), ag('quark')], [l]), {
    krono: { rincon: 'cafe', sitio: 0, con: 'quark', hasta, por: 'tertulia' },
    quark: { rincon: 'cafe', sitio: 1, con: 'krono', hasta, por: 'tertulia' },
  })
})

test('una línea de hace 20 min o más, del futuro o sin rincón no junta a nadie', () => {
  const agentes = [ag('krono'), ag('quark')]
  for (const l of [linea('l1', 'krono', 'quark', 'cafe', 21), linea('l2', 'krono', 'quark', 'cafe', 20), linea('l3', 'krono', 'quark', 'cafe', -3),
    linea('l4', 'krono', 'quark', null, 5)]) {
    assert.deepEqual(por(repartir(agentes, [l]), 'tertulia'), [], l.id)
  }
})

test('si le habla a Ale, solo va quien habla', () => {
  const l = linea('l1', 'krono', 'ale', 'platica', 5)
  const r = repartir([ag('krono'), ag('quark')], [l])
  assert.deepEqual(r.krono, { rincon: 'platica', sitio: 0, con: null, hasta: new Date(Date.parse(l.mostrar_desde) + 20 * MIN).toISOString(), por: 'tertulia' })
  assert.deepEqual(por(r, 'tertulia'), ['krono'])
})

test('con 3 parejas al café van las 2 más nuevas y la más vieja se queda entera en sus escritorios', () => {
  const agentes = ['a1', 'a2', 'b1', 'b2', 'c1', 'c2'].map((id) => ag(id))
  const lineas = [linea('vieja', 'a1', 'a2', 'cafe', 9), linea('media', 'b1', 'b2', 'cafe', 6), linea('nueva', 'c1', 'c2', 'cafe', 3)]
  const r = repartir(agentes, lineas)
  assert.deepEqual(en(r, 'cafe'), { c1: 0, c2: 1, b1: 2, b2: 3 })
  // ni de turno ni a otro rincón: se quedan platicando desde su escritorio
  assert.equal(r.a1, undefined)
  assert.equal(r.a2, undefined)
})

test('si uno de la pareja está ocupado o ya tiene lugar, no va ninguno de los dos', () => {
  const agentes = [ag('libre'), ag('ocupado', { estado: 'trabajando' }), ag('krono'), ag('quark'), ag('otro')]
  const lineas = [
    linea('l1', 'libre', 'ocupado', 'cafe', 2),
    linea('l2', 'krono', 'quark', 'platica', 4), // la más nueva de las dos de Krono: esta va
    linea('l3', 'krono', 'otro', 'cafe', 6), // Krono ya tiene lugar: Otro no va solo
  ]
  const r = repartir(agentes, lineas)
  assert.deepEqual(Object.keys(r).sort(), ['krono', 'quark'])
  assert.equal(r.krono.con, 'quark')
})

test('una pareja que no cabe en un rincón con un solo campo no va: nunca se parte', () => {
  const agentes = ['a', 'b', 'c', 'd', 'e'].map((id) => ag(id))
  const lineas = [linea('l1', 'a', 'b', 'cafe', 2), linea('l2', 'c', 'ale', 'cafe', 3), linea('l3', 'd', 'e', 'cafe', 4)]
  const r = repartir(agentes, lineas)
  assert.deepEqual(en(r, 'cafe'), { a: 0, b: 1, c: 2 })
  assert.equal(r.d, undefined)
  assert.equal(r.e, undefined)
})

test('a las 2:00 p. m. van a siesta hasta 3 de los de noche, en su orden del día, hasta las 4:00 p. m.', () => {
  const noche = ['n1', 'n2', 'n3', 'n4', 'n5'].map((id) => ag(id, { horario: '0 1 * * *' }))
  const r = repartir([...noche, ag('dia', { horario: '0 18 * * *' })], [], SIESTA)
  const esperados = ordenFijo(noche.map((a) => a.id), (id) => `2026-11-16:siesta:${id}`).slice(0, 3)
  assert.deepEqual(en(r, 'siesta'), Object.fromEntries(esperados.map((id, i) => [id, i])))
  for (const id of esperados) assert.deepEqual(r[id], { rincon: 'siesta', sitio: esperados.indexOf(id), con: null, hasta: CUATRO, por: 'siesta' })
  // a las 4:05 p. m. ya no hay siesta
  assert.deepEqual(en(repartir(noche, [], new Date('2026-11-16T22:05:00Z')), 'siesta'), {})
  // a la 1:00 p. m. ya empieza
  assert.equal(Object.keys(en(repartir(noche, [], new Date('2026-11-16T19:00:00Z')), 'siesta')).length, 3)
})

test('un de noche que está en una pareja no duerme siesta', () => {
  const r = repartir([ag('n1', { horario: '0 1 * * *' }), ag('x')], [linea('l1', 'n1', 'x', 'cafe', 5, SIESTA)], SIESTA)
  assert.equal(r.n1.rincon, 'cafe')
  assert.equal(r.n1.por, 'tertulia')
})

test('de turno van 2 como mucho, y los mismos con los mismos datos en la misma media hora', () => {
  const agentes = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'].map((id) => ag(id, { estado: 'pedido', estado_fijo: 'pedido' }))
  const r = repartir(agentes, [])
  // 10:42 a. m.: la media hora 21 (impar) va al café, hasta las 11:00 a. m.
  const [uno, dos] = ordenFijo(agentes.map((a) => a.id), (id) => `2026-11-16:21:${id}`)
  assert.deepEqual(r, {
    [uno]: { rincon: 'cafe', sitio: 0, con: null, hasta: '2026-11-16T17:00:00.000Z', por: 'turno' },
    [dos]: { rincon: 'cafe', sitio: 1, con: null, hasta: '2026-11-16T17:00:00.000Z', por: 'turno' },
  })
  for (const t of ['2026-11-16T16:30:00Z', '2026-11-16T16:59:59Z']) assert.deepEqual(repartir(agentes, [], new Date(t)), r, t)
  // 11:05 a. m.: la media hora 22 (par) va a la plática, hasta las 11:30 a. m.
  const luego = repartir(agentes, [], new Date('2026-11-16T17:05:00Z'))
  assert.equal(Object.keys(luego).length, 2)
  for (const l of Object.values(luego)) assert.deepEqual([l.rincon, l.hasta, l.por], ['platica', '2026-11-16T17:30:00.000Z', 'turno'])
})

test('de turno: si su rincón está lleno, al otro', () => {
  const agentes = ['a1', 'a2', 'b1', 'b2', 'x', 'y'].map((id) => ag(id))
  const r = repartir(agentes, [linea('l1', 'a1', 'a2', 'cafe', 2), linea('l2', 'b1', 'b2', 'cafe', 4)])
  assert.deepEqual(Object.keys(en(r, 'cafe')).sort(), ['a1', 'a2', 'b1', 'b2'])
  assert.deepEqual(en(r, 'platica'), { [ordenFijo(['x', 'y'], (id) => `2026-11-16:21:${id}`)[0]]: 0, [ordenFijo(['x', 'y'], (id) => `2026-11-16:21:${id}`)[1]]: 1 })
  assert.deepEqual(por(r, 'turno'), ['x', 'y'])
})

test('de noche: su próxima corrida es entre las 7:00 p. m. y las 6:59 a. m., o es del servidor sin horario', () => {
  assert.equal(deNoche(ag('a', { horario: '0 1 * * *' }), MANANA), true) // 7:00 p. m.
  assert.equal(deNoche(ag('b', { donde: 'servidor', horario: null }), MANANA), true)
  assert.equal(deNoche(ag('c', { horario: '0 13 * * *' }), MANANA), false) // 7:00 a. m.
  assert.equal(deNoche(ag('d', { horario: '59 12 * * *' }), MANANA), true) // 6:59 a. m.
  assert.equal(deNoche(ag('e', { horario: '*/5 * * * *', cada_minutos: 5 }), MANANA), false)
  assert.equal(deNoche(ag('f', { horario: '0 1 * * *', estado_fijo: 'pendiente', estado: 'pendiente' }), MANANA), false)
  assert.equal(deNoche(ag('g', { donde: 'sitio', horario: null }), MANANA), false)
})

test('lo que dice de quien está en la sala', () => {
  const nombre = (id: string) => ({ quark: 'Quark', krono: 'Krono' })[id] ?? id
  const l = (x: Partial<LugarSala>): LugarSala => ({ rincon: 'cafe', sitio: 0, con: null, hasta: null, por: 'turno', ...x })
  assert.equal(textoSala(l({ con: 'quark', por: 'tertulia' }), nombre), 'Tomándose un café con Quark')
  assert.equal(textoSala(l({}), nombre), 'Tomándose un café')
  assert.equal(textoSala(l({ rincon: 'platica', con: 'krono', por: 'tertulia' }), nombre), 'Platicando con Krono')
  assert.equal(textoSala(l({ rincon: 'platica' }), nombre), 'Descansando en los sillones')
  assert.equal(textoSala(l({ rincon: 'siesta', hasta: CUATRO, por: 'siesta' }), nombre), 'En siesta hasta las 4:00 p. m.')
})
