// Las cuentas de las vistas Ventas, Redes y Agenda: de lo que trae cada fuente a lo que muestra cada panel. Puro, con
// pruebas (armar.test.ts).
import { diaCR, hoyCR, sumarDias } from '../../../calendario/fechas.ts'
import { itemsAgenda, type CitaDia, type Persona, type PostDia, type TareaDia } from '../armar.ts'
import type { CanalCliente } from '../tipos.ts'
import type { ComentarioReciente, DiaAgenda, LeadsDelMes, Movida, PipelineVentas, PostTop, Programada } from './tipos.ts'

// Ventas -------------------------------------------------------------------------------------------------------------

type FilaPipeline = { id: string; nombre: string; orden: number }
type FilaEtapa = { id: string; nombre: string; orden: number; pipeline_id: string }
type FilaAbierta = { pipeline_id: string; etapa_id: string; valor: number | string | null }

const plata = (v: number | string | null) => {
  const n = typeof v === 'string' ? Number.parseFloat(v) : (v ?? 0)
  return Number.isFinite(n) ? n : 0
}

// Las oportunidades abiertas de cada pipeline, por etapa (en el orden del pipeline), con cuántas son y cuánto suman
export function armarPipelines(pipelines: FilaPipeline[], etapas: FilaEtapa[], abiertas: FilaAbierta[]): PipelineVentas[] {
  return [...pipelines]
    .sort((a, b) => a.orden - b.orden)
    .map((p) => {
      const suyas = etapas.filter((e) => e.pipeline_id === p.id).sort((a, b) => a.orden - b.orden)
      const etapasVentas = suyas.map((e) => {
        const en = abiertas.filter((o) => o.pipeline_id === p.id && o.etapa_id === e.id)
        return { nombre: e.nombre, cuantas: en.length, valor: en.reduce((s, o) => s + plata(o.valor), 0) }
      })
      return {
        nombre: p.nombre,
        abiertas: etapasVentas.reduce((s, e) => s + e.cuantas, 0),
        valor: etapasVentas.reduce((s, e) => s + e.valor, 0),
        etapas: etapasVentas,
      }
    })
    .filter((p) => p.etapas.length > 0)
}

type FilaMovida = {
  nombre: string
  valor: number | string | null
  estado: Movida['estado']
  etapa_id: string
  cambio_etapa_en: string | null
  actualizado_en: string
  contacto: string | null
}

// Las que cambiaron de etapa hace menos (si no se sabe cuándo, la última vez que se tocaron)
export function armarMovidas(filas: FilaMovida[], etapas: { id: string; nombre: string }[], cuantas = 6): Movida[] {
  const nombreEtapa = new Map(etapas.map((e) => [e.id, e.nombre]))
  const cuando = (f: FilaMovida) => f.cambio_etapa_en ?? f.actualizado_en
  return [...filas]
    .sort((a, b) => Date.parse(cuando(b)) - Date.parse(cuando(a)))
    .slice(0, cuantas)
    .map((f) => ({
      nombre: f.nombre,
      contacto: f.contacto ?? 'Sin contacto',
      etapa: nombreEtapa.get(f.etapa_id) ?? '—',
      estado: f.estado,
      valor: plata(f.valor),
      en: new Date(cuando(f)).toISOString(),
    }))
}

const CANALES: CanalCliente[] = ['Instagram', 'WhatsApp', 'Sitio web', 'Messenger']

// Las personas nuevas de los últimos `dias` días (hoy incluido): por canal y día por día
export function leadsDelMes(personas: Persona[], ahora: Date, dias = 30): LeadsDelMes {
  const hoy = hoyCR(ahora)
  const desde = sumarDias(hoy, -(dias - 1))
  const delMes = personas.filter((p) => {
    const d = diaCR(p.en)
    return d >= desde && d <= hoy
  })
  const porDia = new Array<number>(dias).fill(0)
  for (const p of delMes) {
    const i = Math.round((Date.parse(`${diaCR(p.en)}T00:00:00Z`) - Date.parse(`${desde}T00:00:00Z`)) / 86_400_000)
    if (i >= 0 && i < dias) porDia[i]++
  }
  const porCanal = CANALES.map((canal) => ({ canal, total: delMes.filter((p) => p.canal === canal).length })).sort(
    (a, b) => b.total - a.total || CANALES.indexOf(a.canal) - CANALES.indexOf(b.canal),
  )
  return { total: delMes.length, porCanal, porDia, desde }
}

