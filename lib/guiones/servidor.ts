// «Guiones» con la base de datos y Storage: la lista del panel, cargar el guion de la noche, descartar / volver a
// abrir, y pedir y registrar la subida de un video. Las reglas están en reglas.ts, subida.ts y esquema.ts, con pruebas.
// Este archivo también lo carga el comando de la noche (scripts/guiones/cargar.ts) con Node directo: por eso los
// imports son relativos con .ts y no hay `server-only`. Quien llama revisa antes que sea administrador.
import { randomBytes } from 'node:crypto'
import { createServiceClient } from '../supabase/service.ts'
import { cambioPorAccion, noRecibeVideos, puedeSubir, sumarVideo, type AccionGuion } from './reglas.ts'
import { esRutaDe, MAX_BYTES, NO_ES_VIDEO, MUY_GRANDE, nombreDeRuta, rutaSubida, TIPOS_VIDEO, type PedidoSubida } from './subida.ts'
import { BUCKET_CRUDOS, COLUMNAS_GUION, TABLA_GUIONES, type EstadoGuion, type Guion, type GuionFila, type VideoGuion } from './tipos.ts'

const MAX_LISTA = 120
// Dos videos que terminan a la vez: el segundo vuelve a leer y se suma encima (escritura condicional)
const INTENTOS = 5
const NO_EXISTE = 'Ese guion ya no existe'
const CAMBIO = 'El guion cambió mientras tanto. Mira cómo quedó y prueba de nuevo.'

const db = () => createServiceClient()

export type Resultado<T extends object = object> = ({ ok: true } & T) | { ok: false; status: number; error: string }
const falla = (status: number, error: string) => ({ ok: false as const, status, error })

const lista = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

// Las listas son jsonb: si algo raro llegó a la fila, la página no se rompe
function normalizar(f: Record<string, unknown>): GuionFila {
  const g = f as GuionFila
  return { ...g, lineas: lista(g.lineas), ganchos: lista(g.ganchos), videos: lista(g.videos) }
}

export async function leerGuiones(): Promise<GuionFila[]> {
  const { data, error } = await db()
    .from(TABLA_GUIONES)
    .select(COLUMNAS_GUION)
    .order('dia', { ascending: false })
    .order('creado_en', { ascending: false })
    .limit(MAX_LISTA)
  if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
  return (data ?? []).map((f) => normalizar(f as Record<string, unknown>))
}

async function leerGuion(id: string): Promise<GuionFila | null> {
  const { data, error } = await db().from(TABLA_GUIONES).select(COLUMNAS_GUION).eq('id', id).maybeSingle()
  if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
  return data ? normalizar(data as Record<string, unknown>) : null
}

export type Carga = { id: string; nuevo: boolean; estado: EstadoGuion }

// El guion de la noche: uno por día y título. Si ya existe, se actualiza lo escrito sin tocar su estado ni sus videos
// (el upsert solo pone las columnas que manda; lo demás queda como estaba)
export async function cargarGuion(g: Guion, o: { dia: string; carpeta: string | null }): Promise<Carga> {
  const fila = {
    dia: o.dia,
    titulo: g.titulo,
    tema: g.tema,
    comenta: g.comenta,
    guia: g.guia,
    duracion_s: g.duracion_s,
    lineas: g.lineas,
    ganchos: g.ganchos,
    carpeta: o.carpeta,
  }
  const { data, error } = await db()
    .from(TABLA_GUIONES)
    .upsert(fila, { onConflict: 'dia,titulo' })
    .select('id, estado, creado_en, actualizado_en')
    .single()
  if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
  // Al crearla, las dos horas son el mismo now(); al actualizar, el disparador mueve actualizado_en
  return { id: data.id as string, estado: data.estado as EstadoGuion, nuevo: data.creado_en === data.actualizado_en }
}

