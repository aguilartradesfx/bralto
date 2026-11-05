// bralto.io/es/recursos: lo que se publica, en tres pestañas que la persona escoge.
//   Guías: las guías de los posts de Instagram (tutoriales, herramientas, recursos, reels).
//   Noticias: las notas del sitio (noticias y artículos) y las guías de los posts de noticias.
//   Descargables: las guías que piden datos (traen algo para bajar).
// Solo en español, como las guías. Lógica sin conexiones, con pruebas en lista.test.ts.

export type Seccion = 'guias' | 'noticias' | 'descargables'
export const SECCIONES: Seccion[] = ['guias', 'noticias', 'descargables']

export const POR_PAGINA = 24

// Lo que se lee de la tabla guias (solo las publicadas)
export type FilaGuia = {
  slug: string
  titulo: string
  resumen: string
  etiqueta: string
  imagen_url: string | null
  tipo: string | null // tutorial, noticia, dato (reel), herramientas o recursos: el tipo del post
  pide_datos: boolean | null
  creada_en: string
  publicar_en?: string | null // cuándo sale (o salió) su post en Instagram, de redes_publicaciones
}

// Lo que se lee de la tabla noticias (solo las publicadas)
export type FilaNota = {
  slug: string
  tipo: 'noticia' | 'articulo'
  titulo_es: string
  resumen_es: string
  imagen_url: string
  publicada_en: string
}

export type Recurso = {
  clave: string
  seccion: Seccion
  href: string
  titulo: string
  resumen: string
  etiqueta: string
  imagen: string | null
  fecha: string
}

// /recursos es Guías; /recursos/noticias y /recursos/descargables las otras. Cualquier otra cosa da 404.
export function leerSeccion(partes: string[] | undefined): Seccion | null {
  if (!partes || partes.length === 0) return 'guias'
  if (partes.length !== 1) return null
  return partes[0] === 'noticias' || partes[0] === 'descargables' ? partes[0] : null
}

export const rutaDeSeccion = (s: Seccion) => (s === 'guias' ? '/es/recursos' : `/es/recursos/${s}`)

// Lo descargable va primero: aunque sea de una noticia, lo que la persona busca es el archivo
export function seccionDeGuia(g: { tipo: string | null; pide_datos: boolean | null }): Seccion {
  if (g.pide_datos) return 'descargables'
  return g.tipo === 'noticia' ? 'noticias' : 'guias'
}

const NOMBRE: Record<Seccion, string> = { guias: 'Guía', noticias: 'Noticia', descargables: 'Descargable' }

export function desdeGuia(g: FilaGuia): Recurso {
  const seccion = seccionDeGuia(g)
  const tema = g.etiqueta.replace(/^Guía\s*·\s*/, '').trim()
  return {
    clave: `guia:${g.slug}`,
    seccion,
    href: `/es/guias/${g.slug}`,
    titulo: g.titulo,
    resumen: g.resumen,
    etiqueta: tema ? `${NOMBRE[seccion]} · ${tema}` : NOMBRE[seccion],
    imagen: g.imagen_url,
    fecha: g.publicar_en ?? g.creada_en,
  }
}

export function desdeNota(n: FilaNota): Recurso {
  return {
    clave: `nota:${n.slug}`,
    seccion: 'noticias',
    href: `/es/noticias/${n.slug}`,
    titulo: n.titulo_es,
    resumen: n.resumen_es,
    etiqueta: n.tipo === 'articulo' ? 'Artículo' : 'Noticia',
    imagen: n.imagen_url,
    fecha: n.publicada_en,
  }
}

// La guía se carga la noche antes que su post: aparece aquí cuando el post sale, no antes
export function armar(notas: FilaNota[], guias: FilaGuia[], ahora = new Date().toISOString()): Record<Seccion, Recurso[]> {
  const yaSalieron = guias.filter((g) => !g.publicar_en || new Date(g.publicar_en) <= new Date(ahora))
  const todo = [...notas.map(desdeNota), ...yaSalieron.map(desdeGuia)].sort((a, b) => Date.parse(b.fecha) - Date.parse(a.fecha))
  return {
    guias: todo.filter((r) => r.seccion === 'guias'),
    noticias: todo.filter((r) => r.seccion === 'noticias'),
    descargables: todo.filter((r) => r.seccion === 'descargables'),
  }
}

export function pagina<T>(items: T[], n: number, tam = POR_PAGINA): { items: T[]; hayMas: boolean } {
  const desde = (Math.max(1, n) - 1) * tam
  return { items: items.slice(desde, desde + tam), hayMas: items.length > desde + tam }
}