// Redes --------------------------------------------------------------------------------------------------------------

// Las de más vistas (sin números van al final)
export function topPosts(posts: PostTop[], cuantas = 5): PostTop[] {
  return [...posts].sort((a, b) => (b.vistas ?? -1) - (a.vistas ?? -1)).slice(0, cuantas)
}

// Los comentarios de otras personas desde `desde`, los más nuevos primero
export function comentariosRecientes(lista: ComentarioReciente[], propias: Set<string>, desde: Date, cuantos = 8): ComentarioReciente[] {
  return lista
    .filter((c) => !propias.has(c.usuario.toLowerCase()) && Date.parse(c.en) >= desde.getTime())
    .sort((a, b) => Date.parse(b.en) - Date.parse(a.en))
    .slice(0, cuantos)
}

// Lo que sale de aquí en adelante (sin lo cancelado), en orden
export function programadas(filas: PostDia[], ahora: Date): Programada[] {
  return filas
    .filter((p) => p.estado !== 'cancelado' && Date.parse(p.publicar_en) >= ahora.getTime() - 60 * 60_000)
    .sort((a, b) => Date.parse(a.publicar_en) - Date.parse(b.publicar_en))
    .map((p) => ({ titulo: p.titulo, tipo: p.tipo, estado: p.estado, en: new Date(p.publicar_en).toISOString() }))
}

export const ESTADO_PROGRAMADA: Record<string, string> = {
  programado: 'Programado',
  borrador: 'Sin aprobar',
  publicando: 'Saliendo',
  publicado: 'Ya salió',
  error: 'No salió',
}

// Agenda -------------------------------------------------------------------------------------------------------------

// La regla de horas de un día: de las 8 a las 20 como mínimo, y lo que haga falta para que entre todo (y ahora)
export function rangoDia(horas: number[], ahora: number | null): { desde: number; hasta: number } {
  const todas = ahora === null ? horas : [...horas, ahora]
  const desde = Math.max(0, Math.floor(Math.min(8, ...todas)))
  const hasta = Math.min(24, Math.ceil(Math.max(20, ...todas.map((h) => h + 1))))
  return { desde, hasta }
}

// Dónde va cada cosa en la regla (en píxeles desde arriba): en su hora, sin taparse (si chocan, la de después baja) y
// sin salirse por abajo. null si no caben todas: entonces van en lista
export function posicionesDia(horas: number[], alto: number, rango: { desde: number; hasta: number }, bloque = 52, separacion = 6): number[] | null {
  const paso = bloque + separacion
  if (horas.length === 0) return []
  if (horas.length * paso - separacion > alto) return null
  const y = (h: number) => ((h - rango.desde) / (rango.hasta - rango.desde)) * alto
  const tops = horas.map((h) => y(h) - 10)
  for (let i = 0; i < tops.length; i++) tops[i] = Math.max(tops[i], 0, i > 0 ? tops[i - 1] + paso : 0)
  for (let i = tops.length - 1; i >= 0; i--) tops[i] = Math.min(tops[i], alto - bloque - (tops.length - 1 - i) * paso)
  return tops.map((t) => Math.round(t))
}

// Hoy y los días que siguen (`cuantos`), cada uno con sus citas, posts y tareas en orden de hora
export function diasAgenda(o: { citas: CitaDia[]; posts: PostDia[]; tareas: TareaDia[] }, ahora: Date, cuantos = 2): DiaAgenda[] {
  const hoy = hoyCR(ahora)
  const items = itemsAgenda(o)
  return Array.from({ length: cuantos }, (_, i) => {
    const dia = sumarDias(hoy, i)
    return { dia, items: items.filter((it) => diaCR(it.en) === dia) }
  })
}
