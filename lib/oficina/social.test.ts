import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarSocial, firmaSocial, fnv1a, leerAccionIdea, leerMeGusta, socialVencido, ultimaRonda, type SocialCrudo } from './social.ts'
import type { Comentario, EstadoOficina, Idea, Post, Ronda } from './tipos.ts'

// Lunes 16/11/2026, 2:00 p. m. en Costa Rica
const AHORA = new Date('2026-11-16T20:00:00Z')
const MIN = 60_000
const en = (min: number) => new Date(AHORA.getTime() + min * MIN).toISOString()
const luego = (min: number) => new Date(AHORA.getTime() + min * MIN)
const DESPIERTA: EstadoOficina = { dormida: false, desde: null, por: null }
// Dormida desde `min` minutos de AHORA (negativo: antes)
const dormidaDesde = (min: number): EstadoOficina => ({ dormida: true, desde: en(min), por: 'ale' })

type PostCrudo = Omit<Post, 'comentarios'>
const post = (id: string, mostrar_desde: string, o: Partial<PostCrudo> = {}): PostCrudo => ({
  id, de: 'ana', tipo: 'nota', titulo: `Título ${id}`, texto: 'Algo que pasó hoy', foto_id: null, likes: 2, te_gusta: false,
  idea_id: null, mostrar_desde, ...o,
})
const com = (id: string, post_id: string, mostrar_desde: string, en_respuesta_a: string | null = null): Comentario => ({
  id, post_id, de: 'beto', texto: `Comentario ${id}`, en_respuesta_a, idea_id: null, mostrar_desde,
})
const idea = (id: string, mostrar_desde: string, estado: Idea['estado'] = 'nueva'): Idea => ({
  id, texto: 'Probar algo distinto', por_que: 'Porque pasó algo', de: 'ana', post_id: null, estado, mostrar_desde, decidida_en: null,
})

function crudo(o: Partial<SocialCrudo> = {}): SocialCrudo {
  return {
    posts: [post('p1', en(-120)), post('p2', en(-30)), post('p-futuro', en(45))],
    comentarios: [
      com('c2', 'p1', en(-100)),
      com('r1', 'p1', en(-90), 'c1'), // responde a c1 y es más nueva que c2
      com('c1', 'p1', en(-110)),
      com('c-futuro', 'p1', en(20)),
    ],
    ideas: [idea('i1', en(-200)), idea('i2', en(-20)), idea('i-futura', en(60))],
    fotos: [{ id: 'f1', tipo: 'retrato', agentes: ['ana'], ruta: 'retratos/ana.jpg', pie: null }],
    ronda: { fecha: '2026-11-16', turno: 'mediodia', resultado: 'ok', detalle: '' },
    ...o,
  }
}

test('armarSocial: esconde el post y el comentario del futuro, y cada respuesta va detrás de su comentario', () => {
  const s = armarSocial(crudo(), AHORA, DESPIERTA)
  assert.deepEqual(s.foro.map((p) => p.id), ['p2', 'p1'])
  assert.deepEqual(s.foro[1].comentarios.map((c) => c.id), ['c1', 'r1', 'c2'])
  assert.deepEqual(s.foro[0].comentarios, [])
  assert.deepEqual(s.ideas.map((i) => i.id), ['i2', 'i1'])
  assert.deepEqual(s.fotos, [{ id: 'f1', tipo: 'retrato', agentes: ['ana'], ruta: 'retratos/ana.jpg', pie: null }])
  assert.deepEqual(s.ronda, { fecha: '2026-11-16', turno: 'mediodia', resultado: 'ok', detalle: '' })
})

test('armarSocial: la ronda de ayer no sale', () => {
  assert.equal(armarSocial(crudo({ ronda: { fecha: '2026-11-15', turno: 'tarde', resultado: 'falla', detalle: 'x' } }), AHORA, DESPIERTA).ronda, null)
  assert.equal(armarSocial(crudo({ ronda: null }), AHORA, DESPIERTA).ronda, null)
})

test('armarSocial: 40 posts como mucho, los más nuevos', () => {
  const posts = Array.from({ length: 45 }, (_, i) => post(`p${i}`, en(-i - 1)))
  const s = armarSocial(crudo({ posts, comentarios: [] }), AHORA, DESPIERTA)
  assert.equal(s.foro.length, 40)
  assert.equal(s.foro[0].id, 'p0')
  assert.equal(s.foro[39].id, 'p39')
})

