// SERVER-ONLY — la bandeja de Zernio por su API (https://zernio.com/api/v1, docs.zernio.com): listar
// conversaciones y mensajes, y contestar. La clave va en ZERNIO_API_KEY. `fetch` se puede cambiar: en las pruebas va
// uno falso y nunca sale nada a una persona.
import type { ConversacionZernio, CuentaZernio, MensajeZernio } from './tipos.ts'

const BASE = 'https://zernio.com/api/v1'
const ESPERA_MS = 30_000

type Fetch = typeof fetch

// Lo que contestó Zernio al mandar. ok: lo aceptó (no quiere decir que ya llegó)
export type ResultadoEnvio =
  | { ok: true; mensajeId: string | null }
  | { ok: false; status: number; codigo: string | null; detalle: string; codigoRed: number | null; subcodigoRed: number | null }

export interface CuerpoEnvio {
  accountId: string
  message: string
  // Instagram y Messenger, después de 24 h y hasta 7 días: solo lo que escribe una persona (Ale), nunca Knox
  messageTag?: 'HUMAN_AGENT'
  messagingType?: 'MESSAGE_TAG'
}

export interface ClienteZernio {
  conversaciones(o?: { cursor?: string | null; limite?: number }): Promise<{ conversaciones: ConversacionZernio[]; siguiente: string | null }>
  mensajes(
    conversacionId: string,
    cuentaId: string,
    o?: { cursor?: string | null; limite?: number; orden?: 'asc' | 'desc' },
  ): Promise<{ mensajes: MensajeZernio[]; siguiente: string | null }>
  enviar(conversacionId: string, cuerpo: CuerpoEnvio, clave: string): Promise<ResultadoEnvio>
  cuentas(): Promise<CuentaZernio[]>
}

export class ErrorZernio extends Error {
  status: number
  constructor(mensaje: string, status: number) {
    super(mensaje)
    this.status = status
  }
}

const objeto = (v: unknown) => (typeof v === 'object' && v !== null && !Array.isArray(v) ? (v as Record<string, unknown>) : {})
const texto = (v: unknown) => (typeof v === 'string' ? v : null)
const numero = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) ? v : null)

export function clienteZernio({ clave, fetch: f = fetch }: { clave: string; fetch?: Fetch }): ClienteZernio {
  const encabezados = { Authorization: `Bearer ${clave}` }

  async function leer(ruta: string): Promise<Record<string, unknown>> {
    const res = await f(`${BASE}${ruta}`, { headers: encabezados, cache: 'no-store', signal: AbortSignal.timeout(ESPERA_MS) })
    const cuerpo = objeto(await res.json().catch(() => ({})))
    if (!res.ok) throw new ErrorZernio(`Zernio ${ruta.split('?')[0]}: HTTP ${res.status} ${String(cuerpo.error ?? '').slice(0, 200)}`, res.status)
    return cuerpo
  }

  return {
    async conversaciones({ cursor = null, limite = 100 } = {}) {
      const p = new URLSearchParams({ status: 'active', limit: String(limite) })
      if (cursor) p.set('cursor', cursor)
      const r = await leer(`/inbox/conversations?${p}`)
      return {
        conversaciones: Array.isArray(r.data) ? (r.data as ConversacionZernio[]) : [],
        siguiente: objeto(r.pagination).hasMore ? texto(objeto(r.pagination).nextCursor) : null,
      }
    },

    async mensajes(conversacionId, cuentaId, { cursor = null, limite = 100, orden = 'desc' } = {}) {
      const p = new URLSearchParams({ accountId: cuentaId, limit: String(limite), sortOrder: orden })
      if (cursor) p.set('cursor', cursor)
      const r = await leer(`/inbox/conversations/${encodeURIComponent(conversacionId)}/messages?${p}`)
      return {
        mensajes: Array.isArray(r.messages) ? (r.messages as MensajeZernio[]) : [],
        siguiente: objeto(r.pagination).hasMore ? texto(objeto(r.pagination).nextCursor) : null,
      }
    },

    // Una clave de idempotencia por envío: si la respuesta se pierde y se vuelve a pedir, Zernio no lo manda dos veces
    async enviar(conversacionId, cuerpo, claveEnvio) {
      let res: Response
      try {
        res = await f(`${BASE}/inbox/conversations/${encodeURIComponent(conversacionId)}/messages`, {
          method: 'POST',
          headers: { ...encabezados, 'Content-Type': 'application/json', 'Idempotency-Key': claveEnvio },
          body: JSON.stringify(cuerpo),
          cache: 'no-store',
          signal: AbortSignal.timeout(ESPERA_MS),
        })
      } catch (err) {
        return { ok: false, status: 0, codigo: 'sin_conexion', detalle: err instanceof Error ? err.message : String(err), codigoRed: null, subcodigoRed: null }
      }
      const r = objeto(await res.json().catch(() => ({})))
      if (res.ok) return { ok: true, mensajeId: texto(objeto(r.data).messageId) }
      const red = objeto(r.platformError)
      return {
        ok: false,
        status: res.status,
        codigo: texto(r.code),
        detalle: String(texto(r.error) ?? texto(r.message) ?? '').slice(0, 300),
        codigoRed: numero(red.code),
        subcodigoRed: numero(red.subcode),
      }
    },

    async cuentas() {
      const r = await leer('/accounts')
      return Array.isArray(r.accounts) ? (r.accounts as CuentaZernio[]) : []
    },
  }
}

// El cliente con la clave del entorno
export function clienteDelEntorno(): ClienteZernio {
  const clave = process.env.ZERNIO_API_KEY
  if (!clave) throw new Error('falta ZERNIO_API_KEY')
  return clienteZernio({ clave })
}