// «Descartar» y «Volver a abrir». Condicional sobre el estado: si el servidor lo tomó para editar justo ahora, no se pisa
export async function aplicarAccion(id: string, accion: AccionGuion): Promise<Resultado<{ estado: EstadoGuion }>> {
  const f = await leerGuion(id)
  if (!f) return falla(404, NO_EXISTE)
  const c = cambioPorAccion(f, accion)
  if ('error' in c) return falla(c.status, c.error)
  const { data, error } = await db().from(TABLA_GUIONES).update(c.cambios).eq('id', id).eq('estado', f.estado).select('estado')
  if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
  if (!data?.length) return falla(409, CAMBIO)
  return { ok: true, estado: data[0].estado as EstadoGuion }
}

// La URL firmada para que el navegador suba el video directo a «crudos» (vale 2 horas y no pisa nada)
export async function pedirSubida(id: string, p: PedidoSubida): Promise<Resultado<{ ruta: string; url: string }>> {
  const { data, error } = await db().from(TABLA_GUIONES).select('estado').eq('id', id).maybeSingle()
  if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
  if (!data) return falla(404, NO_EXISTE)
  const estado = data.estado as EstadoGuion
  if (!puedeSubir(estado)) {
    const f = noRecibeVideos(estado)
    return falla(f.status, f.error)
  }
  const unico = `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`
  const ruta = rutaSubida(id, p.nombre, p.tipo, unico)
  const { data: firmada, error: e2 } = await db().storage.from(BUCKET_CRUDOS).createSignedUploadUrl(ruta)
  if (e2 || !firmada) throw new Error(`${BUCKET_CRUDOS}: ${e2?.message ?? 'sin URL firmada'}`)
  return { ok: true, ruta, url: firmada.signedUrl }
}

// El archivo tal como quedó en el bucket (o null si no está)
async function buscarEnCrudos(ruta: string): Promise<{ bytes: number; tipo: string | null } | null> {
  const [carpeta, archivo] = ruta.split('/')
  const { data, error } = await db().storage.from(BUCKET_CRUDOS).list(carpeta, { limit: 100, search: archivo })
  if (error) throw new Error(`${BUCKET_CRUDOS}: ${error.message}`)
  const o = (data ?? []).find((x) => x.name === archivo && x.id)
  if (!o) return null
  const m = (o.metadata ?? {}) as { size?: unknown; mimetype?: unknown }
  return { bytes: typeof m.size === 'number' ? m.size : 0, tipo: typeof m.mimetype === 'string' ? m.mimetype : null }
}

// Al terminar la subida: revisa que el archivo esté en el bucket, lo suma a `videos` y el guion queda «Subido»
export async function registrarSubida(id: string, ruta: string): Promise<Resultado<{ estado: EstadoGuion; videos: number }>> {
  if (!esRutaDe(id, ruta)) return falla(400, 'Ese video no es de este guion')
  const archivo = await buscarEnCrudos(ruta)
  if (!archivo) return falla(409, 'Todavía no veo el video completo en el servidor. Toca «Reintentar».')
  // El bucket ya pone estos límites; si no los tuviera, el archivo no se queda
  const malo = archivo.bytes > MAX_BYTES ? MUY_GRANDE : archivo.tipo && !(TIPOS_VIDEO as readonly string[]).includes(archivo.tipo) ? NO_ES_VIDEO : null
  if (malo) {
    await db().storage.from(BUCKET_CRUDOS).remove([ruta])
    return falla(400, malo)
  }
  const video: VideoGuion = { ruta, nombre: nombreDeRuta(ruta), bytes: archivo.bytes, subido_en: new Date().toISOString() }
  for (let i = 0; i < INTENTOS; i++) {
    const f = await leerGuion(id)
    if (!f) return falla(404, NO_EXISTE)
    const s = sumarVideo(f, video)
    if ('repetido' in s) return { ok: true, estado: f.estado, videos: f.videos.length }
    if ('error' in s) return falla(s.status, s.error)
    const { data, error } = await db()
      .from(TABLA_GUIONES)
      .update(s.cambios)
      .eq('id', id)
      .eq('actualizado_en', f.actualizado_en)
      .select('estado, videos')
    if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
    if (data?.length) return { ok: true, estado: data[0].estado as EstadoGuion, videos: lista(data[0].videos).length }
  }
  return falla(409, CAMBIO)
}
