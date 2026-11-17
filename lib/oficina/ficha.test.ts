import { test } from 'node:test'
import assert from 'node:assert/strict'
import type { AgenteSnap, Comentario, Foto, Marca, Post, Pub, TipoMarca } from './tipos.ts'
import type { LugarSala } from './sala.ts'
import { ahoraFicha, fotosDe, lugarDe, marcasDeHoy, notaProximo, proximosDeAgente, ultimoEnForo } from './ficha.ts'

// Lunes 16/11/2026, 10:00 a. m. en Costa Rica
const DIEZ = new Date('2026-11-16T16:00:00Z')

function ag(id: string, extra: Partial<AgenteSnap> = {}): AgenteSnap {
  return {
    id, nombre: id.charAt(0).toUpperCase() + id.slice(1), oficio: 'Oficio', area: 'Contenido', puesto: 0,
    aspecto: { tela: '#cccccc', ropa: '#333333', glifo: 'lineas' }, personalidad: '', frase: '', horario: null, cada_minutos: null,
    ruta: null, donde: 'sitio', estado_fijo: null, despierto_siempre: false, dura_min: 10, ultima_revision: null, lugar: null,
    estado: 'descansando', numeros: { tareas: 0, horas: 0, diasSinFallar: 0 }, semana: [], ...extra,
  }
}

function mk(agente: string, tipo: TipoMarca, creado_en: string, extra: Partial<Marca> = {}): Marca {
  return {
    id: `${agente}-${tipo}-${creado_en}`, agente, tipo, para: null, texto: `${tipo} de ${agente}`, enlace: null, ref_tabla: null,
    ref_id: null, dura_seg: null, extra: null, visto_en: null, creado_en, ...extra,
  }
}

const NOMBRES: Record<string, string> = { quark: 'Quark', krono: 'Krono' }
type DatosAhora = Parameters<typeof ahoraFicha>[1]
const base = (d: Partial<DatosAhora> = {}): DatosAhora => ({
  marcas: [], paraTi: [], ahora: DIEZ, dormida: false, lugar: null, nombreDe: (id) => NOMBRES[id] ?? id, ...d,
})
const sala = (x: Partial<LugarSala>): LugarSala => ({ rincon: 'cafe', sitio: 0, con: null, hasta: null, por: 'turno', ...x })

// ---------- Ahora ----------

test('ahora, con la oficina dormida: duerme en su escritorio; quien se queda despierto, de guardia (Echo atiende a la gente)', () => {
  const d = base({ dormida: true })
  assert.equal(ahoraFicha(ag('drax', { estado: 'durmiendo', horario: '0 1 * * *' }), d), 'Duerme en su escritorio')
  const empieza = mk('echo', 'empieza', '2026-11-16T15:55:00Z', { texto: 'Le manda la guía a una persona' })
  assert.equal(ahoraFicha(ag('echo', { despierto_siempre: true, estado: 'trabajando' }), { ...d, marcas: [empieza] }), 'Atiende a la gente')
  assert.equal(ahoraFicha(ag('kash', { despierto_siempre: true, horario: '*/10 * * * *', cada_minutos: 10 }), d), 'De guardia')
})

test('ahora, con algo en marcha: lo de lineaAhora, aunque esté en la sala', () => {
  const empieza = mk('beta', 'empieza', '2026-11-16T15:30:00Z', { texto: 'Escribe el reel de Gmail' })
  assert.equal(ahoraFicha(ag('beta', { estado: 'trabajando' }), base({ marcas: [empieza] })), 'Escribe el reel de Gmail · desde las 9:30 a. m.')
  const entrega = mk('delta', 'entrega', '2026-11-16T15:50:00Z', { texto: '2 guiones corregidos' })
  const enElCafe = sala({ con: 'quark', por: 'tertulia' })
  assert.equal(ahoraFicha(ag('delta', { estado: 'listo' }), base({ paraTi: [entrega], lugar: enElCafe })), 'Te dejó: 2 guiones corregidos')
})

