import type { Money, PaymentEnvironment, PaymentOrder, PaymentStatus, TilopayInitParams } from './types'

// Adaptador de Tilopay. Comprobado contra la cuenta real (ver prompt-integrar-tilopay.md):
// - los montos van en unidades enteras de la moneda, NO en céntimos ($97 = 97);
// - las respuestas del API vienen bajo `response`, no `data`;
// - un HTTP 200 no significa éxito: siempre se mira el cuerpo;
// - pruebas y producción comparten host: el modo real lo dicen Init() y consult.
// Las credenciales viven solo en el servidor; al navegador baja el token del SDK (1 hora).

export const TILOPAY_API = 'https://app.tilopay.com/api/v1'
export const TILOPAY_SDK_URL = 'https://app.tilopay.com/sdk/v2/sdk_tpay.min.js'

// ── Lógica pura (con tests) ─────────────────────────────────────────────────────

const PHONE_COUNTRY: [string, string][] = [
  ['+506', 'CR'], ['+507', 'PA'], ['+502', 'GT'], ['+503', 'SV'], ['+504', 'HN'], ['+505', 'NI'],
  ['+593', 'EC'], ['+598', 'UY'], ['+591', 'BO'], ['+595', 'PY'], ['+52', 'MX'], ['+57', 'CO'],
  ['+54', 'AR'], ['+56', 'CL'], ['+51', 'PE'], ['+58', 'VE'], ['+34', 'ES'], ['+55', 'BR'],
  ['+44', 'GB'], ['+1', 'US'],
]

function countryFromPhone(phone: string): string {
  return PHONE_COUNTRY.find(([prefix]) => phone.startsWith(prefix))?.[1] ?? 'CR'
}

/** Parámetros de Tilopay.Init() para cobrar una orden (sin guardar la tarjeta) */
export function buildInitParams(order: PaymentOrder, opts: { token: string }): TilopayInitParams {
  return {
    token: opts.token,
    currency: order.money.currency,
    language: order.locale,
    amount: order.money.amount,
    orderNumber: order.orderNumber,
    billToFirstName: order.customer.firstName,
    billToLastName: order.customer.lastName,
    billToEmail: order.customer.email,
    // Obligatorio para Tilopay; el diagnóstico no pide dirección
    billToAddress: 'N/A',
    billToCountry: countryFromPhone(order.customer.phone),
    billToTelephone: order.customer.phone.replace(/\D/g, ''),
    capture: 1,
    subscription: 0,
    hashVersion: 'V2',
    redirect: order.returnUrl,
  }
}

type ConsultEntry = {
  orderNumber?: unknown
  amount?: unknown
  currency?: unknown
  code?: unknown
  response?: unknown
  auth?: unknown
  environment?: unknown
  type?: unknown
}

const REFUND = /refund|revers|reembols|anula|void/i

function toMoney(amount: unknown, currency: unknown): Money | null {
  // Los montos vienen como cadena ("97.00"): se pasan a centavos enteros para comparar sin flotantes
  const n = Number(String(amount ?? '').replace(/,/g, ''))
  if (!Number.isFinite(n) || typeof currency !== 'string' || !currency) return null
  return { amount: Math.round(n * 100) / 100, currency: currency.toUpperCase() }
}

function toEnvironment(value: unknown): PaymentEnvironment {
  // "Production" es producción; "Test" (o cualquier otra cosa) no lo es
  return typeof value === 'string' && /^prod/i.test(value) ? 'PROD' : 'TEST'
}

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * consult devuelve el orderNumber con el prefijo del comercio delante: se envía
 * "BRD-261007-JBMHB4C0" y vuelve "PFC030684-BRD-261007-JBMHB4C0" (comprobado con la cuenta
 * real; la documentación no lo dice). Cuenta como la misma orden solo con UN segmento delante.
 */
function sameOrder(value: unknown, orderNumber: string): boolean {
  const v = String(value ?? '')
  return v === orderNumber || new RegExp(`^[A-Za-z0-9]+-${escapeRegex(orderNumber)}$`).test(v)
}

/** Interpreta POST /api/v1/consult. Solo `response` cuenta: sin esa clave, el estado es desconocido. */
export function parseConsult(json: unknown, orderNumber: string): PaymentStatus {
  if (!json || typeof json !== 'object') return { state: 'unknown' }
  const body = json as { response?: unknown; message?: unknown }
  if (!Array.isArray(body.response)) return { state: 'unknown' }

  const entries = (body.response as ConsultEntry[]).filter((e) => e && sameOrder(e.orderNumber, orderNumber))
  if (entries.length === 0) return { state: 'not_found' }

  const isApproved = (e: ConsultEntry) => String(e.code) === '1'
  if (entries.some((e) => isApproved(e) && REFUND.test(String(e.type ?? '')))) {
    return { state: 'declined', reason: 'refunded' }
  }

  const payment = entries.find((e) => isApproved(e) && !REFUND.test(String(e.type ?? '')))
  if (payment) {
    const money = toMoney(payment.amount, payment.currency)
    if (!money) return { state: 'unknown' }
    return {
      state: 'approved',
      money,
      environment: toEnvironment(payment.environment),
      reference: String(payment.auth ?? ''),
    }
  }

  const last = entries[entries.length - 1]
  return { state: 'declined', reason: String(last.response ?? 'declined') }
}

