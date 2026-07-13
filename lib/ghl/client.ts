import { createServiceClient } from '@/lib/supabase/service'

const GHL_API_BASE = 'https://services.leadconnectorhq.com'
const GHL_TOKEN_URL = `${GHL_API_BASE}/oauth/token`
const GHL_LOCATION_TOKEN_URL = `${GHL_API_BASE}/oauth/locationToken`
const GHL_API_VERSION = '2021-07-28'

export type AppKind = 'agency' | 'subaccount'

export type GhlTokenResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
  scope?: string
  userType?: 'Company' | 'Location'
  companyId?: string
  locationId?: string
}

export type StoredTokens = {
  id: string
  company_id: string
  location_id: string | null
  user_type: 'Company' | 'Location'
  access_token: string
  refresh_token: string
  expires_at: string
  scope: string | null
}

export class GhlConfigError extends Error {}
export class GhlAuthError extends Error {}
export class GhlApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly body: unknown) {
    super(message)
  }
}

function getOauthEnv(kind: AppKind) {
  if (kind === 'agency') {
    const clientId = process.env.HIGHLEVEL_AGENCY_CLIENT_ID
    const clientSecret = process.env.HIGHLEVEL_AGENCY_CLIENT_SECRET
    if (!clientId || !clientSecret) {
      throw new GhlConfigError('Missing HIGHLEVEL_AGENCY_CLIENT_ID/SECRET')
    }
    return { clientId, clientSecret, userType: 'Company' as const }
  }
  const clientId = process.env.HIGHLEVEL_SUBACCOUNT_CLIENT_ID
  const clientSecret = process.env.HIGHLEVEL_SUBACCOUNT_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    throw new GhlConfigError('Missing HIGHLEVEL_SUBACCOUNT_CLIENT_ID/SECRET')
  }
  return { clientId, clientSecret, userType: 'Location' as const }
}

// ── OAuth: code exchange & refresh ──────────────────────────────────────────

export async function exchangeAuthCode(
  kind: AppKind,
  code: string,
  redirectUri: string,
): Promise<GhlTokenResponse> {
  const { clientId, clientSecret, userType } = getOauthEnv(kind)

  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: redirectUri,
    user_type: userType,
  })

  const res = await fetch(GHL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: form.toString(),
  })
  const data = (await res.json()) as GhlTokenResponse & { error?: string; message?: string }
  if (!res.ok) {
    throw new GhlAuthError(
      `GHL token exchange (${kind}) failed: ${res.status} ${data.message ?? data.error ?? ''}`,
    )
  }
  return data
}

async function refreshAccessToken(kind: AppKind, refreshToken: string): Promise<GhlTokenResponse> {
  const { clientId, clientSecret, userType } = getOauthEnv(kind)

  const form = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    user_type: userType,
  })

  const res = await fetch(GHL_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Accept: 'application/json' },
    body: form.toString(),
  })
  const data = (await res.json()) as GhlTokenResponse & { error?: string; message?: string }
  if (!res.ok) {
    throw new GhlAuthError(
      `GHL refresh (${kind}) failed: ${res.status} ${data.message ?? data.error ?? ''}`,
    )
  }
  return data
}

export async function saveTokens(kind: AppKind, token: GhlTokenResponse): Promise<StoredTokens> {
  if (!token.companyId) throw new GhlAuthError('GHL token response missing companyId')
  if (kind === 'subaccount' && !token.locationId) {
    throw new GhlAuthError('Sub-account install token missing locationId')
  }
  if (!token.refresh_token) {
    throw new GhlAuthError('GHL token response missing refresh_token')
  }

  const userType: 'Company' | 'Location' = kind === 'agency' ? 'Company' : 'Location'
  const supabase = createServiceClient()
  const expiresAt = new Date(Date.now() + token.expires_in * 1000).toISOString()

  // Manual upsert: delete the existing matching row, then insert. Postgres
  // partial-unique indexes don't work with onConflict in supabase-js.
  const matchQuery = supabase
    .from('ghl_oauth_tokens')
    .delete()
    .eq('company_id', token.companyId)
    .eq('user_type', userType)
  if (userType === 'Location') {
    await matchQuery.eq('location_id', token.locationId!)
  } else {
    await matchQuery.is('location_id', null)
  }

  const { data, error } = await supabase
    .from('ghl_oauth_tokens')
    .insert({
      company_id: token.companyId,
      location_id: userType === 'Location' ? token.locationId : null,
      user_type: userType,
      access_token: token.access_token,
      refresh_token: token.refresh_token,
      expires_at: expiresAt,
      scope: token.scope ?? null,
    })
    .select()
    .single()

  if (error || !data) {
    throw new GhlAuthError(`Failed to persist GHL tokens: ${error?.message ?? 'no data'}`)
  }
  return data as StoredTokens
}