test('ahora, en la sala: «Tomándose un café con Quark» o «En siesta hasta las 4:00 p. m.»', () => {
  const cafe = sala({ rincon: 'cafe', con: 'quark', por: 'tertulia' })
  assert.equal(ahoraFicha(ag('krono', { horario: '0 15 * * 0' }), base({ lugar: cafe })), 'Tomándose un café con Quark')
  const siesta = sala({ rincon: 'siesta', hasta: '2026-11-16T22:00:00.000Z', por: 'siesta' })
  assert.equal(ahoraFicha(ag('drax', { horario: '0 1 * * *' }), base({ lugar: siesta })), 'En siesta hasta las 4:00 p. m.')
})

test('ahora, de visita: «De visita en la oficina de Lynx» mientras dure (gana a lo que te dejó y a la sala; dormida, no)', () => {
  const nombres = (id: string) => ({ lynx: 'Lynx', quark: 'Quark' })[id] ?? id
  const visita = { anfitrion: 'lynx' }
  assert.equal(ahoraFicha(ag('krono', { horario: '0 15 * * 0' }), base({ visita, nombreDe: nombres })), 'De visita en la oficina de Lynx')
  assert.equal(ahoraFicha(ag('krono', { estado: 'pedido', estado_fijo: 'pedido' }), base({ visita, nombreDe: nombres })), 'De visita en la oficina de Lynx')
  assert.equal(ahoraFicha(ag('krono'), base({ visita, lugar: sala({ con: 'quark', por: 'tertulia' }), nombreDe: nombres })), 'De visita en la oficina de Lynx')
  // aunque te haya dejado algo (está «listo»), mientras dura la visita dice dónde anda
  const entrega = mk('krono', 'entrega', '2026-11-16T15:50:00Z', { texto: '2 guiones' })
  assert.equal(ahoraFicha(ag('krono', { estado: 'listo' }), base({ visita, paraTi: [entrega], nombreDe: nombres })), 'De visita en la oficina de Lynx')
  assert.equal(ahoraFicha(ag('krono', { estado: 'listo' }), base({ paraTi: [entrega], nombreDe: nombres })), 'Te dejó: 2 guiones')
  assert.equal(ahoraFicha(ag('krono'), base({ visita, dormida: true, nombreDe: nombres })), 'Duerme en su escritorio')
  // sin visita, lo de siempre
  assert.equal(ahoraFicha(ag('krono'), base({ visita: null })), 'Descansa hasta que le llegue trabajo')
})

test('ahora, sin nada en marcha: todavía no trabaja, se lo pides a Claude o cada cuánto revisa', () => {
  assert.equal(ahoraFicha(ag('atlas', { estado: 'pendiente', estado_fijo: 'pendiente' }), base()), 'Todavía no trabaja. Llega pronto.')
  assert.equal(ahoraFicha(ag('mira', { estado: 'pedido', estado_fijo: 'pedido' }), base()), 'Se lo pides a Claude en tu compu')
  const zap = ag('zap', { horario: '*/5 * * * *', cada_minutos: 5, ultima_revision: '2026-11-16T15:55:00Z' })
  assert.equal(ahoraFicha(zap, base()), 'Revisa cada 5 min · última vez: 9:55 a. m.')
})

test('ahora, descansando: hasta su próxima corrida (hoy, mañana o ese día) o hasta que le llegue trabajo', () => {
  assert.equal(ahoraFicha(ag('drax', { horario: '0 1 * * *' }), base()), 'Descansa hasta las 7:00 p. m.')
  assert.equal(ahoraFicha(ag('rho', { horario: '0 19 * * *' }), base()), 'Descansa hasta la 1:00 p. m.')
  assert.equal(ahoraFicha(ag('argo', { horario: '0 13 * * *' }), base()), 'Descansa hasta mañana a las 7:00 a. m.')
  assert.equal(ahoraFicha(ag('krono', { horario: '0 15 * * 3' }), base()), 'Descansa hasta el miércoles a las 9:00 a. m.')
  assert.equal(ahoraFicha(ag('dex'), base()), 'Descansa hasta que le llegue trabajo')
  assert.equal(ahoraFicha(ag('raro', { horario: 'no es un cron' }), base()), 'Descansa hasta que le llegue trabajo')
})

// ---------- Hoy ----------

