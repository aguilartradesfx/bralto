import type { Comenta } from './tipos.ts'

// El cuerpo de una automatización «Comenta X» de Zernio (POST /v1/comment-automations, ver
// docs.zernio.com/comment-automations/create-comment-automation). Es el mismo armado con el que salieron
// los primeros posts a mano (Bralto-redes/publicaciones/zernio-api.mjs).

export type CuentaZernio = { profileId: string; accountId: string }

// www directo: bralto.io redirige a www y así el enlace del mensaje abre un salto antes
export function enlaceGuia(guia: string, origen: 'ig' | 'fb') {
  return `https://www.bralto.io/es/guias/${guia}?o=${origen}`
}

// Respuestas públicas que sirven en cualquier reel: completan las de cada uno hasta las 6 que deja Zernio
// (la principal y 5 variaciones, que rota al azar). Como se responde en público a todos apenas comentan
// (antes de que toquen el botón del saludo), dicen «te escribí», nunca «aquí está la guía».
export const RESPUESTAS_GENERALES = [
  '¡Listo! Revisa tus mensajes 📩',
  'Te escribí por mensaje 🙌 Si no lo ves, revisa tus solicitudes.',
  '¡Te acabo de escribir! Revisa tus mensajes 📩',
  'Va por mensaje 🚀',
  'Ya te escribí 🙌 Toca el botón y te llega.',
  '¡Revisa tus mensajes! Ahí te espera 👇',
  'Te mandé un DM 📩 Tócale al botón.',
  '¡Te escribí! Toca «¡Sí, porfa!» y es tuya 🙌',
]
export const MAX_RESPUESTAS = 6

// Las del reel primero; después las generales en desorden, sin repetir, hasta 6
export function respuestasPublicas(propias: string[], mezclar: <T>(l: T[]) => T[] = barajar) {
  const todas = [...propias]
  for (const r of mezclar(RESPUESTAS_GENERALES)) {
    if (todas.length >= MAX_RESPUESTAS) break
    if (!todas.includes(r)) todas.push(r)
  }
  return todas.slice(0, MAX_RESPUESTAS)
}

function barajar<T>(l: T[]) {
  const c = [...l]
  for (let i = c.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[c[i], c[j]] = [c[j], c[i]]
  }
  return c
}

export function cuerpoAutomatizacion(o: {
  cuenta: CuentaZernio
  platformPostId: string
  titulo: string
  comenta: Comenta
  origen: 'ig' | 'fb'
  mezclar?: <T>(l: T[]) => T[]
}) {
  const { comenta: c } = o
  const enlace = enlaceGuia(c.guia, o.origen)
  const conEnlace = (t: string) => t.replaceAll('{enlace}', enlace)
  const botones = (c.botones ?? []).map((b) => ({ ...b, title: conEnlace(b.title), url: conEnlace(b.url) }))
  const [respuesta, ...variaciones] = respuestasPublicas(c.respuestas.map(conEnlace), o.mezclar)
  const s = c.seguir
  return {
    profileId: o.cuenta.profileId,
    accountId: o.cuenta.accountId,
    name: o.titulo,
    trigger: 'comment',
    platformPostId: o.platformPostId,
    postTitle: o.titulo,
    keywords: c.palabras,
    matchMode: 'word',
    typoTolerance: Boolean(c.tolerarErrores),
    dmMessage: conEnlace(c.mensaje),
    ...(botones.length ? { buttons: botones } : {}),
    commentReply: respuesta,
    commentReplyVariations: variaciones,
    // 'always': responde en público a todos apenas comentan. Con 'after_dm' (hasta el 13/11) solo respondía a
    // quien ya había tocado el botón del saludo y seguía la cuenta: en el reel viral de logos quedaron 19 de 26 sin respuesta
    publicReplyPolicy: 'always',
    dmDelaySeconds: 20,
    commentReplyDelaySeconds: 40,
    actions: { likeComment: true },
    linkTracking: true,
    ...(c.etiquetaClic ? { clickTag: c.etiquetaClic } : {}),
    // Solo Instagram (Meta no dice quién sigue una página de Facebook). Instagram solo deja ver si sigue
    // alguien que ya escribió: primero va un saludo con botón, tocarlo cuenta como mensaje y Zernio revisa
    // ahí; si sigue, manda la guía, y si no, `noSigue` con el mismo botón
    ...(o.origen === 'ig' && s
      ? {
          audience: { followerStatus: 'follower', whenUnknown: 'verify' },
          followGate: {
            message: conEnlace(s.mensaje),
            buttonLabel: s.boton,
            ...(s.botonPerfil ? { profileButtonLabel: s.botonPerfil } : {}),
            notFollowingMessage: conEnlace(s.noSigue),
          },
        }
      : {}),
  }
}

type PlataformaZernio = { platform: string; status?: string; platformPostId?: string; platformPostUrl?: string; errorMessage?: string; error?: string }
export type RespuestaPost = {
  post?: { _id?: string; status?: string; platforms?: PlataformaZernio[] }
  platforms?: PlataformaZernio[]
  platformPostUrl?: string
}

// La respuesta de POST /v1/posts con publishNow (docs.zernio.com/posts/create-post). Zernio responde 207 cuando
// el post se creó pero publicar falló o quedó a medias: se mira el estado de Facebook, no el código HTTP.
// Si sigue publicando, queda «en proceso» sin inventar un id. El id del post es «página_post»: sin
// platformPostId sale de un enlace numérico; los enlaces «pfbid» no traen el número, así que queda sin id.
export function leerPostFacebook(r: RespuestaPost, pagina?: string) {
  const post = r.post ?? {}
  const fb = (post.platforms ?? r.platforms ?? []).find((x) => x.platform === 'facebook')
  const estado = fb?.status ?? post.status
  if (estado === 'failed' || estado === 'cancelled') {
    throw new Error(`Zernio no publicó en Facebook (${estado}): ${fb?.errorMessage ?? fb?.error ?? 'sin motivo'}`)
  }
  const zernioId = post._id ?? null
  const url = fb?.platformPostUrl ?? r.platformPostUrl ?? null
  if (estado !== 'published' && !url) return { zernioId, postId: null, url: null, estado }
  const numerico = url?.match(/(\d{6,})\/posts\/(\d+)(?:[/?#]|$)/)
  const fbid = url?.match(/[?&]fbid=(\d+)/)?.[1]
  const postId = fb?.platformPostId ?? (numerico ? `${numerico[1]}_${numerico[2]}` : fbid && pagina ? `${pagina}_${fbid}` : null)
  return { zernioId, postId, url }
}
