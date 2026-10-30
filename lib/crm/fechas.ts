// Fechas del CRM en hora de Costa Rica, dichas como las diría una persona.
import { diaCR, horaCR, hoyCR, sumarDias } from '../calendario/fechas.ts'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
const DIA_MS = 86_400_000

const diasEntre = (desde: string, hasta: string) => Math.round((Date.parse(`${hasta}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / DIA_MS)

// '12 mar' (de este año) o '12 mar 2025'
export function diaCorto(dia: string, hoy: string): string {
  const [año, mes, d] = dia.split('-').map(Number)
  return `${d} ${MESES[mes - 1]}${año === Number(hoy.slice(0, 4)) ? '' : ` ${año}`}`
}

// 'viernes 31 de octubre' (y el año si no es este)
export function diaLargo(dia: string, hoy: string): string {
  const f = new Date(`${dia}T00:00:00Z`)
  const año = f.getUTCFullYear()
  return `${DIAS[f.getUTCDay()]} ${f.getUTCDate()} de ${MESES_LARGOS[f.getUTCMonth()]}${año === Number(hoy.slice(0, 4)) ? '' : ` de ${año}`}`
}

// Para la lista: 'hace un momento', 'hace 5 min', 'hoy, 10:32', 'ayer', 'hace 4 días', '12 mar', '12 mar 2025'
export function haceCuanto(instante: string, ahora: Date): string {
  const minutos = Math.floor((ahora.getTime() - Date.parse(instante)) / 60_000)
  if (minutos < 1) return 'hace un momento'
  if (minutos < 60) return `hace ${minutos} min`
  const hoy = hoyCR(ahora)
  const dia = diaCR(instante)
  if (dia === hoy) return `hoy, ${horaCR(instante)}`
  const dias = diasEntre(dia, hoy)
  if (dias === 1) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  return diaCorto(dia, hoy)
}

// Para cada mensaje: 'Hoy, 10:32', 'Ayer, 18:05', '12 mar, 10:32', '12 mar 2025, 10:32'
export function fechaHora(instante: string, ahora: Date): string {
  const hoy = hoyCR(ahora)
  const dia = diaCR(instante)
  const hora = horaCR(instante)
  if (dia === hoy) return `Hoy, ${hora}`
  if (dia === sumarDias(hoy, -1)) return `Ayer, ${hora}`
  return `${diaCorto(dia, hoy)}, ${hora}`
}

// Para las tareas: 'Vence hoy', 'Vence mañana', 'Venció ayer', 'Venció hace 3 días', 'Vence el viernes 31 de octubre'
export function vencimiento(venceEn: string, ahora: Date): string {
  const hoy = hoyCR(ahora)
  const dias = diasEntre(hoy, diaCR(venceEn))
  if (dias === 0) return 'Vence hoy'
  if (dias === 1) return 'Vence mañana'
  if (dias === -1) return 'Venció ayer'
  if (dias < 0) return `Venció hace ${-dias} días`
  return `Vence el ${diaLargo(diaCR(venceEn), hoy)}`
}

// Para la cita: 'martes 10 de marzo de 2025, 10:00'
export function diaYHora(instante: string, ahora: Date): string {
  return `${diaLargo(diaCR(instante), hoyCR(ahora))}, ${horaCR(instante)}`
}

// Duración de una llamada: '45 s', '3 min', '1 h 5 min'
export function duracion(segundos: number): string {
  if (segundos < 60) return `${Math.round(segundos)} s`
  const minutos = Math.round(segundos / 60)
  if (minutos < 60) return `${minutos} min`
  return `${Math.floor(minutos / 60)} h${minutos % 60 ? ` ${minutos % 60} min` : ''}`
}
