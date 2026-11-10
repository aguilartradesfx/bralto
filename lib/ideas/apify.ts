// Los números de un video con Apify: apify/instagram-scraper (el post y el perfil de su cuenta) o
// clockworks/tiktok-scraper (el video, ya bajado a Apify para que Gemini lo vea).
import type { Enlace } from './enlaces.ts'
import { leerInstagram, leerTiktok, type Medios, type Metricas } from './metricas.ts'

const BASE = 'https://api.apify.com/v2/acts'
const CORTE_S = 120 // el actor se corta antes que la función (300 s), así queda tiempo para Gemini
const LIMITE_MS = (CORTE_S + 10) * 1000

type Deps = { token: string; fetchFn?: typeof fetch }

async function correr(actor: string, entrada: object, deps: Deps): Promise<unknown> {
  const fetchFn = deps.fetchFn ?? fetch
  let res: Response
  try {
    res = await fetchFn(`${BASE}/${actor}/run-sync-get-dataset-items?timeout=${CORTE_S}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${deps.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(entrada),
      signal: AbortSignal.timeout(LIMITE_MS),
    })
  } catch (err) {
    throw new Error(`Apify no respondió (${err instanceof Error ? err.message : String(err)})`)
  }
  const data: unknown = await res.json().catch(() => null)
  if (!res.ok || !Array.isArray(data)) {
    const e = data && typeof data === 'object' && 'error' in data ? (data as { error?: { message?: unknown } }).error : null
    const motivo = typeof e?.message === 'string' ? e.message : `HTTP ${res.status}`
    throw new Error(`Apify no pudo leer el enlace: ${motivo.slice(0, 200)}`)
  }
  return data
}

export async function buscarNumeros(e: Enlace, deps: Deps): Promise<{ metricas: Metricas; medios: Medios }> {
  if (e.red === 'tiktok') {
    const raw = await correr(
      'clockworks~tiktok-scraper',
      { postURLs: [e.url], shouldDownloadVideos: true, shouldDownloadCovers: false, shouldDownloadSubtitles: false },
      deps,
    )
    return leerTiktok(raw)
  }
  const post = await correr('apify~instagram-scraper', { directUrls: [e.url], resultsType: 'posts', resultsLimit: 1 }, deps)
  const cuenta = Array.isArray(post) ? (post[0] as { ownerUsername?: unknown } | undefined)?.ownerUsername : undefined
  // El perfil da los seguidores y lo normal de la cuenta; si falla, quedan los números del post
  let perfil: unknown = []
  if (typeof cuenta === 'string' && cuenta) {
    perfil = await correr('apify~instagram-scraper', { directUrls: [`https://www.instagram.com/${cuenta}/`], resultsType: 'details', resultsLimit: 1 }, deps).catch(() => [])
  }
  return leerInstagram(post, perfil)
}
