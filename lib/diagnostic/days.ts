// Días y claves de horario de /agendar. Los horarios son de Costa Rica (lib/ghl/bookings.ts):
// los días se cuentan con la fecha de Costa Rica, no con el reloj de quien ejecuta. La página se
// arma en el servidor (UTC) y se hidrata en el navegador (cualquier zona); si cada lado contara
// con su reloj, de 6 p. m. a medianoche marcarían días distintos y la hidratación de React
// dejaría los atributos del servidor (mañana deshabilitado, el último día sin responder).

const ZONE = 'America/Costa_Rica'

/** Fecha de hoy en Costa Rica, "YYYY-MM-DD" */
export function costaRicaToday(now: number): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: ZONE, year: 'numeric', month: '2-digit', day: '2-digit' })
    .formatToParts(now)
  const get = (type: string) => parts.find((p) => p.type === type)?.value
  return `${get('year')}-${get('month')}-${get('day')}`
}

/** Los cinco días hábiles siguientes a hoy en Costa Rica, "YYYY-MM-DD" */
export function bookableDays(now: number): string[] {
  const [y, m, d] = costaRicaToday(now).split('-').map(Number)
  const days: string[] = []
  // Aritmética de calendario en UTC: ninguna zona horaria se mete en el conteo
  for (let offset = 1; days.length < 5; offset++) {
    const day = new Date(Date.UTC(y, m - 1, d + offset))
    const dow = day.getUTCDay()
    if (dow !== 0 && dow !== 6) days.push(day.toISOString().slice(0, 10))
  }
  return days
}

/** "YYYY-MM-DD" → medianoche local de ese día, como las celdas del calendario */
export function localDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Clave del horario ("2026-10-09-9am"): el día que se ve en el calendario, leído con sus
 * componentes locales. Con toISOString() quien está al este de UTC reservaba un día antes.
 */
export function slotKey(day: Date, timeId: string): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${day.getFullYear()}-${pad(day.getMonth() + 1)}-${pad(day.getDate())}-${timeId}`
}
