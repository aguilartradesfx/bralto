// «Ideas» con la base de datos: guardar los enlaces pegados, analizar la cola y lo que él decide en el panel.
// Las reglas están en cola.ts, enlaces.ts, metricas.ts y analisis.ts, con pruebas.
import { createServiceClient } from '@/lib/supabase/service'
import { sinElCreador } from './analisis'
import { buscarNumeros } from './apify'
import { COLUMNAS_IDEA, MAX_INTENTOS, rescatar, temaDeIdea, type Accion, type IdeaFila } from './cola'
import { detectarEnlaces, resolverCorto } from './enlaces'
import { analizarConGemini } from './gemini'

const TABLA = 'lab_ideas'
const MAX_POR_PEGADO = 50
const MAX_LISTA = 300
const A_LA_VEZ = 3 // ideas que se analizan al mismo tiempo
const TIEMPO_PARA_EMPEZAR_MS = 150_000 // pasado esto no se toma otra: la función se corta a los 300 s

const db = () => createServiceClient()

export async function leerIdeas(): Promise<IdeaFila[]> {
  const { data, error } = await db().from(TABLA).select(COLUMNAS_IDEA).order('creada_en', { ascending: false }).limit(MAX_LISTA)
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  return (data ?? []) as IdeaFila[]
}

export type ResultadoPegado = { nuevas: number; repetidas: number; noValidos: string[]; ids: string[]; deMas: number }

export async function agregarEnlaces(texto: string): Promise<ResultadoPegado> {
  const { enlaces, noValidos } = detectarEnlaces(texto)
  const tomados = enlaces.slice(0, MAX_POR_PEGADO)
  const largos = await Promise.all(tomados.map((e) => resolverCorto(e)))
  const malos = tomados.filter((_, i) => !largos[i]).map((e) => e.url)
  const validos = [...new Map(largos.flatMap((e) => (e ? [[e.url, e] as const] : []))).values()]
  let ids: string[] = []
  if (validos.length) {
    const { data, error } = await db()
      .from(TABLA)
      .upsert(
        validos.map((e) => ({ url: e.url, red: e.red, origen: 'tu' })),
        { onConflict: 'url', ignoreDuplicates: true },
      )
      .select('id')
    if (error) throw new Error(`${TABLA}: ${error.message}`)
    ids = (data ?? []).map((f) => f.id as string)
  }
  return {
    nuevas: ids.length,
    repetidas: validos.length - ids.length,
    noValidos: [...noValidos, ...malos],
    ids,
    deMas: enlaces.length - tomados.length,
  }
}

async function guardar(id: string, cambios: Record<string, unknown>, condicion: Record<string, unknown> = {}) {
  let q = db()
    .from(TABLA)
    .update({ ...cambios, actualizada_en: new Date().toISOString() })
    .eq('id', id)
  for (const [k, v] of Object.entries(condicion)) q = q.eq(k, v as string | number)
  const { data, error } = await q.select('id')
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  return (data?.length ?? 0) > 0
}

// Una idea de punta a punta: números con Apify, análisis con Gemini y se guarda. Devuelve el error, si hubo
async function analizar(f: IdeaFila, claves: { apify: string; gemini: string }): Promise<string | null> {
  let metricas = null
  try {
    const numeros = await buscarNumeros({ url: f.url, red: f.red }, { token: claves.apify })
    metricas = numeros.metricas
    const m = numeros.metricas
    const { analisis } = await analizarConGemini(
      numeros.medios,
      {
        red: f.red,
        tipo: m.tipo,
        texto: m.texto,
        vistas: m.vistas,
        vecesSuPublico: m.veces_su_publico,
        vecesLoNormal: m.veces_lo_normal,
        compartidos: m.compartidos,
        guardados: m.guardados,
      },
      { apiKey: claves.gemini, apifyToken: claves.apify },
    )
    const ahora = new Date().toISOString()
    await guardar(f.id, { estado: 'lista', metricas, analisis: sinElCreador(analisis, m.cuenta), error: null, analizada_en: ahora }, { estado: 'analizando' })
    return null
  } catch (err) {
    const motivo = err instanceof Error ? err.message : String(err)
    const final = f.intentos + 1 >= MAX_INTENTOS
    await guardar(f.id, { estado: final ? 'error' : 'pendiente', error: motivo.slice(0, 500), ...(metricas ? { metricas } : {}) }, { estado: 'analizando' }).catch(
      () => false,
    )
    return motivo
  }
}

