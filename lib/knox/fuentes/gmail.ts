import { CONSULTA_GMAIL, resumirCorreos, type CorreosDeUnaCuenta } from '../correos'
import type { Correos } from '../tipos'

// El correo de Ale desde el 30/10: sus dos cuentas de Google (GOOGLE_CUENTA / GOOGLE_REFRESH_TOKEN y la segunda
// con _2), solo lectura. Si una falla, Knox habla de la otra.
const MAX_POR_CUENTA = 15

type Gmail = { messages?: { id: string }[]; resultSizeEstimate?: number }
type Mensaje = { snippet?: string; internalDate?: string; payload?: { headers?: { name: string; value: string }[] } }

function conectadas(): { cuenta: string; permiso: string }[] {
  const pares: [string | undefined, string | undefined][] = [
    [process.env.GOOGLE_CUENTA, process.env.GOOGLE_REFRESH_TOKEN],
    [process.env.GOOGLE_CUENTA_2, process.env.GOOGLE_REFRESH_TOKEN_2],
  ]
  return pares.filter((p): p is [string, string] => Boolean(p[0] && p[1])).map(([cuenta, permiso]) => ({ cuenta, permiso }))
}

export async function accesoGoogle(permiso: string): Promise<string> {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID ?? '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET ?? '',
      refresh_token: permiso,
      grant_type: 'refresh_token',
    }),
    cache: 'no-store',
  })
  const j = (await r.json()) as { access_token?: string; error?: string }
  if (!j.access_token) throw new Error(`Google no dio acceso (${j.error ?? r.status})`)
  return j.access_token
}

// Gmail manda el resumen con entidades HTML (&#39;, &amp;…)
const sinEntidades = (s: string) =>
  s.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&')

async function deUnaCuenta(cuenta: string, permiso: string): Promise<CorreosDeUnaCuenta> {
  const H = { Authorization: `Bearer ${await accesoGoogle(permiso)}` }
  const base = 'https://gmail.googleapis.com/gmail/v1/users/me/messages'
  const lista = (await fetch(`${base}?q=${encodeURIComponent(CONSULTA_GMAIL)}&maxResults=${MAX_POR_CUENTA}`, { headers: H, cache: 'no-store' }).then((r) =>
    r.json(),
  )) as Gmail
  const mensajes = await Promise.all(
    (lista.messages ?? []).map(async ({ id }) => {
      const m = (await fetch(`${base}/${id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`, { headers: H, cache: 'no-store' }).then((r) =>
        r.json(),
      )) as Mensaje
      const encabezado = (nombre: string) => m.payload?.headers?.find((h) => h.name.toLowerCase() === nombre)?.value ?? ''
      return {
        de: encabezado('from'),
        asunto: encabezado('subject'),
        resumen: sinEntidades(m.snippet ?? ''),
        en: new Date(Number(m.internalDate ?? 0)).toISOString(),
      }
    }),
  )
  return { cuenta, total: lista.resultSizeEstimate ?? mensajes.length, mensajes }
}

export async function correos(): Promise<Correos> {
  const cuentas = conectadas()
  if (!cuentas.length) throw new Error('no hay cuentas de Google conectadas')
  const resultados = await Promise.allSettled(cuentas.map((c) => deUnaCuenta(c.cuenta, c.permiso)))
  const leidas = resultados.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : []))
  if (!leidas.length) {
    const fallo = resultados.find((r) => r.status === 'rejected') as PromiseRejectedResult | undefined
    throw new Error(fallo?.reason instanceof Error ? fallo.reason.message : 'no se pudo leer el correo')
  }
  return resumirCorreos(leidas)
}
