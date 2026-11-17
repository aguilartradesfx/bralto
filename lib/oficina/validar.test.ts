import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  validarRonda, problemaDeTexto, cortar, repartir, finDeRonda, horasDelChat, intercalar, pausaAntes, aDeay, normalizarDonde, TOPES,
  type CtxValidar, type RondaLimpia,
} from './validar.ts'
import { horaCR } from './horario.ts'

const ctx = (extra: Partial<CtxValidar> = {}): CtxValidar => ({
  hablan: new Set(['ana', 'beto', 'cata', 'dani']),
  conFoto: new Set(['ana', 'beto', 'cata', 'dani', 'eli']),
  hechos: new Set(['h1', 'h2']),
  postsViejos: new Set(['viejo1']),
  prohibidos: [],
  escenaEsperando: false,
  turno: 'mediodia',
  ahora: new Date('2026-11-16T18:30:00Z'), // 12:30 p. m. CR
  ...extra,
})
// la ronda de la mañana (8:30 a. m.) y la de la tarde (4:00 p. m.)
const MANANA = { turno: 'manana' as const, ahora: new Date('2026-11-16T14:30:00Z') }
const TARDE = { turno: 'tarde' as const, ahora: new Date('2026-11-16T22:00:00Z') }

const post = (n: number, extra: Record<string, unknown> = {}) => ({
  clave: `p${n}`, de: 'ana', tipo: 'nota', titulo: `Titulo ${n}`, texto: `Texto ${n}`, likes: 1, basada_en: ['h1'], idea: null, ...extra,
})
const com = (n: number, extra: Record<string, unknown> = {}) => ({
  clave: `c${n}`, post: 'p1', de: 'beto', texto: `Comentario ${n}`, responde_a: null, idea: null, ...extra,
})
const linea = (n: number, extra: Record<string, unknown> = {}) => ({
  de: 'ana', para: null, texto: `Linea ${n}`, rincon: null, idea: null, ...extra,
})
const ronda = (extra: Record<string, unknown> = {}) => ({ chat: [], charlas: [], posts: [], comentarios: [], escena: null, ...extra })
// Una charla de n líneas que se turnan entre `a` y `b` (empieza `a`)
const charla = (n: number, extra: Record<string, unknown> = {}, a = 'ana', b = 'beto') => ({
  donde: 'cafe', visita_a: null,
  lineas: Array.from({ length: n }, (_, i) => ({ de: i % 2 ? b : a, texto: `Frase ${i + 1} de ${i % 2 ? b : a}` })),
  ...extra,
})
const ok = (crudo: unknown, c = ctx()) => {
  const r = validarRonda(crudo, c)
  assert.ok(!('error' in r), 'no debía dar error')
  return r as Exclude<ReturnType<typeof validarRonda>, { error: string }>
}
const idea = (extra: Record<string, unknown> = {}) => ({ texto: 'Una idea', por_que: 'Porque sí', basada_en: ['h1'], ...extra })
const escena = (extra: Record<string, unknown> = {}) => ({
  de: 'ana', agentes: ['ana', 'beto'], titulo: 'Cafecito', donde: 'la sala', que: 'toman café', texto: 'Café juntos', likes: 1, ...extra,
})

test('fin de ronda: depende del turno (12:30, 4:00 p. m. o 6:30 p. m. de Costa Rica)', () => {
  assert.equal(finDeRonda(MANANA.ahora, 'manana').toISOString(), '2026-11-16T18:30:00.000Z')
  assert.equal(finDeRonda(new Date('2026-11-16T18:30:00Z'), 'mediodia').toISOString(), '2026-11-16T22:00:00.000Z')
  assert.equal(finDeRonda(TARDE.ahora, 'tarde').toISOString(), '2026-11-17T00:30:00.000Z')
})

test('repartir con alInicio: la primera sale justo en desde', () => {
  const r = repartir(3, new Date('2026-11-16T18:30:00Z'), new Date('2026-11-17T00:30:00Z'), true)
  assert.deepEqual(r.map(d => d.toISOString()), ['2026-11-16T18:30:00.000Z', '2026-11-16T20:30:00.000Z', '2026-11-16T22:30:00.000Z'])
})

test('repartir: la i-ésima va en el punto medio de su tramo', () => {
  const r = repartir(3, new Date('2026-11-16T18:30:00Z'), new Date('2026-11-17T00:30:00Z'))
  assert.deepEqual(r.map(horaCR), ['1:30 p. m.', '3:30 p. m.', '5:30 p. m.'])
  assert.deepEqual(repartir(0, new Date(0), new Date(1000)), [])
  const mismo = new Date('2026-11-17T01:00:00Z')
  assert.deepEqual(repartir(2, mismo, mismo), [mismo, mismo])
})

test('cortar: en el último espacio, con «…» y dentro del tope', () => {
  const largo = Array.from({ length: 30 }, () => 'casita').join(' ')
  const c = cortar(largo, 120)
  assert.ok(c.length <= 120 && c.endsWith('…'))
  assert.ok(!c.slice(0, -1).endsWith(' '))
  assert.equal(cortar('corto', 120), 'corto')
  assert.ok(cortar('x'.repeat(150), 120).length <= 120)
})

