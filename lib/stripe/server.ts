// Minimal Stripe helpers — webhook signature verification and REST calls.
// No SDK dependency: keeps the bundle small and runs on any Vercel runtime.

const STRIPE_API_BASE = 'https://api.stripe.com/v1'

export class StripeConfigError extends Error {}
export class StripeSignatureError extends Error {}
export class StripeApiError extends Error {
  constructor(message: string, public readonly status: number, public readonly body: unknown) {
    super(message)
  }
}

function getSecretKey(): string {
  const key = process.env.STRIPE_SECRET_KEY
  if (!key) throw new StripeConfigError('Missing STRIPE_SECRET_KEY')
  return key
}

function getWebhookSecret(): string {
  const secret = process.env.STRIPE_WEBHOOK_SECRET
  if (!secret) throw new StripeConfigError('Missing STRIPE_WEBHOOK_SECRET')
  return secret
}

// Constant-time hex comparison.
function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

export type StripeEvent = {
  id: string
  type: string
  livemode: boolean
  data: { object: Record<string, unknown> }
  created: number
}

// Verifies the `stripe-signature` header against the raw request body.
// Throws StripeSignatureError on mismatch / expiry.
export async function verifyStripeSignature(opts: {
  rawBody: string
  signatureHeader: string | null
  toleranceSeconds?: number
}): Promise<StripeEvent> {
  const { rawBody, signatureHeader, toleranceSeconds = 300 } = opts
  if (!signatureHeader) {
    throw new StripeSignatureError('Missing stripe-signature header')
  }

  const secret = getWebhookSecret()

  // Header format: t=<ts>,v1=<sig>,v1=<sig>,v0=<sig>
  const parts = signatureHeader.split(',').map((p) => p.trim())
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2)
  const v1Signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3))

  if (!timestamp || v1Signatures.length === 0) {
    throw new StripeSignatureError('Malformed stripe-signature header')
  }

  const tsNum = Number.parseInt(timestamp, 10)
  if (!Number.isFinite(tsNum)) {
    throw new StripeSignatureError('Invalid timestamp in stripe-signature')
  }
  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - tsNum)
  if (ageSeconds > toleranceSeconds) {
    throw new StripeSignatureError(`Timestamp outside tolerance window (${ageSeconds}s)`)
  }

  const expected = await hmacSha256Hex(secret, `${timestamp}.${rawBody}`)
  const ok = v1Signatures.some((sig) => timingSafeEqualHex(sig, expected))
  if (!ok) {
    throw new StripeSignatureError('Signature mismatch')
  }

  return JSON.parse(rawBody) as StripeEvent
}

// Thin REST helper for the few Stripe endpoints we need server-side.
export async function stripeApi<T = unknown>(
  path: string,
  init: { method?: 'GET' | 'POST'; query?: Record<string, string>; body?: Record<string, unknown> } = {},
): Promise<T> {
  const { method = 'GET', query, body } = init
  const key = getSecretKey()

  let url = `${STRIPE_API_BASE}${path}`
  if (query) {
    const qs = new URLSearchParams(query).toString()
    url += url.includes('?') ? `&${qs}` : `?${qs}`
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${key}`,
    Accept: 'application/json',
  }

  let bodyStr: string | undefined
  if (body && method !== 'GET') {
    headers['Content-Type'] = 'application/x-www-form-urlencoded'
    bodyStr = serializeStripeForm(body)
  }

  const res = await fetch(url, { method, headers, body: bodyStr })
  const json = (await res.json()) as T & { error?: { message?: string } }
  if (!res.ok) {
    const msg = (json as { error?: { message?: string } }).error?.message ?? 'unknown'
    throw new StripeApiError(`Stripe ${method} ${path} → ${res.status}: ${msg}`, res.status, json)
  }
  return json
}

// Stripe uses bracket-notation form encoding for nested objects.
function serializeStripeForm(body: Record<string, unknown>, prefix = ''): string {
  const parts: string[] = []
  for (const [k, v] of Object.entries(body)) {
    const key = prefix ? `${prefix}[${k}]` : k
    if (v === null || v === undefined) continue
    if (typeof v === 'object' && !Array.isArray(v)) {
      parts.push(serializeStripeForm(v as Record<string, unknown>, key))
    } else if (Array.isArray(v)) {
      v.forEach((item, idx) => {
        if (typeof item === 'object' && item !== null) {
          parts.push(serializeStripeForm(item as Record<string, unknown>, `${key}[${idx}]`))
        } else {
          parts.push(`${encodeURIComponent(`${key}[${idx}]`)}=${encodeURIComponent(String(item))}`)
        }
      })
    } else {
      parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(v))}`)
    }
  }
  return parts.filter(Boolean).join('&')
}
