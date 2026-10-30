import { createServiceClient } from '@/lib/supabase/service'
import { avisoError } from './aviso'
import { probarFila, publicarFila, type Efectos } from './publicar'
import { MAX_INTENTOS, type Publicacion } from './tipos'
import { cuerpoAutomatizacion } from './zernio'

// Conexiones reales de la publicación programada: la Graph API de Meta (token del usuario del sistema,
// el mismo de los primeros posts), Zernio para Facebook y el «Comenta», Supabase y Telegram.
// La lógica está en publicar.ts, con pruebas.

const TABLA = 'redes_publicaciones'
const GRAPH = 'https://graph.facebook.com/v26.0'
const ZERNIO = 'https://zernio.com/api/v1'
const COLUMNAS =
  'id, titulo, tipo, estado, publicar_en, texto, laminas, video_url, portada_url, historias, colaborador, hecho_con_ia, facebook, comenta, resultado, intentos'
const TRABADA_MS = 15 * 60_000 // más que el tope de la función: si sigue «publicando», la corrida se cortó
const TARDE_MS = 3 * 3600_000 // si por algo no salió a su hora, no sale horas después (de noche no)

const NECESARIAS = ['META_ACCESS_TOKEN', 'META_IG_USER_ID', 'ZERNIO_API_KEY', 'ZERNIO_PROFILE_ID', 'ZERNIO_IG_ACCOUNT_ID', 'ZERNIO_FB_ACCOUNT_ID']

function env(nombre: string): string {
  const v = process.env[nombre]
  if (!v) throw new Error(`falta ${nombre}`)
  return v
}

async function graph<T>(ruta: string, params: Record<string, string>, metodo: 'GET' | 'POST' = 'POST'): Promise<T> {
  const p = new URLSearchParams({ ...params, access_token: env('META_ACCESS_TOKEN') })
  const res =
    metodo === 'POST'
      ? await fetch(`${GRAPH}/${ruta}`, { method: 'POST', body: p, cache: 'no-store' })
      : await fetch(`${GRAPH}/${ruta}?${p}`, { cache: 'no-store' })
  const r = (await res.json().catch(() => ({}))) as T & { error?: { message?: string; error_user_msg?: string } }
  if (!res.ok || r.error) {
    const extra = r.error?.error_user_msg ? ` (${r.error.error_user_msg})` : ''
    throw new Error(`Meta ${ruta.split('/').pop()}: ${r.error?.message ?? `HTTP ${res.status}`}${extra}`)
  }
  return r
}

async function zernio<T>(ruta: string, cuerpo: unknown, clave: string): Promise<T> {
  const res = await fetch(`${ZERNIO}${ruta}`, {
    method: 'POST',
    // La clave de idempotencia evita duplicar si una corrida se corta y la siguiente repite el paso
    headers: { Authorization: `Bearer ${env('ZERNIO_API_KEY')}`, 'Content-Type': 'application/json', 'Idempotency-Key': clave },
    body: JSON.stringify(cuerpo),
    cache: 'no-store',
  })
  const texto = await res.text()
  let j: unknown
  try {
    j = JSON.parse(texto)
  } catch {
    j = { crudo: texto.slice(0, 300) }
  }
  if (!res.ok && res.status !== 207) throw new Error(`Zernio ${ruta}: HTTP ${res.status} ${JSON.stringify(j).slice(0, 300)}`)
  return j as T
}

async function estadoContenedor(id: string) {
  return (await graph<{ status_code: string }>(id, { fields: 'status_code' }, 'GET')).status_code
}

type PostZernio = { platform: string; platformPostId?: string; platformPostUrl?: string; status?: string }

