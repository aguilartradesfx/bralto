import { createHash, timingSafeEqual } from 'node:crypto'
import { armarCambio, NO_SE_PUEDE, type Cambio } from '../calendario/editar.ts'
import { aLocalCR, diaCR, horaCR, hoyCR, localCRaUtc, nombreDia, sumarDias } from '../calendario/fechas.ts'
import { sePuedeEditar } from '../calendario/reglas.ts'
import { validar } from './publicacion/publicar.ts'
import type { Estado, Publicacion, Tipo } from './publicacion/tipos.ts'

// El Calendario de redes manejado desde el asistente de Telegram de Alejandro (otro proyecto, que llama a
// /api/redes/asistente con un secreto compartido). Usa las mismas reglas que el panel (calendario/editar.ts):
// cada cambio es condicional y nada que ya salió o se está publicando se toca.

export const ACCIONES = ['listar', 'aprobar', 'frenar', 'sacar_ya', 'cambiar_hora'] as const
export type Accion = (typeof ACCIONES)[number]

export type Pedido =
  | { accion: 'listar'; desde: string; hasta: string } // días de Costa Rica, los dos incluidos
  | { accion: 'aprobar'; id: string | null } // sin id: el único borrador cercano
  | { accion: 'sacar_ya'; id: string | null; confirmar: boolean }
  | { accion: 'frenar'; id: string }
  | { accion: 'cambiar_hora'; id: string; cuando: string; confirmar: boolean } // cuando: 'AAAA-MM-DDTHH:MM' de Costa Rica

// Lo que el asistente ve de cada publicación
export type Item = { id: string; titulo: string; tipo: Tipo; estado: Estado; publicar_en: string; dia: string; hora: string }

export type Fallo = { ok: false; status: 400 | 409; error: string; motivo?: 'noche' | 'hora_pasada' }
type Armado = { ok: true; cambio: Cambio } | Fallo

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const DIA = /^\d{4}-\d{2}-\d{2}$/
const LOCAL = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/
const HORA_MS = 3600_000
const MAX_DIAS = 31
// «dale» sin decir cuál: lo que estaba para hace poco (todavía sale, el publicador acepta hasta 3 h de atraso) o
// para las próximas 24 horas
const ATRAS_MS = 3 * HORA_MS
const ADELANTE_MS = 24 * HORA_MS
// Nunca de noche sin que Alejandro lo confirme: de 7:00 a 21:00 de Costa Rica
const PRIMERA = '07:00'
const ULTIMA = '21:00'

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)
const minuscula = (texto: string) => texto.charAt(0).toLowerCase() + texto.slice(1)

// La autorización completa ('Bearer <secreto>'), comparada en tiempo constante. Sin secreto configurado, nadie
export function secretoValido(cabecera: string | null, secreto: string | undefined): boolean {
  if (!secreto || !cabecera) return false
  const dado = createHash('sha256').update(cabecera).digest()
  const esperado = createHash('sha256').update(`Bearer ${secreto}`).digest()
  return timingSafeEqual(dado, esperado)
}

const diaValido = (dia: string) => DIA.test(dia) && new Date(`${dia}T00:00:00Z`).toISOString().startsWith(dia)

export function leerPedido(entrada: unknown, ahora: Date): { ok: true; pedido: Pedido } | { ok: false; error: string } {
  const e = (typeof entrada === 'object' && entrada !== null ? entrada : {}) as Record<string, unknown>
  if (typeof e.accion !== 'string' || !(ACCIONES as readonly string[]).includes(e.accion)) {
    return { ok: false, error: `Acción desconocida: usa ${ACCIONES.join(', ')}` }
  }
  const accion = e.accion as Accion
  if (e.id !== undefined && e.id !== null && (typeof e.id !== 'string' || !UUID.test(e.id))) {
    return { ok: false, error: 'Ese id no es de una publicación' }
  }
  const id = typeof e.id === 'string' ? e.id : null
  const confirmar = e.confirmar === true

  if (accion === 'listar') {
    const desde = e.desde === undefined ? hoyCR(ahora) : e.desde
    const hasta = e.hasta === undefined ? (e.desde === undefined ? sumarDias(desde as string, 6) : desde) : e.hasta
    if (typeof desde !== 'string' || typeof hasta !== 'string' || !diaValido(desde) || !diaValido(hasta)) {
      return { ok: false, error: 'Las fechas van como AAAA-MM-DD' }
    }
    if (hasta < desde) return { ok: false, error: 'La fecha final va después de la inicial' }
    if (hasta > sumarDias(desde, MAX_DIAS)) return { ok: false, error: `Se puede listar hasta ${MAX_DIAS} días a la vez` }
    return { ok: true, pedido: { accion, desde, hasta } }
  }
  if (accion === 'aprobar') return { ok: true, pedido: { accion, id } }
  if (accion === 'sacar_ya') return { ok: true, pedido: { accion, id, confirmar } }
  if (!id) return { ok: false, error: 'Falta el id de la publicación' }
  if (accion === 'frenar') return { ok: true, pedido: { accion, id } }
  if (typeof e.cuando !== 'string' || !LOCAL.test(e.cuando)) {
    return { ok: false, error: 'La hora nueva va como AAAA-MM-DDTHH:MM, en hora de Costa Rica' }
  }
  return { ok: true, pedido: { accion, id, cuando: e.cuando, confirmar } }
}