test('problemaDeTexto: modismos de afuera', () => {
  for (const t of ['Pana, ¿y eso?', 'tantito', 'Chevere', 'qué CHÉVERE', '¿Qué dicen, panas?', 'unos tantitos', 'están chéveres', 'muy cheveres']) assert.ok(problemaDeTexto(t, []), t)
  for (const t of ['Fui a la panadería', 'Todo bien, mae', 'la empanada', 'el panal']) assert.equal(problemaDeTexto(t, []), null, t)
})

test('problemaDeTexto: enlaces', () => {
  for (const t of ['mirá www.algo.com', 'https://x', 'entra a algo.com', 'sitio.io hoy', 've a bralto.ai', 'foo.app']) assert.ok(problemaDeTexto(t, []), t)
  for (const t of ['Listo.Con calma', 'Dije eso. Co sí', 'Nos vemos.']) assert.equal(problemaDeTexto(t, []), null, t)
})

test('problemaDeTexto: voseo y usted', () => {
  for (const t of ['¿Vos qué decís?', 'Mirá esto', 'sos buena', 'tenés razón', 'andá ya', 'Fijate bien', 'vení']) assert.ok(problemaDeTexto(t, []), t)
  for (const t of ['Mira esto, mae', 'tú sabes', 'ven acá', '¿Qué dicen ustedes?', 'Dile algo']) assert.equal(problemaDeTexto(t, []), null, t)
  assert.ok(problemaDeTexto('¿Qué dice usted?', []))
  assert.ok(problemaDeTexto('USTED manda', []))
})

test('problemaDeTexto: más voseo (pensás, sentís, tomá, decí, escuchá, contá, pasá, dejá) y su tuteo pasa', () => {
  const voseo = ['¿Qué pensás, mae?', 'Sentís que va lento', 'Tomá, compa', 'Decí algo', 'Escuchá esto', 'Contá cómo salió', 'Pasá por acá', 'Dejá eso']
  for (const t of voseo) assert.match(problemaDeTexto(t, []) ?? '', /\(voseo\)$/, t)
  const tuteo = ['¿Qué piensas, mae?', 'Sientes que va lento', 'Toma, compa', 'Di algo', 'Escucha esto', 'Cuenta cómo salió', 'Pasa por acá', 'Deja eso', 'Sal ya de ahí']
  for (const t of tuteo) assert.equal(problemaDeTexto(t, []), null, t)
  // «salí» también es el pasado de «yo»: no se bota
  assert.equal(problemaDeTexto('Hoy salí temprano', []), null)
})

test('problemaDeTexto: nombres prohibidos (frase entera, sin tildes ni mayúsculas)', () => {
  const p = ['Ferretería El Sol', 'Ana', 'Sol']
  assert.ok(problemaDeTexto('la ferreteria el sol pagó', p))
  assert.equal(problemaDeTexto('el sol salió', p), null)
  assert.equal(problemaDeTexto('Ana dijo hola', p), null) // menos de 4 letras
  assert.equal(problemaDeTexto('Hay una ferretería ahí', p), null)
})

test('un crudo que no es objeto da error', () => {
  for (const x of ['hola', null, 3, undefined]) assert.deepEqual(validarRonda(x, ctx()), { error: 'La respuesta no tiene la forma esperada' })
})

test('quién habla: de, para y escena', () => {
  const r = ok(ronda({
    chat: [linea(1, { de: 'pepe' }), linea(2, { para: 'todos' }), linea(3, { para: 'ale' }), linea(4, { para: 'beto' }), linea(5, { para: 'ana' })],
    escena: escena({ agentes: ['ana', 'zeta'] }),
  }))
  assert.deepEqual(r.chat.map(l => l.texto), ['Linea 3', 'Linea 4'])
  assert.equal(r.chat[0].para, 'ale')
  assert.equal(r.escena, null)
  assert.ok(r.botadas.some(b => b.startsWith('chat 1:')))
  assert.ok(r.botadas.some(b => b.startsWith('chat 2:')))
  assert.ok(r.botadas.some(b => b.startsWith('escena:')))
})

test('escena: de 1 a 4 Knox con foto, sin repetir', () => {
  const buenas = ok(ronda({ escena: escena() })).escena
  assert.deepEqual(buenas?.agentes, ['ana', 'beto'])
  assert.equal(ok(ronda({ escena: escena({ agentes: ['ana', 'beto', 'cata', 'dani', 'eli'] }) })).escena, null)
  assert.equal(ok(ronda({ escena: escena({ agentes: ['ana', 'ana'] }) })).escena, null)
  assert.equal(ok(ronda({ escena: escena({ agentes: [] }) })).escena, null)
  assert.equal(ok(ronda({ escena: escena({ de: 'pepe' }) })).escena, null)
  assert.equal(ok(ronda({ escena: escena({ texto: 'Qué chévere' }) })).escena, null)
})

