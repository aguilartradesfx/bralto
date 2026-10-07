import type { PaymentEnvironment } from './types'

// Pruebas y producción comparten host en la pasarela: la URL nunca dice en qué modo se
// está. Cada despliegue declara qué modo espera, y si el real no coincide no se cobra.

type Env = Record<string, string | undefined>

/** Producción espera PROD; previews y local esperan TEST. PAYMENTS_EXPECTED_ENV lo fija a mano. */
export function expectedEnvironment(env: Env): PaymentEnvironment {
  const forced = env.PAYMENTS_EXPECTED_ENV?.toUpperCase()
  if (forced === 'PROD' || forced === 'TEST') return forced
  return env.VERCEL_ENV === 'production' ? 'PROD' : 'TEST'
}

/**
 * Modo que devolvió Tilopay.Init(). Lo real es `environment: "PROD" | "TEST"`; la
 * documentación describe un `test: 0 | 1` que no viene, pero se acepta por si cambia.
 * Ante la duda es producción: el default seguro, que bloquea el cobro en pruebas.
 */
export function readInitEnvironment(res: unknown): PaymentEnvironment {
  if (!res || typeof res !== 'object') return 'PROD'
  const r = res as { environment?: unknown; test?: unknown }
  if (r.environment === 'TEST' || r.environment === 'PROD') return r.environment
  if (r.environment === undefined && (r.test === 1 || r.test === '1')) return 'TEST'
  return 'PROD'
}

export function canCharge(actual: PaymentEnvironment, expected: PaymentEnvironment): boolean {
  return actual === expected
}
