import { test } from 'node:test'
import assert from 'node:assert/strict'
import { armarContexto, ctxValidar, pedidoTertulia, leerRespuesta, type DatosRonda } from './tertulia.ts'
import type { Agente, Marca } from './tipos.ts'

const agente = (id: string, extra: Partial<Agente> = {}): Agente => ({
  id, nombre: id.toUpperCase(), oficio: `Oficio ${id}`, area: 'Area', puesto: 1,
  aspecto: { tela: '#fff', ropa: '#000', glifo: 'x' }, personalidad: `Personalidad ${id}`, frase: `Frase ${id}`,
  horario: null, cada_minutos: null, ruta: null, donde: 'servidor', estado_fijo: null,
  despierto_siempre: false, dura_min: 5, ultima_revision: null, lugar: null, ...extra,
})

const marca = (n: number, extra: Partial<Marca> = {}): Marca => ({
  id: `mk${n}`, agente: 'ana', tipo: 'entrega', para: null, texto: `Hice ${n}`, enlace: null,
  ref_tabla: null, ref_id: null, dura_seg: null, extra: null, visto_en: null,
  creado_en: new Date(Date.UTC(2026, 10, 16, 20, 0) - n * 60_000).toISOString(), ...extra,
})

const datos = (extra: Partial<DatosRonda> = {}): DatosRonda => ({
  agentes: [agente('ana'), agente('beto'), agente('cata', { estado_fijo: 'pendiente' })],
  marcas: [marca(1, { agente: 'ana', para: 'beto', texto: 'Te paso 2 reels' })],
  semana: [
    { agente: 'ana', dia: '2026-11-15', tareas: 10, falla: false },
    { agente: 'ana', dia: '2026-11-16', tareas: 8, falla: true },
    { agente: 'beto', dia: '2026-11-16', tareas: 0, falla: false },
  ],
  pruebas: [{ titulo: 'Logos v2', estado: 'ganó', actualizado_en: '2026-11-16T10:00:00Z' }],
  reels: [{ titulo: 'Mi reel', version: 2, vistas: 1200, guardados: 30, publicado_en: '2026-11-15T10:00:00Z' }],
  ideasNuevas: [{ texto: 'Un reel de café', de: 'beto' }],
  foroReciente: [{ id: 'post-1', de: 'ana', tipo: 'nota', titulo: 'Hola', comentarios: 2 }],
  conFoto: ['ana'],
  prohibidos: ['Cliente Secreto'],
  escenaEsperando: false,
  hoy: {
    chat: [
      { de: 'beto', para: 'ana', texto: '¿Y el reel de café?', rincon: 'visita', donde: 'ana', mostrar_desde: '2026-11-16T16:10:00Z' },
      { de: 'ana', para: null, texto: 'Ya salió la prueba', rincon: null, donde: null, mostrar_desde: '2026-11-16T15:00:00Z' },
      { de: 'ana', para: 'beto', texto: 'Mae, ¿un café?', rincon: 'cafe', donde: null, mostrar_desde: '2026-11-16T15:30:00Z' },
    ],
    posts: [{ de: 'ana', tipo: 'nota', titulo: 'Lo de hoy', texto: 'Probé  algo\nnuevo', mostrar_desde: '2026-11-16T14:40:00Z' }],
    comentarios: [{ de: 'beto', post_titulo: 'Lo de hoy', texto: 'Buenísimo', mostrar_desde: '2026-11-16T16:00:00Z' }],
  },
  ...extra,
})

const AHORA = new Date('2026-11-16T20:30:00Z') // 2:30 p. m.: la ronda del mediodía