test('escena: si ya hay una esperando su foto, se bota cualquiera con su motivo y no ocupa lugar', () => {
  const esperando = ctx({ escenaEsperando: true })
  const r = ok(ronda({ escena: escena() }), esperando)
  assert.equal(r.escena, null)
  assert.deepEqual(r.botadas, ['escena: ya hay una esperando su foto'])
  // Una escena mala también se bota por eso, antes que por lo demás
  assert.deepEqual(ok(ronda({ escena: escena({ de: 'pepe' }) }), esperando).botadas, ['escena: ya hay una esperando su foto'])
  // Botada, no le quita el lugar a la publicación de la ronda
  const una = ok(ronda({ posts: [post(1)], escena: escena() }), esperando)
  assert.equal(una.posts.length, 1)
  assert.deepEqual(una.botadas, ['escena: ya hay una esperando su foto'])
  // Sin escena, nada que botar
  assert.deepEqual(ok(ronda({ escena: null }), esperando).botadas, [])
})

test('escena: solo en la ronda del mediodía (en la de la mañana y la de la tarde se bota con su motivo)', () => {
  assert.ok(ok(ronda({ escena: escena() })).escena)
  for (const t of [MANANA, TARDE]) {
    const r = ok(ronda({ escena: escena() }), ctx(t))
    assert.equal(r.escena, null, t.turno)
    assert.deepEqual(r.botadas, ['escena: solo va en la ronda del mediodía'], t.turno)
  }
})

test('textos: espacios de más y una sola línea', () => {
  const r = ok(ronda({
    chat: [linea(1, { texto: '  hola \n  mae   qué tal ' })],
    posts: [post(1, { texto: 'uno  dos\n\n\n\n tres' })],
    comentarios: [com(1, { texto: 'a\nb' })],
  }))
  assert.equal(r.chat[0].texto, 'hola mae qué tal')
  assert.equal(r.comentarios[0].texto, 'a b')
  assert.equal(r.posts[0].texto, 'uno dos\n\ntres')
})

test('textos malos se botan con su motivo', () => {
  const r = ok(ronda({ chat: [linea(1), linea(2), linea(3), linea(4, { texto: 'Pana, ¿y eso?' })] }))
  assert.equal(r.chat.length, 3)
  assert.equal(r.botadas[0], 'chat 4: dice «pana»')
})

test('largo: se corta a su tope', () => {
  const r = ok(ronda({ chat: [linea(1, { texto: 'palabra '.repeat(30).trim() })] }))
  assert.ok(r.chat[0].texto.length <= 120 && r.chat[0].texto.endsWith('…'))
})

test('post: necesita un hecho de verdad, si no se bota con sus comentarios', () => {
  const r = ok(ronda({
    posts: [post(1, { basada_en: ['inventado'] }), post(2)],
    comentarios: [com(1, { post: 'p1' }), com(2, { post: 'p2' })],
  }))
  assert.deepEqual(r.posts.map(p => p.clave), ['p2'])
  assert.deepEqual(r.comentarios.map(c => c.clave), ['c2'])
  assert.ok(r.botadas.some(b => b.startsWith('post 1:')))
})

test('post idea: sin idea válida queda como nota', () => {
  const mala = ok(ronda({ posts: [post(1, { tipo: 'idea', idea: idea({ basada_en: ['nada'] }) })] }))
  assert.equal(mala.posts[0].tipo, 'nota')
  assert.deepEqual(mala.ideas, [])
  const buena = ok(ronda({ posts: [post(2, { tipo: 'idea', idea: idea() })] }))
  assert.equal(buena.posts[0].tipo, 'idea')
  assert.deepEqual(buena.ideas.map(i => i.origen), ['p2'])
  assert.equal(buena.ideas[0].de, 'ana')
})

test('idea: necesita texto y por_que', () => {
  const r = ok(ronda({ comentarios: [com(1, { post: 'viejo1', idea: idea({ por_que: '  ' }) })], posts: [] }))
  assert.equal(r.ideas.length, 0)
  assert.equal(r.comentarios.length, 1)
})

test('likes: entero entre 0 y quienes hablan menos 1', () => {
  const likes = (n: unknown) => ok(ronda({ posts: [post(1, { likes: n })] })).posts[0].likes
  assert.deepEqual([likes(99), likes(-4), likes(1.7), likes('3')], [3, 0, 1, 0])
})

test('comentarios: a un post que existe y respuestas de un solo nivel', () => {
  const r = ok(ronda({
    posts: [post(1)],
    comentarios: [
      com(1), com(2, { post: 'viejo1' }), com(3, { post: 'fantasma' }),
      com(4, { responde_a: 'c1' }), com(5, { responde_a: 'c4' }), com(6, { responde_a: 'nada' }),
      com(7, { post: 'viejo1', responde_a: 'c1' }),
    ],
  }))
  assert.deepEqual(r.comentarios.map(c => c.clave), ['c1', 'c2', 'c4', 'c5'])
  const por = Object.fromEntries(r.comentarios.map(c => [c.clave, c.responde_a]))
  assert.deepEqual(por, { c1: null, c2: null, c4: 'c1', c5: 'c1' })
})

