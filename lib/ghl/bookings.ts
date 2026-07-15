import { upsertContact, addContactTags, bookAppointment } from './api'
import { getLocationAccessToken } from './client'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'

const BRALTO_LOCATION_ID =
  process.env.HIGHLEVEL_BRALTO_LOCATION_ID ?? 'hdVpvshZP3RGJQbxx8GA'
const BRALTO_CALENDAR_ID =
  process.env.HIGHLEVEL_BRALTO_CALENDAR_ID ?? 'LUZgumbKyrgNJy05MsRY'

// Curated website times → hour of day (Costa Rica, -06:00).
// Must stay in sync with TIME_SLOTS in app/[locale]/agendar/_view.tsx.
const CURATED_HOUR_TO_ID: Record<number, string> = {
  9: '9am',
  13: '1pm',
  15: '3pm',
  17: '5pm',
}

// Returns the slotKeys ("YYYY-MM-DD-<id>") among our curated times that are
// actually FREE in the GHL calendar over the next ~8 days. Lets the booking
// page hide any curated slot already taken/blocked directly in GHL, so the site
// can't double-book. Throws on GHL error — callers should degrade gracefully.
export async function getGhlAvailableSlotKeys(): Promise<string[]> {
  const token = await getLocationAccessToken(BRALTO_LOCATION_ID)
  const now = Date.now()
  const url =
    `${GHL_API_BASE}/calendars/${BRALTO_CALENDAR_ID}/free-slots` +
    `?startDate=${now}&endDate=${now + 8 * 24 * 60 * 60 * 1000}&timezone=America/Costa_Rica`

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Version: '2021-04-15',
      Accept: 'application/json',
    },
  })
  if (!res.ok) throw new Error(`GHL free-slots → ${res.status}`)

  // Shape: { "2026-07-16": { slots: ["2026-07-16T09:00:00-06:00", ...] }, traceId }
  const data = (await res.json()) as Record<string, { slots?: string[] } | unknown>

  const available: string[] = []
  for (const [key, val] of Object.entries(data)) {
    if (key === 'traceId') continue
    const slots = (val as { slots?: string[] })?.slots
    if (!Array.isArray(slots)) continue
    for (const iso of slots) {
      const date = iso.slice(0, 10)
      const hour = Number.parseInt(iso.slice(11, 13), 10)
      const id = CURATED_HOUR_TO_ID[hour]
      if (id) available.push(`${date}-${id}`)
    }
  }
  return available
}

// Custom-field IDs from the Bralto GHL location.
const CUSTOM_FIELDS = {
  revenue: 'jZ5jAhuHb8zNAF3Uhonk', // "Facturación mensual - 2.0"
  challenge: 'ed09mOtZTtjWElJyXktB', // "Objetivo"
  timeline: 'WhSRysieHoxhwYM8NBsK', // "Deadline"
  size: 'ZBdr8gd6Ch4jHzyNQEQl', // "Company Size"
  industry: 'y8Yd1WsGrGzyc3iqkX1V', // "Industria"
} as const

export type AppointmentAnswers = {
  size?: string
  revenue?: string
  challenge?: string
  industry?: string
  timeline?: string
}

export type AppointmentInput = {
  slotKey: string
  firstName: string
  lastName: string
  phone: string
  email: string
  answers?: AppointmentAnswers
}

// "2026-03-27-3pm" → "2026-03-27T15:00:00-06:00" (Costa Rica time).
export function parseSlotKey(slotKey: string): string {
  const match = slotKey.match(/^(\d{4}-\d{2}-\d{2})-(\d{1,2})(am|pm)$/i)
  if (!match) throw new Error(`Invalid slot_key: "${slotKey}"`)

  let hour = Number.parseInt(match[2], 10)
  const ampm = match[3].toLowerCase()
  if (ampm === 'pm' && hour !== 12) hour += 12
  if (ampm === 'am' && hour === 12) hour = 0

  return `${match[1]}T${hour.toString().padStart(2, '0')}:00:00-06:00`
}

export async function createBookingInGhl(input: AppointmentInput): Promise<{
  contactId: string
  appointmentId: string
}> {
  if (!BRALTO_LOCATION_ID) {
    throw new Error('Missing HIGHLEVEL_BRALTO_LOCATION_ID env var')
  }

  const startTime = parseSlotKey(input.slotKey)
  const answers = input.answers ?? {}

  const customFields = [
    { id: CUSTOM_FIELDS.revenue, value: answers.revenue ?? '' },
    { id: CUSTOM_FIELDS.challenge, value: answers.challenge ?? '' },
    { id: CUSTOM_FIELDS.timeline, value: answers.timeline ?? '' },
    { id: CUSTOM_FIELDS.size, value: answers.size ?? '' },
    { id: CUSTOM_FIELDS.industry, value: answers.industry ?? '' },
  ].filter((f) => f.value !== '')

  const contact = await upsertContact({
    locationId: BRALTO_LOCATION_ID,
    email: input.email,
    phone: input.phone,
    firstName: input.firstName,
    lastName: input.lastName,
    customFields,
    source: 'Bralto Web Booking',
  })

  const appointment = await bookAppointment({
    calendarId: BRALTO_CALENDAR_ID,
    locationId: BRALTO_LOCATION_ID,
    contactId: contact.id,
    startTime,
  })

  // Best-effort tagging — never fail the booking on a tag error.
  try {
    await addContactTags(BRALTO_LOCATION_ID, contact.id, ['Web Lead 2026'])
  } catch (err) {
    console.warn(`[bookings] addContactTags warning for ${contact.id}:`, err)
  }

  return { contactId: contact.id, appointmentId: appointment.id }
}
