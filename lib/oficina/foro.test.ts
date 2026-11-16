import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { Comentario, Foto, Idea, Post } from './tipos.ts'
import {
  accionIdea, avisoRonda, contarIdeas, cuandoCorto, debateAbierto, filtrarForo, filtrarIdeas, filtroDeVerIdeas, focoAlDecidir,
  fotosDelEquipo, listaDeNombres, marcaVisto, nuevosDelForo, quienesComentan,
} from './foro.ts'

// lunes 16/11/2026, 10:42 a. m. en Costa Rica
const AHORA = new Date('2026-11-16T16:42:00Z')
const HORA = 3_600_000
const DIA = 24 * HORA
const antes = (ms: number) => new Date(AHORA.getTime() - ms).toISOString()

function post(id: string, x: Partial<Post> = {}): Post {
  return {
    id, de: 'alfa', tipo: 'nota', titulo: `Post ${id}`, texto: 'Texto', foto_id: null, likes: 0, te_gusta: false, idea_id: null,
    mostrar_desde: antes(HORA), comentarios: [], ...x,
  }
}
function com(id: string, de: string, x: Partial<Comentario> = {}): Comentario {
  return { id, post_id: 'p', de, texto: 'Comentario', en_respuesta_a: null, idea_id: null, mostrar_desde: antes(HORA), ...x }
}
function idea(id: string, estado: Idea['estado']): Idea {
  return { id, texto: `Idea ${id}`, por_que: 'Porque sí', de: 'beta', post_id: null, estado, mostrar_desde: antes(HORA), decidida_en: null }
}

test('la hora corta del foro: hoy, ayer, un día de esta semana o la fecha', () => {
  assert.equal(cuandoCorto(new Date('2026-11-16T16:31:00Z'), AHORA), 'Hoy, 10:31 a. m.')
  assert.equal(cuandoCorto(new Date('2026-11-15T22:10:00Z'), AHORA), 'Ayer, 4:10 p. m.')
  assert.equal(cuandoCorto(new Date('2026-11-12T15:15:00Z'), AHORA), 'Jue, 9:15 a. m.')
  assert.equal(cuandoCorto(new Date('2026-11-12T15:15:00Z'), new Date('2026-11-20T16:00:00Z')), '12/11, 9:15 a. m.')
  // el día es el de Costa Rica: las 11:30 p. m. del domingo ya son lunes en UTC
  assert.equal(cuandoCorto(new Date('2026-11-16T05:30:00Z'), AHORA), 'Ayer, 11:30 p. m.')
  // hasta 6 días atrás va el día; a los 7, la fecha (el martes pasado no se confunde con el que viene)
  assert.equal(cuandoCorto(new Date('2026-11-10T18:00:00Z'), AHORA), 'Mar, 12:00 p. m.')
  assert.equal(cuandoCorto(new Date('2026-11-09T18:00:00Z'), AHORA), '9/11, 12:00 p. m.')
  assert.equal(cuandoCorto(new Date('2026-11-14T22:30:00Z'), AHORA), 'Sáb, 4:30 p. m.')
  assert.equal(cuandoCorto(new Date('2026-11-11T14:00:00Z'), AHORA), 'Mié, 8:00 a. m.')
})

test('los filtros del foro: con «Con ideas» entra el post cuya idea viene en un comentario', () => {
  const debate = post('debate', { tipo: 'debate' })
  const foto = post('foto', { tipo: 'foto', foto_id: 'f1' })
  const conComentario = post('nota', { comentarios: [com('c1', 'beta'), com('c2', 'gama', { idea_id: 'i1', en_respuesta_a: 'c1' })] })
  const propia = post('idea', { tipo: 'idea', idea_id: 'i2' })
  const posts = [debate, foto, conComentario, propia]
  assert.deepEqual(filtrarForo(posts, 'idea').map((p) => p.id), ['nota', 'idea'])
  assert.deepEqual(filtrarForo(posts, 'debate').map((p) => p.id), ['debate'])
  assert.deepEqual(filtrarForo(posts, 'foto').map((p) => p.id), ['foto'])
  assert.equal(filtrarForo(posts, 'todo'), posts)
  assert.deepEqual(filtrarForo([], 'idea'), [])
})

test('el debate abierto es el más nuevo de los últimos 3 días que ya se ve', () => {
  const viejo = post('viejo', { tipo: 'debate', mostrar_desde: antes(4 * DIA) })
  assert.equal(debateAbierto([viejo], AHORA), null, 'uno de hace 4 días ya no está abierto')
  const ayer = post('ayer', { tipo: 'debate', mostrar_desde: antes(DIA) })
  const hoy = post('hoy', { tipo: 'debate', mostrar_desde: antes(2 * HORA) })
  const nota = post('nota', { mostrar_desde: antes(HORA) })
  const despues = post('despues', { tipo: 'debate', mostrar_desde: new Date(AHORA.getTime() + HORA).toISOString() })
  assert.equal(debateAbierto([viejo, ayer, nota, hoy, despues], AHORA)?.id, 'hoy')
  assert.equal(debateAbierto([viejo, ayer], AHORA)?.id, 'ayer')
  assert.equal(debateAbierto([], AHORA), null)
})

