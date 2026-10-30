import { randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { inicios, unir, type Alineacion } from './alineacion'
import { escribirGuion } from './escritor'
import { diaCr } from './fechas'
import { contenido, leads } from './fuentes/base'
import { tipoDeCambio } from './fuentes/cambio'
import { agenda, conversaciones } from './fuentes/ghl'
import { redes } from './fuentes/redes'
import type { Datos, Reporte, Seccion } from './tipos'
import { narrar } from './voz'

// Junta los datos, escribe el guion, lo narra y guarda el reporte del día. Si una fuente falla, Knox
// igual habla de lo demás; si la voz falla, el reporte queda sin audio (el panel lo muestra escrito).
const BUCKET = 'knox'
const DIA = 24 * 3600_000

function conTiempo<T>(promesa: Promise<T>, ms: number): Promise<T> {
  return Promise.race([promesa, new Promise<T>((_, rechazar) => setTimeout(() => rechazar(new Error(`no respondió en ${ms / 1000} s`)), ms))])
}

async function recolectar(ahora: Date): Promise<Datos> {
  const ayer = new Date(ahora.getTime() - DIA)
  const [cambio, red, nuevos, citas, chats, cont] = await Promise.allSettled(
    [tipoDeCambio(), redes(ahora), leads(ayer), agenda(ahora), conversaciones(), contenido(ahora)].map((p) => conTiempo<unknown>(p, 45_000)),
  )
  const faltan: string[] = []
  function de<T>(nombre: string, r: PromiseSettledResult<unknown>): T | null {
    if (r.status === 'fulfilled') return r.value as T
    faltan.push(nombre)
    console.error(`[knox] no se pudo leer ${nombre}:`, r.reason instanceof Error ? r.reason.message : r.reason)
    return null
  }
  return {
    cambio: de('cambio', cambio),
    redes: de('redes', red),
    leads: de('leads', nuevos),
    agenda: de('agenda', citas),
    conversaciones: de('conversaciones', chats),
    contenido: de('contenido', cont),
    faltan,
  }
}

type Fila = {
  id: string
  fecha: string
  creado_en: string
  datos: Datos
  secciones: Seccion[]
  inicios: number[]
  audio_path: string | null
  escrito_por: 'claude' | 'plantilla'
}

const aReporte = (f: Fila): Reporte => ({
  id: f.id,
  fecha: f.fecha,
  creadoEn: f.creado_en,
  datos: f.datos,
  secciones: f.secciones,
  inicios: f.inicios,
  conAudio: Boolean(f.audio_path),
  escritoPor: f.escrito_por,
})

export async function generarReporte(ahora = new Date()): Promise<Reporte> {
  const db = createServiceClient()
  const datos = await recolectar(ahora)
  const { secciones, escritoPor, error } = await escribirGuion(datos, ahora)
  if (error) console.error('[knox] guion con la plantilla:', error)

  const id = randomUUID()
  const fecha = diaCr(ahora)
  const { texto, offsets } = unir(secciones.map((s) => s.texto))
  let audioPath: string | null = null
  let alineacion: Alineacion | null = null
  try {
    const voz = await narrar(texto)
    const ruta = `${fecha}/${id}.mp3`
    const subida = await db.storage.from(BUCKET).upload(ruta, voz.audio, { contentType: 'audio/mpeg' })
    if (subida.error) throw new Error(subida.error.message)
    audioPath = ruta
    alineacion = voz.alineacion
  } catch (err) {
    console.error('[knox] sin voz:', err instanceof Error ? err.message : err)
  }

  const { data, error: errorFila } = await db
    .from('knox_reportes')
    .insert({ id, fecha, datos, secciones, inicios: inicios(offsets, texto, alineacion), audio_path: audioPath, escrito_por: escritoPor })
    .select('*')
    .single()
  if (errorFila) throw new Error(`no se pudo guardar el reporte: ${errorFila.message}`)
  return aReporte(data as Fila)
}

export async function ultimoReporte(fecha: string): Promise<Reporte | null> {
  const { data, error } = await createServiceClient()
    .from('knox_reportes')
    .select('*')
    .eq('fecha', fecha)
    .order('creado_en', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? aReporte(data as Fila) : null
}

export async function audioDelReporte(id: string): Promise<ArrayBuffer | null> {
  const db = createServiceClient()
  const { data: fila } = await db.from('knox_reportes').select('audio_path').eq('id', id).maybeSingle()
  if (!fila?.audio_path) return null
  const { data, error } = await db.storage.from(BUCKET).download(fila.audio_path)
  return error || !data ? null : data.arrayBuffer()
}
