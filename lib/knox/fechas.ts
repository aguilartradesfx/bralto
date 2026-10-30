// Fechas y horas como las dice Knox. Costa Rica no cambia de hora: siempre UTC−6.

const ZONA = 'America/Costa_Rica'

// El día de Costa Rica de un momento (AAAA-MM-DD)
export function diaCr(fecha: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha)
}

// Las 00:00 de Costa Rica de ese día
export function inicioDelDia(dia: string): Date {
  return new Date(`${dia}T06:00:00Z`)
}

export function sumarDias(dia: string, dias: number): string {
  const d = new Date(`${dia}T12:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function horaYMinuto(fecha: Date): [number, number] {
  const partes = new Intl.DateTimeFormat('en-US', { timeZone: ZONA, hour: 'numeric', minute: '2-digit', hourCycle: 'h23' }).formatToParts(fecha)
  const valor = (tipo: string) => Number(partes.find((p) => p.type === tipo)?.value ?? 0)
  return [valor('hour'), valor('minute')]
}

export function saludo(fecha: Date): string {
  const [h] = horaYMinuto(fecha)
  return h >= 5 && h < 12 ? 'Buenos días' : h >= 12 && h < 19 ? 'Buenas tardes' : 'Buenas noches'
}

// «las 6 de la tarde», «la 1 y media de la tarde», «las 12 del mediodía»
export function horaHablada(fecha: Date): string {
  const [h, m] = horaYMinuto(fecha)
  if (h === 12 && m === 0) return 'las 12 del mediodía'
  const h12 = h % 12 === 0 ? 12 : h % 12
  const parte = h < 5 ? 'de la madrugada' : h < 12 ? 'de la mañana' : h < 19 ? 'de la tarde' : 'de la noche'
  const minutos = m === 0 ? '' : m === 30 ? ' y media' : m === 15 ? ' y cuarto' : ` y ${m}`
  return `${h12 === 1 ? 'la' : 'las'} ${h12}${minutos} ${parte}`
}

// «6:00 p. m.», para las tarjetas
export function horaCorta(fecha: Date): string {
  return new Intl.DateTimeFormat('es-CR', { timeZone: ZONA, hour: 'numeric', minute: '2-digit' }).format(fecha)
}

// «viernes 30 de octubre»
export function fechaHablada(fecha: Date): string {
  return new Intl.DateTimeFormat('es-CR', { timeZone: ZONA, weekday: 'long', day: 'numeric', month: 'long' }).format(fecha).replace(',', '')
}
