// Google Calendar para la agenda. El acceso de cada cuenta se pide con su permiso guardado (refresh token) y se
// guarda en memoria hasta que vence. Sin dependencias y con fetch inyectable: las pruebas usan uno falso
// (google.test.ts). Las cuentas salen del entorno: GOOGLE_CUENTA + GOOGLE_REFRESH_TOKEN, GOOGLE_CUENTA_2 + …_2, etc.
// Nada de esto le manda correos a nadie: Google trabaja con sendUpdates=none y los avisos salen por Resend.
import type { Ocupado } from './reglas.ts'

const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const API = 'https://www.googleapis.com/calendar/v3'

export type CuentaGoogle = { correo: string; refresh: string }

type Entorno = Record<string, string | undefined>

/** Las cuentas conectadas, en orden: GOOGLE_CUENTA, GOOGLE_CUENTA_2, GOOGLE_CUENTA_3… */
export function cuentasDelEntorno(env: Entorno): CuentaGoogle[] {
  const cuentas: CuentaGoogle[] = []
  for (let n = 1; n <= 9; n++) {
    const sufijo = n === 1 ? '' : `_${n}`
    const correo = env[`GOOGLE_CUENTA${sufijo}`]?.trim().toLowerCase()
    const refresh = env[`GOOGLE_REFRESH_TOKEN${sufijo}`]?.trim()
    if (correo && refresh) cuentas.push({ correo, refresh })
  }
  return cuentas
}

/** Dónde se crean las citas: AGENDA_CUENTA o, si no está, la cuenta de la empresa (la que termina en @bralto.io) */
export function cuentaDeLaAgenda(cuentas: CuentaGoogle[], env: Entorno): CuentaGoogle | null {
  const elegida = env.AGENDA_CUENTA?.trim().toLowerCase()
  if (elegida) return cuentas.find((c) => c.correo === elegida) ?? null
  return cuentas.find((c) => c.correo.endsWith('@bralto.io')) ?? null
}

export class ErrorGoogle extends Error {
  status: number
  constructor(mensaje: string, status: number) {
    super(mensaje)
    this.name = 'ErrorGoogle'
    this.status = status
  }
}

export type HoraGoogle = { dateTime?: string; date?: string; timeZone?: string }

export type EventoGoogle = {
  id: string
  iCalUID?: string
  status?: string // confirmed | tentative | cancelled
  summary?: string
  description?: string
  start?: HoraGoogle
  end?: HoraGoogle
  eventType?: string // default | outOfOffice | focusTime | workingLocation | fromGmail | birthday
  transparency?: string
  attendees?: { email?: string; displayName?: string; self?: boolean; responseStatus?: string }[]
  hangoutLink?: string
  htmlLink?: string
  conferenceData?: {
    createRequest?: { status?: { statusCode?: string } }
    entryPoints?: { entryPointType?: string; uri?: string }[]
  }
  extendedProperties?: { private?: Record<string, string> }
}

export type EventoNuevo = {
  id?: string
  summary: string
  description?: string
  start: HoraGoogle
  end: HoraGoogle
  attendees?: { email: string; displayName?: string }[]
  conferenceData?: { createRequest: { requestId: string; conferenceSolutionKey: { type: 'hangoutsMeet' } } }
  guestsCanInviteOthers?: boolean
  extendedProperties?: { private?: Record<string, string> }
  reminders?: { useDefault: boolean }
}

/** El enlace de Meet de un evento, si ya está listo */
export function enlaceMeet(e: Pick<EventoGoogle, 'hangoutLink' | 'conferenceData'>): string | null {
  return e.hangoutLink ?? e.conferenceData?.entryPoints?.find((p) => p.entryPointType === 'video')?.uri ?? null
}

type Opciones = {
  clientId: string
  clientSecret: string
  fetch?: typeof fetch
  ahora?: () => number
  esperar?: (ms: number) => Promise<void>
  msLimite?: number // cuánto se espera cada respuesta de Google
}

const iso = (ms: number) => new Date(ms).toISOString()
const yaNoEsta = (err: unknown) => err instanceof ErrorGoogle && (err.status === 404 || err.status === 410)

