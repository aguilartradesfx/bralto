// Una fila de redes_publicaciones (supabase/migrations/20261030_001_redes_publicaciones.sql).

// Si Instagram falla, la publicación vuelve a la cola (cada 5 minutos) hasta este intento
export const MAX_INTENTOS = 3

export type Tipo = 'carrusel' | 'reel'
export type Estado = 'borrador' | 'programado' | 'publicando' | 'publicado' | 'error' | 'cancelado'

export type Boton = { type: 'url'; title: string; url: string }

// El «Comenta X» de Zernio. {enlace} en el mensaje y en los botones es la guía en bralto.io
export type Comenta = {
  guia: string
  palabras: string[]
  tolerarErrores?: boolean
  mensaje: string
  botones?: Boton[]
  respuestas: string[] // la primera es la respuesta pública al comentario; las demás, variaciones
  etiquetaClic?: string
  // Solo Instagram: un saludo con botón antes de la guía, y la guía solo a quien sigue la cuenta
  seguir?: { mensaje: string; boton: string; botonPerfil?: string; noSigue: string }
}

// Lo que ya se hizo, paso por paso. Se guarda después de cada paso: un reintento no repite lo hecho
export type Resultado = {
  contenedor?: { id: string; creado: number }
  instagram?: { id: string; permalink: string | null; en: string }
  comentaIg?: { id: string } | { error: string }
  facebook?: { postId: string | null; url: string | null; automatizacion?: string; errorComenta?: string; error?: string }
  collab?: string // 'aceptada' o 'pendiente: <motivo>'
  historias?: string[] // id de cada historia, o 'error: <motivo>'
}

export type Publicacion = {
  id: string
  titulo: string
  tipo: Tipo
  estado: Estado
  publicar_en: string
  texto: string
  laminas: string[]
  video_url: string | null
  portada_url: string | null
  historias: string[]
  colaborador: string | null
  hecho_con_ia: boolean
  facebook: boolean
  comenta: Comenta | null
  resultado: Resultado
  intentos: number
}