function efectosReales(): Efectos {
  const ig = env('META_IG_USER_ID')
  return {
    async crearContenedor(p) {
      const comun = {
        caption: p.texto,
        ...(p.colaborador ? { collaborators: JSON.stringify([p.colaborador]) } : {}),
        ...(p.hecho_con_ia ? { is_ai_generated: 'true' } : {}),
      }
      if (p.tipo === 'reel') {
        const reel = { media_type: 'REELS', video_url: p.video_url ?? '', share_to_feed: 'true', ...(p.portada_url ? { cover_url: p.portada_url } : {}) }
        return (await graph<{ id: string }>(`${ig}/media`, { ...reel, ...comun })).id
      }
      const hijos: string[] = []
      for (const image_url of p.laminas) hijos.push((await graph<{ id: string }>(`${ig}/media`, { image_url, is_carousel_item: 'true' })).id)
      return (await graph<{ id: string }>(`${ig}/media`, { media_type: 'CAROUSEL', children: hijos.join(','), ...comun })).id
    },

    estadoContenedor,

    async publicarContenedor(id) {
      const { id: media } = await graph<{ id: string }>(`${ig}/media_publish`, { creation_id: id })
      const { permalink } = await graph<{ permalink?: string }>(media, { fields: 'permalink' }, 'GET').catch(() => ({ permalink: undefined }))
      return { id: media, permalink: permalink ?? null }
    },

    async buscarPublicado(texto) {
      const { data } = await graph<{ data: { id: string; caption?: string; permalink?: string }[] }>(
        `${ig}/media`,
        { fields: 'id,caption,permalink', limit: '5' },
        'GET',
      )
      const m = data.find((x) => x.caption?.trim() === texto.trim())
      return m ? { id: m.id, permalink: m.permalink ?? null } : null
    },

    async crearComenta(origen, postId, p) {
      if (!p.comenta) throw new Error('la publicación no tiene «Comenta»')
      const cuenta = { profileId: env('ZERNIO_PROFILE_ID'), accountId: env(origen === 'ig' ? 'ZERNIO_IG_ACCOUNT_ID' : 'ZERNIO_FB_ACCOUNT_ID') }
      const cuerpo = cuerpoAutomatizacion({ cuenta, platformPostId: postId, titulo: p.titulo, comenta: p.comenta, origen })
      const r = await zernio<{ automation?: { id?: string }; id?: string }>('/comment-automations', cuerpo, `comenta-${postId}`)
      const id = r.automation?.id ?? r.id
      if (!id) throw new Error('Zernio no devolvió el id de la automatización')
      return id
    },

    // Facebook lo publica Zernio: nuestra app de Meta sigue en modo Desarrollo y lo que publica en una
    // página no lo ve el público
    async publicarFacebook(p) {
      const medios = p.tipo === 'reel' ? [{ type: 'video', url: p.video_url }] : p.laminas.map((url) => ({ type: 'image', url }))
      const r = await zernio<{ post?: { platforms?: PostZernio[] }; platforms?: PostZernio[]; platformPostUrl?: string }>(
        '/posts',
        { content: p.texto, mediaItems: medios, platforms: [{ platform: 'facebook', accountId: env('ZERNIO_FB_ACCOUNT_ID') }], publishNow: true },
        `fb-${p.id}`,
      )
      const fb = (r.post?.platforms ?? r.platforms ?? []).find((x) => x.platform === 'facebook')
      const url = fb?.platformPostUrl ?? r.platformPostUrl ?? null
      // El id del post en Facebook es «página_post»; si Zernio no lo da, sale del enlace
      const desdeUrl = url?.match(/(\d{6,})\/posts\/(\d+)/)
      const pagina = process.env.META_FB_PAGE_ID
      const fbid = url?.match(/fbid=(\d+)/)?.[1]
      const postId = fb?.platformPostId ?? (desdeUrl ? `${desdeUrl[1]}_${desdeUrl[2]}` : fbid && pagina ? `${pagina}_${fbid}` : null)
      return { postId, url }
    },

    // La collab se acepta desde la otra cuenta con el mismo token
    async aceptarCollab(media) {
      await graph(`${env('META_IG_COLAB_USER_ID')}/collaboration_invites`, { media_id: media, accept: 'true' })
    },

    async publicarHistoria(image_url) {
      const { id } = await graph<{ id: string }>(`${ig}/media`, { image_url, media_type: 'STORIES' })
      for (let i = 0; i < 24; i++) {
        const estado = await estadoContenedor(id)
        if (estado === 'FINISHED') return (await graph<{ id: string }>(`${ig}/media_publish`, { creation_id: id })).id
        if (estado === 'ERROR' || estado === 'EXPIRED') throw new Error(`la historia quedó en ${estado}`)
        await new Promise((ok) => setTimeout(ok, 5000))
      }
      throw new Error('la historia no terminó de procesarse')
    },

    async guardar(id, cambios) {
      const { error } = await createServiceClient().from(TABLA).update(cambios).eq('id', id)
      if (error) throw new Error(`${TABLA}: ${error.message}`)
    },

    async avisar(texto) {
      const token = process.env.TELEGRAM_BOT_TOKEN
      const chat = process.env.TELEGRAM_CHAT_ID
      if (!token || !chat) return
      try {
        const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ chat_id: chat, text: texto, disable_web_page_preview: true }),
        })
        if (!res.ok) console.error(`redes: Telegram rechazó el aviso (HTTP ${res.status})`)
      } catch (err) {
        console.error('redes: no salió el aviso a Telegram', err)
      }
    },

    dormir: (ms) => new Promise((ok) => setTimeout(ok, ms)),
    ahora: () => Date.now(),
  }
}

