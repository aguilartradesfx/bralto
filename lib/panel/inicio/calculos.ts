// Los números del Inicio del panel, sin base de datos (con pruebas): series por día, comparaciones, el puntaje
// de seguimiento y el color de cada etapa del pipeline.
import { diaCR, hoyCR, sumarDias } from '../../calendario/fechas.ts'

export const PERIODOS = [7, 30, 90] as const
export type Periodo = (typeof PERIODOS)[number]

export function leerPeriodo(valor: unknown): Periodo {
  const n = Number(Array.isArray(valor) ? valor[0] : valor)
  return (PERIODOS as readonly number[]).includes(n) ? (n as Periodo) : 30
}

// Cuántos hubo cada día (hora de Costa Rica), de los `dias` que terminan hoy. El último es hoy
export function serieDiaria(instantes: string[], ahora: Date, dias: number): number[] {
  const hoy = hoyCR(ahora)
  const primero = sumarDias(hoy, -(dias - 1))
  const serie = new Array<number>(dias).fill(0)
  for (const t of instantes) {
    const d = diaCR(t)
    if (d < primero || d > hoy) continue
    const i = Math.round((Date.parse(`${d}T00:00:00Z`) - Date.parse(`${primero}T00:00:00Z`)) / 86_400_000)
    serie[i]++
  }
  return serie
}

// El período que termina hoy y el de antes, del mismo largo
export function contarPeriodos(instantes: string[], ahora: Date, dias: number): { actual: number; anterior: number } {
  const hoy = hoyCR(ahora)
  const desde = sumarDias(hoy, -(dias - 1))
  const antesDesde = sumarDias(desde, -dias)
  let actual = 0
  let anterior = 0
  for (const t of instantes) {
    const d = diaCR(t)
    if (d >= desde && d <= hoy) actual++
    else if (d >= antesDesde && d < desde) anterior++
  }
  return { actual, anterior }
}

// «+12.5 %» o «−4 %» contra el período anterior; null si antes no hubo nada con qué comparar
export function cambio(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return Math.round(((actual - anterior) / anterior) * 1000) / 10
}

// Respondes a tiempo: cada vez que alguien escribe (uno o varios mensajes seguidos), ¿le contestaste en menos de
// `horas`? Lo que todavía está dentro del plazo y sin respuesta no cuenta (aún puedes contestar a tiempo)
export interface MensajeTurno {
  conversacion_id: string | null
  direccion: 'entrante' | 'saliente' | null
  enviado_en: string
}

export function turnosRespondidos(mensajes: MensajeTurno[], ahora: Date, desde: string, horas = 24): { aTiempo: number; total: number } {
  const plazo = horas * 3600_000
  const porConversacion = new Map<string, MensajeTurno[]>()
  for (const m of mensajes) {
    if (!m.conversacion_id || !m.direccion) continue
    const lista = porConversacion.get(m.conversacion_id) ?? []
    lista.push(m)
    porConversacion.set(m.conversacion_id, lista)
  }
  let aTiempo = 0
  let total = 0
  for (const lista of porConversacion.values()) {
    lista.sort((a, b) => Date.parse(a.enviado_en) - Date.parse(b.enviado_en))
    let inicio: number | null = null
    for (const m of lista) {
      const t = Date.parse(m.enviado_en)
      if (m.direccion === 'entrante') {
        if (inicio === null) inicio = t
        continue
      }
      if (inicio !== null) {
        if (inicio >= Date.parse(desde)) {
          total++
          if (t - inicio <= plazo) aTiempo++
        }
        inicio = null
      }
    }
    // Escribió y nadie le ha contestado: cuenta como tarde solo si ya se pasó el plazo
    if (inicio !== null && inicio >= Date.parse(desde) && ahora.getTime() - inicio > plazo) total++
  }
  return { aTiempo, total }
}

// El puntaje de seguimiento (0 a 100): cada parte vale según su peso; las que no tienen datos no cuentan
export interface Parte {
  id: string
  nombre: string
  peso: number
  valor: number | null // 0 a 100; null: sin datos
  detalle: string
  consejo: { titulo: string; texto: string; href: string } | null
}

export interface Salud {
  puntaje: number | null
  partes: (Parte & { pesoReal: number })[]
  mejoras: { id: string; titulo: string; texto: string; href: string; sube: number }[]
}

export function salud(partes: Parte[]): Salud {
  const conDatos = partes.filter((p) => p.valor !== null)
  const pesoTotal = conDatos.reduce((s, p) => s + p.peso, 0)
  const conPeso = partes.map((p) => ({ ...p, pesoReal: p.valor === null || pesoTotal === 0 ? 0 : Math.round((p.peso / pesoTotal) * 100) }))
  if (pesoTotal === 0) return { puntaje: null, partes: conPeso, mejoras: [] }
  const puntaje = Math.round(conDatos.reduce((s, p) => s + (p.valor as number) * p.peso, 0) / pesoTotal)
  // Cuánto subiría el puntaje si esa parte llegara a 100
  const mejoras = conDatos
    .filter((p) => p.consejo && (p.valor as number) < 100)
    .map((p) => ({ id: p.id, ...p.consejo!, sube: Math.round(((100 - (p.valor as number)) * p.peso) / pesoTotal) }))
    .filter((m) => m.sube > 0)
    .sort((a, b) => b.sube - a.sube)
    .slice(0, 3)
  return { puntaje, partes: conPeso, mejoras }
}

export const porcentaje = (parte: number, total: number): number | null => (total > 0 ? Math.round((parte / total) * 100) : null)

// El color de cada etapa del pipeline, por su nombre (las etapas vienen de GoHighLevel con nombres libres)
export type Tono = 'gris' | 'azul' | 'morado' | 'verde' | 'rojo' | 'ambar'

const plano = (t: string) => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function tonoDeEtapa(nombre: string, estado: string = 'abierta'): Tono {
  if (estado === 'ganada') return 'verde'
  if (estado === 'perdida' || estado === 'abandonada') return 'rojo'
  const n = plano(nombre)
  if (/\bwin\b|ganad|se presento|cerrad/.test(n)) return 'verde'
  if (/perdid|no se presento|no contest|no en este momento|descart/.test(n)) return 'rojo'
  if (/cita|reunion|llamada agendada/.test(n)) return 'azul'
  if (/interes|propuesta/.test(n)) return 'morado'
  if (/seguimiento/.test(n)) return 'ambar'
  return 'gris'
}

// Quita el punto final que traen algunas etapas («Cita agendada.»)
export const nombreEtapa = (nombre: string) => nombre.trim().replace(/\.+$/, '')
