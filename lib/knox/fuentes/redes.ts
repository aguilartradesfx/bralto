import type { Comentario, CuentaIg, PaginaFb, Publicacion, Redes } from '../tipos'

// Instagram y Facebook con el token del usuario del sistema de Meta (el mismo que publica). Ese token
// también ve páginas de clientes: Knox solo mira las dos de Alejandro.
const GRAPH = 'https://graph.facebook.com/v26.0'
const DIA = 24 * 3600_000
const PAGINA_BRALTO = '185038244684371'

export type Medio = {
  id: string
  caption?: string
  media_type: string
  media_product_type?: string
  timestamp: string
  permalink?: string
  like_count?: number
  comments_count?: number
}

export async function graph<T>(ruta: string, token: string): Promise<T> {
  const res = await fetch(`${GRAPH}/${ruta}${ruta.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`, {
    signal: AbortSignal.timeout(15_000),
    cache: 'no-store',
  })
  const j = (await res.json().catch(() => ({}))) as T & { error?: { message?: string } }
  if (!res.ok || j.error) throw new Error(`Meta ${ruta.split('?')[0]}: ${j.error?.message ?? `HTTP ${res.status}`}`)
  return j
}

// Instagram manda «+0000» sin los dos puntos
export const fecha = (ts: string) => new Date(ts.replace(/([+-]\d\d)(\d\d)$/, '$1:$2'))

export function tituloDe(caption: string | undefined): string {
  const linea = (caption ?? '').split('\n').map((l) => l.trim()).find(Boolean) ?? 'Sin texto'
  return linea.length > 70 ? `${linea.slice(0, 67).trimEnd()}…` : linea
}

export function tipoDe(m: Medio): Publicacion['tipo'] {
  if (m.media_product_type === 'REELS' || m.media_type === 'VIDEO') return 'reel'
  return m.media_type === 'CAROUSEL_ALBUM' ? 'carrusel' : 'foto'
}

async function cuentaIg(id: string, token: string): Promise<{ cuenta: CuentaIg; medios: Medio[] }> {
  const perfil = await graph<{ username: string; followers_count: number }>(`${id}?fields=username,followers_count`, token)
  // Seguidores nuevos del último día completo. Instagram no lo da a cuentas con menos de 100 seguidores.
  let nuevosAyer: number | null = null
  try {
    const ins = await graph<{ data: { values?: { value: number }[] }[] }>(`${id}/insights?metric=follower_count&period=day`, token)
    const valores = ins.data[0]?.values ?? []
    nuevosAyer = valores.length ? valores[valores.length - 1].value : null
  } catch {
    nuevosAyer = null
  }
  const medios = await graph<{ data: Medio[] }>(
    `${id}/media?fields=id,caption,media_type,media_product_type,timestamp,permalink,like_count,comments_count&limit=15`,
    token,
  )
  return { cuenta: { usuario: perfil.username, seguidores: perfil.followers_count, nuevosAyer }, medios: medios.data }
}

async function estadisticas(m: Medio, token: string) {
  try {
    const ins = await graph<{ data: { name: string; values?: { value: number }[] }[] }>(`${m.id}/insights?metric=reach,views,saved,shares`, token)
    const v = Object.fromEntries(ins.data.map((d) => [d.name, d.values?.[0]?.value ?? null]))
    return { vistas: v.views ?? null, alcance: v.reach ?? null, guardados: v.saved ?? null, compartidos: v.shares ?? null }
  } catch {
    return { vistas: null, alcance: null, guardados: null, compartidos: null }
  }
}

async function comentariosNuevos(m: Medio, token: string, desde: Date, propias: Set<string>): Promise<Comentario[]> {
  if (!m.comments_count) return []
  const j = await graph<{ data: { text?: string; username?: string; timestamp: string }[] }>(
    `${m.id}/comments?fields=text,username,timestamp&limit=50`,
    token,
  )
  return j.data
    .filter((c) => c.username && !propias.has(c.username) && fecha(c.timestamp) >= desde)
    .map((c) => ({ usuario: c.username!, texto: (c.text ?? '').slice(0, 200), en: fecha(c.timestamp).toISOString(), publicacion: tituloDe(m.caption) }))
}