// '18:00' → '6:00 p. m.'
export function hora12(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return `${h % 12 === 0 ? 12 : h % 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'a. m.' : 'p. m.'}`
}

const diaDe = (instante: string) => minuscula(nombreDia(diaCR(instante)))
const horaDe = (instante: string) => hora12(horaCR(instante))

export function aItem(p: Pick<Publicacion, 'id' | 'titulo' | 'tipo' | 'estado' | 'publicar_en'>): Item {
  return { id: p.id, titulo: p.titulo, tipo: p.tipo, estado: p.estado, publicar_en: p.publicar_en, dia: diaDe(p.publicar_en), hora: horaDe(p.publicar_en) }
}

export function esDeNoche(instante: string): boolean {
  const hora = horaCR(instante)
  return hora < PRIMERA || hora > ULTIMA || (hora === ULTIMA && new Date(instante).getUTCSeconds() > 0)
}

// Sin id, la acción va sobre la única publicación cercana en `estados`; si hay varias o ninguna, no elige
export function elegirPendiente(
  lista: Pick<Publicacion, 'id' | 'titulo' | 'tipo' | 'estado' | 'publicar_en'>[],
  ahora: Date,
  estados: readonly Estado[],
): { ok: true; id: string } | { ok: false; status: 404 | 409; error: string; opciones: Item[] } {
  const t = ahora.getTime()
  const cerca = lista
    .filter((p) => estados.includes(p.estado))
    .filter((p) => Date.parse(p.publicar_en) >= t - ATRAS_MS && Date.parse(p.publicar_en) <= t + ADELANTE_MS)
    .sort((a, b) => Date.parse(a.publicar_en) - Date.parse(b.publicar_en))
  if (cerca.length === 1) return { ok: true, id: cerca[0].id }
  if (!cerca.length) return { ok: false, status: 404, error: 'No hay ninguna publicación pendiente para las próximas 24 horas', opciones: [] }
  return { ok: false, status: 409, error: `Hay ${cerca.length} publicaciones pendientes: hay que decir cuál`, opciones: cerca.map(aItem) }
}

const noche = (instante: string, que: string): Fallo => ({
  ok: false,
  status: 409,
  motivo: 'noche',
  error: `${que} a las ${horaDe(instante)}, y eso ya es de noche (fuera de 7:00 a. m. a 9:00 p. m.). Pídele que lo confirme.`,
})

export function armarAprobar(actual: Publicacion, ahora: Date): Armado {
  if (!sePuedeEditar(actual.estado)) return { ok: false, status: 409, error: NO_SE_PUEDE }
  if (Date.parse(actual.publicar_en) <= ahora.getTime()) {
    return {
      ok: false,
      status: 409,
      motivo: 'hora_pasada',
      error: `Su hora (${horaDe(actual.publicar_en)} del ${diaDe(actual.publicar_en)}) ya pasó: pregúntale si lo saco ya o a qué hora lo paso`,
    }
  }
  return armarCambio({ texto: actual.texto, cuando: aLocalCR(actual.publicar_en), estado: 'programado' }, actual, ahora)
}

export function armarFrenar(actual: Publicacion, ahora: Date): Armado {
  return armarCambio({ texto: actual.texto, cuando: aLocalCR(actual.publicar_en), estado: 'borrador' }, actual, ahora)
}

export function armarHora(actual: Publicacion, cuando: string, ahora: Date, confirmar: boolean): Armado {
  const r = armarCambio({ texto: actual.texto, cuando }, actual, ahora)
  if (!r.ok) return r
  const destino = localCRaUtc(cuando)
  if (destino && esDeNoche(destino) && !confirmar) return noche(destino, 'Quedaría')
  return r
}

// Aprobarla con la hora de ahora: el publicador la toma enseguida. Revisa lo mismo que el publicador
export function armarSacarYa(actual: Publicacion, ahora: Date, confirmar: boolean): Armado {
  if (!sePuedeEditar(actual.estado)) return { ok: false, status: 409, error: NO_SE_PUEDE }
  const invalida = validar(actual)
  if (invalida) return { ok: false, status: 400, error: mayuscula(invalida) }
  const ya = ahora.toISOString()
  if (esDeNoche(ya) && !confirmar) return noche(ya, 'Saldría')
  return { ok: true, cambio: { texto: actual.texto, publicar_en: ya, estado: 'programado' } }
}

export function mensajeListo(accion: Exclude<Accion, 'listar'>, p: Pick<Publicacion, 'titulo' | 'estado' | 'publicar_en'>): string {
  const t = `«${p.titulo}»`
  // Termina en «a. m.» o «p. m.»: ya trae su punto
  const cuando = `el ${diaDe(p.publicar_en)} a las ${horaDe(p.publicar_en)}`
  if (accion === 'aprobar') return `Listo: ${t} quedó aprobado y sale ${cuando}`
  if (accion === 'frenar') return `Listo: ${t} quedó en borrador y no sale hasta que lo apruebes.`
  if (accion === 'sacar_ya') return `${t} se está publicando ya. Te aviso por aquí cuando salga.`
  return `Listo: ${t} ahora sale ${cuando}${p.estado === 'borrador' ? ' Sigue en borrador: falta aprobarlo.' : ''}`
}