test('firmaSocial: la misma con los mismos datos, y a otra hora si no se ve nada nuevo', () => {
  const f = firmaSocial(armarSocial(crudo(), AHORA, DESPIERTA))
  assert.match(f, /^[0-9a-f]{8}$/)
  assert.equal(firmaSocial(armarSocial(crudo(), AHORA, DESPIERTA)), f)
  assert.equal(firmaSocial(armarSocial(crudo(), luego(10), DESPIERTA)), f)
})

test('firmaSocial: las mismas fotos en otro orden dan la misma firma', () => {
  const fotos: SocialCrudo['fotos'] = [
    { id: 'f1', tipo: 'retrato', agentes: ['ana'], ruta: 'retratos/ana.jpg', pie: null },
    { id: 'f2', tipo: 'grupo', agentes: ['ana', 'beto'], ruta: 'grupo/f2.jpg', pie: 'Almuerzo en la playa' },
    { id: 'f3', tipo: 'retrato', agentes: ['beto'], ruta: 'retratos/beto.jpg', pie: null },
  ]
  const enOrden = firmaSocial(armarSocial(crudo({ fotos }), AHORA, DESPIERTA))
  assert.equal(firmaSocial(armarSocial(crudo({ fotos: [fotos[2], fotos[0], fotos[1]] }), AHORA, DESPIERTA)), enOrden)
  assert.deepEqual(armarSocial(crudo({ fotos: [fotos[1], fotos[2], fotos[0]] }), AHORA, DESPIERTA).fotos.map((f) => f.id), ['f1', 'f2', 'f3'])
})

test('firmaSocial: cambia con un me gusta, con un comentario que sale y con una idea que sirve', () => {
  const f = firmaSocial(armarSocial(crudo(), AHORA, DESPIERTA))
  const conGusta = crudo({ posts: [post('p1', en(-120), { te_gusta: true }), post('p2', en(-30)), post('p-futuro', en(45))] })
  assert.notEqual(firmaSocial(armarSocial(conGusta, AHORA, DESPIERTA)), f)
  assert.notEqual(firmaSocial(armarSocial(crudo(), luego(21), DESPIERTA)), f)
  const sirve = crudo({ ideas: [idea('i1', en(-200), 'sirve'), idea('i2', en(-20)), idea('i-futura', en(60))] })
  assert.notEqual(firmaSocial(armarSocial(sirve, AHORA, DESPIERTA)), f)
})

test('armarSocial: dormida, no sale nada programado desde que se durmió (el mismo corte del chat)', () => {
  // Dormida desde la 1:30 p. m.: p2 y la idea i2 tocaban justo a esa hora o después
  const s = armarSocial(crudo(), AHORA, dormidaDesde(-30))
  assert.deepEqual(s.foro.map((p) => p.id), ['p1'])
  assert.deepEqual(s.foro[0].comentarios.map((c) => c.id), ['c1', 'r1', 'c2'])
  assert.deepEqual(s.ideas.map((i) => i.id), ['i1'])
  assert.equal(s.fotos.length, 1)
  assert.ok(s.ronda)
  // Dormida desde la 12:25 p. m.: la respuesta r1 (12:30) tampoco sale, c2 (12:20) sí
  const antes = armarSocial(crudo(), AHORA, dormidaDesde(-95))
  assert.deepEqual(antes.foro.map((p) => p.id), ['p1'])
  assert.deepEqual(antes.foro[0].comentarios.map((c) => c.id), ['c1', 'c2'])
  // Dormida sin saber desde cuándo: nada, como el chat
  const sinHora = armarSocial(crudo(), AHORA, { dormida: true, desde: null, por: null })
  assert.deepEqual([sinHora.foro.length, sinHora.ideas.length], [0, 0])
})

test('firmaSocial: dormida no cambia con la hora, y al despertar cambia para que el bloque viaje', () => {
  const dormida = dormidaDesde(-30)
  const f = firmaSocial(armarSocial(crudo(), AHORA, dormida))
  // Ya pasó la hora de c-futuro (+20) y de p-futuro (+45), pero mientras duerme no salen
  assert.equal(firmaSocial(armarSocial(crudo(), luego(60), dormida)), f)
  assert.notEqual(firmaSocial(armarSocial(crudo(), luego(60), DESPIERTA)), f)
  // Si no había nada después de la hora de dormirse, despertar no cambia lo que se ve ni la firma
  const solo = crudo({ posts: [post('p1', en(-120))], comentarios: [], ideas: [idea('i1', en(-200))] })
  assert.equal(firmaSocial(armarSocial(solo, AHORA, dormida)), firmaSocial(armarSocial(solo, AHORA, DESPIERTA)))
})