test('hoy: sus marcas de hoy (día de Costa Rica), de la más vieja a la más nueva', () => {
  const marcas = [
    mk('beta', 'termina', '2026-11-16T15:00:00Z'), // 9:00 a. m.
    mk('beta', 'empieza', '2026-11-16T06:30:00Z'), // 12:30 a. m. de hoy
    mk('beta', 'termina', '2026-11-16T05:50:00Z'), // 11:50 p. m. de ayer
    mk('gama', 'termina', '2026-11-16T15:10:00Z'),
  ]
  assert.deepEqual(marcasDeHoy('beta', marcas, DIEZ).map((m) => m.creado_en), ['2026-11-16T06:30:00Z', '2026-11-16T15:00:00Z'])
})

// ---------- Lo próximo ----------

// vienen como las manda el servidor: las que todavía no salen, por hora (una ya salió, por si acaso)
const PUBS: Pub[] = [
  { id: 'pasada', titulo: 'Ya salió', publicar_en: '2026-11-16T15:00:00Z', prueba: false },
  { id: 'prueba-1', titulo: 'Excel con IA', publicar_en: '2026-11-16T18:00:00Z', prueba: true },
  { id: 'post-1', titulo: 'Post de 7 láminas', publicar_en: '2026-11-17T00:00:00Z', prueba: false },
  { id: 'post-2', titulo: 'Gmail programado', publicar_en: '2026-11-17T14:00:00Z', prueba: false },
]

test('lo próximo de Zap: sus publicaciones (no las pruebas), cada una a su página del Calendario, aunque revise cada 5 min', () => {
  const zap = ag('zap', { horario: '*/5 * * * *', cada_minutos: 5, lugar: '/calendario' })
  assert.deepEqual(proximosDeAgente(zap, PUBS, DIEZ, false), [
    { cuando: '6:00 p. m.', texto: 'Sale «Post de 7 láminas»', href: '/calendario/post-1', boton: 'Ver en el Calendario' },
    { cuando: 'mañana 8:00 a. m.', texto: 'Sale «Gmail programado»', href: '/calendario/post-2', boton: 'Ver en el Calendario' },
  ])
})

test('lo próximo de Vero: las pruebas', () => {
  const vero = ag('vero', { horario: '17 * * * *', cada_minutos: 60 })
  assert.deepEqual(proximosDeAgente(vero, PUBS, DIEZ, false), [
    { cuando: '12:00 p. m.', texto: 'Sale «Excel con IA»', href: '/calendario/prueba-1', boton: 'Ver en el Calendario' },
  ])
})

test('lo próximo con horario: sus 2 próximas corridas con su oficio y «Abrir» a su lugar; sin lugar seguro, sin botón', () => {
  const drax = ag('drax', { oficio: 'Jefe de la noche', horario: '0 1 * * *', lugar: '/calendario' })
  assert.deepEqual(proximosDeAgente(drax, PUBS, DIEZ, false), [
    { cuando: '7:00 p. m.', texto: 'Jefe de la noche', href: '/calendario', boton: 'Abrir' },
    { cuando: 'mañana 7:00 p. m.', texto: 'Jefe de la noche', href: '/calendario', boton: 'Abrir' },
  ])
  for (const lugar of [null, 'javascript:alert(1)', '//otro.com']) {
    assert.deepEqual(proximosDeAgente({ ...drax, lugar }, [], DIEZ, false).map((p) => [p.href, p.boton]), [[null, null], [null, null]], String(lugar))
  }
})

test('lo próximo va por hora y trae 3 como mucho (o n)', () => {
  // un Zap con horario diario mezcla sus corridas (2:00 p. m.) y sus publicaciones
  const zap = ag('zap', { oficio: 'Publica', horario: '0 20 * * *' })
  assert.deepEqual(proximosDeAgente(zap, PUBS, DIEZ, false).map((p) => `${p.cuando} · ${p.texto}`), [
    '2:00 p. m. · Publica', '6:00 p. m. · Sale «Post de 7 láminas»', 'mañana 8:00 a. m. · Sale «Gmail programado»',
  ])
  assert.equal(proximosDeAgente(zap, PUBS, DIEZ, false, 2).length, 2)
})

