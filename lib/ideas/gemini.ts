// Gemini «ve» el video (o las fotos) y escribe el análisis. Basado en la etapa de temas de redes: mismo modelo,
// medios en línea y reintentos si está saturado.
import { leerAnalisis, promptIdea, type Analisis, type ContextoIdea } from './analisis.ts'
import type { Medios } from './metricas.ts'

const GEMINI = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent'
// En base64 crece 4/3: así el pedido entero queda bajo los 20 MB que Gemini acepta en línea
export const MAX_VIDEO = 14 * 1024 * 1024
const MAX_FOTOS = 10
const ESPERAS = [2000, 6000]
const REINTENTABLES = new Set([429, 500, 502, 503, 504])
const ESPERA_GEMINI_MS = 120_000

type Deps = { apiKey: string; apifyToken: string; fetchFn?: typeof fetch; sleep?: (ms: number) => Promise<void> }

// Los CDN de Instagram a veces no resuelven con el host que trae Apify; scontent.cdninstagram.com sí
function conHostCdn(url: string): string | null {
  try {
    const u = new URL(url)
    if (!/(fbcdn\.net|cdninstagram\.com)$/.test(u.hostname) || u.hostname === 'scontent.cdninstagram.com') return null
    u.hostname = 'scontent.cdninstagram.com'
    return u.toString()
  } catch {
    return null
  }
}

async function bajar(url: string, fetchFn: typeof fetch, opts: { max?: number; clave?: string } = {}): Promise<Uint8Array | null> {
  for (const u of [url, opts.clave ? null : conHostCdn(url)]) {
    if (!u) continue
    try {
      const headers: Record<string, string> = { 'User-Agent': 'Mozilla/5.0' }
      if (opts.clave) headers.Authorization = `Bearer ${opts.clave}`
      const res = await fetchFn(u, { headers, signal: AbortSignal.timeout(60_000) })
      if (!res.ok) continue
      if (opts.max && Number(res.headers.get('content-length') ?? 0) > opts.max) return null
      const buf = new Uint8Array(await res.arrayBuffer())
      if (opts.max && buf.byteLength > opts.max) return null
      return buf
    } catch {
      // se prueba el siguiente host
    }
  }
  return null
}

const enLinea = (mimeType: string, buf: Uint8Array) => ({ inlineData: { mimeType, data: Buffer.from(buf).toString('base64') } })

async function jsonDe(res: Response): Promise<unknown> {
  const data = (await res.json().catch(() => null)) as {
    candidates?: Array<{ finishReason?: string; content?: { parts?: Array<{ text?: string; thought?: boolean }> } }>
  } | null
  const cand = data?.candidates?.[0]
  if (!cand || cand.finishReason !== 'STOP') throw new Error(`Gemini no terminó bien (${cand?.finishReason ?? 'sin respuesta'})`)
  const texto = (cand.content?.parts ?? [])
    .filter((p) => !p.thought)
    .map((p) => p.text ?? '')
    .join('')
  try {
    return JSON.parse(texto)
  } catch {
    throw new Error('Gemini no devolvió el análisis en el formato pedido')
  }
}

async function pedirGemini(partes: object[], deps: Deps): Promise<unknown> {
  const fetchFn = deps.fetchFn ?? fetch
  const sleep = deps.sleep ?? ((ms: number) => new Promise<void>((r) => setTimeout(r, ms)))
  const cuerpo = JSON.stringify({ contents: [{ role: 'user', parts: partes }], generationConfig: { responseMimeType: 'application/json' } })
  for (let intento = 0; ; intento++) {
    let res: Response | null = null
    try {
      res = await fetchFn(GEMINI, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': deps.apiKey },
        body: cuerpo,
        signal: AbortSignal.timeout(ESPERA_GEMINI_MS),
      })
    } catch {
      res = null
    }
    if (res?.ok) return jsonDe(res)
    const reintentable = !res || REINTENTABLES.has(res.status)
    if (!reintentable || intento >= ESPERAS.length) throw new Error(`Gemini no respondió (${res ? `HTTP ${res.status}` : 'sin conexión'})`)
    await sleep(ESPERAS[intento])
  }
}

export async function analizarConGemini(
  medios: Medios,
  contexto: Omit<ContextoIdea, 'soloImagen'>,
  deps: Deps,
): Promise<{ analisis: Analisis; soloImagen: boolean }> {
  const fetchFn = deps.fetchFn ?? fetch
  const partes: object[] = []
  let soloImagen = false
  if (medios.video) {
    const video = await bajar(medios.video, fetchFn, { max: MAX_VIDEO, clave: medios.videoConClave ? deps.apifyToken : undefined })
    if (video) partes.push(enLinea('video/mp4', video))
    else soloImagen = true
  }
  if (!partes.length) {
    for (const url of medios.imagenes.slice(0, MAX_FOTOS)) {
      const foto = await bajar(url, fetchFn)
      if (foto) partes.push(enLinea('image/jpeg', foto))
    }
  }
  if (!partes.length) throw new Error(medios.video ? 'No se pudo bajar el video ni su portada' : 'No se pudieron bajar las fotos')
  const json = await pedirGemini([...partes, { text: promptIdea({ ...contexto, soloImagen }) }], deps)
  return { analisis: leerAnalisis(json), soloImagen }
}
