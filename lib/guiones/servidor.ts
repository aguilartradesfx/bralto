// «Guiones» con la base de datos y Storage: la lista del panel, cargar el guion de la noche, descartar / volver a
// abrir, y pedir, registrar y cancelar la subida de un video. Las reglas y los pasos están en reglas.ts, subida.ts,
// esquema.ts y pasos.ts, con pruebas: aquí solo se les da la base y el bucket de verdad.
// Este archivo también lo carga el comando de la noche (scripts/guiones/cargar.ts) con Node directo: por eso los
// imports son relativos con .ts y no hay `server-only`. Quien llama revisa antes que sea administrador.
import { randomBytes } from 'node:crypto'
import { createServiceClient } from '../supabase/service.ts'
import { CAMBIO, NO_EXISTE, filaParaCargar, pedir, registrar, soltar, type Almacen, type Base, type FilaSubida, type Resultado } from './pasos.ts'
import { cambioPorAccion, type AccionGuion } from './reglas.ts'
import type { PedidoSubida } from './subida.ts'
import { BUCKET_CRUDOS, COLUMNAS_GUION, TABLA_GUIONES, type EstadoGuion, type Guion, type GuionFila } from './tipos.ts'

export type { Resultado }

const MAX_LISTA = 120
const COLUMNAS_SUBIDA = 'estado, videos, pendientes, grabado_en, actualizado_en'

const db = () => createServiceClient()
const falla = (status: number, error: string) => ({ ok: false as const, status, error })

const lista = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : [])

// Las listas son jsonb: si algo raro llegó a la fila, la página no se rompe
function normalizar(f: Record<string, unknown>): GuionFila {
  const g = f as GuionFila
  return { ...g, lineas: lista(g.lineas), ganchos: lista(g.ganchos), videos: lista(g.videos), pendientes: lista(g.pendientes) }
}

function filaSubida(f: Record<string, unknown>): FilaSubida {
  return {
    estado: f.estado as EstadoGuion,
    videos: lista(f.videos),
    pendientes: lista(f.pendientes),
    grabado_en: (f.grabado_en as string | null) ?? null,
    actualizado_en: f.actualizado_en as string,
  }
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

export type Carga = { id: string; nuevo: boolean; estado: EstadoGuion }

// El guion de la noche: uno por día y título. Si ya existe, se actualiza lo escrito sin tocar su estado, sus videos ni
// sus pendientes (filaParaCargar solo trae esas columnas, y el upsert solo pone las que manda)
export async function cargarGuion(g: Guion, o: { dia: string; carpeta: string | null }): Promise<Carga> {
  const { data, error } = await db()
    .from(TABLA_GUIONES)
    .upsert(filaParaCargar(g, o), { onConflict: 'dia,titulo' })
    .select('id, estado, creado_en, actualizado_en')
    .single()
  if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
  // Al crearla, las dos horas son el mismo now(); al actualizar, el disparador mueve actualizado_en
  return { id: data.id as string, estado: data.estado as EstadoGuion, nuevo: data.creado_en === data.actualizado_en }
}

// «Descartar» y «Volver a abrir». Condicional sobre el estado: si el servidor lo tomó para editar justo ahora, no se pisa
export async function aplicarAccion(id: string, accion: AccionGuion): Promise<Resultado<{ estado: EstadoGuion }>> {
  const { data: f, error: e1 } = await db().from(TABLA_GUIONES).select('estado, videos').eq('id', id).maybeSingle()
  if (e1) throw new Error(`${TABLA_GUIONES}: ${e1.message}`)
  if (!f) return falla(404, NO_EXISTE)
  const estado = f.estado as EstadoGuion
  const c = cambioPorAccion({ estado, videos: lista(f.videos) }, accion)
  if ('error' in c) return falla(c.status, c.error)
  const { data, error } = await db().from(TABLA_GUIONES).update(c.cambios).eq('id', id).eq('estado', estado).select('estado')
  if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
  if (!data?.length) return falla(409, CAMBIO)
  return { ok: true, estado: data[0].estado as EstadoGuion }
}

// La fila de un guion para las subidas, y la escritura condicional sobre actualizado_en
const base = (): Base => ({
  async leer(id) {
    const { data, error } = await db().from(TABLA_GUIONES).select(COLUMNAS_SUBIDA).eq('id', id).maybeSingle()
    if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
    return data ? filaSubida(data as Record<string, unknown>) : null
  },
  async escribir(id, cambios, actualizado_en) {
    const { data, error } = await db().from(TABLA_GUIONES).update(cambios).eq('id', id).eq('actualizado_en', actualizado_en).select(COLUMNAS_SUBIDA)
    if (error) throw new Error(`${TABLA_GUIONES}: ${error.message}`)
    return data?.length ? filaSubida(data[0] as Record<string, unknown>) : null
  },
})

// El bucket privado «crudos»
const almacen = (): Almacen => ({
  // La URL firmada para que el navegador suba directo (vale 2 horas y no pisa nada)
  async firmar(ruta) {
    const { data, error } = await db().storage.from(BUCKET_CRUDOS).createSignedUploadUrl(ruta)
    if (error || !data) throw new Error(`${BUCKET_CRUDOS}: ${error?.message ?? 'sin URL firmada'}`)
    return data.signedUrl
  },
  // El archivo tal como quedó (o null si no está). Sin tamaño en Storage, `bytes` es null
  async buscar(ruta) {
    const [carpeta, archivo] = ruta.split('/')
    const { data, error } = await db().storage.from(BUCKET_CRUDOS).list(carpeta, { limit: 100, search: archivo })
    if (error) throw new Error(`${BUCKET_CRUDOS}: ${error.message}`)
    const o = (data ?? []).find((x) => x.name === archivo && x.id)
    if (!o) return null
    const m = (o.metadata ?? {}) as { size?: unknown; mimetype?: unknown }
    return { bytes: typeof m.size === 'number' ? m.size : null, tipo: typeof m.mimetype === 'string' ? m.mimetype : null }
  },
  async borrar(ruta) {
    const { error } = await db().storage.from(BUCKET_CRUDOS).remove([ruta])
    if (error) throw new Error(`${BUCKET_CRUDOS}: ${error.message}`)
  },
})

const unico = () => `${Date.now().toString(36)}${randomBytes(4).toString('hex')}`

export function pedirSubida(id: string, p: PedidoSubida, reemplaza: string | null = null) {
  return pedir(base(), almacen(), id, p, { unico: unico(), ahora: new Date(), reemplaza })
}

export function registrarSubida(id: string, ruta: string) {
  return registrar(base(), almacen(), id, ruta, new Date())
}

export function cancelarSubida(id: string, ruta: string) {
  return soltar(base(), almacen(), id, ruta, new Date())
}
