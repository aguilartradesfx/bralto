// SERVER-ONLY — las pruebas de conexión del Centro de mando (el panel 08 de Hoy y la vista Conexiones). Cada prueba se
// guarda entre 5 y 10 minutos (si falla, solo 1 minuto). Nada de lo que responden afuera llega tal cual a la pantalla:
// Meta mete el token en sus enlaces de paginación y Telegram lo lleva en la dirección.
import { createServiceClient } from '@/lib/supabase/service'
import { accesoGoogle } from '@/lib/knox/fuentes/gmail'
import { graph } from '@/lib/knox/fuentes/redes'
import { clienteDelEntorno } from '@/lib/zernio/cliente'
import { whatsappConectado, type CuentaZernioMin } from '@/lib/knox/centro/armar'
import { cuantasCuentas, detalleVoz, estadoBandeja, motivo } from '@/lib/knox/centro/conexiones'
import { entero } from '@/lib/knox/centro/formato'
import { conTope, MIN } from '@/lib/knox/centro/memoria'
import type { Chequeo, EstadoChequeo } from '@/lib/knox/centro/tipos'

type Resultado = { estado: EstadoChequeo; detalle: string; uso?: Chequeo['uso'] }
type Revisado = Resultado & { revisado: string }

const SITIO = 'https://www.bralto.io'
const FALLA_MS = MIN

const guardado = new Map<string, { hasta: number; valor: Promise<Revisado> }>()

// La prueba con su hora. Lo que sale bien se guarda `ms`; lo que falla, un minuto (para volver a probar pronto)
function revisar(clave: string, ms: number, probar: () => Promise<Resultado>): Promise<Revisado> {
  const g = guardado.get(clave)
  if (g && g.hasta > Date.now()) return g.valor
  const valor = (async (): Promise<Revisado> => {
    try {
      return { ...(await conTope(probar(), 10_000)), revisado: new Date().toISOString() }
    } catch (err) {
      return { estado: 'caido', detalle: motivo(err), revisado: new Date().toISOString() }
    }
  })()
  guardado.set(clave, { hasta: Date.now() + ms, valor })
  void valor.then((r) => {
    if (r.estado === 'caido' && guardado.get(clave)?.valor === valor) guardado.set(clave, { hasta: Date.now() + FALLA_MS, valor })
  })
  return valor
}

const token = () => process.env.META_ACCESS_TOKEN

async function instagram(id: string | undefined): Promise<Resultado> {
  const t = token()
  if (!t || !id) return { estado: 'por-conectar', detalle: 'Falta la cuenta en el panel' }
  const p = await graph<{ username?: string; followers_count?: number }>(`${id}?fields=username,followers_count`, t)
  return { estado: 'conectado', detalle: `@${p.username ?? '—'} · ${entero(p.followers_count ?? 0)} seguidores` }
}

// Solo las páginas propias: el token también ve páginas de clientes
async function facebook(): Promise<Resultado> {
  const t = token()
  const propias = [process.env.META_FB_PAGE_ID, process.env.META_FB_BRALTO_PAGE_ID].filter((x): x is string => !!x)
  if (!t || propias.length === 0) return { estado: 'por-conectar', detalle: 'Falta la página en el panel' }
  const r = await graph<{ data?: { id: string; name?: string }[] }>('me/accounts?fields=id,name&limit=100', t)
  const mias = (r.data ?? []).filter((p) => propias.includes(p.id))
  if (mias.length === 0) return { estado: 'caido', detalle: 'El token ya no ve la página' }
  return { estado: 'conectado', detalle: mias.map((p) => p.name?.trim() || 'Página').join(' · ') }
}

async function anuncios(): Promise<Resultado> {
  const t = token()
  if (!t) return { estado: 'por-conectar', detalle: 'Falta el token de Meta' }
  const r = await graph<{ data?: unknown[] }>('me/adaccounts?fields=id&limit=100', t)
  const n = r.data?.length ?? 0
  return n > 0 ? { estado: 'conectado', detalle: cuantasCuentas(n, 'de anuncios') } : { estado: 'por-conectar', detalle: 'Todavía no ve ninguna cuenta de anuncios' }
}

async function whatsapp(): Promise<Resultado> {
  if (!process.env.ZERNIO_API_KEY) return { estado: 'por-conectar', detalle: 'Falta la clave de Zernio' }
  const cuentas = (await clienteDelEntorno().cuentas()) as (CuentaZernioMin & { displayName?: string; username?: string })[]
  const wa = cuentas.find((c) => c.platform === 'whatsapp')
  if (!wa) return { estado: 'por-conectar', detalle: 'Zernio no tiene un WhatsApp conectado' }
  if (!whatsappConectado([wa])) return { estado: 'caido', detalle: 'Zernio pide volver a conectarlo' }
  return { estado: 'conectado', detalle: `Por Zernio · ${wa.displayName || wa.username || 'la cuenta de WhatsApp'}` }
}

