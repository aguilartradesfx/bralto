import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validarRonda, problemaDeTexto, cortar, repartir, finDeRonda, type CtxValidar } from './validar.ts'
import { horaCR } from './horario.ts'

const ctx = (extra: Partial<CtxValidar> = {}): CtxValidar => ({
  hablan: new Set(['ana', 'beto', 'cata', 'dani']),
  conFoto: new Set(['ana', 'beto', 'cata', 'dani', 'eli']),
  hechos: new Set(['h1', 'h2']),
  postsViejos: new Set(['viejo1']),
  prohibidos: [],
  escenaEsperando: false,
  ahora: new Date('2026-11-16T18:30:00Z'), // 12:30 p. m. CR
  ...extra,
})

const post = (n: number, extra: Record<string, unknown> = {}) => ({
  clave: `p${n}`, de: 'ana', tipo: 'nota', titulo: `Titulo ${n}`, texto: `Texto ${n}`, likes: 1, basada_en: ['h1'], idea: null, ...extra,
})
const com = (n: number, extra: Record<string, unknown> = {}) => ({
  clave: `c${n}`, post: 'p1', de: 'beto', texto: `Comentario ${n}`, responde_a: null, idea: null, ...extra,
})
const linea = (n: number, extra: Record<string, unknown> = {}) => ({
  de: 'ana', para: null, texto: `Linea ${n}`, rincon: null, idea: null, ...extra,
})
const ronda = (extra: Record<string, unknown> = {}) => ({ chat: [], posts: [], comentarios: [], escena: null, ...extra })
const ok = (crudo: unknown, c = ctx()) => {
  const r = validarRonda(crudo, c)
  assert.ok(!('error' in r), 'no debía dar error')
  return r as Exclude<ReturnType<typeof validarRonda>, { error: string }>
}
const idea = (extra: Record<string, unknown> = {}) => ({ texto: 'Una idea', por_que: 'Porque sí', basada_en: ['h1'], ...extra })
const escena = (extra: Record<string, unknown> = {}) => ({
  de: 'ana', agentes: ['ana', 'beto'], titulo: 'Cafecito', donde: 'la sala', que: 'toman café', texto: 'Café juntos', likes: 1, ...extra,
})

test('fin de ronda: 6:30 p. m. de Costa Rica', () =>
  assert.equal(finDeRonda(new Date('2026-11-16T18:30:00Z')).toISOString(), '2026-11-17T00:30:00.000Z'))

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
  // Botada, no le quita el lugar a la tercera publicación
  const tres = ok(ronda({ posts: [post(1), post(2), post(3)], escena: escena() }), esperando)
  assert.equal(tres.posts.length, 3)
  assert.deepEqual(tres.botadas, ['escena: ya hay una esperando su foto'])
  // Sin escena, nada que botar
  assert.deepEqual(ok(ronda({ escena: null }), esperando).botadas, [])
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
  const r = ok(ronda({
    posts: [post(1, { tipo: 'idea', idea: idea({ basada_en: ['nada'] }) }), post(2, { tipo: 'idea', idea: idea() })],
  }))
  assert.equal(r.posts[0].tipo, 'nota')
  assert.equal(r.posts[1].tipo, 'idea')
  assert.deepEqual(r.ideas.map(i => i.origen), ['p2'])
  assert.equal(r.ideas[0].de, 'ana')
})

test('idea: necesita texto y por_que', () => {
  const r = ok(ronda({ comentarios: [com(1, { post: 'viejo1', idea: idea({ por_que: '  ' }) })], posts: [] }))
  assert.equal(r.ideas.length, 0)
  assert.equal(r.comentarios.length, 1)
})

test('likes: entero entre 0 y quienes hablan menos 1', () => {
  const r = ok(ronda({ posts: [post(1, { likes: 99 }), post(2, { likes: -4 }), post(3, { likes: 1.7 })] }))
  assert.deepEqual(r.posts.map(p => p.likes), [3, 0, 1])
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

test('topes: 30 líneas, 3 ideas, 12 comentarios', () => {
  const chat = Array.from({ length: 40 }, (_, i) => linea(i + 1))
  assert.equal(ok(ronda({ chat })).chat.length, 30)

  const comentarios = Array.from({ length: 14 }, (_, i) => com(i + 1, { post: 'viejo1' }))
  assert.equal(ok(ronda({ comentarios })).comentarios.length, 12)

  const conIdea = Array.from({ length: 5 }, (_, i) => com(i + 1, { post: 'viejo1', idea: idea() }))
  const r = ok(ronda({ comentarios: conIdea, chat: [linea(1, { idea: 'c5' })] }))
  assert.equal(r.ideas.length, 3)
  assert.equal(r.comentarios.length, 5)
  assert.equal(r.chat[0].idea, null)
})

test('topes: 3 publicaciones contando la escena', () => {
  const cinco = ok(ronda({ posts: [1, 2, 3, 4, 5].map(n => post(n)), escena: escena(), comentarios: [com(1, { post: 'p5' })] }))
  assert.deepEqual(cinco.posts.map(p => p.clave), ['p1', 'p2', 'p3'])
  assert.equal(cinco.escena, null)
  assert.equal(cinco.comentarios.length, 0)
  const dos = ok(ronda({ posts: [post(1), post(2)], escena: escena() }))
  assert.equal(dos.posts.length, 2)
  assert.ok(dos.escena)
})

test('horas: 3 posts desde las 12:30 p. m.', () => {
  const r = ok(ronda({
    posts: [post(1), post(2), post(3)],
    comentarios: [com(1, { post: 'p3' }), com(2, { post: 'p3' }), com(3, { post: 'viejo1' })],
  }))
  assert.deepEqual(r.posts.map(p => horaCR(new Date(p.mostrar_desde))), ['12:30 p. m.', '2:30 p. m.', '4:30 p. m.'])
  const p3 = r.comentarios.filter(c => c.post === 'p3')
  assert.deepEqual(p3.map(c => horaCR(new Date(c.mostrar_desde))), ['5:00 p. m.', '6:00 p. m.'])
  assert.equal(horaCR(new Date(r.comentarios.find(c => c.post === 'viejo1')!.mostrar_desde)), '3:30 p. m.')
  const fin = finDeRonda(ctx().ahora).getTime()
  for (const x of [...r.posts, ...r.comentarios]) assert.ok(new Date(x.mostrar_desde).getTime() <= fin)
})

test('horas: una línea con idea no sale antes que su idea y el chat se reordena', () => {
  const r = ok(ronda({
    posts: [post(1), post(2), post(3, { tipo: 'idea', idea: idea() })],
    chat: [linea(1, { idea: 'p3' }), linea(2), linea(3)],
  }))
  const horaIdea = new Date(r.ideas[0].mostrar_desde).getTime()
  assert.equal(horaIdea, new Date(r.posts[2].mostrar_desde).getTime())
  const l1 = r.chat.find(l => l.texto === 'Linea 1')!
  assert.ok(new Date(l1.mostrar_desde).getTime() >= horaIdea)
  const horas = r.chat.map(l => new Date(l.mostrar_desde).getTime())
  assert.deepEqual(horas, [...horas].sort((a, b) => a - b))
  assert.deepEqual(r.chat.map(l => l.texto), ['Linea 2', 'Linea 1', 'Linea 3'])
})

test('horas: si ya pasó el fin, todo va al inicio', () => {
  const tarde = ctx({ ahora: new Date('2026-11-17T01:00:00Z') })
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
