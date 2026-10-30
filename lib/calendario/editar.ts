import { validar } from '../redes/publicacion/publicar.ts'
import type { Estado, Publicacion } from '../redes/publicacion/tipos.ts'
import { localCRaUtc } from './fechas.ts'
import { ESTADOS_EDITABLES, sePuedeEditar } from './reglas.ts'

// Cambios a una publicación desde el panel. La conexión con la tabla está en servidor.ts; acá llega por
// `Actualizar`, para probarlo sin tocar filas de verdad.

export const NO_SE_PUEDE = 'Ya salió o se está publicando; no se puede cambiar'

// Aprobar la deja programada; frenarla, en borrador
export type Destino = 'programado' | 'borrador'

// Lo que manda el panel: el texto y la hora local de Costa Rica ('AAAA-MM-DDTHH:MM'); con estado, además la
// aprueba o la frena
export type Pedido = { texto: string; cuando: string; estado?: Destino }

// Lo que se escribe en la fila: la hora solo si cambió
export type Cambio = { texto: string; publicar_en?: string; estado?: Destino }

type Fallo = { ok: false; status: 400 | 409; error: string }

const falla = (error: string): Fallo => ({ ok: false, status: 400, error })
const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)
const minuto = (instante: string) => Math.floor(Date.parse(instante) / 60_000)

export function armarCambio(entrada: unknown, actual: Publicacion, ahora: Date): { ok: true; cambio: Cambio } | Fallo {
  if (!sePuedeEditar(actual.estado)) return { ok: false, status: 409, error: NO_SE_PUEDE }
  const e = (typeof entrada === 'object' && entrada !== null ? entrada : {}) as Record<string, unknown>
  if (typeof e.texto !== 'string' || typeof e.cuando !== 'string') return falla('Faltan el texto o la fecha')
  if (e.estado !== undefined && e.estado !== 'programado' && e.estado !== 'borrador') return falla('Solo se puede aprobar o frenar')
  const estado = e.estado as Destino | undefined

  const publicar_en = localCRaUtc(e.cuando)
  if (!publicar_en) return falla('La fecha no es válida')
  const texto = e.texto.replace(/\r\n?/g, '\n')
  // Lo mismo que revisa el cron antes de publicar: así no se guarda algo que después no va a salir
  const invalida = validar({ ...actual, texto })
  if (invalida) return falla(mayuscula(invalida))

  // El campo solo tiene minutos: si es el mismo minuto, la hora no cambió y se deja como está
  const movida = minuto(publicar_en) !== minuto(actual.publicar_en)
  if (movida && Date.parse(publicar_en) <= ahora.getTime()) return falla('Esa hora ya pasó. Elegí una más adelante.')
  if (estado === 'programado' && Date.parse(movida ? publicar_en : actual.publicar_en) <= ahora.getTime()) {
    return falla('Esa hora ya pasó. Cambiala antes de aprobar.')
  }
  return { ok: true, cambio: { texto, ...(movida ? { publicar_en } : {}), ...(estado ? { estado } : {}) } }
}

// Actualiza la fila solo si sigue en uno de `estados`, y dice cuántas filas cambió
export type Actualizar = (id: string, cambio: Cambio, estados: readonly Estado[]) => Promise<{ filas: number } | { error: string }>

export async function guardarCambio(
  id: string,
  cambio: Cambio,
  actualizar: Actualizar,
): Promise<{ ok: true } | { ok: false; status: 409 | 500; error: string }> {
  const r = await actualizar(id, cambio, ESTADOS_EDITABLES)
  if ('error' in r) return { ok: false, status: 500, error: r.error }
  // Ninguna fila: mientras tanto el cron la tomó o ya la publicó
  if (r.filas === 0) return { ok: false, status: 409, error: NO_SE_PUEDE }
  return { ok: true }
}
