// SERVER-ONLY — los datos del Inicio del panel, con service role. Quien llama revisa antes que sea administrador.
import { createServiceClient } from '@/lib/supabase/service'
import { hoyCR, sumarDias } from '@/lib/calendario/fechas'
import { nombreVisible } from '@/lib/crm/tipos'
import { leerPipelines } from '@/lib/crm/servidor'
import { esperando } from '@/lib/knox/centro/servidor'
import { resumenBandeja } from '@/lib/crm/bandeja/servidor'
import type { Esperandote } from '@/lib/knox/centro/tipos'
import {
  cambio,
  contarPeriodos,
  nombreEtapa,
  porcentaje,
  salud,
  serieDiaria,
  tonoDeEtapa,
  turnosRespondidos,
  type MensajeTurno,
  type Periodo,
  type Salud,
  type Tono,
} from './calculos'

const db = () => createServiceClient()

export interface Kpi {
  actual: number
  anterior: number
  cambio: number | null
  serie: number[]
}

export interface FilaOportunidad {
  id: string
  nombre: string
  valor: number
  etapa: string
  tono: Tono
  contacto: { id: string; nombre: string } | null
  movida: string | null // cuándo cambió de etapa
}

export interface EtapaResumen {
  id: string
  nombre: string
  tono: Tono
  cuantas: number
  valor: number
}

export interface Inicio {
  periodo: Periodo
  contactos: Kpi
  recibidos: Kpi
  enviados: Kpi
  // total: lo que está por responder en la bandeja; clientes: de esas, las de trabajo (Knox)
  esperando: { total: number; clientes: number; conversaciones: Esperandote[] } | null
  embudo: { abiertas: number; valor: number; ganadas: number; ganadoValor: number; etapas: EtapaResumen[] }
  salud: Salud
  oportunidades: FilaOportunidad[]
}

// Trae todas las filas, de a 1000 (el máximo de la API)
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

type Oportunidad = {
  id: string
  nombre: string
  valor: number | null
  estado: string
  etapa_id: string
  cambio_etapa_en: string | null
  actualizado_en: string
  crm_contactos: { id: string; nombre: string; apellido: string; correo: string | null; telefono: string | null } | null
}

const kpi = (instantes: string[], ahora: Date, dias: number): Kpi => {
  const { actual, anterior } = contarPeriodos(instantes, ahora, dias)
  return { actual, anterior, cambio: cambio(actual, anterior), serie: serieDiaria(instantes, ahora, dias) }
}