// Lo último que entró por el webhook de Zernio (cuando se guardó, no cuando se escribió)
async function bandeja(): Promise<Resultado> {
  const { data, error } = await createServiceClient()
    .from('crm_mensajes')
    .select('creado_en')
    .eq('origen', 'zernio')
    .order('creado_en', { ascending: false })
    .limit(1)
  if (error) throw new Error(error.message)
  return estadoBandeja((data?.[0] as { creado_en: string } | undefined)?.creado_en ?? null, new Date())
}

const CUENTAS_GOOGLE = [
  ['GOOGLE_CUENTA', 'GOOGLE_REFRESH_TOKEN'],
  ['GOOGLE_CUENTA_2', 'GOOGLE_REFRESH_TOKEN_2'],
] as const

// Conectada: el permiso guardado todavía da acceso (el acceso no se guarda ni sale de aquí)
async function google(i: 0 | 1): Promise<Resultado> {
  const [c, p] = CUENTAS_GOOGLE[i]
  const cuenta = process.env[c]
  const permiso = process.env[p]
  if (!cuenta || !permiso) return { estado: 'por-conectar', detalle: 'Falta conectar la cuenta' }
  await accesoGoogle(permiso)
  return { estado: 'conectado', detalle: cuenta }
}

async function sitio(): Promise<Resultado> {
  const inicio = Date.now()
  const res = await fetch(SITIO, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(8_000) })
  await res.body?.cancel().catch(() => undefined)
  return res.status === 200
    ? { estado: 'conectado', detalle: `bralto.io responde en ${entero(Date.now() - inicio)} ms` }
    : { estado: 'caido', detalle: `bralto.io respondió ${res.status}` }
}

// Solo pregunta quién es el bot: no manda nada
async function telegram(): Promise<Resultado> {
  const t = process.env.TELEGRAM_BOT_TOKEN
  if (!t || !process.env.TELEGRAM_CHAT_ID) return { estado: 'por-conectar', detalle: 'Falta conectar el bot de los avisos' }
  const res = await fetch(`https://api.telegram.org/bot${t}/getMe`, { cache: 'no-store', signal: AbortSignal.timeout(8_000) })
  const j = (await res.json().catch(() => ({}))) as { ok?: boolean; result?: { username?: string } }
  if (!j.ok) return { estado: 'caido', detalle: 'Telegram no aceptó el bot' }
  return { estado: 'conectado', detalle: `@${j.result?.username ?? 'bot'} · los avisos llegan a tu chat` }
}

async function voz(): Promise<Resultado> {
  const clave = process.env.ELEVENLABS_API_KEY
  if (!clave) return { estado: 'por-conectar', detalle: 'Falta la clave de ElevenLabs' }
  const res = await fetch('https://api.elevenlabs.io/v1/user/subscription', { headers: { 'xi-api-key': clave }, cache: 'no-store' })
  if (!res.ok) return { estado: 'caido', detalle: `ElevenLabs respondió ${res.status}` }
  const j = (await res.json()) as { character_count?: number; character_limit?: number }
  const usado = j.character_count ?? 0
  const limite = j.character_limit ?? 0
  return { estado: limite && usado >= limite ? 'caido' : 'conectado', detalle: detalleVoz(usado, limite), uso: { usado, limite } }
}

// GoHighLevel se va a apagar: no se prueba, se avisa
async function goHighLevel(): Promise<Resultado> {
  return { estado: 'se-va', detalle: 'Se va a apagar: la agenda pasa a Google Calendar' }
}

const DIEZ = 10 * MIN
const CINCO = 5 * MIN

// Las dos cuentas de Google, para el panel 08 de Hoy: las que están en el panel y si respondieron
export async function cuentasGoogle(): Promise<{ ok: boolean }[]> {
  const r = await Promise.all([revisar('google-1', DIEZ, () => google(0)), revisar('google-2', DIEZ, () => google(1))])
  return r.filter((x) => x.estado !== 'por-conectar').map((x) => ({ ok: x.estado === 'conectado' }))
}

export async function leerChequeos(): Promise<Chequeo[]> {
  const pruebas: [clave: string, nombre: string, ms: number, probar: () => Promise<Resultado>][] = [
    ['instagram-1', 'Instagram', DIEZ, () => instagram(process.env.META_IG_USER_ID)],
    ['instagram-2', 'Instagram (colaboración)', DIEZ, () => instagram(process.env.META_IG_COLAB_USER_ID)],
    ['facebook', 'Facebook', DIEZ, facebook],
    ['whatsapp', 'WhatsApp', CINCO, whatsapp],
    ['bandeja', 'Bandeja de mensajes', CINCO, bandeja],
    ['google-1', 'Google · cuenta 1', DIEZ, () => google(0)],
    ['google-2', 'Google · cuenta 2', DIEZ, () => google(1)],
    ['anuncios', 'Anuncios de Meta', DIEZ, anuncios],
    ['sitio', 'Sitio web', CINCO, sitio],
    ['telegram', 'Avisos por Telegram', DIEZ, telegram],
    ['voz', 'Voz de Knox', DIEZ, voz],
    ['ghl', 'GoHighLevel', DIEZ, goHighLevel],
  ]
  const r = await Promise.all(pruebas.map(([clave, , ms, probar]) => revisar(clave, ms, probar)))
  return pruebas.map(([clave, nombre], i) => ({ clave, nombre, ...r[i] }))
}
