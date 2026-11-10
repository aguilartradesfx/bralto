// Los números de un video a partir de lo que devuelve Apify: apify/instagram-scraper (el post y el perfil de
// la cuenta) y clockworks/tiktok-scraper. Instagram no muestra compartidos ni guardados: quedan en null
// («no los muestra»), nunca en cero.

export type Metricas = {
  cuenta: string | null
  publicado_en: string | null
  tipo: 'video' | 'fotos'
  duracion_s: number | null
  texto: string
  vistas: number | null
  me_gusta: number | null
  comentarios: number | null
  compartidos: number | null
  guardados: number | null
  seguidores: number | null
  normal_me_gusta: number | null // lo normal de la cuenta: me gusta de un post suyo cualquiera
  veces_su_publico: number | null // vistas ÷ seguidores
  veces_lo_normal: number | null // me gusta ÷ lo normal
}

// Lo que Gemini mira: el video (videoConClave: se baja con la clave de Apify) o las fotos
export type Medios = { video: string | null; videoConClave: boolean; imagenes: string[] }

export class ApifyRespuestaError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ApifyRespuestaError'
  }
}

type Crudo = Record<string, unknown>

const texto = (v: unknown) => (typeof v === 'string' ? v : '')
// Un número de verdad (TikTok a veces los manda como texto); negativo = oculto
function numero(v: unknown): number | null {
  const n = typeof v === 'number' ? v : typeof v === 'string' && v.trim() !== '' ? Number(v) : NaN
  return Number.isFinite(n) && n >= 0 ? n : null
}
const urls = (v: unknown) => (Array.isArray(v) ? v.filter((u): u is string => typeof u === 'string' && u.length > 0) : [])
const redondear = (n: number) => Math.round(n * 10) / 10
// Por debajo de 1 vez, con 2 decimales: en una cuenta enorme un decimal lo dejaría en cero
function veces(a: number | null, b: number | null): number | null {
  if (a === null || !b) return null
  const v = a / b
  return v >= 1 ? redondear(v) : Math.round(v * 100) / 100
}

export function mediana(xs: number[]): number | null {
  if (!xs.length) return null
  const o = [...xs].sort((a, b) => a - b)
  const m = Math.floor(o.length / 2)
  return o.length % 2 ? o[m] : (o[m - 1] + o[m]) / 2
}

function primero(raw: unknown, que: string): Crudo {
  const item = Array.isArray(raw) ? (raw[0] as Crudo | undefined) : undefined
  if (!item || typeof item !== 'object') throw new ApifyRespuestaError(`Apify no devolvió ${que}`)
  if (item.error) {
    const motivo = texto(item.errorDescription) || texto(item.error)
    throw new ApifyRespuestaError(`Apify no encontró ${que}${motivo ? ` (${motivo})` : ''}`)
  }
  return item
}

const MIN_POSTS_NORMAL = 3

export function leerInstagram(rawPost: unknown, rawPerfil: unknown): { metricas: Metricas; medios: Medios } {
  const p = primero(rawPost, 'el post')
  const codigo = texto(p.shortCode)
  if (!codigo) throw new ApifyRespuestaError('Apify no encontró el post')
  const esVideo = texto(p.type) === 'Video'
  const portada = texto(p.displayUrl)
  const laminas = urls(p.images)

  const perfil = Array.isArray(rawPerfil) ? (rawPerfil[0] as Crudo | undefined) : undefined
  const seguidores = perfil && !perfil.error ? numero(perfil.followersCount) : null
  const otros = Array.isArray(perfil?.latestPosts) ? (perfil.latestPosts as Crudo[]) : []
  const likesOtros = otros
    .filter((x) => x && x.isPinned !== true && texto(x.shortCode) !== codigo)
    .map((x) => numero(x.likesCount))
    .filter((n): n is number => n !== null)
  const normal = likesOtros.length >= MIN_POSTS_NORMAL ? mediana(likesOtros) : null

  const vistas = esVideo ? (numero(p.videoPlayCount) ?? numero(p.videoViewCount)) : null
  const meGusta = numero(p.likesCount)
  const duracion = numero(p.videoDuration)
  return {
    metricas: {
      cuenta: texto(p.ownerUsername) || null,
      publicado_en: texto(p.timestamp) || null,
      tipo: esVideo ? 'video' : 'fotos',
      duracion_s: esVideo && duracion !== null ? Math.round(duracion) : null,
      texto: texto(p.caption),
      vistas,
      me_gusta: meGusta,
      comentarios: numero(p.commentsCount),
      compartidos: null,
      guardados: null,
      seguidores,
      normal_me_gusta: normal,
      veces_su_publico: veces(vistas, seguidores),
      veces_lo_normal: veces(meGusta, normal),
    },
    medios: {
      video: esVideo ? texto(p.videoUrl) || null : null,
      videoConClave: false,
      imagenes: laminas.length ? laminas : portada ? [portada] : [],
    },
  }
}

export function leerTiktok(raw: unknown): { metricas: Metricas; medios: Medios } {
  const v = primero(raw, 'el video')
  const vistas = numero(v.playCount)
  if (vistas === null && numero(v.diggCount) === null) throw new ApifyRespuestaError('Apify no devolvió los números del video')
  const autor = (v.authorMeta && typeof v.authorMeta === 'object' ? v.authorMeta : {}) as Crudo
  const meta = (v.videoMeta && typeof v.videoMeta === 'object' ? v.videoMeta : {}) as Crudo
  const seguidores = numero(autor.fans)
  const corazones = numero(autor.heart)
  const videos = numero(autor.video)
  const normal = corazones !== null && videos ? redondear(corazones / videos) : null
  const meGusta = numero(v.diggCount)
  const esFotos = v.isSlideshow === true
  const portada = texto(meta.coverUrl) || texto(meta.originalCoverUrl)
  const duracion = numero(meta.duration)
  return {
    metricas: {
      cuenta: texto(autor.name) || null,
      publicado_en: texto(v.createTimeISO) || null,
      tipo: esFotos ? 'fotos' : 'video',
      duracion_s: esFotos || duracion === null ? null : Math.round(duracion),
      texto: texto(v.text),
      vistas,
      me_gusta: meGusta,
      comentarios: numero(v.commentCount),
      compartidos: numero(v.shareCount),
      guardados: numero(v.collectCount),
      seguidores,
      normal_me_gusta: normal,
      veces_su_publico: veces(vistas, seguidores),
      veces_lo_normal: veces(meGusta, normal),
    },
    medios: { video: esFotos ? null : urls(v.mediaUrls)[0] ?? null, videoConClave: true, imagenes: portada ? [portada] : [] },
  }
}

// 950 · 6,8 mil · 393 mil · 1,2 M (como se dice, no «6.8K»)
export function formatoNumero(n: number | null): string {
  if (n === null) return '—'
  const decimal = (x: number) => (x < 10 ? (Math.round(x * 10) / 10).toString().replace('.', ',') : Math.round(x).toString())
  if (n < 1000) return Math.round(n).toString()
  if (n < 1_000_000) {
    const mil = n / 1000
    return mil >= 999.5 ? '1 M' : `${decimal(mil)} mil`
  }
  return `${decimal(n / 1_000_000)} M`
}

// 26× · 2,5×
export function formatoVeces(v: number | null): string {
  if (v === null) return '—'
  return `${v >= 10 ? Math.round(v).toLocaleString('es-CR') : (Math.round(v * 10) / 10).toString().replace('.', ',')}×`
}