// Una pasada de la cola: rescata lo trabado y analiza lo pendiente (o solo las ideas de `ids`)
export async function procesarCola(o: { limite: number; ids?: string[] }): Promise<Record<string, unknown>> {
  const apify = process.env.APIFY_TOKEN
  const gemini = process.env.GEMINI_API_KEY
  if (!apify || !gemini) {
    const falta = [!apify && 'APIFY_TOKEN', !gemini && 'GEMINI_API_KEY'].filter(Boolean).join(', ')
    console.error(`[ideas] no se analiza nada, falta configurar ${falta}`)
    return { ok: false, nota: `falta configurar: ${falta}` }
  }
  const claves = { apify, gemini }
  const inicio = Date.now()
  const ahora = new Date()

  const { data: trabadas, error: e1 } = await db().from(TABLA).select('id, estado, actualizada_en, intentos').eq('estado', 'analizando')
  if (e1) throw new Error(`${TABLA}: ${e1.message}`)
  let rescatadas = 0
  for (const t of (trabadas ?? []) as Pick<IdeaFila, 'id' | 'estado' | 'actualizada_en' | 'intentos'>[]) {
    const cambio = rescatar(t, ahora)
    if (cambio && (await guardar(t.id, cambio, { estado: 'analizando', actualizada_en: t.actualizada_en }))) rescatadas++
  }

  let q = db().from(TABLA).select(COLUMNAS_IDEA).eq('estado', 'pendiente').lt('intentos', MAX_INTENTOS).order('creada_en').limit(o.limite)
  if (o.ids) q = q.in('id', o.ids)
  const { data, error } = await q
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  const cola = [...((data ?? []) as IdeaFila[])]

  let listas = 0
  const errores: string[] = []
  async function trabajador() {
    for (let f = cola.shift(); f; f = cola.shift()) {
      if (Date.now() - inicio > TIEMPO_PARA_EMPEZAR_MS) return
      // Condicional: si otra corrida ya la tomó, esta la deja
      const tomada = await guardar(f.id, { estado: 'analizando', intentos: f.intentos + 1 }, { estado: 'pendiente', intentos: f.intentos })
      if (!tomada) continue
      const motivo = await analizar(f, claves)
      if (motivo) errores.push(motivo)
      else listas++
    }
  }
  await Promise.all(Array.from({ length: A_LA_VEZ }, trabajador))
  return { ok: true, rescatadas, listas, errores, sinTomar: cola.length }
}

export type ResultadoAccion = { ok: true } | { ok: false; status: number; error: string }

const falla = (status: number, error: string): ResultadoAccion => ({ ok: false, status, error })

export async function aplicarAccion(id: string, accion: Accion): Promise<ResultadoAccion> {
  const { data, error } = await db().from(TABLA).select(COLUMNAS_IDEA).eq('id', id).maybeSingle()
  if (error) throw new Error(`${TABLA}: ${error.message}`)
  const f = data as IdeaFila | null
  if (!f) return falla(404, 'Esa idea ya no existe')
  const ahora = new Date().toISOString()

  if (accion === 'reintentar') {
    if (f.estado !== 'error' && !(f.estado === 'pendiente' && f.error)) return falla(409, 'Esta idea no tiene error')
    await guardar(f.id, { estado: 'pendiente', intentos: 0, error: null })
    return { ok: true }
  }

  if (accion === 'deshacer') {
    if (f.decision === 'knox' && f.tema_id) {
      const { data: tema, error: e2 } = await db().from('redes_temas').select('id, usado_en').eq('id', f.tema_id).maybeSingle()
      if (e2) throw new Error(`redes_temas: ${e2.message}`)
      if (tema?.usado_en) return falla(409, 'Knox ya hizo el video con esta idea: ya no se puede deshacer')
      if (tema) {
        const { error: e3 } = await db().from('redes_temas').delete().eq('id', f.tema_id).is('usado_en', null)
        if (e3) throw new Error(`redes_temas: ${e3.message}`)
      }
    }
    await guardar(f.id, { decision: null, decidida_en: null, tema_id: null })
    return { ok: true }
  }

  if (f.decision) return falla(409, 'Esta idea ya tiene decisión. Deshazla primero.')

  if (accion === 'knox') {
    if (f.estado !== 'lista' || !f.analisis) return falla(409, 'Espera a que termine el análisis')
    const tema = temaDeIdea(f)
    const { error: e4 } = await db().from('redes_temas').upsert(tema, { onConflict: 'clave', ignoreDuplicates: true })
    if (e4) throw new Error(`redes_temas: ${e4.message}`)
    const { data: fila, error: e5 } = await db().from('redes_temas').select('id').eq('clave', tema.clave).single()
    if (e5) throw new Error(`redes_temas: ${e5.message}`)
    await guardar(f.id, { decision: 'knox', decidida_en: ahora, tema_id: fila.id })
    return { ok: true }
  }

  await guardar(f.id, { decision: accion === 'yo' ? 'yo' : 'descartada', decidida_en: ahora })
  return { ok: true }
}
