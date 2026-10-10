// Horarios del diagnóstico. Son horas de Costa Rica, que no tiene horario de verano (siempre
// UTC-6), y GHL los cura con estas mismas horas (CURATED_TIME_TO_ID en lib/ghl/bookings.ts).
// Todo se escribe con Intl: la hora de Costa Rica para todos y, aparte, la de quien agenda.

export const SLOT_ZONE = 'America/Costa_Rica'
const SLOT_UTC_OFFSET = '-06:00'

export const TIME_SLOT_IDS = ['9am', '1pm', '3pm', '5pm'] as const

type Locale = 'es' | 'en'

const LOCALE_TAG: Record<Locale, string> = { es: 'es-CR', en: 'en-US' }

/** "2026-10-08-9am" → instante en que empieza el horario (ms) */
export function slotStart(key: string): number {
  const match = key.match(/^(\d{4}-\d{2}-\d{2})-(\d{1,2})(am|pm)$/i)
  if (!match) throw new Error(`Clave de horario inválida: "${key}"`)
  let hour = Number(match[2]) % 12
  if (match[3].toLowerCase() === 'pm') hour += 12
  return Date.parse(`${match[1]}T${String(hour).padStart(2, '0')}:00:00${SLOT_UTC_OFFSET}`)
}

function timeIn(start: number, locale: Locale, timeZone: string): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], { hour: 'numeric', minute: '2-digit', timeZone }).format(start)
}

/** Hora del horario en Costa Rica, en el idioma de la página */
export function formatSlotTime(start: number, locale: Locale): string {
  return timeIn(start, locale, SLOT_ZONE)
}

/** La misma hora en la zona de quien agenda; null si coincide con Costa Rica o la zona no sirve */
export function localSlotTime(start: number, locale: Locale, timeZone: string | undefined): string | null {
  if (!timeZone) return null
  try {
    const local = timeIn(start, locale, timeZone)
    return local === formatSlotTime(start, locale) ? null : local
  } catch {
    return null
  }
}

/** Día elegido en el calendario (medianoche local, como localDate), escrito completo */
export function formatSlotDay(day: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(LOCALE_TAG[locale], { weekday: 'long', day: 'numeric', month: 'long' }).format(day)
}