test('chat: rincón e idea', () => {
  const r = ok(ronda({
    posts: [post(1, { tipo: 'idea', idea: idea() })],
    chat: [linea(1, { rincon: 'siesta' }), linea(2, { rincon: 'cafe' }), linea(3, { rincon: 'platica', idea: 'p1' }), linea(4, { idea: 'zzz' })],
  }))
  assert.deepEqual(r.chat.map(l => l.rincon), [null, 'cafe', 'platica', null])
  assert.deepEqual(r.chat.map(l => l.idea), [null, null, 'p1', null])
})

test('topes por ronda: 30 líneas, 4 comentarios, 1 idea', () => {
  assert.deepEqual(TOPES, { chat: 30, charlas: 6, publicaciones: 1, comentarios: 4, ideas: 1 })
  const chat = Array.from({ length: 40 }, (_, i) => linea(i + 1))
  const r40 = ok(ronda({ chat }))
  assert.equal(r40.chat.length, 30)
  assert.equal(r40.botadas[0], 'chat 31: pasa del tope')

  const comentarios = Array.from({ length: 6 }, (_, i) => com(i + 1, { post: 'viejo1' }))
  const r6 = ok(ronda({ comentarios }))
  assert.deepEqual(r6.comentarios.map(c => c.clave), ['c1', 'c2', 'c3', 'c4'])
  assert.deepEqual(r6.botadas, ['comentario c5: pasa del tope', 'comentario c6: pasa del tope'])

  const conIdea = Array.from({ length: 3 }, (_, i) => com(i + 1, { post: 'viejo1', idea: idea() }))
  const r = ok(ronda({ comentarios: conIdea, chat: [linea(1, { idea: 'c3' })] }))
  assert.deepEqual(r.ideas.map(i => i.origen), ['c1'])
  assert.equal(r.comentarios.length, 3)
  assert.equal(r.chat[0].idea, null)
})

test('topes por ronda: 1 publicación; la escena del mediodía va aparte y no le quita su lugar', () => {
  const tres = ok(ronda({ posts: [1, 2, 3].map(n => post(n)), escena: escena(), comentarios: [com(1, { post: 'p3' }), com(2, { post: 'p1' })] }))
  assert.deepEqual(tres.posts.map(p => p.clave), ['p1'])
  assert.equal(tres.escena?.titulo, 'Cafecito')
  assert.deepEqual(tres.comentarios.map(c => c.clave), ['c2'])
  assert.deepEqual(tres.botadas, ['post p2: pasa del tope', 'post p3: pasa del tope'])
  // una publicación y una escena van las dos
  const las2 = ok(ronda({ posts: [post(1)], escena: escena() }))
  assert.deepEqual([las2.posts.length, !!las2.escena, las2.botadas.length], [1, true, 0])
  const sola = ok(ronda({ escena: escena() }))
  assert.equal(sola.posts.length, 0)
  assert.ok(sola.escena)
})

test('topes por ronda: los comentarios de una publicación que pasó del tope no le quitan el lugar a los demás', () => {
  const r = ok(ronda({
    posts: [post(1), post(2)],
    comentarios: [com(1, { post: 'p2' }), com(2, { post: 'p2' }), com(3, { post: 'p1' }), com(4, { post: 'viejo1' }), com(5, { post: 'p1' }), com(6, { post: 'viejo1' })],
  }))
  assert.deepEqual(r.comentarios.map(c => c.clave), ['c3', 'c4', 'c5', 'c6'])
})

test('topes por ronda: la idea de una publicación que pasó del tope deja su lugar a la de un comentario', () => {
  const r = ok(ronda({ posts: [post(1), post(2, { tipo: 'idea', idea: idea() })], comentarios: [com(1, { post: 'viejo1', idea: idea() })] }))
  assert.deepEqual(r.ideas.map(i => i.origen), ['c1'])
})

test('horas: la publicación sale al empezar la ronda y los comentarios se reparten hasta el fin del turno', () => {
  const r = ok(ronda({
    posts: [post(1)],
    comentarios: [com(1, { post: 'p1' }), com(2, { post: 'p1' }), com(3, { post: 'viejo1' })],
  }))
  assert.deepEqual(r.posts.map(p => horaCR(new Date(p.mostrar_desde))), ['12:30 p. m.'])
  const p1 = r.comentarios.filter(c => c.post === 'p1')
  assert.deepEqual(p1.map(c => horaCR(new Date(c.mostrar_desde))), ['1:22 p. m.', '3:07 p. m.'])
  assert.equal(horaCR(new Date(r.comentarios.find(c => c.post === 'viejo1')!.mostrar_desde)), '2:15 p. m.')
  const fin = finDeRonda(ctx().ahora, 'mediodia').getTime()
  for (const x of [...r.posts, ...r.comentarios]) assert.ok(new Date(x.mostrar_desde).getTime() <= fin)
  // en la de la mañana, hasta las 12:30
  const m = ok(ronda({ posts: [post(1)], comentarios: [com(1)] }), ctx(MANANA))
  assert.deepEqual([...m.posts, ...m.comentarios].map(x => horaCR(new Date(x.mostrar_desde))), ['8:30 a. m.', '10:30 a. m.'])
})

