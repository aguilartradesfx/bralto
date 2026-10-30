// El historial de un contacto: cómo se ordena, se agrupa por día y se cuenta cada cosa.
import { diaCR, hoyCR, sumarDias } from '../calendario/fechas.ts'
import { diaLargo, duracion } from './fechas.ts'
import type { Direccion } from './tipos.ts'

type ConFecha = { id: string; enviado_en: string }

const despues = (a: ConFecha, b: ConFecha) => {
  const t = Date.parse(b.enviado_en) - Date.parse(a.enviado_en)
  return t !== 0 ? t : a.id < b.id ? 1 : a.id > b.id ? -1 : 0
}

// Lo que ya se veía más lo que trajo «Ver más» (o la página al día), sin repetir: lo más nuevo primero
export function unirMensajes<T extends ConFecha>(...listas: T[][]): T[] {
  const porId = new Map<string, T>()
  for (const lista of listas) for (const m of lista) porId.set(m.id, m)
  return [...porId.values()].sort(despues)
}

// En orden, agrupados por día de Costa Rica
export function porDia<T extends ConFecha>(mensajes: T[]): [string, T[]][] {
  const dias: [string, T[]][] = []
  for (const m of mensajes) {
    const dia = diaCR(m.enviado_en)
    const ultimo = dias[dias.length - 1]
    if (ultimo && ultimo[0] === dia) ultimo[1].push(m)
    else dias.push([dia, [m]])
  }
  return dias
}

// 'Hoy', 'Ayer' o 'viernes 12 de marzo'
export function nombreDelDia(dia: string, ahora: Date): string {
  const hoy = hoyCR(ahora)
  if (dia === hoy) return 'Hoy'
  if (dia === sumarDias(hoy, -1)) return 'Ayer'
  return diaLargo(dia, hoy)
}

const LLAMADA: Record<string, string> = {
  cancelada: 'se canceló',
  ocupado: 'daba ocupado',
  sin_respuesta: 'no contestó',
  fallo: 'no salió',
}

// 'Llamaste · 2 min', 'Te llamó · no contestó'
export function textoLlamada(direccion: Direccion | null, llamada: { estado?: string; segundos?: number } | null): string {
  const partes = [direccion === 'entrante' ? 'Te llamó' : 'Llamaste']
  if (llamada?.segundos) partes.push(duracion(llamada.segundos))
  if (llamada?.estado && LLAMADA[llamada.estado]) partes.push(LLAMADA[llamada.estado])
  return partes.join(' · ')
}

// Un texto largo se muestra cortado, con «Ver todo»
export const esLargo = (texto: string | null) => !!texto && (texto.length > 420 || texto.split('\n').length > 8)
