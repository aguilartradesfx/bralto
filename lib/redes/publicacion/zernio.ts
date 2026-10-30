import type { Comenta } from './tipos.ts'

// El cuerpo de una automatización «Comenta X» de Zernio (POST /v1/comment-automations, ver
// docs.zernio.com/comment-automations/create-comment-automation). Es el mismo armado con el que salieron
// los primeros posts a mano (Bralto-redes/publicaciones/zernio-api.mjs).

export type CuentaZernio = { profileId: string; accountId: string }

// www directo: bralto.io redirige a www y así el enlace del mensaje abre un salto antes
export function enlaceGuia(guia: string, origen: 'ig' | 'fb') {
  return `https://www.bralto.io/es/guias/${guia}?o=${origen}`
}

export function cuerpoAutomatizacion(o: {
  cuenta: CuentaZernio
  platformPostId: string
  titulo: string
  comenta: Comenta
  origen: 'ig' | 'fb'
}) {
  const { comenta: c } = o
  const enlace = enlaceGuia(c.guia, o.origen)
  const conEnlace = (t: string) => t.replaceAll('{enlace}', enlace)
  const botones = (c.botones ?? []).map((b) => ({ ...b, title: conEnlace(b.title), url: conEnlace(b.url) }))
  const [respuesta, ...variaciones] = c.respuestas
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
    publicReplyPolicy: 'after_dm',
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
            message: s.mensaje,
            buttonLabel: s.boton,
            ...(s.botonPerfil ? { profileButtonLabel: s.botonPerfil } : {}),
            notFollowingMessage: s.noSigue,
          },
        }
      : {}),
  }
}