test('horas: una línea con idea no sale antes que su idea y el chat se reordena', () => {
  const r = ok(ronda({
    comentarios: [com(1, { post: 'viejo1', idea: idea() })],
    chat: [linea(1, { idea: 'c1' }), linea(2), linea(3)],
  }))
  const horaIdea = new Date(r.ideas[0].mostrar_desde).getTime()
  assert.equal(horaIdea, new Date(r.comentarios[0].mostrar_desde).getTime())
  const l1 = r.chat.find(l => l.texto === 'Linea 1')!
  assert.equal(l1.idea, 'c1')
  assert.ok(new Date(l1.mostrar_desde).getTime() >= horaIdea)
  const horas = r.chat.map(l => new Date(l.mostrar_desde).getTime())
  assert.deepEqual(horas, [...horas].sort((a, b) => a - b))
  assert.equal(new Set(horas).size, 3)
  assert.deepEqual(r.chat.map(l => l.texto), ['Linea 2', 'Linea 1', 'Linea 3'])
})

test('horas: si ya pasó el fin, todo va al inicio (el chat, seguido desde ahí)', () => {
  const tarde = ctx({ turno: 'tarde', ahora: new Date('2026-11-17T01:00:00Z') }) // 7:00 p. m.
  const r = ok(ronda({ posts: [post(1)], chat: [linea(1)], comentarios: [com(1)] }), tarde)
  for (const x of [...r.posts, ...r.chat, ...r.comentarios]) assert.equal(x.mostrar_desde, tarde.ahora.toISOString())
})

test('«diay» sale como «deay» (mayúscula conservada), sin tocar otras palabras, y la línea no se bota', () => {
  const r = ok(ronda({ chat: [linea(1, { texto: 'Diay, mae, ya salió' }), linea(2, { texto: 'diay y mediaya diaya' }), linea(3, { texto: 'el prediay' })] }))
  assert.equal(r.chat.length, 3)
  assert.equal(r.chat[0].texto, 'Deay, mae, ya salió')
  assert.equal(r.chat[1].texto, 'deay y mediaya diaya')
  assert.equal(r.chat[2].texto, 'el prediay')
  assert.deepEqual(r.botadas, [])
})

// ---------- charlas ----------

const MIN = 60_000
const t = (iso: string) => new Date(iso).getTime()
// todas las líneas del chat (sueltas y de charlas) con su hora, por hora
const todasLasLineas = (r: RondaLimpia) => [
  ...r.chat.map(l => ({ de: l.de, texto: l.texto, hilo: -1, t: t(l.mostrar_desde) })),
  ...r.charlas.flatMap((c, i) => c.lineas.map(l => ({ de: l.de, texto: l.texto, hilo: i, t: t(l.mostrar_desde) }))),
].sort((a, b) => a.t - b.t)

test('charlas: una buena en el café: 2 Knox que se turnan, cada línea para el otro, sin anfitrión', () => {
  const r = ok(ronda({ charlas: [charla(3)] }))
  assert.equal(r.charlas.length, 1)
  const c = r.charlas[0]
  assert.equal(c.donde, 'cafe')
  assert.equal(c.anfitrion, null)
  assert.deepEqual(c.lineas.map(l => [l.de, l.para, l.texto]), [
    ['ana', 'beto', 'Frase 1 de ana'], ['beto', 'ana', 'Frase 2 de beto'], ['ana', 'beto', 'Frase 3 de ana'],
  ])
  assert.deepEqual(r.botadas, [])
  // en la sala (plática), igual; un visita_a de más fuera de una visita no estorba
  const sala = ok(ronda({ charlas: [charla(2, { donde: 'platica', visita_a: 'beto' })] })).charlas[0]
  assert.deepEqual([sala.donde, sala.anfitrion, sala.lineas.length], ['platica', null, 2])
})

test('charlas: una visita: visita_a es el anfitrión y el que llega habla primero', () => {
  const r = ok(ronda({ charlas: [charla(4, { donde: 'visita', visita_a: 'beto' })] }))
  assert.deepEqual(r.botadas, [])
  assert.equal(r.charlas[0].donde, 'visita')
  assert.equal(r.charlas[0].anfitrion, 'beto')
  assert.equal(r.charlas[0].lineas[0].de, 'ana')
  assert.equal(r.charlas[0].lineas[0].para, 'beto')
})

