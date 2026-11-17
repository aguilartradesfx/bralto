import { test } from 'node:test'
import assert from 'node:assert/strict'
import { estadoDe, numerosDe, paraTi, proximos, armarSnapshot, semanaDe, chatVisible, corteDormida, visitasDelDia, lineaParaLaPagina } from './estado.ts'
import type { Agente, Marca, TipoMarca, EstadoOficina, FilaSemana, LineaTertulia } from './tipos.ts'

const AHORA = new Date('2026-11-15T20:00:00Z')
const hace = (min: number) => new Date(AHORA.getTime() - min * 60000).toISOString()

const agente = (o: Partial<Agente> = {}): Agente => ({
  id: 'ana', nombre: 'Ana', oficio: 'revisa cosas', area: 'prueba', puesto: 1,
  aspecto: { tela: '#000', ropa: '#111', glifo: 'x' }, personalidad: '', frase: '',
  horario: null, cada_minutos: null, ruta: null, donde: 'servidor', estado_fijo: null,
  despierto_siempre: false, dura_min: 10, ultima_revision: null, lugar: null, ...o,
})
let n = 0
const marca = (tipo: TipoMarca, min: number, o: Partial<Marca> = {}): Marca => ({
  id: `m${++n}`, agente: 'ana', tipo, para: null, texto: 't', enlace: null, ref_tabla: null,
  ref_id: null, dura_seg: null, extra: null, visto_en: null, creado_en: hace(min), ...o,
})
const despierta: EstadoOficina = { dormida: false, desde: null, por: null }
const dormida: EstadoOficina = { dormida: true, desde: hace(5), por: 'x' }

test('empieza de hace 25 min con dura_min 10 → a-medias', () =>
  assert.equal(estadoDe(agente(), [marca('empieza', 25)], AHORA, despierta, []), 'a-medias'))
test('empieza de hace 15 min con dura_min 10 → trabajando', () =>
  assert.equal(estadoDe(agente(), [marca('empieza', 15)], AHORA, despierta, []), 'trabajando'))
test('empieza y luego pasa sigue trabajando', () =>
  assert.equal(estadoDe(agente(), [marca('pasa', 1), marca('empieza', 3)], AHORA, despierta, []), 'trabajando'))
test('durmiendo gana a todo', () => {
  const ms = [marca('empieza', 1)]
  assert.equal(estadoDe(agente({ estado_fijo: 'pendiente' }), ms, AHORA, dormida, []), 'durmiendo')
  assert.equal(estadoDe(agente(), ms, AHORA, dormida, []), 'durmiendo')
})
test('despierto_siempre sigue con su estado', () =>
  assert.equal(estadoDe(agente({ despierto_siempre: true }), [marca('empieza', 1)], AHORA, dormida, []), 'trabajando'))
test('estado_fijo pendiente', () =>
  assert.equal(estadoDe(agente({ estado_fijo: 'pendiente' }), [], AHORA, despierta, []), 'pendiente'))
test('publica reciente → publicando; vieja no', () => {
  assert.equal(estadoDe(agente(), [marca('publica', 3)], AHORA, despierta, []), 'publicando')
  assert.equal(estadoDe(agente(), [marca('publica', 30)], AHORA, despierta, []), 'descansando')
})
test('falla después de termina → fallo', () =>
  assert.equal(estadoDe(agente(), [marca('falla', 1), marca('termina', 5)], AHORA, despierta, []), 'fallo'))
test('termina después de falla → descansando', () =>
  assert.equal(estadoDe(agente(), [marca('termina', 1), marca('falla', 5)], AHORA, despierta, []), 'descansando'))
test('entrega pendiente → listo', () => {
  const e = marca('entrega', 60)
  assert.equal(estadoDe(agente(), [e], AHORA, despierta, [e]), 'listo')
})
test('estado_fijo pedido', () =>
  assert.equal(estadoDe(agente({ estado_fijo: 'pedido' }), [], AHORA, despierta, []), 'pedido'))