test('lo próximo vacío: dormida, pendiente, cuando lo pidas o quien revisa cada pocos minutos (salvo lo que sale de Zap y Vero)', () => {
  assert.deepEqual(proximosDeAgente(ag('drax', { horario: '0 1 * * *' }), PUBS, DIEZ, true), [])
  assert.deepEqual(proximosDeAgente(ag('zap', { horario: '*/5 * * * *', cada_minutos: 5 }), PUBS, DIEZ, true), [])
  assert.deepEqual(proximosDeAgente(ag('atlas', { estado_fijo: 'pendiente', horario: '0 1 * * *' }), PUBS, DIEZ, false), [])
  assert.deepEqual(proximosDeAgente(ag('mira', { estado_fijo: 'pedido' }), PUBS, DIEZ, false), [])
  assert.deepEqual(proximosDeAgente(ag('tiko', { horario: '*/5 * * * *', cada_minutos: 5 }), PUBS, DIEZ, false), [])
  assert.deepEqual(proximosDeAgente(ag('zap', { horario: '*/5 * * * *', cada_minutos: 5 }), [], DIEZ, false), [])
  assert.deepEqual(proximosDeAgente(ag('dex'), PUBS, DIEZ, false), [])
})

test('la línea sin hora de lo próximo: se lo pides a Claude, cada cuánto revisa, o lo de proximoDe si no hay lista', () => {
  assert.equal(notaProximo(ag('mira', { estado_fijo: 'pedido' }), [], DIEZ, false), 'Se lo pides a Claude en tu compu')
  // quien revisa cada pocos minutos: solo cada cuánto (la última vez, que ya pasó, sale en «Ahora», no en lo próximo)
  const ultima = '2026-11-16T15:55:00Z'
  const zap = ag('zap', { horario: '*/5 * * * *', cada_minutos: 5, ultima_revision: ultima })
  assert.equal(notaProximo(zap, proximosDeAgente(zap, PUBS, DIEZ, false), DIEZ, false), 'Revisa cada 5 min')
  assert.equal(notaProximo(ag('tiko', { horario: '*/5 * * * *', cada_minutos: 5, ultima_revision: ultima }), [], DIEZ, false), 'Revisa cada 5 min')
  assert.equal(notaProximo(ag('vero', { horario: '17 * * * *', cada_minutos: 60, ultima_revision: ultima }), [], DIEZ, false), 'Revisa cada hora')
  assert.equal(notaProximo(ag('drax', { horario: '0 1 * * *' }), [], DIEZ, true), 'En pausa mientras la oficina duerme')
  assert.equal(notaProximo(ag('atlas', { estado_fijo: 'pendiente' }), [], DIEZ, false), 'Todavía no empieza')
  assert.equal(notaProximo(ag('dex'), [], DIEZ, false), 'Cuando le llegue trabajo')
  const drax = ag('drax', { horario: '0 1 * * *' })
  assert.equal(notaProximo(drax, proximosDeAgente(drax, [], DIEZ, false), DIEZ, false), null)
})

// ---------- Dónde trabaja ----------

test('dónde trabaja: cada lugar con su texto y su botón', () => {
  const casos: [string, string, string][] = [
    ['/calendario', 'el Calendario', 'Abrir el Calendario'],
    ['/analisis', 'Análisis de reels', 'Abrir Análisis'],
    ['/ideas', 'Ideas', 'Abrir Ideas'],
    ['/crm/mensajes', 'Mensajes', 'Abrir Mensajes'],
    ['/contratos', 'Contratos', 'Abrir Contratos'],
    ['https://knox.bralto.io', 'el centro de Knox', 'Abrir el centro de Knox'],
    ['https://knox.bralto.io/inicio', 'el centro de Knox', 'Abrir el centro de Knox'],
    ['https://www.instagram.com/perfil/', 'Instagram', 'Abrir Instagram'],
    ['/plan-q4', 'su lugar', 'Abrir'],
    ['https://ejemplo.com/algo', 'su lugar', 'Abrir'],
    ['https://knox.bralto.io.otro.com', 'su lugar', 'Abrir'],
  ]
  for (const [lugar, texto, boton] of casos) assert.deepEqual(lugarDe(lugar), { texto, boton, href: lugar }, lugar)
})