test('armarContexto deja fuera al pendiente, marca con_foto y numera los hechos', () => {
  const c = armarContexto(datos(), AHORA)
  assert.deepEqual(c.agentes.map(a => a.id), ['ana', 'beto'])
  assert.equal(c.agentes[0].con_foto, true)
  assert.equal(c.agentes[1].con_foto, false)
  assert.equal(c.fecha, '2026-11-16')
  assert.equal(c.hora, '2:30 p. m.')
  const porClave = Object.fromEntries(c.hechos.map(h => [h.clave, h.texto]))
  assert.equal(porClave.m1, '1:59 p. m. · ANA → BETO: Te paso 2 reels')
  assert.equal(porClave.n1, 'ANA: 18 tareas en 7 días, 1 día con falla')
  assert.ok(!Object.values(porClave).some(t => t.startsWith('BETO:')))
  assert.ok(porClave.p1.includes('Logos v2'))
  assert.equal(porClave.r1, 'Reel «Mi reel», versión 2: 1200 vistas y 30 guardados')
  assert.deepEqual(c.ideas_pendientes, [{ texto: 'Un reel de café', de: 'beto' }])
  assert.equal(c.foro_reciente.length, 1)
})

test('armarContexto deja fuera las marcas de «empieza» y las de más de 24 h, y topa en 120', () => {
  const muchas = Array.from({ length: 200 }, (_, i) => marca(i + 1))
  const c = armarContexto(datos({ marcas: [...muchas, marca(300, { tipo: 'empieza' }), marca(2000)] }), AHORA)
  assert.equal(c.hechos.filter(h => h.clave.startsWith('m')).length, 120)
  assert.ok(c.hechos.find(h => h.clave === 'm1')!.texto.includes('Hice 1'))
  assert.ok(c.hechos.find(h => h.clave === 'm120')!.texto.endsWith('Hice 120'))
})

test('ctxValidar arma hechos y postsViejos, y deja prohibidos igual', () => {
  const d = datos()
  const c = armarContexto(d, AHORA)
  const v = ctxValidar(d, c, AHORA)
  assert.deepEqual([...v.hechos].sort(), c.hechos.map(h => h.clave).sort())
  assert.deepEqual([...v.postsViejos], ['post-1'])
  assert.deepEqual([...v.hablan], ['ana', 'beto'])
  assert.deepEqual([...v.conFoto], ['ana'])
  assert.deepEqual(v.prohibidos, ['Cliente Secreto'])
  assert.equal(v.ahora, AHORA)
  assert.equal(v.turno, 'mediodia')
})

test('el contexto dice el turno y hasta qué hora salen sus cosas (sin turno, el de la hora)', () => {
  const c = armarContexto(datos(), AHORA)
  assert.deepEqual([c.turno, c.hasta], ['mediodia', '4:00 p. m.'])
  const m = armarContexto(datos(), new Date('2026-11-16T14:30:00Z'), 'manana')
  assert.deepEqual([m.turno, m.hora, m.hasta], ['manana', '8:30 a. m.', '12:30 p. m.'])
  assert.equal(ctxValidar(datos(), m, new Date('2026-11-16T14:30:00Z')).turno, 'manana')
  assert.deepEqual([armarContexto(datos(), new Date('2026-11-16T22:00:00Z')).turno, armarContexto(datos(), new Date('2026-11-16T22:00:00Z')).hasta], ['tarde', '6:30 p. m.'])
})