export async function leerInicio(periodo: Periodo, ahora = new Date()): Promise<Inicio> {
  const base = db()
  const hoy = hoyCR(ahora)
  // Desde el primer día del período anterior (para comparar), a medianoche de Costa Rica
  const desdeAnterior = `${sumarDias(hoy, -(2 * periodo - 1))}T06:00:00Z`
  const desdePeriodo = `${sumarDias(hoy, -(periodo - 1))}T06:00:00Z`
  const hace30 = new Date(ahora.getTime() - 30 * 86_400_000).toISOString()
  const hace90 = new Date(ahora.getTime() - 90 * 86_400_000).toISOString()

  const [contactos, mensajes, apartadas, oportunidades, pipelines, citas, tareas, espera, escribieron, bandeja] = await Promise.all([
    todas<{ creado_en: string }>((a, b) => base.from('crm_contactos').select('creado_en').gte('creado_en', desdeAnterior).range(a, b)),
    todas<MensajeTurno & { tipo: string }>((a, b) =>
      base.from('crm_mensajes').select('conversacion_id, direccion, enviado_en, tipo').in('tipo', ['mensaje', 'correo']).gte('enviado_en', desdeAnterior).order('enviado_en').range(a, b),
    ),
    // Las conversaciones personales y el spam no cuentan para el seguimiento
    todas<{ id: string }>((a, b) => base.from('crm_conversaciones').select('id').in('tipo', ['personal', 'spam']).range(a, b)),
    todas<Oportunidad>((a, b) =>
      base
        .from('crm_oportunidades')
        .select('id, nombre, valor, estado, etapa_id, cambio_etapa_en, actualizado_en, crm_contactos(id, nombre, apellido, correo, telefono)')
        .order('cambio_etapa_en', { ascending: false, nullsFirst: false })
        .range(a, b),
    ),
    leerPipelines(),
    todas<{ estado: string }>((a, b) => base.from('crm_citas').select('estado').gte('inicio', hace90).lte('inicio', ahora.toISOString()).range(a, b)),
    todas<{ vence_en: string | null }>((a, b) => base.from('crm_tareas').select('vence_en').eq('hecha', false).range(a, b)),
    esperando(4).catch((err) => {
      console.error('[inicio] te están esperando:', err instanceof Error ? err.message : err)
      return null
    }),
    // Quién escribió en los últimos 30 días (para ver si quedaron en el pipeline)
    todas<{ contacto_id: string }>((a, b) => base.from('crm_mensajes').select('contacto_id').eq('direccion', 'entrante').eq('tipo', 'mensaje').gte('enviado_en', hace30).range(a, b)),
    resumenBandeja().catch(() => null),
  ])

  const fuera = new Set(apartadas.map((c) => c.id))
  const deTrabajo = mensajes.filter((m) => !m.conversacion_id || !fuera.has(m.conversacion_id))
  const recibidos = deTrabajo.filter((m) => m.direccion === 'entrante').map((m) => m.enviado_en)
  const enviados = deTrabajo.filter((m) => m.direccion === 'saliente').map((m) => m.enviado_en)

  // El pipeline: las etapas de todos los pipelines, en su orden
  const etapas = new Map<string, { nombre: string; orden: number }>()
  pipelines.forEach((p, ip) => p.etapas.forEach((e) => etapas.set(e.id, { nombre: e.nombre, orden: ip * 1000 + e.orden })))
  const abiertas = oportunidades.filter((o) => o.estado === 'abierta')
  const ganadasPeriodo = oportunidades.filter((o) => o.estado === 'ganada' && o.actualizado_en >= desdePeriodo)
  const porEtapa = new Map<string, EtapaResumen>()
  for (const o of abiertas) {
    const e = etapas.get(o.etapa_id)
    const r = porEtapa.get(o.etapa_id) ?? { id: o.etapa_id, nombre: nombreEtapa(e?.nombre ?? 'Sin etapa'), tono: tonoDeEtapa(e?.nombre ?? ''), cuantas: 0, valor: 0 }
    r.cuantas++
    r.valor += o.valor ?? 0
    porEtapa.set(o.etapa_id, r)
  }
  const resumenEtapas = [...porEtapa.values()].sort((a, b) => (etapas.get(a.id)?.orden ?? 0) - (etapas.get(b.id)?.orden ?? 0))

  // El puntaje de seguimiento
  const respuesta = turnosRespondidos(deTrabajo.filter((m) => m.enviado_en >= desdeAnterior), ahora, desdePeriodo)
  const movidas = abiertas.filter((o) => o.cambio_etapa_en && o.cambio_etapa_en >= hace30).length
  const conOportunidad = new Set(oportunidades.map((o) => o.crm_contactos?.id).filter(Boolean))
  const quienes = [...new Set(escribieron.map((m) => m.contacto_id))]
  const enPipeline = quienes.filter((id) => conOportunidad.has(id)).length
  const asistio = citas.filter((c) => c.estado === 'asistio').length
  const falto = citas.filter((c) => c.estado === 'no_asistio').length
  const vencidas = tareas.filter((t) => t.vence_en && t.vence_en < hoy).length
  const esperan = espera?.total ?? 0

  const puntaje = salud([
    {
      id: 'respuesta',
      nombre: 'Contestas en 24 h',
      peso: 35,
      valor: porcentaje(respuesta.aTiempo, respuesta.total),
      detalle: respuesta.total ? `${respuesta.aTiempo} de ${respuesta.total} veces` : 'Nadie escribió en este período',
      consejo: {
        titulo: esperan ? `Contesta a ${esperan === 1 ? 'la persona que te espera' : `las ${esperan} personas que te esperan`}` : 'Contesta el mismo día',
        texto: 'Quien recibe respuesta rápido tiene muchas más ganas de seguir hablando.',
        href: '/crm/mensajes',
      },
    },
    {
      id: 'pipeline',
      nombre: 'Pipeline al día',
      peso: 25,
      valor: porcentaje(movidas, abiertas.length),
      detalle: abiertas.length ? `${movidas} de ${abiertas.length} se movieron en 30 días` : 'No hay oportunidades abiertas',
      consejo: {
        titulo: `Revisa las ${abiertas.length - movidas} oportunidades quietas`,
        texto: 'Muévelas a la etapa en que están de verdad, o ciérralas como perdidas.',
        href: '/crm/pipeline',
      },
    },
    {
      id: 'conversaciones',
      nombre: 'Chats en el pipeline',
      peso: 25,
      valor: porcentaje(enPipeline, quienes.length),
      detalle: quienes.length ? `${enPipeline} de ${quienes.length} que escribieron tienen oportunidad` : 'Nadie escribió en 30 días',
      consejo: {
        titulo: 'Pasa al pipeline a quien muestra interés',
        texto: 'Así nadie que preguntó por precios se queda sin seguimiento.',
        href: '/crm',
      },
    },
    {
      id: 'citas',
      nombre: 'Llegan a las citas',
      peso: 10,
      valor: porcentaje(asistio, asistio + falto),
      detalle: asistio + falto ? `${asistio} de ${asistio + falto} en 90 días` : 'Sin citas en 90 días',
      consejo: { titulo: 'Confirma cada cita el día antes', texto: 'Un mensaje corto el día anterior baja mucho las ausencias.', href: '/pronto/agenda' },
    },
    {
      id: 'tareas',
      nombre: 'Tareas al día',
      peso: 5,
      valor: tareas.length ? porcentaje(tareas.length - vencidas, tareas.length) : null,
      detalle: tareas.length ? `${vencidas} vencidas de ${tareas.length}` : 'Sin tareas pendientes',
      consejo: { titulo: `Pon al día las ${vencidas} tareas vencidas`, texto: 'Hazlas o cámbiales la fecha.', href: '/crm/tareas' },
    },
  ])

  return {
    periodo,
    contactos: kpi(contactos.map((c) => c.creado_en), ahora, periodo),
    recibidos: kpi(recibidos, ahora, periodo),
    enviados: kpi(enviados, ahora, periodo),
    esperando: espera || bandeja ? { total: bandeja?.porResponder ?? espera?.total ?? 0, clientes: espera?.total ?? 0, conversaciones: espera?.conversaciones ?? [] } : null,
    embudo: {
      abiertas: abiertas.length,
      valor: abiertas.reduce((s, o) => s + (o.valor ?? 0), 0),
      ganadas: ganadasPeriodo.length,
      ganadoValor: ganadasPeriodo.reduce((s, o) => s + (o.valor ?? 0), 0),
      etapas: resumenEtapas,
    },
    salud: puntaje,
    oportunidades: abiertas.slice(0, 150).map((o) => ({
      id: o.id,
      nombre: o.nombre,
      valor: o.valor ?? 0,
      etapa: nombreEtapa(etapas.get(o.etapa_id)?.nombre ?? 'Sin etapa'),
      tono: tonoDeEtapa(etapas.get(o.etapa_id)?.nombre ?? '', o.estado),
      contacto: o.crm_contactos ? { id: o.crm_contactos.id, nombre: nombreVisible(o.crm_contactos) } : null,
      movida: o.cambio_etapa_en,
    })),
  }
}
