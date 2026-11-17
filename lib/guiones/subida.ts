// Las reglas de la subida de un video desde el teléfono: qué archivos sirven, su nombre limpio y dónde queda en el
// bucket privado «crudos» (<id>/<único>-<nombre limpio>). Lo usan la página (antes de pedir) y la API (al pedir y al
// registrar). El archivo va del navegador directo a Storage con una URL firmada: nunca pasa por el servidor del sitio.

// 2 GB, lo mismo que deja el bucket «crudos» (supabase/migrations/20261116_018_guiones.sql)
export const MAX_BYTES = 2 * 1024 ** 3

export const TIPOS_VIDEO = ['video/quicktime', 'video/mp4', 'video/x-m4v', 'video/webm'] as const
export type TipoVideo = (typeof TIPOS_VIDEO)[number]

const POR_EXTENSION: Record<string, TipoVideo> = { mov: 'video/quicktime', qt: 'video/quicktime', mp4: 'video/mp4', m4v: 'video/x-m4v', webm: 'video/webm' }
const EXTENSION: Record<TipoVideo, string> = { 'video/quicktime': 'mov', 'video/mp4': 'mp4', 'video/x-m4v': 'm4v', 'video/webm': 'webm' }

export const NO_ES_VIDEO = 'Ese archivo no es un video que se pueda subir. Sirven los .mov, .mp4, .m4v y .webm.'
export const MUY_GRANDE = 'Ese video pesa más de 2 GB y no cabe. Grábalo en 1080p o córtalo en partes.'
const VACIO = 'Ese archivo está vacío'

const esTipoVideo = (t: string): t is TipoVideo => (TIPOS_VIDEO as readonly string[]).includes(t)

// El nombre sin carpetas, separado en base y extensión de video (si la trae)
function partes(nombre: string): { base: string; ext: string } {
  const archivo = nombre.trim().split(/[\\/]/).pop() ?? ''
  const m = /^(.*)\.([A-Za-z0-9]{1,5})$/.exec(archivo)
  const ext = m ? m[2].toLowerCase() : ''
  return m && POR_EXTENSION[ext] ? { base: m[1], ext } : { base: archivo, ext: '' }
}

// El tipo del video: el que dice el navegador si es uno de los que sirven; si no dice nada, el de la extensión
export function tipoDeVideo(tipo: string, nombre: string): TipoVideo | null {
  const t = tipo.trim().toLowerCase()
  if (esTipoVideo(t)) return t
  if (t && t !== 'application/octet-stream') return null
  return POR_EXTENSION[partes(nombre).ext] ?? null
}

// «Gancho «mito» ñandú.MOV» → «gancho-mito-nandu.mov»: lo que acepta Storage, sin carpetas y nunca vacío
export function nombreLimpio(nombre: string, tipo?: TipoVideo | null): string {
  const { base, ext } = partes(nombre)
  const limpia =
    base
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 60)
      .replace(/-+$/, '') || 'video'
  return `${limpia}.${ext || (tipo ? EXTENSION[tipo] : 'mov')}`
}

export function rutaSubida(id: string, nombre: string, tipo: TipoVideo, unico: string): string {
  return `${id}/${unico}-${nombreLimpio(nombre, tipo)}`
}

const RUTA = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/[0-9a-z]{6,40}-([a-z0-9]+(?:-[a-z0-9]+)*\.(?:mov|qt|mp4|m4v|webm))$/

// Solo una ruta con la forma de rutaSubida y de la carpeta de ese guion
export function esRutaDe(id: string, ruta: string): boolean {
  const m = RUTA.exec(ruta)
  return !!m && m[1] === id
}

// <id>/<único>-toma-1.mov → toma-1.mov
export function nombreDeRuta(ruta: string): string {
  return RUTA.exec(ruta)?.[2] ?? (ruta.split('/').pop() ?? ruta)
}

export type PedidoSubida = { nombre: string; bytes: number; tipo: TipoVideo }

function revisar(nombre: string, bytes: number, tipo: string): { ok: true; tipo: TipoVideo } | { ok: false; error: string } {
  if (bytes <= 0) return { ok: false, error: VACIO }
  const t = tipoDeVideo(tipo, nombre)
  if (!t) return { ok: false, error: NO_ES_VIDEO }
  if (bytes > MAX_BYTES) return { ok: false, error: MUY_GRANDE }
  return { ok: true, tipo: t }
}

