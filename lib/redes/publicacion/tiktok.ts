import type { Comenta, Publicacion } from './tipos.ts'
import type { CuentaZernio } from './zernio.ts'

// TikTok sale por Zernio (POST /v1/posts con platform «tiktok», ver docs.zernio.com/platforms/tiktok/posts).
// Se programa unos minutos adelante en vez de publicar en la misma llamada: Zernio sube el video por su
// cuenta y la corrida del cron no se queda esperando. El «Comenta» se ata al post de Zernio y se arma solo
// cuando sale.

export type DatosTikTok = Pick<Publicacion, 'tipo' | 'texto' | 'laminas' | 'video_url' | 'portada_url' | 'hecho_con_ia'>

// TikTok no deja mandar mensajes privados a quien comenta: la respuesta es pública y lo manda al enlace del
// perfil (bralto.io/es/recursos, donde están todas las guías). Un enlace en el comentario TikTok lo esconde
export const RESPUESTAS_TIKTOK = [
  '¡Listo! 🙌 La guía está gratis en el link de mi perfil.',
  '¡Ahí te va! Está en el link de mi perfil, en Recursos 📩',
  '¡Hecho! Búscala gratis en el link de mi perfil 🙌',
]

const AVISO_IA = '📸 Fotos hechas con IA.'
const MAX_TITULO = 90

// En fotos TikTok no deja marcar «hecho con IA» por la API: se dice en el texto, antes de los hashtags
export function conAvisoIA(texto: string): string {
  const bloques = texto.trimEnd().split('\n\n')
  const ultimo = bloques[bloques.length - 1]
  if (bloques.length > 1 && ultimo.trimStart().startsWith('#')) {
    return [...bloques.slice(0, -1), AVISO_IA, ultimo].join('\n\n')
  }
  return `${texto.trimEnd()}\n\n${AVISO_IA}`
}

// El título de un post de fotos: la primera línea, sin hashtags, de 90 caracteres como máximo (corta en una
// palabra y termina en «…»)
export function tituloFotos(texto: string): string {
  const linea = (texto.split('\n').find((l) => l.trim()) ?? '').replace(/#[\p{L}\p{N}_]+/gu, '').replace(/\s+/g, ' ').trim()
  const letras = [...linea]
  if (letras.length <= MAX_TITULO) return linea
  const corte = letras.slice(0, MAX_TITULO - 1).join('')
  const espacio = corte.lastIndexOf(' ')
  return `${(espacio > 40 ? corte.slice(0, espacio) : corte).trimEnd()}…`
}

const CONSENTIMIENTO = { contentPreviewConfirmed: true, expressConsentGiven: true }

// El cuerpo de POST /v1/posts. `cuando`: la hora en ISO a la que Zernio lo publica
export function cuerpoTikTok(p: DatosTikTok, accountId: string, cuando: string) {
  const plataformas = [{ platform: 'tiktok', accountId }]
  if (p.tipo === 'reel') {
    return {
      content: p.texto,
      mediaItems: [{ type: 'video', url: p.video_url ?? '' }],
      platforms: plataformas,
      tiktokSettings: {
        privacyLevel: 'PUBLIC_TO_EVERYONE',
        allowComment: true,
        allowDuet: true,
        allowStitch: true,
        ...CONSENTIMIENTO,
        ...(p.hecho_con_ia ? { videoMadeWithAi: true } : {}),
        ...(p.portada_url ? { videoCoverImageUrl: p.portada_url } : {}),
      },
      scheduledFor: cuando,
    }
  }
  return {
    content: tituloFotos(p.texto),
    mediaItems: p.laminas.map((url) => ({ type: 'image', url })),
    platforms: plataformas,
    tiktokSettings: {
      privacyLevel: 'PUBLIC_TO_EVERYONE',
      allowComment: true,
      mediaType: 'photo',
      photoCoverIndex: 0,
      autoAddMusic: true,
      description: p.hecho_con_ia ? conAvisoIA(p.texto) : p.texto,
      ...CONSENTIMIENTO,
    },
    scheduledFor: cuando,
  }
}

// Lo que ya se hizo en TikTok (va en `resultado.tiktok`). zernioId null: no se pudo programar
export type ResultadoTikTok = {
  zernioId: string | null
  programado?: string // a qué hora sale
  automatizacion?: string
  errorComenta?: string
  error?: string
}

export type EfectosTikTok = {
  programar(p: Publicacion, cuando: string): Promise<string> // el id del post en Zernio
  comenta(zernioId: string, p: Publicacion): Promise<string> // el id de la automatización
}

// Unos minutos adelante: Zernio lo publica por su cuenta y nadie se queda esperando a que suba el video
const EN_MS = 3 * 60_000
const mensaje = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 300)

// Programa la pieza en TikTok y arma su «Comenta». Sigue donde quedó (`previo`) y no tira error: lo que falla
// queda anotado en el resultado. `guardar` se llama después de cada paso
export async function mandarATikTok(
  p: Publicacion,
  previo: ResultadoTikTok | undefined,
  tt: EfectosTikTok,
  ahora: number,
  guardar: (t: ResultadoTikTok) => Promise<void>,
): Promise<ResultadoTikTok> {
  let t: ResultadoTikTok = structuredClone(previo ?? { zernioId: null })
  if (!t.zernioId) {
    const cuando = new Date(ahora + EN_MS).toISOString()
    try {
      t = { zernioId: await tt.programar(p, cuando), programado: cuando }
    } catch (err) {
      t = { zernioId: null, error: mensaje(err) }
    }
    await guardar(t)
  }
  if (t.zernioId && p.comenta && !t.automatizacion) {
    try {
      t.automatizacion = await tt.comenta(t.zernioId, p)
      delete t.errorComenta
    } catch (err) {
      t.errorComenta = mensaje(err)
    }
    await guardar(t)
  }
  return t
}

// El «Comenta» de TikTok (POST /v1/comment-automations): solo respuesta pública. `postId` es el id del post
// en Zernio: la automatización queda esperando y se arma sola cuando el post sale
export function cuerpoComentaTikTok(o: { cuenta: CuentaZernio; postId: string; titulo: string; comenta: Comenta }) {
  const [respuesta, ...variaciones] = RESPUESTAS_TIKTOK
  return {
    profileId: o.cuenta.profileId,
    accountId: o.cuenta.accountId,
    name: `${o.titulo} (TikTok)`,
    trigger: 'comment',
    postId: o.postId,
    postTitle: o.titulo,
    keywords: o.comenta.palabras,
    matchMode: 'word',
    typoTolerance: Boolean(o.comenta.tolerarErrores),
    commentReply: respuesta,
    commentReplyVariations: variaciones,
  }
}