test('dónde trabaja: sin lugar, o con uno que no es una ruta del panel ni un enlace https, nada (sin botón)', () => {
  for (const lugar of [null, '', 'javascript:x', '//otro.com', '/\\otro.com', 'http://otro.com', 'calendario', '/']) {
    assert.equal(lugarDe(lugar), null, String(lugar))
  }
})

// ---------- En el foro ----------

function post(id: string, de: string, mostrar_desde: string, comentarios: Comentario[] = [], extra: Partial<Post> = {}): Post {
  return {
    id, de, tipo: 'nota', titulo: `Título de ${id}`, texto: `Texto de ${id}`, foto_id: null, likes: 0, te_gusta: false, idea_id: null,
    mostrar_desde, comentarios, ...extra,
  }
}
function com(id: string, post_id: string, de: string, mostrar_desde: string, texto = `Comentario ${id}`): Comentario {
  return { id, post_id, de, texto, en_respuesta_a: null, idea_id: null, mostrar_desde }
}

test('en el foro: lo último que escribió; un comentario más nuevo que su post dice «Comentó»', () => {
  const foro = [
    post('p2', 'nova', '2026-11-16T15:00:00Z', [com('c1', 'p2', 'beta', '2026-11-16T15:30:00Z', 'Mae, me apunto')]),
    post('p1', 'beta', '2026-11-16T14:00:00Z', [com('c0', 'p1', 'nova', '2026-11-16T14:10:00Z')], { titulo: '¿Probamos 2 por día?' }),
  ]
  assert.deepEqual(ultimoEnForo('beta', foro), { postId: 'p2', texto: 'Mae, me apunto', como: 'Comentó', cuando: '2026-11-16T15:30:00Z' })
  // su post es más nuevo que su comentario: «Publicó», con el título del post
  assert.deepEqual(ultimoEnForo('nova', foro), { postId: 'p2', texto: 'Título de p2', como: 'Publicó', cuando: '2026-11-16T15:00:00Z' })
  assert.deepEqual(ultimoEnForo('beta', foro.slice(1)), { postId: 'p1', texto: '¿Probamos 2 por día?', como: 'Publicó', cuando: '2026-11-16T14:00:00Z' })
  assert.equal(ultimoEnForo('drax', foro), null)
})

// ---------- Sus fotos ----------

const foto = (id: string, tipo: Foto['tipo'], agentes: string[], pie: string | null = null): Foto => ({ id, tipo, agentes, url: `/fotos/${id}.jpg`, pie })

test('sus fotos: su retrato primero; después las de grupo donde sale, de la más nueva a la más vieja (por su post); sin post, al final por id', () => {
  // vienen por id, como las manda el servidor
  const fotos = [
    foto('f0', 'grupo', ['beta'], 'Otra sin post'),
    foto('f1', 'grupo', ['beta', 'drax'], 'Almuerzo'),
    foto('f2', 'retrato', ['beta']),
    foto('f3', 'grupo', ['drax', 'beta', 'gama'], 'Playa'),
    foto('f4', 'grupo', ['beta'], 'En moto'),
    foto('f5', 'retrato', ['drax']),
    foto('f6', 'grupo', ['gama'], 'Solo Gama'),
    foto('f7', 'grupo', ['beta'], 'Sin post'),
  ]
  const foro = [
    post('p3', 'gama', '2026-11-15T20:00:00Z', [], { tipo: 'foto', foto_id: 'f3' }),
    post('p4', 'beta', '2026-11-14T20:00:00Z', [], { tipo: 'foto', foto_id: 'f4' }),
    post('p9', 'beta', '2026-11-14T10:00:00Z'),
    post('p1', 'beta', '2026-11-12T20:00:00Z', [], { tipo: 'foto', foto_id: 'f1' }),
  ]
  assert.deepEqual(fotosDe('beta', fotos, foro).map((f) => f.id), ['f2', 'f3', 'f4', 'f1', 'f0', 'f7'])
  assert.deepEqual(fotosDe('drax', fotos, foro).map((f) => f.id), ['f5', 'f3', 'f1'])
  // sin retrato, solo las de grupo; sin nada, ninguna
  assert.deepEqual(fotosDe('gama', fotos, foro).map((f) => f.id), ['f3', 'f6'])
  assert.deepEqual(fotosDe('delta', fotos, foro), [])
})