test('sin marcas → descansando; ignora marcas de otro agente', () => {
  assert.equal(estadoDe(agente(), [], AHORA, despierta, []), 'descansando')
  assert.equal(estadoDe(agente(), [marca('empieza', 1, { agente: 'otro' })], AHORA, despierta, []), 'descansando')
})

test('paraTi: filtra vistas, resueltas y viejas sin referencia', () => {
  const ok23 = marca('entrega', 23 * 60)
  const vieja = marca('entrega', 25 * 60)
  const vista = marca('entrega', 10, { visto_en: hace(1) })
  const resuelta = marca('entrega', 10, { ref_tabla: 'posts', ref_id: '1' })
  const conRef = marca('entrega', 3 * 24 * 60, { ref_tabla: 'posts', ref_id: '2' })
  const otra = marca('termina', 10)
  const r = paraTi([ok23, vieja, vista, resuelta, conRef, otra], new Set(['posts:1']), AHORA)
  assert.deepEqual(r.map((m) => m.id), [ok23.id, conRef.id])
})
test('paraTi: la más nueva primero', () => {
  const a = marca('entrega', 50), b = marca('entrega', 5)
  assert.deepEqual(paraTi([a, b], new Set(), AHORA).map((m) => m.id), [b.id, a.id])
})

test('numerosDe', () => {
  assert.deepEqual(numerosDe(undefined, AHORA), { tareas: 0, horas: 0, diasSinFallar: 0 })
  assert.equal(numerosDe({ agente: 'a', tareas: 3, segundos: 5400, ultima_falla: null, primera: null }, AHORA).horas, 1.5)
  const f = { agente: 'a', tareas: '4' as unknown as number, segundos: '360' as unknown as number, ultima_falla: hace(3 * 24 * 60 + 5), primera: hace(10 * 24 * 60) }
  assert.deepEqual(numerosDe(f, AHORA), { tareas: 4, horas: 0.1, diasSinFallar: 3 })
  assert.equal(numerosDe({ agente: 'a', tareas: 1, segundos: 0, ultima_falla: null, primera: hace(2 * 24 * 60) }, AHORA).diasSinFallar, 2)
  assert.equal(numerosDe({ agente: 'a', tareas: 1, segundos: 0, ultima_falla: '2030-01-01T00:00:00Z', primera: null }, AHORA).diasSinFallar, 0)
})

test('proximos: deja fuera cada_minutos 5, incluye la noche', () => {
  const ags = [
    agente({ id: 'rapido', horario: '*/5 * * * *', cada_minutos: 5 }),
    agente({ id: 'noche', oficio: 'produce de noche', horario: '0 1 * * *' }),
    agente({ id: 'fijo', horario: '0 2 * * *', estado_fijo: 'pedido' }),
    agente({ id: 'sin' }),
  ]
  const r = proximos(ags, [], AHORA)
  assert.deepEqual(r, [{ cuando: '7:00 p. m.', agente: 'noche', texto: 'produce de noche' }])
})
test('proximos: deja fuera cada_minutos 60 (cada hora es frecuente)', () => {
  const r = proximos([agente({ id: 'vero', horario: '0 * * * *', cada_minutos: 60 })], [], AHORA)
  assert.deepEqual(r, [])
})
test('proximos: publicaciones, pruebas, orden y límite', () => {
  const ags = [agente({ id: 'noche', oficio: 'o', horario: '0 1 * * *' })]
  const pubs = [
    { id: '1', titulo: 'Tarde', publicar_en: '2026-11-15T23:00:00Z', prueba: false },
    { id: '2', titulo: 'Prueba', publicar_en: '2026-11-15T22:00:00Z', prueba: true },
    { id: '3', titulo: 'Pasada', publicar_en: '2026-11-15T19:00:00Z', prueba: false },
  ]
  const r = proximos(ags, pubs, AHORA)
  assert.deepEqual(r.map((p) => [p.agente, p.texto]), [
    ['vero', 'prueba de «Prueba»'], ['zap', '«Tarde»'], ['noche', 'o'],
  ])
  assert.ok(!r.some((p) => p.texto.includes('Pasada')))
  assert.equal(proximos(ags, pubs, AHORA, 1).length, 1)
})
test('proximos: la hora se puede escribir de otra forma (en grande, con el día)', () => {
  const ags = [agente({ id: 'noche', oficio: 'o', horario: '0 1 * * *' }), agente({ id: 'temprano', oficio: 'p', horario: '0 12 * * *' })]
  const pubs = [{ id: '1', titulo: 'Tarde', publicar_en: '2026-11-15T23:00:00Z', prueba: false }]
  const r = proximos(ags, pubs, AHORA, 5, (d) => d.toISOString())
  assert.deepEqual(r.map((p) => [p.cuando, p.agente]), [
    ['2026-11-15T23:00:00.000Z', 'zap'], ['2026-11-16T01:00:00.000Z', 'noche'], ['2026-11-16T12:00:00.000Z', 'temprano'],
  ])
  // sin la forma, la hora de siempre
  assert.deepEqual(proximos(ags, pubs, AHORA).map((p) => p.cuando), ['5:00 p. m.', '7:00 p. m.', '6:00 a. m.'])
})

