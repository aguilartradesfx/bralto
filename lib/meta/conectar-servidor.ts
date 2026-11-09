import { createServiceClient } from '@/lib/supabase/service'
import { cifrar } from './cifrado.ts'
import { REDIRECCION, VERSION_GRAPH, leerCuentas, type Cuenta } from './conectar.ts'

// Lo de «Conectar cuentas» que habla con Meta y con la base. Nunca se escribe una clave en los registros.

const GRAPH = `https://graph.facebook.com/${VERSION_GRAPH}`
// Lo que Meta le avisa a la app de cada página: comentarios, mensajes, ecos y botones
const CAMPOS_AVISOS = 'feed,messages,message_echoes,messaging_postbacks'

export type Invitacion = { codigo: string; cliente: string; expira_en: string }
export type CuentaConectada = { pagina_id: string; pagina_nombre: string; instagram_usuario: string | null }

function requerida(nombre: string): string {
  const valor = process.env[nombre]
  if (!valor) throw new Error(`Falta ${nombre}`)
  return valor
}

async function pedir(url: string, init?: RequestInit): Promise<unknown> {
  const r = await fetch(url, { ...init, cache: 'no-store', signal: AbortSignal.timeout(20_000) })
  const cuerpo = (await r.json().catch(() => null)) as { error?: { message?: string; code?: number } } | null
  if (!r.ok) throw new Error(`Meta contestó ${r.status} (${cuerpo?.error?.code ?? 's/c'}): ${cuerpo?.error?.message ?? 'sin detalle'}`)
  return cuerpo
}

async function cambiarToken(params: Record<string, string>): Promise<string> {
  const r = (await pedir(`${GRAPH}/oauth/access_token?${new URLSearchParams(params)}`)) as { access_token?: unknown }
  if (typeof r?.access_token !== 'string') throw new Error('Meta no devolvió la clave')
  return r.access_token
}

export async function buscarInvitacion(codigo: string): Promise<Invitacion | null> {
  const { data, error } = await createServiceClient()
    .from('meta_invitaciones')
    .select('codigo, cliente, expira_en')
    .eq('codigo', codigo)
    .maybeSingle()
  if (error) throw new Error(`No se pudo leer la invitación: ${error.message}`)
  return data
}

export async function cuentasDeInvitacion(codigo: string): Promise<CuentaConectada[]> {
  const { data, error } = await createServiceClient()
    .from('meta_conexiones')
    .select('pagina_id, pagina_nombre, instagram_usuario')
    .eq('invitacion', codigo)
    .eq('estado', 'activa')
    .order('conectada_en')
  if (error) throw new Error(`No se pudieron leer las cuentas: ${error.message}`)
  return data ?? []
}

async function suscribirAvisos(c: Cuenta): Promise<boolean> {
  try {
    await pedir(`${GRAPH}/${c.paginaId}/subscribed_apps`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ subscribed_fields: CAMPOS_AVISOS, access_token: c.token }),
    })
    return true
  } catch (e) {
    // La cuenta queda conectada igual: los avisos se pueden volver a pedir sin molestar al cliente
    console.error(`[meta/conectar] la página ${c.paginaId} no quedó suscrita`, e instanceof Error ? e.message : e)
    return false
  }
}

// Cambia el código de Facebook por la clave larga, guarda cada página cifrada y la suscribe a los avisos.
// Devuelve cuántas cuentas quedaron conectadas (0: Facebook no mostró ninguna página).
export async function completarConexion(code: string, invitacion: Invitacion): Promise<number> {
  const client_id = requerida('META_APP_ID')
  const client_secret = requerida('META_APP_SECRET')
  const claveTokens = requerida('META_TOKENS_KEY')

  const corta = await cambiarToken({ client_id, client_secret, redirect_uri: REDIRECCION, code })
  const larga = await cambiarToken({ grant_type: 'fb_exchange_token', client_id, client_secret, fb_exchange_token: corta })
  const q = new URLSearchParams({
    fields: 'id,name,access_token,instagram_business_account{id,username}',
    limit: '100',
    access_token: larga,
  })
  const cuentas = leerCuentas(await pedir(`${GRAPH}/me/accounts?${q}`))
  if (cuentas.length === 0) return 0

  const db = createServiceClient()
  for (const c of cuentas) {
    const avisos_activos = await suscribirAvisos(c)
    const { error } = await db.from('meta_conexiones').upsert(
      {
        pagina_id: c.paginaId,
        pagina_nombre: c.nombre,
        instagram_id: c.instagramId,
        instagram_usuario: c.instagramUsuario,
        token_cifrado: cifrar(c.token, claveTokens),
        cliente: invitacion.cliente,
        invitacion: invitacion.codigo,
        estado: 'activa',
        avisos_activos,
        actualizada_en: new Date().toISOString(),
      },
      { onConflict: 'pagina_id' },
    )
    if (error) throw new Error(`No se pudo guardar la cuenta: ${error.message}`)
  }

  const { error } = await db.from('meta_invitaciones').update({ usada_en: new Date().toISOString() }).eq('codigo', invitacion.codigo)
  if (error) console.error('[meta/conectar] no se pudo marcar la invitación', error.message)
  return cuentas.length
}