test('el contexto lleva lo que ya se habló hoy, por hora, con dónde fue y sin nombres de clientes', () => {
  const d = datos()
  d.hoy.chat.push({ de: 'beto', para: null, texto: 'Hablé con Cliente Secreto', rincon: null, donde: null, mostrar_desde: '2026-11-16T16:20:00Z' })
  const c = armarContexto(d, AHORA)
  assert.deepEqual(c.ya_se_hablo.chat, [
    { hora: '9:00 a. m.', de: 'ana', para: null, donde: null, texto: 'Ya salió la prueba' },
    { hora: '9:30 a. m.', de: 'ana', para: 'beto', donde: 'el café', texto: 'Mae, ¿un café?' },
    { hora: '10:10 a. m.', de: 'beto', para: 'ana', donde: 'la oficina de ana', texto: '¿Y el reel de café?' },
    { hora: '10:20 a. m.', de: 'beto', para: null, donde: null, texto: 'Hablé con un cliente' },
  ])
  assert.deepEqual(c.ya_se_hablo.publicaciones, [{ hora: '8:40 a. m.', de: 'ana', tipo: 'nota', titulo: 'Lo de hoy', texto: 'Probé algo nuevo' }])
  assert.deepEqual(c.ya_se_hablo.comentarios, [{ hora: '10:00 a. m.', de: 'beto', en: 'Lo de hoy', texto: 'Buenísimo' }])
  // un texto largo de una publicación va corto
  const largo = armarContexto(datos({ hoy: { chat: [], comentarios: [], posts: [{ de: 'ana', tipo: 'nota', titulo: 'T', texto: 'palabra '.repeat(80), mostrar_desde: '2026-11-16T14:40:00Z' }] } }), AHORA)
  assert.ok(largo.ya_se_hablo.publicaciones[0].texto.length <= 200)
})

test('armarContexto tapa los nombres de clientes en todo el texto libre', () => {
  const d = datos({
    marcas: [marca(1, { texto: 'Cerré con cliente secreto hoy' })],
    ideasNuevas: [{ texto: 'Reel para CLIENTE SECRETO', de: 'beto' }],
    reels: [{ titulo: 'Cliente  Sécreto v2', version: null, vistas: null, guardados: null, publicado_en: '2026-11-15T10:00:00Z' }],
    foroReciente: [{ id: 'post-1', de: 'ana', tipo: 'nota', titulo: 'Sobre Cliente Secreto', comentarios: 0 }],
    prohibidos: [null as unknown as string, '', 'Cliente Secreto'],
  })
  const c = armarContexto(d, AHORA)
  const json = JSON.stringify(c).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
  assert.ok(!json.includes('cliente secreto') && !/cliente\s+secreto/.test(json))
  assert.ok(c.hechos.find(h => h.clave === 'm1')!.texto.endsWith('Cerré con un cliente hoy'))
  assert.equal(c.ideas_pendientes[0].texto, 'Reel para un cliente')
  assert.equal(c.foro_reciente[0].titulo, 'Sobre un cliente')
})

test('pedidoTertulia trae el contexto y las reglas', () => {
  const c = armarContexto(datos(), AHORA)
  const p = pedidoTertulia(c)
  for (const t of ['pana', 'tantito', 'chévere', 'mae', 'deay', 'compa', 'basada_en', 'rincon', 'usted', 'tenés', 'sin texto antes ni después', '120']) {
    assert.ok(p.includes(t), `falta ${t}`)
  }
  assert.ok(p.includes('«deay» (así, nunca «diay»)'))
  assert.ok(p.includes(JSON.stringify(c)))
})

test('pedidoTertulia: los topes son los de la ronda', () => {
  const p = pedidoTertulia(armarContexto(datos(), AHORA))
  assert.ok(p.includes('Topes de esta ronda: hasta 30 líneas en total (las sueltas más las de las charlas), 6 charlas, 1 publicación, 4 comentarios y 1 idea.'), p)
})

test('pedidoTertulia explica las charlas: 2 Knox que se turnan, café, sala o visita, y quién habla primero', () => {
  const p = pedidoTertulia(armarContexto(datos(), AHORA))
  for (const t of [
    'exactamente 2 Knox que se turnan', 'de 2 a 5 líneas', '«cafe»', '«platica»', '«visita»', '«visita_a»', 'el que llega habla primero',
    'trabajo de verdad', 'un gancho, un número, una prueba, una idea o una publicación', 'pueden hablar más suelto',
    'Mezcla café, sala y visitas: unas 3 a 6 charlas por ronda', 'primera persona', 'bota la charla entera', '"charlas":[',
  ]) assert.ok(p.includes(t), `falta ${t}`)
})

