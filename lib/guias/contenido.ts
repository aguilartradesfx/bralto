import { z } from 'zod'

// Una guía de bralto.io/es/guias: lo abierto se lee sin registro y lo bloqueado solo sale
// del servidor con acceso (cookie firmada, lib/guias/acceso.ts). El contenido vive en Supabase,
// nunca en el repo, que es público.

const https = z.string().refine((u) => /^https:\/\/\S+$/.test(u), 'Solo enlaces https')

// Las imágenes de las guías viven en el bucket público social-images, carpeta guias/ (next.config.mjs la permite)
export const IMAGENES_GUIAS = 'https://pjwmfllnyauobityaile.supabase.co/storage/v1/object/public/social-images/guias/'
const imagenGuia = z.string().refine((u) => u.startsWith(IMAGENES_GUIAS) && !/\s|\.\./.test(u), 'Imagen fuera de la carpeta de guías')

const BloqueSchema = z.discriminatedUnion('tipo', [
  // ancho y alto: el tamaño real del archivo, para reservar su lugar y que la página no salte al cargar
  z.object({
    tipo: z.literal('imagen'),
    src: imagenGuia,
    alt: z.string().min(1),
    ancho: z.number().int().positive(),
    alto: z.number().int().positive(),
    pie: z.string().optional(),
  }),
  z.object({ tipo: z.literal('subtitulo'), texto: z.string().min(1) }),
  z.object({ tipo: z.literal('parrafo'), texto: z.string().min(1) }),
  z.object({ tipo: z.literal('nota'), texto: z.string().min(1) }),
  z.object({ tipo: z.literal('lista'), items: z.array(z.string().min(1)).min(1) }),
  z.object({ tipo: z.literal('paso'), titulo: z.string().min(1), texto: z.string().optional() }),
  z.object({ tipo: z.literal('codigo'), codigo: z.string().min(1), etiqueta: z.string().optional() }),
  z.object({ tipo: z.literal('enlace'), texto: z.string().min(1), url: https }),
])

export type Bloque = z.infer<typeof BloqueSchema>

export type Guia = {
  slug: string
  palabra: string
  titulo: string
  resumen: string
  etiqueta: string
  incluye: string[]
  fuenteNombre: string | null
  fuenteUrl: string | null
  imagenUrl: string | null
  abierto: Bloque[]
  bloqueado: Bloque[]
}

// El slug va en la URL y en el redirect del candado: solo minúsculas, números y guiones
export const SLUG_GUIA = /^[a-z0-9-]{1,80}$/

const FilaSchema = z.object({
  slug: z.string().regex(SLUG_GUIA),
  palabra: z.string().min(1),
  titulo: z.string().min(1),
  resumen: z.string().min(1),
  etiqueta: z.string().min(1),
  incluye: z.array(z.string()),
  fuente_nombre: z.string().nullish(),
  fuente_url: https.nullish(),
  imagen_url: imagenGuia.nullish(), // la portada, de la misma carpeta que las imágenes de los pasos
  abierto: z.array(BloqueSchema),
  bloqueado: z.array(BloqueSchema),
})

// Una fila con algo raro (un bloque que no conocemos, un enlace que no es https) no se muestra
export function filaAGuia(fila: Record<string, unknown>): Guia | null {
  const r = FilaSchema.safeParse(fila)
  if (!r.success) return null
  const f = r.data
  return {
    slug: f.slug,
    palabra: f.palabra,
    titulo: f.titulo,
    resumen: f.resumen,
    etiqueta: f.etiqueta,
    incluye: f.incluye,
    fuenteNombre: f.fuente_nombre ?? null,
    fuenteUrl: f.fuente_url ?? null,
    imagenUrl: f.imagen_url ?? null,
    abierto: f.abierto,
    bloqueado: f.bloqueado,
  }
}

export type Visible = Bloque & { numero?: number }

// Los pasos se numeran seguidos en las dos partes; sin acceso, lo bloqueado ni siquiera se devuelve
export function bloquesVisibles(g: Guia, conAcceso: boolean): { abierto: Visible[]; bloqueado: Visible[] } {
  let n = 0
  const numerar = (b: Bloque): Visible => (b.tipo === 'paso' ? { ...b, numero: ++n } : b)
  const abierto = g.abierto.map(numerar)
  return { abierto, bloqueado: conAcceso ? g.bloqueado.map(numerar) : [] }
}

// El id de una sección para «Ir directo a»: sin acentos ni signos, con guiones
export function idSeccion(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
}

// Las secciones de la guía (sus subtítulos) para «Ir directo a». El id es el mismo que lleva el
// subtítulo en la página (idSeccion); si dos se llaman igual, el botón lleva al primero.
export function secciones(g: Pick<Guia, 'abierto' | 'bloqueado'>): { id: string; texto: string }[] {
  const vistos = new Set<string>()
  const salida: { id: string; texto: string }[] = []
  for (const b of [...g.abierto, ...g.bloqueado]) {
    if (b.tipo !== 'subtitulo') continue
    const id = idSeccion(b.texto)
    if (!id || vistos.has(id)) continue
    vistos.add(id)
    salida.push({ id, texto: b.texto })
  }
  return salida
}

export type Grupo =
  | { tipo: 'bloque'; bloque: Visible }
  | { tipo: 'paso'; paso: Visible; cuerpo: Visible[]; imagenes: Visible[] }

// Cada paso se lleva lo que viene después (texto, comandos e imágenes) hasta el próximo paso o subtítulo:
// así la página lo arma como una tarjeta, con la imagen al lado en pantallas anchas
export function agrupar(bloques: Visible[]): Grupo[] {
  const grupos: Grupo[] = []
  let actual: Extract<Grupo, { tipo: 'paso' }> | null = null
  for (const b of bloques) {
    if (b.tipo === 'paso') {
      actual = { tipo: 'paso', paso: b, cuerpo: [], imagenes: [] }
      grupos.push(actual)
    } else if (b.tipo === 'subtitulo' || !actual) {
      actual = null
      grupos.push({ tipo: 'bloque', bloque: b })
    } else if (b.tipo === 'imagen') {
      actual.imagenes.push(b)
    } else {
      actual.cuerpo.push(b)
    }
  }
  return grupos
}

export type Trozo = { t: 'texto' | 'negrita' | 'codigo'; v: string } | { t: 'enlace'; v: string; url: string }

// Solo **negrita**, `código` y [texto](https://…): nada de HTML
const MARCAS = /\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\((https:\/\/[^\s)]+)\)/g

export function trozos(texto: string): Trozo[] {
  const salida: Trozo[] = []
  let ultimo = 0
  for (const m of texto.matchAll(MARCAS)) {
    if (m.index > ultimo) salida.push({ t: 'texto', v: texto.slice(ultimo, m.index) })
    if (m[1] !== undefined) salida.push({ t: 'negrita', v: m[1] })
    else if (m[2] !== undefined) salida.push({ t: 'codigo', v: m[2] })
    else salida.push({ t: 'enlace', v: m[3], url: m[4] })
    ultimo = m.index + m[0].length
  }
  if (ultimo < texto.length) salida.push({ t: 'texto', v: texto.slice(ultimo) })
  return salida
}