/**
 * Vigencia de un token. El login del API la manda en segundos (86400); el del SDK, como
 * fecha exacta sin zona ("2026-10-07 16:18:37", hora de Costa Rica). No se calcula: se lee.
 */
export function parseTokenExpiry(expiresIn: unknown, now: number): number {
  if (typeof expiresIn === 'number' && Number.isFinite(expiresIn)) return now + expiresIn * 1000
  if (typeof expiresIn === 'string') {
    const m = expiresIn.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})$/)
    if (m) {
      const [, y, mo, d, h, mi, s] = m.map(Number)
      return Date.UTC(y, mo - 1, d, h + 6, mi, s) // UTC-6, sin horario de verano
    }
    if (/^\d+$/.test(expiresIn)) return now + Number(expiresIn) * 1000
  }
  return now + 5 * 60_000
}

const ORDER_SAFE = /^[A-Za-z0-9_-]{4,64}$/

/** Número de orden en el cuerpo de un webhook (solo una pista: el estado se confirma con consult) */
export function orderFromWebhook(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null
  const p = payload as Record<string, unknown>
  for (const key of ['orderNumber', 'order_number', 'order', 'orderId']) {
    const v = p[key]
    if (typeof v === 'string' || typeof v === 'number') {
      const s = String(v).trim()
      return ORDER_SAFE.test(s) ? s : null
    }
  }
  if (p.data && typeof p.data === 'object') return orderFromWebhook(p.data)
  return null
}

// ── Cliente del API ─────────────────────────────────────────────────────────────

export class TilopayConfigError extends Error {}

type Credentials = { apiUser: string; password: string; key: string }

function credentials(env: Record<string, string | undefined>): Credentials {
  const apiUser = env.TILOPAY_API_USER
  const password = env.TILOPAY_API_PASSWORD
  const key = env.TILOPAY_API_KEY
  if (!apiUser || !password || !key) throw new TilopayConfigError('Faltan TILOPAY_API_USER, TILOPAY_API_PASSWORD o TILOPAY_API_KEY')
  return { apiUser, password, key }
}

async function post(path: string, body: Record<string, unknown>, token?: string): Promise<{ status: number; json: unknown }> {
  const res = await fetch(`${TILOPAY_API}/${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  })
  const text = await res.text()
  try {
    return { status: res.status, json: JSON.parse(text) }
  } catch {
    return { status: res.status, json: text }
  }
}

function readToken(json: unknown): { token: string; expiresIn: unknown } | null {
  if (!json || typeof json !== 'object') return null
  const j = json as { access_token?: unknown; expires_in?: unknown }
  return typeof j.access_token === 'string' && j.access_token ? { token: j.access_token, expiresIn: j.expires_in } : null
}

// El token del API dura 24 h y no se puede revocar: se reusa mientras viva esta instancia
let apiToken: { value: string; expiresAt: number } | null = null

async function getApiToken(creds: Credentials): Promise<string> {
  const now = Date.now()
  if (apiToken && apiToken.expiresAt - 60_000 > now) return apiToken.value
  const { status, json } = await post('login', { apiuser: creds.apiUser, password: creds.password })
  const t = readToken(json)
  if (!t) throw new Error(`[tilopay] login falló (HTTP ${status})`)
  apiToken = { value: t.token, expiresAt: parseTokenExpiry(t.expiresIn, now) }
  return t.token
}

/** Token del SDK para Tilopay.Init() en el navegador (1 hora; uno por checkout) */
export async function getSdkToken(env: Record<string, string | undefined> = process.env): Promise<string> {
  const creds = credentials(env)
  const { status, json } = await post('loginSdk', { apiuser: creds.apiUser, password: creds.password, key: creds.key })
  const t = readToken(json)
  if (!t) throw new Error(`[tilopay] loginSdk falló (HTTP ${status})`)
  return t.token
}

/** Estado real de una orden (POST /api/v1/consult) */
export async function consultOrder(orderNumber: string, env: Record<string, string | undefined> = process.env): Promise<PaymentStatus> {
  const creds = credentials(env)
  const token = await getApiToken(creds)
  const { json } = await post('consult', { key: creds.key, orderNumber, merchantId: '' }, token)
  return parseConsult(json, orderNumber)
}

/** Respuesta cruda de consult, para soporte y verificación manual */
export async function consultOrderRaw(orderNumber: string, env: Record<string, string | undefined> = process.env): Promise<unknown> {
  const creds = credentials(env)
  const token = await getApiToken(creds)
  return (await post('consult', { key: creds.key, orderNumber, merchantId: '' }, token)).json
}
