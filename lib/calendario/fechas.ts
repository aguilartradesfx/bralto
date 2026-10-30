// Fechas del calendario en hora de Costa Rica (UTC−6 todo el año, sin horario de verano).
// Día 'AAAA-MM-DD', mes 'AAAA-MM' y hora local 'AAAA-MM-DDTHH:MM' (el valor de <input type="datetime-local">).

const OFFSET_MS = 6 * 3600_000
const DIA_MS = 86_400_000

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// Encabezado de la cuadrícula: la semana empieza el lunes
export const DIAS_SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const MES = /^20\d{2}-(?:0[1-9]|1[0-2])$/
const LOCAL = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

// El instante corrido a la hora de Costa Rica: sus campos UTC son los de la hora local
const enCR = (instante: string | Date) => new Date(new Date(instante).getTime() - OFFSET_MS).toISOString()

export const hoyCR = (ahora: Date) => enCR(ahora).slice(0, 10)
export const diaCR = (instante: string) => enCR(instante).slice(0, 10)
export const horaCR = (instante: string) => enCR(instante).slice(11, 16)
export const aLocalCR = (instante: string) => enCR(instante).slice(0, 16)
export const mesDe = (dia: string) => dia.slice(0, 7)

export function sumarDias(dia: string, dias: number): string {
  return new Date(Date.parse(`${dia}T00:00:00Z`) + dias * DIA_MS).toISOString().slice(0, 10)
}

// La hora local de Costa Rica del formulario, en UTC. null si no es una fecha con hora que exista
export function localCRaUtc(valor: unknown): string | null {
  const partes = typeof valor === 'string' ? LOCAL.exec(valor) : null
  if (!partes) return null
  const [año, mes, dia, hora, minuto, segundo] = partes.slice(1).map((x) => Number(x ?? 0))
  const t = Date.UTC(año, mes - 1, dia, hora, minuto, segundo)
  // Date.UTC acomoda lo que no existe (30 de febrero, 24:00): si algo cambió, la fecha no era válida
  const f = new Date(t)
  const igual =
    f.getUTCFullYear() === año &&
    f.getUTCMonth() === mes - 1 &&
    f.getUTCDate() === dia &&
    f.getUTCHours() === hora &&
    f.getUTCMinutes() === minuto &&
    f.getUTCSeconds() === segundo
  return igual ? new Date(t + OFFSET_MS).toISOString() : null
}

// El mes de ?mes=AAAA-MM; si no sirve, el de hoy en Costa Rica
export function leerMes(valor: unknown, ahora: Date): string {
  return typeof valor === 'string' && MES.test(valor) ? valor : mesDe(hoyCR(ahora))
}

export function moverMes(mes: string, meses: number): string {
  const [año, m] = mes.split('-').map(Number)
  return new Date(Date.UTC(año, m - 1 + meses, 1)).toISOString().slice(0, 7)
}

const lunesDe = (dia: string) => sumarDias(dia, -((new Date(`${dia}T00:00:00Z`).getUTCDay() + 6) % 7))

// Las semanas que muestra el mes, de lunes a domingo (con días del mes anterior y del siguiente para completarlas)
export function semanasDelMes(mes: string): string[][] {
  const ultimo = sumarDias(`${moverMes(mes, 1)}-01`, -1)
  const semanas: string[][] = []
  for (let lunes = lunesDe(`${mes}-01`); lunes <= ultimo; lunes = sumarDias(lunes, 7)) {
    semanas.push(Array.from({ length: 7 }, (_, i) => sumarDias(lunes, i)))
  }
  return semanas
}

// De las 00:00 de Costa Rica del primer día a las 00:00 del día después del último, en UTC: para consultar
export function rangoUtc(desde: string, hasta: string): { desde: string; hasta: string } {
  const inicio = (dia: string) => new Date(Date.parse(`${dia}T00:00:00Z`) + OFFSET_MS).toISOString()
  return { desde: inicio(desde), hasta: inicio(sumarDias(hasta, 1)) }
}

// Por día de Costa Rica y en orden de hora: lo de las 23:30 va en su día aunque en UTC ya sea el siguiente
export function agruparPorDia<T extends { publicar_en: string }>(lista: T[]): Map<string, T[]> {
  const dias = new Map<string, T[]>()
  for (const p of [...lista].sort((a, b) => Date.parse(a.publicar_en) - Date.parse(b.publicar_en))) {
    const dia = diaCR(p.publicar_en)
    const delDia = dias.get(dia)
    if (delDia) delDia.push(p)
    else dias.set(dia, [p])
  }
  return dias
}

// 'Octubre 2026'
export function nombreMes(mes: string): string {
  const [año, m] = mes.split('-').map(Number)
  return `${mayuscula(MESES[m - 1])} ${año}`
}

// 'Viernes 30 de octubre'
export function nombreDia(dia: string): string {
  const f = new Date(`${dia}T00:00:00Z`)
  return `${mayuscula(DIAS[f.getUTCDay()])} ${f.getUTCDate()} de ${MESES[f.getUTCMonth()]}`
}