const faltantes = () => NECESARIAS.filter((n) => !process.env[n])

// Una corrida del cron: rescata lo trabado y publica la siguiente que ya tocaba (una por corrida, para no
// pasarse del tiempo de la función; la próxima corrida es en 5 minutos)
export async function correrCola(): Promise<Record<string, unknown>> {
  const falta = faltantes()
  if (falta.length) return { ok: false, nota: `falta configurar: ${falta.join(', ')}` }
  const db = createServiceClient()
  const e = efectosReales()
  const ahora = Date.now()
  const hecho: Record<string, string> = {}

  const { data: trabadas, error: e1 } = await db
    .from(TABLA)
    .select(COLUMNAS)
    .eq('estado', 'publicando')
    .lt('actualizado_en', new Date(ahora - TRABADA_MS).toISOString())
  if (e1) throw new Error(`${TABLA}: ${e1.message}`)
  for (const t of (trabadas ?? []) as Publicacion[]) {
    if (t.intentos >= MAX_INTENTOS) {
      await e.guardar(t.id, { estado: 'error', ultimo_error: 'la publicación se cortó a la mitad' })
      await e.avisar(avisoError(t.titulo, t.intentos, 'se cortó a la mitad; revisa qué alcanzó a salir'))
      hecho[t.titulo] = 'se cortó: queda en error'
    } else {
      await e.guardar(t.id, { estado: 'programado' }) // sigue donde quedó: `resultado` no deja repetir pasos
      hecho[t.titulo] = 'se cortó: vuelve a la cola'
    }
  }

  const { data, error } = await db
    .from(TABLA)
    .select(COLUMNAS)
    .eq('estado', 'programado')
    .lte('publicar_en', new Date(ahora).toISOString())
    .order('publicar_en')
    .limit(1)
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  const p = (data?.[0] ?? null) as Publicacion | null
  if (!p) return { ok: true, ...hecho, cola: 'nada por publicar' }

  if (ahora - Date.parse(p.publicar_en) > TARDE_MS && !p.resultado?.instagram) {
    const motivo = 'se pasó su hora (más de 3 horas tarde); dime cuándo lo saco'
    await e.guardar(p.id, { estado: 'error', ultimo_error: motivo })
    await e.avisar(avisoError(p.titulo, null, motivo))
    return { ok: true, ...hecho, [p.titulo]: `error: ${motivo}` }
  }

  // Solo una corrida la toma: la actualización exige que siga «programado» y con los mismos intentos
  const { data: tomada, error: e2 } = await db
    .from(TABLA)
    .update({ estado: 'publicando', intentos: p.intentos + 1 })
    .eq('id', p.id)
    .eq('estado', 'programado')
    .eq('intentos', p.intentos)
    .select('id')
  if (e2) throw new Error(`${TABLA}: ${e2.message}`)
  if (!tomada?.length) return { ok: true, ...hecho, [p.titulo]: 'la tomó otra corrida' }

  hecho[p.titulo] = await publicarFila({ ...p, estado: 'publicando', intentos: p.intentos + 1 }, e)
  return { ok: true, ...hecho }
}

// ?probar=<id>: el contenedor de esa publicación, sin publicar ni cambiar la fila
export async function probar(id: string): Promise<Record<string, unknown>> {
  const falta = faltantes()
  if (falta.length) return { ok: false, nota: `falta configurar: ${falta.join(', ')}` }
  const { data, error } = await createServiceClient().from(TABLA).select(COLUMNAS).eq('id', id).maybeSingle()
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  if (!data) return { ok: false, nota: 'no existe esa publicación' }
  return { ok: true, prueba: await probarFila(data as Publicacion, efectosReales()) }
}