// POST /api/guiones/[id]/subida: { nombre, bytes, tipo }
export function leerPedidoSubida(body: unknown): { ok: true; pedido: PedidoSubida } | { ok: false; error: string } {
  const b = body && typeof body === 'object' ? (body as Record<string, unknown>) : {}
  const nombre = typeof b.nombre === 'string' ? b.nombre.trim().slice(0, 300) : ''
  if (!nombre) return { ok: false, error: 'Falta el nombre del archivo' }
  if (typeof b.bytes !== 'number' || !Number.isSafeInteger(b.bytes)) return { ok: false, error: 'Falta el tamaño del archivo' }
  const r = revisar(nombre, b.bytes, typeof b.tipo === 'string' ? b.tipo : '')
  return r.ok ? { ok: true, pedido: { nombre, bytes: b.bytes, tipo: r.tipo } } : r
}

// En la página, con el archivo que escogió (antes de pedir la subida)
export function revisarArchivo(a: { name: string; size: number; type: string }): { ok: true; tipo: TipoVideo } | { ok: false; error: string } {
  return revisar(a.name, a.size, a.type)
}

export const SIN_TAMANO = 'El servidor todavía no dice cuánto pesa el video. Toca «Reintentar» en un momento.'

// Lo que dice Storage del archivo ya subido, antes de anotarlo. Sin tamaño no se anota (nada de 0 bytes) ni se borra
// (puede que Storage todavía no lo diga); vacío, de más de 2 GB o que no es video: se borra.
export function revisarSubido(a: {
  bytes: number | null
  tipo: string | null
}): { ok: true; bytes: number } | { ok: false; borrar: boolean; status: number; error: string } {
  if (typeof a.bytes !== 'number' || !Number.isFinite(a.bytes) || a.bytes < 0) return { ok: false, borrar: false, status: 409, error: SIN_TAMANO }
  if (a.bytes === 0) return { ok: false, borrar: true, status: 400, error: VACIO }
  if (a.bytes > MAX_BYTES) return { ok: false, borrar: true, status: 400, error: MUY_GRANDE }
  if (a.tipo && !esTipoVideo(a.tipo)) return { ok: false, borrar: true, status: 400, error: NO_ES_VIDEO }
  return { ok: true, bytes: a.bytes }
}

// «Reintentar» de un video: si el PUT dio 2xx, solo falta avisar; si se cortó sin saber si llegó, primero se pregunta
// (si el servidor dice que no está, se vuelve a subir soltando esa ruta); si nunca se pidió la URL, desde cero.
export function comoReintentar(it: {
  ruta: string | null
  subido: boolean
}): { paso: 'avisar'; ruta: string } | { paso: 'revisar'; ruta: string } | { paso: 'subir'; reemplaza: string | null } {
  if (!it.ruta) return { paso: 'subir', reemplaza: null }
  return it.subido ? { paso: 'avisar', ruta: it.ruta } : { paso: 'revisar', ruta: it.ruta }
}

export const SE_CORTO = 'Se cortó la conexión. Revisa el internet y toca «Reintentar».'

// Lo que contesta Storage cuando el video no entra, dicho en simple (status 0 = no hubo respuesta)
export function errorDeSubida(status: number, cuerpo: string): string {
  if (status === 0) return SE_CORTO
  let t = cuerpo
  try {
    const j = JSON.parse(cuerpo) as { message?: unknown; error?: unknown } | null
    t = `${j?.error ?? ''} ${j?.message ?? ''}`
  } catch {}
  t = t.toLowerCase()
  if (status === 413 || t.includes('maximum allowed size') || t.includes('too large')) return 'El servidor no aceptó el video: pesa más de lo que deja ahora.'
  if (status === 415 || t.includes('mime')) return 'El servidor no aceptó ese tipo de video.'
  if (t.includes('expired') || t.includes('"exp"') || t.includes('invalidjwt')) return 'Se venció el permiso para subir. Toca «Reintentar».'
  return `No se pudo subir (error ${status}). Toca «Reintentar».`
}

// El camino de cada video en la página: en fila → preparando → subiendo → revisando → subido (o no subió)
export type Fase = 'esperando' | 'preparando' | 'subiendo' | 'revisando' | 'lista' | 'error'
export const EN_CURSO: Fase[] = ['esperando', 'preparando', 'subiendo', 'revisando']

// `yaSubio`: el archivo llegó a Storage y lo que falló fue el aviso (no se dice «No subió»)
export function avanceLegible(fase: Fase, progreso: number, yaSubio = false): string {
  switch (fase) {
    case 'esperando':
      return 'En fila'
    case 'preparando':
      return 'Preparando…'
    case 'subiendo':
      // Al 100 % todavía falta que Storage termine de guardarlo
      return progreso >= 0.999 ? 'Terminando…' : `${Math.floor(Math.max(0, progreso) * 100)} %`
    case 'revisando':
      return 'Revisando…'
    case 'lista':
      return 'Subido'
    case 'error':
      return yaSubio ? 'Falta avisar' : 'No subió'
  }
}