const base = { numeros: [], oficina: despierta, pubs: [], resueltas: new Set<string>(), tertulia: [], semana: [] }
test('armarSnapshot con catálogo vacío no rompe', () => {
  const s = armarSnapshot({ ...base, agentes: [], marcas: [marca('empieza', 1)], entregas: [] }, AHORA)
  assert.deepEqual(s.agentes, [])
  assert.equal(s.ahora, AHORA.toISOString())
})
test('armarSnapshot ignora huérfanas', () => {
  const huerfana = marca('empieza', 1, { agente: 'fantasma' })
  const eh = marca('entrega', 1, { agente: 'fantasma' })
  const mia = marca('entrega', 2)
  const s = armarSnapshot({ ...base, agentes: [agente()], marcas: [huerfana, mia], entregas: [eh, mia] }, AHORA)
  assert.deepEqual(s.marcas.map((m) => m.id), [mia.id])
  assert.deepEqual(s.paraTi.map((m) => m.id), [mia.id])
  assert.equal(s.agentes[0].estado, 'listo')
  assert.deepEqual(s.agentes[0].numeros, { tareas: 0, horas: 0, diasSinFallar: 0 })
})

// ---------- la semana de cada uno ----------
// Miércoles 18/11/2026, 2:00 p. m. en Costa Rica
const MIERCOLES = new Date('2026-11-18T20:00:00Z')
const fila = (agente: string, dia: string, tareas: number, falla = false): FilaSemana => ({ agente, dia, tareas, falla })

test('semanaDe: 7 días que terminan en «Hoy», con ceros donde no hay filas y el día con falla marcado', () => {
  const filas = [fila('ana', '2026-11-15', 3), fila('ana', '2026-11-17', 1, true), fila('ana', '2026-11-10', 5), fila('otro', '2026-11-18', 9, true)]
  assert.deepEqual(semanaDe(filas, 'ana', MIERCOLES), [
    { dia: '2026-11-12', etiqueta: 'J', tareas: 0, falla: false },
    { dia: '2026-11-13', etiqueta: 'V', tareas: 0, falla: false },
    { dia: '2026-11-14', etiqueta: 'S', tareas: 0, falla: false },
    { dia: '2026-11-15', etiqueta: 'D', tareas: 3, falla: false },
    { dia: '2026-11-16', etiqueta: 'L', tareas: 0, falla: false },
    { dia: '2026-11-17', etiqueta: 'M', tareas: 1, falla: true },
    { dia: '2026-11-18', etiqueta: 'Hoy', tareas: 0, falla: false },
  ])
})

test('semanaDe: «Hoy» es el día de Costa Rica (a las 11:30 p. m. todavía es hoy)', () => {
  const s = semanaDe([fila('ana', '2026-11-18', 2)], 'ana', new Date('2026-11-19T05:30:00Z'))
  assert.equal(s.length, 7)
  assert.equal(s[0].dia, '2026-11-12')
  assert.deepEqual(s[6], { dia: '2026-11-18', etiqueta: 'Hoy', tareas: 2, falla: false })
})