export function clienteGoogle(o: Opciones) {
  const pedir = o.fetch ?? fetch
  const ahora = o.ahora ?? Date.now
  const esperar = o.esperar ?? ((ms: number) => new Promise<void>((ok) => setTimeout(ok, ms)))
  const limite = o.msLimite ?? 10_000
  const accesos = new Map<string, { token: string; vence: number }>()

  async function acceso(c: CuentaGoogle): Promise<string> {
    const guardado = accesos.get(c.correo)
    if (guardado && guardado.vence > ahora()) return guardado.token
    const res = await pedir(TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: o.clientId,
        client_secret: o.clientSecret,
        refresh_token: c.refresh,
        grant_type: 'refresh_token',
      }).toString(),
      signal: AbortSignal.timeout(limite),
    })
    const j = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error?: string; error_description?: string }
    if (!res.ok || !j.access_token) {
      // invalid_grant: el permiso se revocó o venció; hay que volver a conectar la cuenta
      const detalle = j.error_description ? ` (${j.error_description})` : ''
      throw new ErrorGoogle(`Google no dio acceso a ${c.correo}: ${j.error ?? `HTTP ${res.status}`}${detalle}`, res.status)
    }
    // Se pide otro un minuto antes de que venza
    accesos.set(c.correo, { token: j.access_token, vence: ahora() + ((j.expires_in ?? 3600) - 60) * 1000 })
    return j.access_token
  }

  async function api<T>(c: CuentaGoogle, metodo: string, ruta: string, op: { query?: Record<string, string>; cuerpo?: unknown } = {}): Promise<T> {
    const token = await acceso(c)
    const url = `${API}${ruta}${op.query ? `?${new URLSearchParams(op.query)}` : ''}`
    const res = await pedir(url, {
      method: metodo,
      headers: { Authorization: `Bearer ${token}`, ...(op.cuerpo === undefined ? {} : { 'Content-Type': 'application/json' }) },
      body: op.cuerpo === undefined ? undefined : JSON.stringify(op.cuerpo),
      signal: AbortSignal.timeout(limite),
    })
    if (res.status === 204) return undefined as T
    const j = (await res.json().catch(() => null)) as (T & { error?: { message?: string } }) | null
    if (!res.ok) {
      // Un acceso que Google ya no acepta se olvida: el próximo pedido trae uno nuevo
      if (res.status === 401) accesos.delete(c.correo)
      throw new ErrorGoogle(`Google Calendar ${metodo} ${ruta}: ${j?.error?.message ?? `HTTP ${res.status}`}`, res.status)
    }
    return j as T
  }

  const rutaEvento = (id: string) => `/calendars/primary/events/${encodeURIComponent(id)}`

  async function leer(c: CuentaGoogle, id: string): Promise<EventoGoogle | null> {
    try {
      return await api<EventoGoogle>(c, 'GET', rutaEvento(id))
    } catch (err) {
      if (yaNoEsta(err)) return null
      throw err
    }
  }

  return {
    /** Lo ocupado en el calendario principal de la cuenta (freeBusy). Lanza si Google no lo pudo leer */
    async ocupado(c: CuentaGoogle, desde: number, hasta: number): Promise<Ocupado[]> {
      type Respuesta = { calendars?: Record<string, { busy?: { start: string; end: string }[]; errors?: { reason?: string }[] }> }
      const j = await api<Respuesta>(c, 'POST', '/freeBusy', {
        cuerpo: { timeMin: iso(desde), timeMax: iso(hasta), items: [{ id: 'primary' }] },
      })
      const cal = j?.calendars?.primary
      if (!cal) throw new ErrorGoogle(`freeBusy no trajo el calendario de ${c.correo}`, 502)
      if (cal.errors?.length) throw new ErrorGoogle(`freeBusy de ${c.correo}: ${cal.errors.map((e) => e.reason).join(', ')}`, 502)
      return (cal.busy ?? []).map((b) => ({ inicio: Date.parse(b.start), fin: Date.parse(b.end) }))
    },

    /** Los eventos del calendario principal entre dos momentos; los que se repiten, uno por vez */
    async eventos(c: CuentaGoogle, desde: number, hasta: number): Promise<EventoGoogle[]> {
      const todos: EventoGoogle[] = []
      let pagina: string | undefined
      for (let vuelta = 0; vuelta < 10; vuelta++) {
        const j = await api<{ items?: EventoGoogle[]; nextPageToken?: string }>(c, 'GET', '/calendars/primary/events', {
          query: {
            singleEvents: 'true',
            orderBy: 'startTime',
            timeMin: iso(desde),
            timeMax: iso(hasta),
            maxResults: '250',
            ...(pagina ? { pageToken: pagina } : {}),
          },
        })
        todos.push(...(j?.items ?? []))
        pagina = j?.nextPageToken
        if (!pagina) break
      }
      return todos
    },

    /** Un evento por su id; null si no existe */
    leer,

    /**
     * Crea un evento en el calendario principal, sin correos de Google. Con Meet, espera el enlace si Google lo dejó
     * pendiente. Si ya existía uno con ese id (un reintento), devuelve ese en vez de crear otro.
     */
    async crear(c: CuentaGoogle, evento: EventoNuevo): Promise<EventoGoogle> {
      const query: Record<string, string> = { sendUpdates: 'none', ...(evento.conferenceData ? { conferenceDataVersion: '1' } : {}) }
      let creado: EventoGoogle
      try {
        creado = await api<EventoGoogle>(c, 'POST', '/calendars/primary/events', { query, cuerpo: evento })
      } catch (err) {
        if (!(err instanceof ErrorGoogle && err.status === 409 && evento.id)) throw err
        const existente = await leer(c, evento.id)
        if (!existente) throw err
        creado = existente
      }
      for (let i = 0; i < 5 && evento.conferenceData && !enlaceMeet(creado); i++) {
        if (creado.conferenceData?.createRequest?.status?.statusCode !== 'pending') break
        await esperar(1000)
        creado = (await leer(c, creado.id)) ?? creado
      }
      return creado
    },

    /** Lleva un evento a otra hora, sin correos de Google */
    async mover(c: CuentaGoogle, id: string, inicio: HoraGoogle, fin: HoraGoogle): Promise<EventoGoogle> {
      return api<EventoGoogle>(c, 'PATCH', rutaEvento(id), { query: { sendUpdates: 'none' }, cuerpo: { start: inicio, end: fin } })
    },

    /** Cancela (borra) un evento, sin correos de Google. Si ya no estaba, no pasa nada */
    async cancelar(c: CuentaGoogle, id: string): Promise<void> {
      try {
        await api<void>(c, 'DELETE', rutaEvento(id), { query: { sendUpdates: 'none' } })
      } catch (err) {
        if (!yaNoEsta(err)) throw err
      }
    },
  }
}

export type ClienteGoogle = ReturnType<typeof clienteGoogle>