test('charlas: las mal hechas se botan enteras, cada una con su motivo', () => {
  const lineas = (...xs: [string, string][]) => xs.map(([de, texto]) => ({ de, texto }))
  const casos: [unknown, string][] = [
    ['no soy una charla', 'no tiene la forma esperada'],
    [charla(2, { donde: 'siesta' }), 'no dice si es en el café, en la sala o de visita'],
    [charla(2, { donde: undefined }), 'no dice si es en el café, en la sala o de visita'],
    [charla(1), 'tiene 1 línea (van de 2 a 5)'],
    [charla(6), 'tiene 6 líneas (van de 2 a 5)'],
    [charla(0, { lineas: 'hola' }), 'tiene 0 líneas (van de 2 a 5)'],
    [charla(0, { lineas: [{ de: 'ana', texto: 'Hola' }, 'adiós'] }), 'una línea no tiene la forma esperada'],
    [charla(0, { lineas: lineas(['ana', 'Hola'], ['fantasma', 'Uuuh']) }), 'habla alguien que no está en la oficina'],
    [charla(0, { lineas: lineas(['ana', 'Hola'], ['ale', 'Hola, Ana']) }), 'habla alguien que no está en la oficina'],
    [charla(0, { lineas: lineas(['ana', 'Hola'], ['ana', 'Sigo yo']) }), 'no es entre 2 Knox'],
    [charla(0, { lineas: lineas(['ana', 'Hola'], ['beto', 'Qué tal'], ['cata', 'Y yo']) }), 'no es entre 2 Knox'],
    [charla(0, { lineas: lineas(['ana', 'Hola'], ['beto', 'Qué tal'], ['beto', 'Otra vez yo'], ['ana', 'Ok']) }), 'no se turnan'],
    [charla(2, { donde: 'visita' }), 'visita a alguien que no está en la charla'],
    [charla(2, { donde: 'visita', visita_a: 'cata' }), 'visita a alguien que no está en la charla'],
    [charla(2, { donde: 'visita', visita_a: 'ana' }), 'el que llega no habla primero'],
    [charla(0, { lineas: lineas(['ana', 'Hola'], ['beto', '   ']) }), 'una línea no trae texto'],
    [charla(0, { lineas: lineas(['ana', 'palabra '.repeat(16).trim()], ['beto', 'Ok']) }), 'una línea pasa de 120 letras'],
    [charla(0, { lineas: lineas(['ana', 'Hola'], ['beto', 'Qué chévere']) }), 'una línea dice «chévere»'],
    [charla(0, { lineas: lineas(['ana', '¿Vos qué decís?'], ['beto', 'Nada']) }), 'una línea dice «decís» (voseo)'],
    [charla(0, { lineas: lineas(['ana', '¿Qué dice usted?'], ['beto', 'Nada']) }), 'una línea dice «usted»'],
    [charla(0, { lineas: lineas(['ana', 'Mira bralto.io'], ['beto', 'Ya']) }), 'una línea trae un enlace'],
  ]
  for (const [c, motivo] of casos) {
    const r = ok(ronda({ charlas: [charla(2), c] }))
    assert.equal(r.charlas.length, 1, motivo)
    assert.deepEqual(r.botadas, [`charla 2: ${motivo}`], motivo)
  }
  // un cliente, con el mismo criterio de siempre
  const cliente = ok(ronda({ charlas: [charla(0, { lineas: lineas(['ana', 'Le escribí a Ferretería El Sol'], ['beto', 'Bien']) })] }), ctx({ prohibidos: ['Ferretería El Sol'] }))
  assert.deepEqual(cliente.botadas, ['charla 1: una línea nombra a un cliente'])
})

test('charlas: las reglas de texto de hoy: «diay» sale como «deay» y los espacios de más se van', () => {
  const r = ok(ronda({ charlas: [charla(0, { lineas: [{ de: 'ana', texto: 'Diay,   mae, ¿y el gancho?' }, { de: 'beto', texto: '  diay, ya salió\n ' }] })] }))
  assert.deepEqual(r.charlas[0].lineas.map(l => l.texto), ['Deay, mae, ¿y el gancho?', 'deay, ya salió'])
  assert.deepEqual(r.botadas, [])
  // justo 120 letras pasa entero, sin cortar
  const justa = 'x'.repeat(120)
  assert.equal(ok(ronda({ charlas: [charla(0, { lineas: [{ de: 'ana', texto: justa }, { de: 'beto', texto: 'Ok' }] })] })).charlas[0].lineas[0].texto, justa)
})

test('charlas: topes: hasta 6 charlas y 30 líneas en total, primero las charlas enteras y después las sueltas', () => {
  const siete = ok(ronda({ charlas: Array.from({ length: 7 }, () => charla(2)) }))
  assert.equal(siete.charlas.length, 6)
  assert.deepEqual(siete.botadas, ['charla 7: pasa del tope'])
  // las botadas no cuentan para el tope
  const conMala = ok(ronda({ charlas: [charla(1), ...Array.from({ length: 6 }, () => charla(2))] }))
  assert.equal(conMala.charlas.length, 6)
  assert.deepEqual(conMala.botadas, ['charla 1: tiene 1 línea (van de 2 a 5)'])
  // 6 charlas de 5 líneas llenan las 30: ninguna suelta
  const llenas = ok(ronda({ charlas: Array.from({ length: 6 }, () => charla(5)), chat: [linea(1), linea(2)] }))
  assert.equal(llenas.charlas.length, 6)
  assert.equal(llenas.chat.length, 0)
  assert.deepEqual(llenas.botadas, ['chat 1: pasa del tope', 'chat 2: pasa del tope'])
  // 4 charlas de 5 líneas: de 15 sueltas quedan las 10 primeras (la numeración es la de la respuesta, también con una mala)
  const sueltas = Array.from({ length: 16 }, (_, i) => (i === 0 ? linea(1, { de: 'fantasma' }) : linea(i + 1)))
  const cuatro = ok(ronda({ charlas: Array.from({ length: 4 }, () => charla(5)), chat: sueltas }))
  assert.deepEqual(cuatro.chat.map(l => l.texto), Array.from({ length: 10 }, (_, i) => `Linea ${i + 2}`))
  assert.equal(cuatro.charlas.reduce((n, c) => n + c.lineas.length, 0) + cuatro.chat.length, 30)
  assert.deepEqual(cuatro.botadas, ['chat 1: habla alguien que no está en la oficina', ...[12, 13, 14, 15, 16].map(n => `chat ${n}: pasa del tope`)])
})

