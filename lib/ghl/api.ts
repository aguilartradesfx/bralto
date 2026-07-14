import { ghlFetchAgency, ghlFetchLocation } from './client'

const COMPANY_ID = process.env.HIGHLEVEL_COMPANY_ID ?? 'cnKny2ektFPRpPLw4AOb'

// ── Agency-scoped endpoints (use Agency app token) ─────────────────────────

export type CreateSubAccountInput = {
  name: string
  phone?: string
  email?: string
  firstName?: string
  lastName?: string
  country?: string
  timezone?: string
}

export type GhlLocation = {
  id: string
  name?: string
  [key: string]: unknown
}

export async function createSubAccount(input: CreateSubAccountInput): Promise<GhlLocation> {
  const body = {
    name: input.name,
    phone: input.phone ?? '',
    companyId: COMPANY_ID,
    country: input.country ?? 'CR',
    timezone: input.timezone ?? 'America/Costa_Rica',
    prospectInfo: {
      firstName: input.firstName ?? '',
      lastName: input.lastName ?? '',
      email: input.email ?? '',
    },
    settings: {
      allowDuplicateContact: false,
      allowDuplicateOpportunity: false,
      allowFacebookNameMerge: false,
      disableContactTimezone: false,
    },
  }

  const data = await ghlFetchAgency<{ id?: string; location?: { id: string } } & GhlLocation>(
    '/locations/',
    { method: 'POST', body: JSON.stringify(body) },
  )
  const id = data.id ?? data.location?.id
  if (!id) throw new Error(`createSubAccount: no id in response: ${JSON.stringify(data)}`)
  return { ...data, id }
}

export type EnableSaasInput = {
  locationId: string
  stripeCustomerId: string
  stripeSubscriptionId: string
  planId: string
}

export async function enableSaas(input: EnableSaasInput): Promise<void> {
  await ghlFetchAgency(`/saas/enable-saas/${input.locationId}`, {
    method: 'POST',
    body: JSON.stringify({
      stripeCustomerId: input.stripeCustomerId,
      stripeSubscriptionId: input.stripeSubscriptionId,
      planId: input.planId,
    }),
  })
}

// ── Location-scoped endpoints (use Sub-account app token) ──────────────────

export type UpsertContactInput = {
  locationId: string
  email?: string
  phone?: string
  firstName?: string
  lastName?: string
  companyName?: string
  tags?: string[]
  customFields?: Array<{ id: string; value: string | number | boolean }>
  source?: string
}

export type GhlContact = {
  id: string
  [key: string]: unknown
}

export async function upsertContact(input: UpsertContactInput): Promise<GhlContact> {
  const body: Record<string, unknown> = {
    locationId: input.locationId,
    email: input.email,
    phone: input.phone,
    firstName: input.firstName,
    lastName: input.lastName,
    source: input.source ?? 'Bralto Website',
  }
  if (input.companyName) body.companyName = input.companyName
  if (input.tags?.length) body.tags = input.tags
  if (input.customFields?.length) body.customFields = input.customFields

  const data = await ghlFetchLocation<{ contact?: GhlContact; new?: boolean }>(
    input.locationId,
    '/contacts/upsert',
    { method: 'POST', body: JSON.stringify(body) },
  )
  if (!data.contact?.id) {
    throw new Error(`upsertContact: no contact id in response: ${JSON.stringify(data)}`)
  }
  return data.contact
}

export async function addContactTags(
  locationId: string,
  contactId: string,
  tags: string[],
): Promise<void> {
  await ghlFetchLocation(locationId, `/contacts/${contactId}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags }),
  })
}

export type BookAppointmentInput = {
  calendarId: string
  locationId: string
  contactId: string
  startTime: string
  title?: string
}

export async function bookAppointment(input: BookAppointmentInput): Promise<{ id: string }> {
  const body = {
    calendarId: input.calendarId,
    locationId: input.locationId,
    contactId: input.contactId,
    startTime: input.startTime,
    title: input.title,
  }
  const data = await ghlFetchLocation<{ id?: string; appointment?: { id: string } }>(
    input.locationId,
    '/calendars/events/appointments',
    { method: 'POST', body: JSON.stringify(body) },
  )
  const id = data.id ?? data.appointment?.id
  if (!id) throw new Error(`bookAppointment: no id in response: ${JSON.stringify(data)}`)
  return { id }
}
