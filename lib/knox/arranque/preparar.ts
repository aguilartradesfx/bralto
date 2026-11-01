import { createHash, randomUUID } from 'node:crypto'
import { createServiceClient } from '@/lib/supabase/service'
import { inicios, unir } from '../alineacion'
import { sumarDias } from '../fechas'
import { narrar } from '../voz'
import { elegirArranque, type FilaArranque } from './elegir'
import { escribirArranques } from './escribir'
import { esFijo, FIJOS, type Arranque, type Fijo } from './textos'

// Los arranques de Knox: el cron los deja listos la noche anterior (escritos por Claude y narrados con la voz de
// Knox) y la pantalla pide el que sigue al abrir. El audio va en el bucket privado «knox».
const BUCKET = 'knox'
// El sonido de arranque es de Mixkit: se sube a mano y no va en el repo, que es público
const SONIDO = 'arranques/fijos/sonido.mp3'

// «Ahora sí…» y «Ya casi…» se narran una vez; si cambia el texto, cambia el archivo
const rutaFija = (nombre: Fijo) => `arranques/fijos/${nombre}-${createHash('sha1').update(FIJOS[nombre]).digest('hex').slice(0, 8)}.mp3`

// Prepara los arranques de un día. null si ya estaban (no se escriben dos veces)
export async function prepararDia(fecha: string): Promise<{ fecha: string; listos: number } | null> {
  const db = createServiceClient()
  const { count, error } = await db.from('knox_arranques').select('id', { count: 'exact', head: true }).eq('fecha', fecha)
  if (error) throw new Error(error.message)
  if (count) return null

  // Lo que ya dijo, para que Claude no lo repita
  const { data: previos } = await db.from('knox_arranques').select('secciones').order('creado_en', { ascending: false }).limit(30)
  const anteriores = (previos ?? []).map((p) => String((p.secciones as string[])[1] ?? '')).filter(Boolean)
  const escritos = await escribirArranques(fecha, anteriores)

  const filas = []
  for (const [k, e] of escritos.entries()) {
    try {
      const id = randomUUID()
      const { texto, offsets } = unir([e.saludo, e.frase])
      const voz = await narrar(texto)
      const ruta = `arranques/${fecha}/${id}.mp3`
      const subida = await db.storage.from(BUCKET).upload(ruta, voz.audio, { contentType: 'audio/mpeg' })
      if (subida.error) throw new Error(subida.error.message)
      filas.push({ id, fecha, orden: k + 1, tipo: e.tipo, secciones: [e.saludo, e.frase], inicios: inicios(offsets, texto, voz.alineacion), audio_path: ruta })
    } catch (err) {
      console.error('[knox-arranques] uno no se pudo narrar:', err instanceof Error ? err.message : err)
    }
  }
  if (!filas.length) throw new Error('no se pudo narrar ningún arranque')
  const { error: errorFilas } = await db.from('knox_arranques').insert(filas)
  if (errorFilas) throw new Error(`no se pudieron guardar los arranques: ${errorFilas.message}`)
  return { fecha, listos: filas.length }
}

// Narra «Ahora sí…» o «Ya casi…» si todavía no está, y devuelve dónde quedó
export async function prepararFijo(nombre: Fijo): Promise<string> {
  const db = createServiceClient()
  const ruta = rutaFija(nombre)
  const corte = ruta.lastIndexOf('/')
  const archivo = ruta.slice(corte + 1)
  const { data } = await db.storage.from(BUCKET).list(ruta.slice(0, corte), { search: archivo })
  if (data?.some((o) => o.name === archivo)) return ruta
  const voz = await narrar(FIJOS[nombre])
  const subida = await db.storage.from(BUCKET).upload(ruta, voz.audio, { contentType: 'audio/mpeg', upsert: true })
  if (subida.error) throw new Error(subida.error.message)
  return ruta
}

export const prepararFijos = () => Promise.all((Object.keys(FIJOS) as Fijo[]).map(prepararFijo))

// El que toca hoy (de la última semana, sin usar)
export async function siguienteArranque(hoy: string): Promise<Arranque | null> {
  const { data, error } = await createServiceClient()
    .from('knox_arranques')
    .select('id, fecha, orden, secciones, inicios, usado_en')
    .is('usado_en', null)
    .gte('fecha', sumarDias(hoy, -7))
    .lte('fecha', hoy)
  if (error) throw new Error(error.message)
  const f = elegirArranque((data ?? []) as FilaArranque[], hoy)
  return f ? { id: f.id, secciones: f.secciones, inicios: f.inicios } : null
}

export async function marcarUsado(id: string): Promise<void> {
  const { error } = await createServiceClient()
    .from('knox_arranques')
    .update({ usado_en: new Date().toISOString() })
    .eq('id', id)
    .is('usado_en', null)
  if (error) throw new Error(error.message)
}

// El audio de un arranque, de «Ahora sí…» o «Ya casi…» (si faltan, se narran en el momento) o el sonido de arranque
export async function audioArranque(id: string): Promise<ArrayBuffer | null> {
  const db = createServiceClient()
  let ruta: string | null
  if (id === 'sonido') ruta = SONIDO
  else if (esFijo(id)) ruta = await prepararFijo(id)
  else {
    const { data } = await db.from('knox_arranques').select('audio_path').eq('id', id).maybeSingle()
    ruta = data?.audio_path ?? null
  }
  if (!ruta) return null
  const { data, error } = await db.storage.from(BUCKET).download(ruta)
  return error || !data ? null : data.arrayBuffer()
}