test('horas: las líneas de una charla van seguidas, de 1 a 2 minutos, sin encimarse con nada, dentro del turno', () => {
  const r = ok(ronda({
    charlas: [charla(5), charla(3, { donde: 'visita', visita_a: 'dani' }, 'cata', 'dani'), charla(2, { donde: 'platica' })],
    chat: Array.from({ length: 6 }, (_, i) => linea(i + 1)),
  }))
  const inicio = ctx().ahora.getTime(), fin = finDeRonda(ctx().ahora, 'mediodia').getTime()
  const todas = todasLasLineas(r)
  assert.equal(todas.length, 16)
  for (const l of todas) assert.ok(l.t >= inicio && l.t <= fin, horaCR(new Date(l.t)))
  // a ninguna hora salen dos
  assert.equal(new Set(todas.map(l => l.t)).size, todas.length)
  r.charlas.forEach((c, i) => {
    // seguidas: entre su primera y su última línea no sale nada que no sea de ella
    const desde = todas.findIndex(l => l.hilo === i), hasta = todas.map(l => l.hilo).lastIndexOf(i)
    assert.equal(hasta - desde + 1, c.lineas.length, `charla ${i}`)
    // de 1 a 2 minutos entre una y otra
    for (let j = 1; j < c.lineas.length; j++) {
      const pausa = t(c.lineas[j].mostrar_desde) - t(c.lineas[j - 1].mostrar_desde)
      assert.ok(pausa >= MIN && pausa <= 2 * MIN, `charla ${i}, línea ${j}: ${pausa}`)
    }
  })
  // las charlas salen intercaladas con las sueltas, no todas juntas
  assert.notDeepEqual(todas.slice(0, 10).map(l => l.hilo).filter(h => h >= 0).length, 10)
})

test('horas: la de la mañana sale antes de las 12:30 y la de la tarde antes de las 6:30 p. m.', () => {
  for (const [turno, hasta] of [[MANANA, '2026-11-16T18:30:00Z'], [TARDE, '2026-11-17T00:30:00Z']] as const) {
    const r = ok(ronda({ charlas: [charla(5), charla(4), charla(5)], chat: [linea(1), linea(2)] }), ctx(turno))
    const todas = todasLasLineas(r)
    assert.ok(todas[0].t >= turno.ahora.getTime(), turno.turno)
    assert.ok(todas[todas.length - 1].t <= t(hasta), turno.turno)
  }
})

test('horas: si ya pasó el fin, las charlas igual salen una detrás de otra y con sus pausas', () => {
  const tarde = ctx({ turno: 'tarde', ahora: new Date('2026-11-17T01:00:00Z') }) // 7:00 p. m.
  const r = ok(ronda({ charlas: [charla(3), charla(2)], chat: [linea(1)] }), tarde)
  const todas = todasLasLineas(r)
  assert.equal(todas[0].t, tarde.ahora.getTime())
  assert.equal(new Set(todas.map(l => l.t)).size, todas.length)
  for (const c of r.charlas) for (let j = 1; j < c.lineas.length; j++) assert.ok(t(c.lineas[j].mostrar_desde) - t(c.lineas[j - 1].mostrar_desde) >= MIN)
})

test('pausaAntes: de 1 minuto (una respuesta corta) a 2 (una de 120 letras o más)', () => {
  assert.equal(pausaAntes(''), MIN)
  assert.equal(pausaAntes('x'.repeat(60)), 1.5 * MIN)
  assert.equal(pausaAntes('x'.repeat(120)), 2 * MIN)
  assert.equal(pausaAntes('x'.repeat(500)), 2 * MIN)
})

test('intercalar: parejo y en orden; a igual lugar, la charla primero', () => {
  const c = (i: number) => `c${i}`, s = (i: number) => `s${i}`
  const ver = (n: number, m: number) => intercalar(n, m).map(u => (u.tipo === 'charla' ? c(u.i) : s(u.i))).join(' ')
  assert.equal(ver(2, 4), 's0 c0 s1 s2 c1 s3')
  assert.equal(ver(1, 1), 'c0 s0')
  assert.equal(ver(3, 0), 'c0 c1 c2')
  assert.equal(ver(0, 2), 's0 s1')
  assert.equal(ver(0, 0), '')
})