// ---------- el chat de la tertulia ----------
// Lunes 16/11/2026, 2:00 p. m. en Costa Rica
const DOS_PM = new Date('2026-11-16T20:00:00Z')
const linea = (id: string, de: string, mostrar_desde: string, o: Partial<LineaTertulia> = {}): LineaTertulia => ({
  id, de, para: null, texto: `línea ${id}`, rincon: null, donde: null, hilo: null, idea_id: null, mostrar_desde, ...o,
})
const nueveAm = linea('9am', 'ana', '2026-11-16T15:00:00Z')
const unaYMedia = linea('1:30pm', 'beto', '2026-11-16T19:30:00Z')
const tresPm = linea('3pm', 'ana', '2026-11-16T21:00:00Z')
const deAyer = linea('ayer', 'beto', '2026-11-15T23:00:00Z')
const enDosMin = linea('2:02pm', 'carla', '2026-11-16T20:02:00Z')
const enCincoMin = linea('2:05pm', 'dani', '2026-11-16T20:05:00Z')

test('chatVisible: a las 2:00 p. m. no sale la línea de las 3:00 p. m. ni la de ayer', () => {
  const r = chatVisible([tresPm, unaYMedia, deAyer, nueveAm], DOS_PM, despierta)
  assert.deepEqual(r.chat.map((l) => l.id), ['9am', '1:30pm'])
})

test('chatVisible: dormida desde la 1:00 p. m., esconde la de la 1:30 y nadie está escribiendo', () => {
  const dormidaALaUna: EstadoOficina = { dormida: true, desde: '2026-11-16T19:00:00Z', por: 'x' }
  const r = chatVisible([nueveAm, unaYMedia, enDosMin], DOS_PM, dormidaALaUna)
  assert.deepEqual(r.chat.map((l) => l.id), ['9am'])
  assert.equal(r.escribiendo, null)
})

test('corteDormida: despierta, ninguno; dormida, la hora en que se durmió; sin esa hora, todo queda fuera', () => {
  assert.equal(corteDormida(despierta), Infinity)
  assert.equal(corteDormida({ dormida: false, desde: '2026-11-16T19:00:00Z', por: null }), Infinity)
  assert.equal(corteDormida({ dormida: true, desde: '2026-11-16T19:00:00Z', por: 'x' }), Date.parse('2026-11-16T19:00:00Z'))
  assert.equal(corteDormida({ dormida: true, desde: null, por: null }), -Infinity)
  assert.equal(corteDormida({ dormida: true, desde: 'no es una hora', por: null }), -Infinity)
})

test('chatVisible: despierta, escribe quien dice la próxima línea si sale en 3 min o menos', () => {
  assert.equal(chatVisible([nueveAm, enCincoMin, enDosMin], DOS_PM, despierta).escribiendo, 'carla')
  assert.equal(chatVisible([nueveAm, enCincoMin], DOS_PM, despierta).escribiendo, null)
})

test('armarSnapshot suma el chat de hoy, la semana de cada uno y las 10 próximas publicaciones', () => {
  const pubs = Array.from({ length: 12 }, (_, i) => ({
    id: `p${i}`, titulo: `Pub ${i}`, publicar_en: new Date(AHORA.getTime() + (12 - i) * 3_600_000).toISOString(), prueba: i % 2 === 0,
  }))
  const pasada = { id: 'pasada', titulo: 'Ya salió', publicar_en: hace(30), prueba: false }
  const s = armarSnapshot({
    ...base, agentes: [agente()], marcas: [], entregas: [], pubs: [pasada, ...pubs],
    tertulia: [linea('de-ana', 'ana', hace(10)), linea('de-fantasma', 'fantasma', hace(5))],
    semana: [fila('ana', '2026-11-15', 4, true)],
  }, AHORA)
  assert.deepEqual(s.pubs.map((p) => p.id), ['p11', 'p10', 'p9', 'p8', 'p7', 'p6', 'p5', 'p4', 'p3', 'p2'])
  assert.deepEqual(s.chat.map((l) => l.id), ['de-ana'])
  assert.equal(s.escribiendo, null)
  assert.equal(s.agentes[0].semana.length, 7)
  assert.deepEqual(s.agentes[0].semana[6], { dia: '2026-11-15', etiqueta: 'Hoy', tareas: 4, falla: true })
})