// ── Token retrieval ─────────────────────────────────────────────────────────

const REFRESH_SKEW_MS = 60_000

async function ensureFresh(kind: AppKind, stored: StoredTokens): Promise<string> {
  if (new Date(stored.expires_at).getTime() - REFRESH_SKEW_MS > Date.now()) {
    return stored.access_token
  }
  const refreshed = await refreshAccessToken(kind, stored.refresh_token)
  const updated = await saveTokens(kind, {
    ...refreshed,
    companyId: refreshed.companyId ?? stored.company_id,
    locationId: refreshed.locationId ?? stored.location_id ?? undefined,
  })
  return updated.access_token
}

export async function getAgencyAccessToken(companyId?: string): Promise<string> {
  const supabase = createServiceClient()
  let q = supabase
    .from('ghl_oauth_tokens')
    .select('*')
    .eq('user_type', 'Company')
    .is('location_id', null)
  if (companyId) q = q.eq('company_id', companyId)
  const { data, error } = await q.order('updated_at', { ascending: false }).limit(1).maybeSingle()
  if (error || !data) {
    throw new GhlAuthError(
      `No agency token stored. Install the agency app first. ${error?.message ?? ''}`,
    )
  }
  return ensureFresh('agency', data as StoredTokens)
}

// Get a location-scoped token. Prefer the stored Sub-account app install for
// this location; if not present, mint one from the Agency token (short-lived).
export async function getLocationAccessToken(locationId: string): Promise<string> {
  if (!locationId) throw new GhlAuthError('getLocationAccessToken: locationId required')

  const supabase = createServiceClient()
  const { data } = await supabase
    .from('ghl_oauth_tokens')
    .select('*')
    .eq('user_type', 'Location')
    .eq('location_id', locationId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (data) return ensureFresh('subaccount', data as StoredTokens)
  return mintLocationTokenFromAgency(locationId)
}

// Exchange an Agency token for a one-shot Location token via /oauth/locationToken.
// Used right after creating a new sub-account where the Sub-account app isn't
// installed yet (so no stored refresh_token exists).
export async function mintLocationTokenFromAgency(locationId: string): Promise<string> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('ghl_oauth_tokens')
    .select('*')
    .eq('user_type', 'Company')
    .is('location_id', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!data) {
    throw new GhlAuthError('No agency token stored. Install the agency app first.')
  }
  const agencyToken = await getAgencyAccessToken(data.company_id)

  const form = new URLSearchParams({ companyId: data.company_id, locationId })
  const res = await fetch(GHL_LOCATION_TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${agencyToken}`,
      'Content-Type': 'application/x-www-form-urlencoded',
      Version: GHL_API_VERSION,
      Accept: 'application/json',
    },
    body: form.toString(),
  })
  const body = (await res.json()) as { access_token?: string; message?: string }
  if (!res.ok || !body.access_token) {
    throw new GhlAuthError(
      `GHL mint location token failed: ${res.status} ${body.message ?? JSON.stringify(body)}`,
    )
  }
  return body.access_token
}

// ── Authenticated fetch wrappers ─────────────────────────────────────────────

type GhlFetchInit = Omit<RequestInit, 'headers'> & { headers?: Record<string, string> }

async function rawGhlFetch<T>(token: string, path: string, init: GhlFetchInit): Promise<T> {
  const url = path.startsWith('http') ? path : `${GHL_API_BASE}${path}`
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      Version: GHL_API_VERSION,
      Accept: 'application/json',
      ...(init.body && !(init.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...init.headers,
    },
  })
  if (!res.ok) {
    let body: unknown = null
    try { body = await res.json() } catch { try { body = await res.text() } catch { /* */ } }
    throw new GhlApiError(`GHL ${init.method ?? 'GET'} ${path} → ${res.status}`, res.status, body)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export async function ghlFetchAgency<T = unknown>(
  path: string,
  init: GhlFetchInit = {},
): Promise<T> {
  const token = await getAgencyAccessToken()
  return rawGhlFetch<T>(token, path, init)
}

export async function ghlFetchLocation<T = unknown>(
  locationId: string,
  path: string,
  init: GhlFetchInit = {},
): Promise<T> {
  const token = await getLocationAccessToken(locationId)
  return rawGhlFetch<T>(token, path, init)
}

// ── Install URL helper (for the admin UI) ───────────────────────────────────

export function buildOAuthInstallUrl(kind: AppKind, redirectUri: string, scopes: string[]): string {
  const { clientId } = getOauthEnv(kind)
  const params = new URLSearchParams({
    response_type: 'code',
    redirect_uri: redirectUri,
    client_id: clientId,
    scope: scopes.join(' '),
  })
  return `https://marketplace.leadconnectorhq.com/oauth/chooselocation?${params.toString()}`
}
