// Knox, el asistente del panel: cada día junta lo importante del negocio y se lo cuenta en voz alta a
// Alejandro al abrir admin.bralto.io. Estos son los datos que junta y el reporte que guarda.

export type Cambio = { compra: number; venta: number; fecha: string }

export type CuentaIg = { usuario: string; seguidores: number; nuevosAyer: number | null }

export type PaginaFb = { nombre: string; seguidores: number; sinLeer: number | null }

export type Publicacion = {
  cuenta: string
  titulo: string // primera línea del texto, corta
  tipo: 'reel' | 'carrusel' | 'foto'
  en: string
  enlace: string | null
  vistas: number | null
  alcance: number | null
  meGusta: number
  comentarios: number
  guardados: number | null
  compartidos: number | null
}

export type Comentario = { usuario: string; texto: string; en: string; publicacion: string }

export type Redes = {
  instagram: CuentaIg[]
  facebook: PaginaFb[]
  mensajesIgSinLeer: number | null
  publicaciones: Publicacion[] // de los últimos 7 días, la más reciente primero
  comentarios: Comentario[] // de las últimas 24 horas, de otras personas
}

export type Lead = { nombre: string; origen: string; en: string }

export type Cita = { titulo: string; inicio: string }

export type Conversaciones = {
  sinLeer: number // conversaciones que esperan respuesta, de los últimos 7 días
  porCanal: Record<string, number> // «Instagram», «Messenger», «WhatsApp»…
  ultimas: { nombre: string; canal: string; texto: string; en?: string }[]
}

export type ContenidoDelDia = {
  hoy: { titulo: string; tipo: string; en: string; hora: string; estado: string }[]
  manana: number // cuántas publicaciones hay programadas para mañana
}

export type Datos = {
  cambio: Cambio | null
  redes: Redes | null
  leads: Lead[] | null
  agenda: Cita[] | null
  conversaciones: Conversaciones | null
  contenido: ContenidoDelDia | null
  faltan: string[] // las fuentes que no respondieron esta vez
}

// Cada tarjeta del panel aparece cuando Knox empieza a hablar de ella
export const TARJETAS = [
  'saludo',
  'cambio',
  'leads',
  'agenda',
  'mensajes',
  'publicaciones',
  'seguidores',
  'contenido',
  'cierre',
] as const
export type Tarjeta = (typeof TARJETAS)[number]

export type Seccion = { tarjeta: Tarjeta; texto: string }

export type Reporte = {
  id: string
  fecha: string // día de Costa Rica (AAAA-MM-DD)
  creadoEn: string
  datos: Datos
  secciones: Seccion[]
  inicios: number[] // segundo del audio en que empieza cada sección
  conAudio: boolean
  escritoPor: 'claude' | 'plantilla'
}