// Conversaciones con mensajes sin leer desde `desde` en una página (Messenger, o Instagram con platform=instagram).
// Las más viejas no cuentan: después de 7 días Meta ya no deja contestarlas
async function conSinLeer(pagina: string, token: string, desde: Date, extra = ''): Promise<number> {
  const j = await graph<{ data: { unread_count?: number; updated_time?: string }[] }>(
    `${pagina}/conversations?fields=unread_count,updated_time&limit=20${extra}`,
    token,
  )
  return j.data.filter((c) => (c.unread_count ?? 0) > 0 && fecha(c.updated_time ?? '') >= desde).length
}

async function paginas(token: string, desde: Date): Promise<{ facebook: PaginaFb[]; mensajesIgSinLeer: number | null }> {
  const mias = new Set([process.env.META_FB_PAGE_ID, process.env.META_FB_BRALTO_PAGE_ID ?? PAGINA_BRALTO].filter(Boolean))
  const cuentas = await graph<{ data: { id: string; name: string; access_token?: string; followers_count?: number }[] }>(
    'me/accounts?fields=id,name,access_token,followers_count&limit=25',
    token,
  )
  let mensajesIgSinLeer: number | null = null
  const facebook: PaginaFb[] = []
  for (const p of cuentas.data.filter((c) => mias.has(c.id))) {
    const sinLeer = p.access_token ? await conSinLeer(p.id, p.access_token, desde).catch(() => null) : null
    if (p.access_token) {
      const ig = await conSinLeer(p.id, p.access_token, desde, '&platform=instagram').catch(() => null)
      if (ig !== null) mensajesIgSinLeer = (mensajesIgSinLeer ?? 0) + ig
    }
    facebook.push({ nombre: p.name.trim(), seguidores: p.followers_count ?? 0, sinLeer })
  }
  return { facebook, mensajesIgSinLeer }
}

export async function redes(ahora: Date): Promise<Redes> {
  const token = process.env.META_ACCESS_TOKEN
  const ids = [process.env.META_IG_USER_ID, process.env.META_IG_COLAB_USER_ID].filter((id): id is string => Boolean(id))
  if (!token || !ids.length) throw new Error('faltan META_ACCESS_TOKEN o META_IG_USER_ID')
  const semana = new Date(ahora.getTime() - 7 * DIA)
  const ayer = new Date(ahora.getTime() - DIA)

  const cuentas = await Promise.all(ids.map((id) => cuentaIg(id, token)))
  const propias = new Set(cuentas.map((c) => c.cuenta.usuario))
  // Un collab sale en las dos cuentas: se cuenta una sola vez
  const unicas = new Map<string, { m: Medio; cuenta: string }>()
  for (const c of cuentas) {
    for (const m of c.medios) {
      const clave = m.permalink ?? m.id
      if (fecha(m.timestamp) >= semana && !unicas.has(clave)) unicas.set(clave, { m, cuenta: c.cuenta.usuario })
    }
  }
  const recientes = [...unicas.values()].sort((a, b) => fecha(b.m.timestamp).getTime() - fecha(a.m.timestamp).getTime())

  const [publicaciones, comentarios, pags] = await Promise.all([
    Promise.all(
      recientes.map(async ({ m, cuenta }): Promise<Publicacion> => ({
        cuenta,
        titulo: tituloDe(m.caption),
        tipo: tipoDe(m),
        en: fecha(m.timestamp).toISOString(),
        enlace: m.permalink ?? null,
        meGusta: m.like_count ?? 0,
        comentarios: m.comments_count ?? 0,
        ...(await estadisticas(m, token)),
      })),
    ),
    Promise.all(recientes.map(({ m }) => comentariosNuevos(m, token, ayer, propias).catch(() => []))).then((l) =>
      l.flat().sort((a, b) => b.en.localeCompare(a.en)),
    ),
    paginas(token, semana).catch(() => ({ facebook: [], mensajesIgSinLeer: null })),
  ])

  return {
    instagram: cuentas.map((c) => c.cuenta),
    facebook: pags.facebook,
    mensajesIgSinLeer: pags.mensajesIgSinLeer,
    publicaciones,
    comentarios,
  }
}