test('lo nuevo del foro: lo que salió después de la última vez que lo viste (sin esa vez, las últimas 24 h)', () => {
  const posts = [
    post('a', { mostrar_desde: '2026-11-16T14:00:00Z' }),
    post('b', { mostrar_desde: '2026-11-16T15:30:00Z' }),
    post('c', { mostrar_desde: '2026-11-16T16:30:00Z' }),
    post('d', { mostrar_desde: '2026-11-16T17:00:00Z' }), // todavía no sale
  ]
  assert.equal(nuevosDelForo(posts, '2026-11-16T15:00:00Z', AHORA), 2)
  assert.equal(nuevosDelForo(posts, '2026-11-16T16:30:00Z', AHORA), 0, 'lo que salió justo a esa hora ya lo viste')
  const dia = [post('x', { mostrar_desde: antes(23 * HORA) }), post('y', { mostrar_desde: antes(25 * HORA) })]
  assert.equal(nuevosDelForo(dia, null, AHORA), 1)
  assert.equal(nuevosDelForo(dia, 'no es una fecha', AHORA), 1, 'una marca rota cuenta como si no hubiera')
  assert.equal(nuevosDelForo([], null, AHORA), 0)
})

test('hasta dónde viste el foro: ahora o el post más nuevo, si el reloj de la compu va atrasado', () => {
  assert.equal(marcaVisto([post('a', { mostrar_desde: antes(HORA) })], AHORA), AHORA.toISOString())
  assert.equal(marcaVisto([post('a', { mostrar_desde: '2026-11-16T16:45:00Z' })], AHORA), '2026-11-16T16:45:00.000Z')
  assert.equal(marcaVisto([], AHORA), AHORA.toISOString())
})

test('las ideas por estado y su cuenta en cada filtro', () => {
  const ideas = [idea('a', 'nueva'), idea('b', 'sirve'), idea('c', 'nueva'), idea('d', 'no_va')]
  assert.deepEqual(contarIdeas(ideas), { todas: 4, nueva: 2, sirve: 1, no_va: 1 })
  assert.deepEqual(contarIdeas([]), { todas: 0, nueva: 0, sirve: 0, no_va: 0 })
  assert.deepEqual(filtrarIdeas(ideas, 'nueva').map((i) => i.id), ['a', 'c'])
  assert.deepEqual(filtrarIdeas(ideas, 'sirve').map((i) => i.id), ['b'])
  assert.deepEqual(filtrarIdeas(ideas, 'no_va').map((i) => i.id), ['d'])
  assert.equal(filtrarIdeas(ideas, 'todas'), ideas)
})

test('el aviso de la ronda: solo la de hoy, si falló o se la saltó', () => {
  assert.equal(avisoRonda({ fecha: '2026-11-15', resultado: 'falla', detalle: 'x' }, '2026-11-16'), null, 'la falla de ayer ya no se avisa')
  assert.equal(avisoRonda({ fecha: '2026-11-16', resultado: 'falla', detalle: 'x' }, '2026-11-16'), 'La tertulia de hoy no salió')
  assert.equal(avisoRonda({ fecha: '2026-11-16', resultado: 'saltada', detalle: 'x' }, '2026-11-16'), 'Hoy no hubo tertulia: la oficina dormía')
  assert.equal(avisoRonda({ fecha: '2026-11-16', resultado: 'ok', detalle: '' }, '2026-11-16'), null)
  assert.equal(avisoRonda(null, '2026-11-16'), null)
})

test('quiénes respondieron un debate, sin repetir y en el orden en que hablaron', () => {
  const p = post('d', {
    tipo: 'debate', de: 'theta',
    comentarios: [com('1', 'kappa'), com('2', 'zeta', { en_respuesta_a: '1' }), com('3', 'iota'), com('4', 'kappa', { en_respuesta_a: '3' }), com('5', 'theta')],
  })
  assert.deepEqual(quienesComentan(p), ['kappa', 'zeta', 'iota', 'theta'])
  assert.deepEqual(quienesComentan(post('solo')), [])
})