test('pedidoTertulia: dice qué tertulia es y pide seguir lo que ya se habló sin repetir', () => {
  const p = pedidoTertulia(armarContexto(datos(), AHORA))
  assert.ok(p.includes('Hay tres tertulias al día'))
  assert.ok(p.includes('ahora escribes la del mediodía (2026-11-16, 2:30 p. m. en Costa Rica): lo que pasa de ahora a las 4:00 p. m.'))
  assert.ok(p.includes('«ya_se_hablo»') && p.includes('nunca repitas lo que ya se dijo'))
  assert.ok(p.includes('"ya_se_hablo":{'))
})

test('pedidoTertulia: la escena solo se ofrece en la ronda del mediodía, y no cuenta como su publicación', () => {
  const mediodia = pedidoTertulia(armarContexto(datos(), AHORA))
  assert.ok(mediodia.includes('La escena no cuenta como la publicación de la ronda: puede ir junto con ella.'))
  assert.ok(!mediodia.includes('no escribas otra publicación'))
  assert.ok(mediodia.includes('"escena":{"de":"id_agente"'))
  for (const ahora of [new Date('2026-11-16T14:30:00Z'), new Date('2026-11-16T22:00:00Z')]) {
    const p = pedidoTertulia(armarContexto(datos(), ahora))
    assert.ok(p.includes('En esta ronda no va escena'), ahora.toISOString())
    assert.ok(p.includes('"escena":null'), ahora.toISOString())
    assert.ok(!p.includes('almuerzo en una soda'), ahora.toISOString())
  }
})

test('la escena que ya espera su foto pasa al contexto y al validador', () => {
  for (const espera of [false, true]) {
    const d = datos({ escenaEsperando: espera })
    const c = armarContexto(d, AHORA)
    assert.equal(c.escena_esperando, espera)
    assert.equal(ctxValidar(d, c, AHORA).escenaEsperando, espera)
  }
})

test('pedidoTertulia: si ya hay una escena esperando su foto, pide "escena": null', () => {
  const p = pedidoTertulia(armarContexto(datos({ escenaEsperando: true }), AHORA))
  assert.match(p, /Si «escena_esperando» es true[^\n]*"escena": null/)
  assert.ok(p.includes('"escena_esperando":true'))
  assert.ok(pedidoTertulia(armarContexto(datos(), AHORA)).includes('"escena_esperando":false'))
})

test('pedidoTertulia: los ejemplos de escena son los del diseño (soda, playa, moto, oficina)', () => {
  const p = pedidoTertulia(armarContexto(datos(), AHORA))
  for (const t of ['almuerzo en una soda', 'la playa', 'en moto', 'la oficina']) assert.ok(p.includes(t), t)
  assert.ok(!p.includes('lugar de la oficina'))
})

test('leerRespuesta lee el resultado, con o sin cercas', () => {
  const sal = (r: string) => JSON.stringify({ type: 'result', is_error: false, result: r })
  assert.deepEqual(leerRespuesta(sal('{"chat":[]}')), { chat: [] })
  assert.deepEqual(leerRespuesta(sal('```json\n{"chat":[]}\n```')), { chat: [] })
  assert.deepEqual(leerRespuesta(sal('Claro:\n{"chat":[1]}\nlisto')), { chat: [1] })
})

test('leerRespuesta lanza si Claude falló o no hay JSON', () => {
  assert.throws(() => leerRespuesta(JSON.stringify({ is_error: true, result: 'x' })), /Claude no contestó bien/)
  assert.throws(() => leerRespuesta(JSON.stringify({ is_error: false })), /Claude no contestó bien/)
  assert.throws(() => leerRespuesta(JSON.stringify({ is_error: false, result: 'no sé' })), /La respuesta no es JSON/)
  assert.throws(() => leerRespuesta(JSON.stringify({ is_error: false, result: '{roto}' })), /La respuesta no es JSON/)
})