test('horasDelChat: el mismo aire entre una y otra, medio aire en las puntas; si no caben, seguidas a un minuto', () => {
  const h = (d: number) => d * MIN
  // 2 sueltas y una charla de 10 min en 100 min: aire de 30 min
  assert.deepEqual(horasDelChat([{ dura: 0 }, { dura: h(10) }, { dura: 0 }], 0, h(100)), [h(15), h(45), h(85)])
  assert.deepEqual(horasDelChat([], 0, h(100)), [])
  // no caben: desde el inicio, a un minuto
  assert.deepEqual(horasDelChat([{ dura: h(3) }, { dura: 0 }, { dura: h(2) }], h(50), h(50)), [h(50), h(54), h(55)])
})

test('horasDelChat: la que no puede salir antes de una hora va al primer hueco desde ahí, sin pegarse a las demás', () => {
  const h = (d: number) => d * MIN
  // le tocaba a los 15 min y su idea sale a los 44: cabe justo un minuto antes de la charla (de 45 a 55)
  assert.deepEqual(horasDelChat([{ dura: 0, desde: h(44) }, { dura: h(10) }, { dura: 0 }], 0, h(100)), [h(44), h(45), h(85)])
  // a los 44 y medio ya no: va un minuto después de la charla
  assert.deepEqual(horasDelChat([{ dura: 0, desde: h(44.5) }, { dura: h(10) }, { dura: 0 }], 0, h(100)), [h(56), h(45), h(85)])
  // dos que esperan la misma hora no se enciman
  const dos = horasDelChat([{ dura: 0, desde: h(60) }, { dura: 0, desde: h(60) }, { dura: 0 }], 0, h(90))
  assert.deepEqual(dos, [h(60), h(61), h(75)])
  // si ya le tocaba después, se queda donde estaba
  assert.deepEqual(horasDelChat([{ dura: 0, desde: h(5) }, { dura: 0 }], 0, h(100)), [h(25), h(75)])
})

// ---------- arreglos: «deay» y dónde ----------

test('aDeay: «diay» sin importar mayúsculas ni tildes, con el mismo estilo de mayúsculas, y sin tocar otras palabras', () => {
  assert.equal(aDeay('diay'), 'deay')
  assert.equal(aDeay('Diay, mae'), 'Deay, mae')
  assert.equal(aDeay('¡DIAY!'), '¡DEAY!')
  assert.equal(aDeay('Díay'), 'Deay')
  assert.equal(aDeay('diáy, ya'), 'deay, ya')
  assert.equal(aDeay('DÍAY MAE'), 'DEAY MAE')
  assert.equal(aDeay('dIaY'), 'deay')
  assert.equal(aDeay('di\u0301ay'), 'deay') // la tilde suelta (NFD)
  assert.equal(aDeay('Diay y diay'), 'Deay y deay')
  for (const t of ['mediaya', 'el prediay', 'diays', 'diay2', '2diay', 'Díaz', 'día', 'deay']) assert.equal(aDeay(t), t, t)
})

test('normalizarDonde: sin importar mayúsculas ni tildes, y «sala» es la plática', () => {
  const casos: [unknown, string | null][] = [
    ['cafe', 'cafe'], ['café', 'cafe'], ['Cafe', 'cafe'], ['CAFÉ', 'cafe'], [' café ', 'cafe'],
    ['platica', 'platica'], ['plática', 'platica'], ['sala', 'platica'], ['Sala', 'platica'],
    ['visita', 'visita'], ['Visita', 'visita'],
    ['siesta', null], ['la sala', null], ['', null], [null, null], [3, null],
  ]
  for (const [x, esperado] of casos) assert.equal(normalizarDonde(x), esperado, String(x))
})

test('charlas: «café», «Cafe», «sala» o «plática» no botan la charla', () => {
  for (const [donde, queda] of [['café', 'cafe'], ['Cafe', 'cafe'], ['sala', 'platica'], ['plática', 'platica'], ['Visita', 'visita']] as const) {
    const r = ok(ronda({ charlas: [charla(2, { donde, visita_a: donde === 'Visita' ? 'beto' : null })] }))
    assert.deepEqual(r.botadas, [], donde)
    assert.equal(r.charlas[0].donde, queda, donde)
  }
})

test('chat: el rincón de una suelta también: «café» es el café, «sala» la plática y una suelta nunca es de visita', () => {
  const r = ok(ronda({
    chat: [linea(1, { rincon: 'café' }), linea(2, { rincon: 'Sala' }), linea(3, { rincon: 'Plática' }), linea(4, { rincon: 'visita' }), linea(5, { rincon: 'siesta' })],
  }))
  assert.deepEqual(r.chat.map(l => [l.texto, l.rincon]), [['Linea 1', 'cafe'], ['Linea 2', 'platica'], ['Linea 3', 'platica'], ['Linea 4', null], ['Linea 5', null]])
})
