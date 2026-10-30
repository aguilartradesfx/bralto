import type { Publicacion } from '../redes/publicacion/tipos.ts'

// Una fila completa de redes_publicaciones, como la lee el panel
export type Fila = Publicacion & { ultimo_error: string | null }

// Lo que necesita la página de una publicación. Campo por campo: lo interno (los mensajes del «Comenta»,
// los pasos de la publicación) no viaja al navegador
export type Vista = Pick<
  Fila,
  | 'id'
  | 'titulo'
  | 'tipo'
  | 'estado'
  | 'publicar_en'
  | 'texto'
  | 'laminas'
  | 'video_url'
  | 'portada_url'
  | 'historias'
  | 'colaborador'
  | 'hecho_con_ia'
  | 'facebook'
  | 'ultimo_error'
> & {
  palabra: string | null // la del «Comenta PALABRA»
  instagram: string | null // enlace al post, si ya salió
  facebookUrl: string | null
}

export function aVista(f: Fila): Vista {
  return {
    id: f.id,
    titulo: f.titulo,
    tipo: f.tipo,
    estado: f.estado,
    publicar_en: f.publicar_en,
    texto: f.texto,
    laminas: f.laminas,
    video_url: f.video_url,
    portada_url: f.portada_url,
    historias: f.historias,
    colaborador: f.colaborador,
    hecho_con_ia: f.hecho_con_ia,
    facebook: f.facebook,
    ultimo_error: f.ultimo_error,
    palabra: f.comenta?.palabras?.[0] ?? null,
    instagram: f.resultado?.instagram?.permalink ?? null,
    facebookUrl: f.resultado?.facebook?.url ?? null,
  }
}
