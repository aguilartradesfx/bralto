// SERVER-ONLY — lo que la pantalla de Contactos suma a la lista del CRM: la actividad de cada persona (90 días),
// su etapa en el pipeline, los números de arriba y, para el contacto abierto, lo que Knox dejó listo.
import { createServiceClient } from '@/lib/supabase/service'
import { hoyCR } from '@/lib/calendario/fechas'
import { resumenBandeja } from '@/lib/crm/bandeja/servidor'
import { leerPipelines } from '@/lib/crm/servidor'
import { nombreEtapa, tonoDeEtapa, type Tono } from '@/lib/panel/inicio/calculos'

const db = () => createServiceClient()

export interface Actividad {
  mensajes: number
  llamadas: number
  correos: number
  citas: number
  etapa: { nombre: string; tono: Tono } | null
}

export interface Resumen {
  esperando: number | null
  tareas: number
  vencidas: number
  oportunidades: number
}

export interface Borrador {
  id: string
  respuesta: string
  conversacionId: string
  creado_en: string
}

async function todas<T>(consulta: (desde: number, hasta: number) => PromiseLike<{ data: unknown; error: { message: string } | null }>): Promise<T[]> {
  const filas: T[] = []
  for (let desde = 0; ; desde += 1000) {
    const { data, error } = await consulta(desde, desde + 999)
    if (error) throw new Error(error.message)
    const pagina = (data ?? []) as T[]
    filas.push(...pagina)
    if (pagina.length < 1000) return filas
  }
}

export async function actividadDeContactos(ids: string[], ahora = new Date()): Promise<Record<string, Actividad>> {
  if (ids.length === 0) return {}
  const base = db()
  const hace90 = new Date(ahora.getTime() - 90 * 86_400_000).toISOString()
  const [mensajes, citas, oportunidades, pipelines] = await Promise.all([
    todas<{ contacto_id: string; tipo: string }>((a, b) => base.from('crm_mensajes').select('contacto_id, tipo').in('contacto_id', ids).gte('enviado_en', hace90).range(a, b)),
    todas<{ contacto_id: string }>((a, b) => base.from('crm_citas').select('contacto_id').in('contacto_id', ids).range(a, b)),
    todas<{ contacto_id: string; etapa_id: string; estado: string; cambio_etapa_en: string | null }>((a, b) =>
      base.from('crm_oportunidades').select('contacto_id, etapa_id, estado, cambio_etapa_en').in('contacto_id', ids).order('cambio_etapa_en', { ascending: false, nullsFirst: false }).range(a, b),
    ),
    leerPipelines(),
  ])
  const etapas = new Map(pipelines.flatMap((p) => p.etapas.map((e) => [e.id, e.nombre] as const)))
  const r: Record<string, Actividad> = Object.fromEntries(ids.map((id) => [id, { mensajes: 0, llamadas: 0, correos: 0, citas: 0, etapa: null }]))
  for (const m of mensajes) {
    const a = r[m.contacto_id]
    if (!a) continue
    if (m.tipo === 'mensaje') a.mensajes++
    else if (m.tipo === 'llamada') a.llamadas++
    else if (m.tipo === 'correo') a.correos++
  }
  for (const c of citas) if (r[c.contacto_id]) r[c.contacto_id].citas++
  // La etapa de su oportunidad más reciente (las abiertas primero)
  for (const o of [...oportunidades].sort((a, b) => Number(b.estado === 'abierta') - Number(a.estado === 'abierta'))) {
    const a = r[o.contacto_id]
    if (!a || a.etapa) continue
    const nombre = etapas.get(o.etapa_id) ?? ''
    a.etapa = { nombre: o.estado === 'abierta' ? nombreEtapa(nombre) : o.estado === 'ganada' ? 'Ganada' : 'Perdida', tono: tonoDeEtapa(nombre, o.estado) }
  }
  return r
}

export async function resumenContactos(ahora = new Date()): Promise<Resumen> {
  const base = db()
  const [bandeja, tareas, oportunidades] = await Promise.all([
    resumenBandeja().catch(() => null),
    todas<{ vence_en: string | null }>((a, b) => base.from('crm_tareas').select('vence_en').eq('hecha', false).range(a, b)),
    base.from('crm_oportunidades').select('id', { count: 'exact', head: true }).eq('estado', 'abierta'),
  ])
  const hoy = hoyCR(ahora)
  return {
    esperando: bandeja?.porResponder ?? null,
    tareas: tareas.length,
    vencidas: tareas.filter((t) => t.vence_en && t.vence_en < hoy).length,
    oportunidades: oportunidades.count ?? 0,
  }
}

// La respuesta que Knox dejó lista (y espera tu visto bueno) para alguna conversación de este contacto
export async function borradorDeKnox(conversaciones: string[]): Promise<Borrador | null> {
  if (conversaciones.length === 0) return null
  const { data, error } = await db()
    .from('crm_knox_decisiones')
    .select('id, respuesta, conversacion_id, creado_en')
    .in('conversacion_id', conversaciones)
    .eq('estado', 'pendiente')
    .not('respuesta', 'is', null)
    .order('creado_en', { ascending: false })
    .limit(1)
  if (error) {
    console.error('[contactos] borrador de Knox:', error.message)
    return null
  }
  const d = (data ?? [])[0] as { id: string; respuesta: string; conversacion_id: string; creado_en: string } | undefined
  return d ? { id: d.id, respuesta: d.respuesta, conversacionId: d.conversacion_id, creado_en: d.creado_en } : null
}
