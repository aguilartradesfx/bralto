import type { Estado } from '../redes/publicacion/tipos.ts'
import { diaCR, hoyCR, sumarDias } from './fechas.ts'

// Lo que el panel puede cambiar. Lo demás ya salió, se está publicando o quedó cerrado.
// Cada cambio en la tabla exige que la fila siga en uno de estos estados: así no le gana al cron que publica.
export const ESTADOS_EDITABLES = ['borrador', 'programado'] as const satisfies readonly Estado[]

export function sePuedeEditar(estado: Estado): boolean {
  return (ESTADOS_EDITABLES as readonly Estado[]).includes(estado)
}

// Lo que sale o ya salió. Un borrador, un error o uno cancelado no salen
const SALEN: readonly Estado[] = ['programado', 'publicando', 'publicado']

// Mañana (en Costa Rica) no sale nada
export function mañanaVacia(lista: { publicar_en: string; estado: Estado }[], ahora: Date): boolean {
  const mañana = sumarDias(hoyCR(ahora), 1)
  return !lista.some((p) => SALEN.includes(p.estado) && diaCR(p.publicar_en) === mañana)
}