test('socialVencido: sin copia o con 30 min, sí; con 29 min, no', () => {
  const t = AHORA.getTime()
  assert.equal(socialVencido(null, t), true)
  assert.equal(socialVencido(t - 30 * MIN, t), true)
  assert.equal(socialVencido(t - 29 * MIN, t), false)
})

test('fnv1a: FNV-1a de 32 bits, en hexadecimal', () => {
  assert.equal(fnv1a(''), '811c9dc5')
  assert.equal(fnv1a('a'), 'e40c292c')
  assert.equal(fnv1a('foobar'), 'bf9cf968')
})

test('leerAccionIdea: sirve, no_va y deshacer; otra cosa no existe', () => {
  assert.deepEqual(leerAccionIdea({ accion: 'sirve' }), { ok: true, estado: 'sirve' })
  assert.deepEqual(leerAccionIdea({ accion: 'no_va' }), { ok: true, estado: 'no_va' })
  assert.deepEqual(leerAccionIdea({ accion: 'deshacer' }), { ok: true, estado: 'nueva' })
  assert.deepEqual(leerAccionIdea({ accion: 'nueva' }), { ok: false, error: 'Esa acción no existe' })
  assert.deepEqual(leerAccionIdea(null), { ok: false, error: 'Esa acción no existe' })
})

test('leerMeGusta: pide un booleano en si', () => {
  assert.deepEqual(leerMeGusta({ si: true }), { ok: true, si: true })
  assert.deepEqual(leerMeGusta({ si: false }), { ok: true, si: false })
  assert.deepEqual(leerMeGusta({ si: 'sí' }), { ok: false, error: 'Falta decir si te gusta' })
  assert.deepEqual(leerMeGusta(null), { ok: false, error: 'Falta decir si te gusta' })
})

test('armarSocial: proxima es el primer post de hoy que aún no se ve', () => {
  const s = armarSocial(crudo({ posts: [post('p1', en(-30)), post('a', en(90)), post('b', en(45))] }), AHORA, DESPIERTA)
  assert.equal(s.proxima, en(45))
})

test('armarSocial: proxima es null si el siguiente post es de mañana', () => {
  const s = armarSocial(crudo({ posts: [post('p1', en(-30)), post('manana', en(24 * 60))] }), AHORA, DESPIERTA)
  assert.equal(s.proxima, null)
})

test('armarSocial: proxima es null con la oficina dormida', () => {
  assert.equal(armarSocial(crudo(), AHORA, dormidaDesde(-30)).proxima, null)
})

test('armarSocial: proxima es null si no hay posts por salir', () => {
  assert.equal(armarSocial(crudo({ posts: [post('p1', en(-120))] }), AHORA, DESPIERTA).proxima, null)
})

test('ultimaRonda: la del día más nuevo y, ese día, la del último turno', () => {
  const r = (fecha: string, turno: Ronda['turno'], resultado: Ronda['resultado'] = 'ok'): Ronda => ({ fecha, turno, resultado, detalle: '' })
  assert.equal(ultimaRonda([]), null)
  assert.deepEqual(ultimaRonda([r('2026-11-16', 'manana'), r('2026-11-15', 'tarde'), r('2026-11-15', 'mediodia')]), r('2026-11-16', 'manana'))
  assert.deepEqual(ultimaRonda([r('2026-11-16', 'tarde', 'falla'), r('2026-11-16', 'manana'), r('2026-11-16', 'mediodia')]), r('2026-11-16', 'tarde', 'falla'))
  assert.deepEqual(ultimaRonda([r('2026-11-16', 'mediodia'), r('2026-11-16', 'manana', 'saltada')]), r('2026-11-16', 'mediodia'))
})

test('firmaSocial: cambia cuando corre otro turno de la tertulia (aunque el resultado sea el mismo)', () => {
  const manana = firmaSocial(armarSocial(crudo({ ronda: { fecha: '2026-11-16', turno: 'manana', resultado: 'falla', detalle: 'x' } }), AHORA, DESPIERTA))
  const mediodia = firmaSocial(armarSocial(crudo({ ronda: { fecha: '2026-11-16', turno: 'mediodia', resultado: 'falla', detalle: 'x' } }), AHORA, DESPIERTA))
  assert.notEqual(manana, mediodia)
})