// ---------- las visitas que van a la página ----------
const deVisita = (id: string, de: string, para: string, mostrar_desde: string) =>
  linea(id, de, mostrar_desde, { para, rincon: 'visita', donde: para === 'lynx' || de === 'lynx' ? 'lynx' : para, hilo: 'h1' })

test('visitasDelDia: las líneas de visita de hoy, también las que salen más tarde, sin su texto y por hora', () => {
  const lineas = [
    deVisita('v2', 'lynx', 'ana', '2026-11-16T20:04:00Z'), // 2:04 p. m.: todavía no sale
    deVisita('v1', 'ana', 'lynx', '2026-11-16T20:02:00Z'),
    linea('cafe', 'ana', '2026-11-16T19:00:00Z', { para: 'beto', rincon: 'cafe', hilo: 'h2' }),
    linea('suelta', 'ana', '2026-11-16T19:30:00Z'),
    deVisita('ayer', 'ana', 'lynx', '2026-11-15T20:02:00Z'),
  ]
  const v = visitasDelDia(lineas, DOS_PM, despierta)
  assert.deepEqual(v.map((l) => l.id), ['v1', 'v2'])
  assert.deepEqual(v[0], { id: 'v1', de: 'ana', para: 'lynx', rincon: 'visita', donde: 'lynx', hilo: 'h1', mostrar_desde: '2026-11-16T20:02:00Z' })
  assert.ok(!('texto' in v[0]))
  // dormida desde las 2:03 p. m.: la de las 2:04 ya no
  assert.deepEqual(visitasDelDia(lineas, DOS_PM, { dormida: true, desde: '2026-11-16T20:03:00Z', por: 'x' }).map((l) => l.id), ['v1'])
})

test('armarSnapshot manda las visitas de hoy (de los Knox del catálogo) aunque su chat todavía no salga', () => {
  const s = armarSnapshot({
    ...base, agentes: [agente(), agente({ id: 'lynx', nombre: 'Lynx' })], marcas: [], entregas: [],
    tertulia: [deVisita('v1', 'ana', 'lynx', hace(-1)), deVisita('v2', 'lynx', 'ana', hace(-3)), deVisita('f', 'fantasma', 'lynx', hace(-1))],
  }, AHORA)
  assert.deepEqual(s.chat, [])
  assert.deepEqual(s.visitas.map((l) => l.id), ['v1', 'v2'])
})

test('el chat de la foto nunca lleva rincon «visita» (una página vieja se caía con él): va null, con su «donde» y su hilo', () => {
  const s = armarSnapshot({
    ...base, agentes: [agente(), agente({ id: 'lynx', nombre: 'Lynx' })], marcas: [], entregas: [],
    tertulia: [
      deVisita('v1', 'ana', 'lynx', hace(3)),
      deVisita('v2', 'lynx', 'ana', hace(2)),
      linea('c1', 'ana', hace(1), { para: 'lynx', rincon: 'cafe', hilo: 'h9' }),
      linea('s1', 'lynx', hace(1)),
    ],
  }, AHORA)
  assert.equal(s.chat.length, 4)
  // lo que cualquier página, también la de antes, sabe leer
  for (const l of s.chat) assert.ok(l.rincon === null || l.rincon === 'cafe' || l.rincon === 'platica', JSON.stringify(l))
  const v1 = s.chat.find((l) => l.id === 'v1')!
  assert.deepEqual([v1.rincon, v1.donde, v1.hilo], [null, 'lynx', 'h1'])
  assert.equal(s.chat.find((l) => l.id === 'c1')!.rincon, 'cafe')
  // quién está de visita sale de `visitas`, con el rincón de verdad
  assert.deepEqual(s.visitas.map((l) => [l.id, l.rincon, l.donde]), [['v1', 'visita', 'lynx'], ['v2', 'visita', 'lynx']])
  assert.deepEqual(lineaParaLaPagina(linea('x', 'ana', hace(1), { rincon: 'platica' })).rincon, 'platica')
})
