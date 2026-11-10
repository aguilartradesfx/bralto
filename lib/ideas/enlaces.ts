// Los enlaces que se pegan en «Ideas»: cuáles son videos de Instagram o TikTok y su forma única, para no
// analizar dos veces el mismo video aunque venga con otro rastreo o como /reel/ en vez de /p/.

export type Red = 'instagram' | 'tiktok'
// corto: un enlace vm.tiktok.com que hay que abrir para saber a qué video lleva
export type Enlace = { url: string; red: Red; corto?: true }

const CODIGO_IG = /^[A-Za-z0-9_-]{5,}$/
const RUTAS_IG = new Set(['p', 'reel', 'reels', 'tv'])
const CORTOS_TT = new Set(['vm.tiktok.com', 'vt.tiktok.com'])

function leerUrl(texto: string): URL | null {
  const t = texto.trim()
  if (!t || /\s/.test(t)) return null
  try {
    return new URL(/^https?:\/\//i.test(t) ? t : `https://${t}`)
  } catch {
    return null
  }
}

const host = (u: URL) => u.hostname.toLowerCase().replace(/^(www|m)\./, '')

export function normalizarEnlace(texto: string): Enlace | null {
  const u = leerUrl(texto)
  if (!u) return null
  const h = host(u)
  const partes = u.pathname.split('/').filter(Boolean)

  if (h === 'instagram.com') {
    // /reel/COD, /p/COD, /tv/COD y también /cuenta/reel/COD
    const i = partes.findIndex((p) => RUTAS_IG.has(p.toLowerCase()))
    const codigo = i >= 0 && i <= 1 ? partes[i + 1] : undefined
    if (!codigo || !CODIGO_IG.test(codigo)) return null
    return { url: `https://www.instagram.com/p/${codigo}/`, red: 'instagram' }
  }

  if (CORTOS_TT.has(h) && partes.length >= 1) return { url: `https://${h}/${partes[0]}/`, red: 'tiktok', corto: true }
  if (h === 'tiktok.com') {
    if (partes[0] === 't' && partes[1]) return { url: `https://www.tiktok.com/t/${partes[1]}/`, red: 'tiktok', corto: true }
    const [cuenta, tipo, id] = partes
    if (!cuenta?.startsWith('@') || cuenta.length < 2 || (tipo !== 'video' && tipo !== 'photo') || !/^\d+$/.test(id ?? '')) return null
    return { url: `https://www.tiktok.com/${cuenta.toLowerCase()}/${tipo}/${id}`, red: 'tiktok' }
  }
  return null
}

// Lo que identifica al video: el código de Instagram o el número de TikTok (la cuenta puede venir distinta)
function clave(e: Enlace): string {
  if (e.corto) return e.url
  if (e.red === 'instagram') return `ig:${e.url.split('/')[4]}`
  return `tt:${e.url.split('/').pop()}`
}

// Todo lo que parece un enlace en el texto pegado (uno por línea, separados por espacios o comas)
export function detectarEnlaces(texto: string): { enlaces: Enlace[]; noValidos: string[] } {
  const candidatos = texto.match(/(?:https?:\/\/|www\.|(?:[a-z0-9-]+\.)+(?:com|io|net|org)\/)[^\s<>"'`]+/gi) ?? []
  const enlaces: Enlace[] = []
  const noValidos: string[] = []
  const vistos = new Set<string>()
  for (const crudo of candidatos) {
    const limpio = crudo.replace(/[),.;:!?»]+$/, '')
    const e = normalizarEnlace(limpio)
    if (!e) {
      if (!noValidos.includes(limpio)) noValidos.push(limpio)
      continue
    }
    const k = clave(e)
    if (vistos.has(k)) continue
    vistos.add(k)
    enlaces.push(e)
  }
  return { enlaces, noValidos }
}

// Abre un enlace corto de TikTok (sin seguir más allá del primer salto) y devuelve el video al que lleva
export async function resolverCorto(e: Enlace, fetchFn: typeof fetch = fetch): Promise<Enlace | null> {
  if (!e.corto) return e
  try {
    const res = await fetchFn(e.url, { redirect: 'manual', headers: { 'User-Agent': 'Mozilla/5.0' }, signal: AbortSignal.timeout(10_000) })
    const destino = res.headers.get('location')
    if (!destino) return null
    const largo = normalizarEnlace(new URL(destino, e.url).toString())
    return largo && !largo.corto ? largo : null
  } catch {
    return null
  }
}