test('los nombres en una frase: con comas y «y», y los que no caben como «y N más»', () => {
  assert.equal(listaDeNombres([]), '')
  assert.equal(listaDeNombres(['Alfa']), 'Alfa')
  assert.equal(listaDeNombres(['Alfa', 'Beta']), 'Alfa y Beta')
  assert.equal(listaDeNombres(['Alfa', 'Beta', 'Gama']), 'Alfa, Beta y Gama')
  assert.equal(listaDeNombres(['A', 'B', 'C', 'D', 'E', 'F', 'G'], 5), 'A, B, C, D, E y 2 más')
  assert.equal(listaDeNombres(['A', 'B', 'C', 'D', 'E', 'F'], 5), 'A, B, C, D, E y 1 más')
  assert.equal(listaDeNombres(['A', 'B', 'C', 'D', 'E'], 5), 'A, B, C, D y E')
})

test('las fotos del equipo: las de grupo, de la más nueva a la más vieja, y después los retratos, hasta el tope', () => {
  const foto = (id: string, tipo: Foto['tipo'], agentes: string[]): Foto => ({ id, tipo, agentes, url: `/f/${id}`, pie: null })
  const fotos = [
    foto('g-sin-post', 'grupo', ['alfa', 'beta']),
    foto('g-vieja', 'grupo', ['alfa', 'gama']),
    foto('g-nueva', 'grupo', ['beta', 'gama']),
    foto('r-gama', 'retrato', ['gama']),
    foto('r-alfa', 'retrato', ['alfa']),
  ]
  const foro = [
    post('p1', { tipo: 'foto', foto_id: 'g-nueva', mostrar_desde: antes(HORA) }),
    post('p2', { tipo: 'foto', foto_id: 'g-vieja', mostrar_desde: antes(DIA) }),
  ]
  const orden = ['alfa', 'beta', 'gama']
  assert.deepEqual(fotosDelEquipo(fotos, foro, orden, 6).map((f) => f.id), ['g-nueva', 'g-vieja', 'g-sin-post', 'r-alfa', 'r-gama'])
  assert.deepEqual(fotosDelEquipo(fotos, foro, orden, 4).map((f) => f.id), ['g-nueva', 'g-vieja', 'g-sin-post', 'r-alfa'])
  // un retrato de alguien que ya no está en el catálogo va al final
  assert.deepEqual(fotosDelEquipo([foto('r-ex', 'retrato', ['ex']), foto('r-alfa', 'retrato', ['alfa'])], [], orden, 6).map((f) => f.id), ['r-alfa', 'r-ex'])
  assert.deepEqual(fotosDelEquipo([], foro, orden, 6), [])
})

test('«Ver ideas» abre en Nuevas si hay alguna; si no, en Todas (nunca en una lista vacía)', () => {
  assert.equal(filtroDeVerIdeas([idea('a', 'sirve'), idea('b', 'nueva')]), 'nueva')
  assert.equal(filtroDeVerIdeas([idea('a', 'no_va'), idea('b', 'sirve')]), 'todas')
  assert.equal(filtroDeVerIdeas([]), 'todas')
})

test('«Me sirve» y «No va»: tocar el que ya está puesto lo deshace', () => {
  assert.equal(accionIdea(idea('a', 'nueva'), 'sirve'), 'sirve')
  assert.equal(accionIdea(idea('a', 'nueva'), 'no_va'), 'no_va')
  assert.equal(accionIdea(idea('a', 'sirve'), 'sirve'), 'deshacer')
  assert.equal(accionIdea(idea('a', 'sirve'), 'no_va'), 'no_va')
  assert.equal(accionIdea(idea('a', 'no_va'), 'no_va'), 'deshacer')
})

test('si al decidirla la idea sale del filtro, el foco va al mismo botón de la fila siguiente o, si no hay, al título', () => {
  const nuevas = [idea('a', 'nueva'), idea('b', 'nueva'), idea('c', 'nueva')]
  assert.deepEqual(focoAlDecidir(nuevas, nuevas[0], 'sirve', 'nueva'), { id: 'b', boton: 'sirve' })
  assert.deepEqual(focoAlDecidir(nuevas, nuevas[1], 'no_va', 'nueva'), { id: 'c', boton: 'no_va' })
  assert.equal(focoAlDecidir(nuevas, nuevas[2], 'sirve', 'nueva'), 'titulo', 'la última no tiene siguiente')
  // en «Todas» ninguna sale: el foco se queda donde está
  assert.equal(focoAlDecidir(nuevas, nuevas[0], 'sirve', 'todas'), null)
  // en «Me sirven», deshacer la devuelve a «Nueva» y sale; «No va» también
  const sirven = [idea('x', 'sirve'), idea('y', 'sirve')]
  assert.deepEqual(focoAlDecidir(sirven, sirven[0], 'sirve', 'sirve'), { id: 'y', boton: 'sirve' })
  assert.equal(focoAlDecidir(sirven, sirven[1], 'no_va', 'sirve'), 'titulo')
  // en «No van», deshacer la saca
  const noVan = [idea('n', 'no_va')]
  assert.equal(focoAlDecidir(noVan, noVan[0], 'no_va', 'no_va'), 'titulo')
})
