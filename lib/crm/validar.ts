// Lo que manda el panel al CRM, revisado antes de tocar la base. Cada función devuelve los datos limpios o el
// error en palabras sencillas (el que ve la persona).
import { localCRaUtc } from '../calendario/fechas.ts'
import { normalizarTelefono } from './telefono.ts'
import { ESTADOS_OPORTUNIDAD } from './tipos.ts'
import type { EstadoOportunidad } from './tipos.ts'

export type Resultado<T> = { ok: true; datos: T } | { ok: false; error: string }

const falla = (error: string): { ok: false; error: string } => ({ ok: false, error })
const objeto = (e: unknown) => (typeof e === 'object' && e !== null && !Array.isArray(e) ? (e as Record<string, unknown>) : null)
const texto = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s+/g, ' ') : '')

export const MAX_NOMBRE = 80
export const MAX_EMPRESA = 120
export const MAX_NOTA = 5000
export const MAX_TITULO = 200
export const MAX_ETIQUETAS = 20
export const MAX_VALOR = 10_000_000

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function limpiarEtiquetas(valor: unknown): string[] | null {
  if (!Array.isArray(valor)) return null
  const vistas = new Set<string>()
  for (const v of valor) {
    const t = texto(v).toLowerCase()
    if (t) vistas.add(t.slice(0, 40))
  }
  return [...vistas].slice(0, MAX_ETIQUETAS)
}

export interface DatosContacto {
  nombre: string
  apellido: string
  telefono: string | null
  correo: string | null
  empresa: string | null
  etiquetas: string[]
}

// Crear (todo) o editar (solo lo que venga). El nombre no puede quedar vacío; teléfono y correo, sí
export function validarContacto(entrada: unknown, { parcial = false } = {}): Resultado<Partial<DatosContacto>> {
  const e = objeto(entrada)
  if (!e) return falla('Faltan los datos del contacto')
  const datos: Partial<DatosContacto> = {}
  const viene = (campo: keyof DatosContacto) => !parcial || campo in e

  if (viene('nombre')) {
    const nombre = texto(e.nombre)
    if (!nombre) return falla('Escribe el nombre')
    if (nombre.length > MAX_NOMBRE) return falla('El nombre es muy largo')
    datos.nombre = nombre
  }
  if (viene('apellido')) {
    const apellido = texto(e.apellido)
    if (apellido.length > MAX_NOMBRE) return falla('El apellido es muy largo')
    datos.apellido = apellido
  }
  if (viene('telefono')) {
    const crudo = texto(e.telefono)
    if (!crudo) datos.telefono = null
    else {
      const telefono = normalizarTelefono(crudo)
      if (!telefono) return falla('Ese teléfono no se entiende. Si es de otro país, empieza con + y el código (por ejemplo +52).')
      datos.telefono = telefono
    }
  }
  if (viene('correo')) {
    const correo = texto(e.correo).toLowerCase()
    if (correo && (!CORREO.test(correo) || correo.length > 254)) return falla('Ese correo no está bien escrito')
    datos.correo = correo || null
  }
  if (viene('empresa')) {
    const empresa = texto(e.empresa)
    if (empresa.length > MAX_EMPRESA) return falla('El nombre de la empresa es muy largo')
    datos.empresa = empresa || null
  }
  if (viene('etiquetas')) {
    const etiquetas = e.etiquetas === undefined ? [] : limpiarEtiquetas(e.etiquetas)
    if (!etiquetas) return falla('Las etiquetas no se entienden')
    datos.etiquetas = etiquetas
  }
  if (parcial && Object.keys(datos).length === 0) return falla('No hay nada que cambiar')
  return { ok: true, datos }
}

export function validarNota(entrada: unknown): Resultado<{ texto: string }> {
  const e = objeto(entrada)
  const t = typeof e?.texto === 'string' ? e.texto.replace(/\r\n?/g, '\n').trim() : ''
  if (!t) return falla('Escribe la nota')
  if (t.length > MAX_NOTA) return falla(`La nota es muy larga (máximo ${MAX_NOTA} letras)`)
  return { ok: true, datos: { texto: t } }
}

const DIA = /^\d{4}-\d{2}-\d{2}$/

// La tarea vence un día (hora de Costa Rica): se guarda a las 9:00 de ese día
export function venceDe(dia: unknown): string | null {
  return typeof dia === 'string' && DIA.test(dia) ? localCRaUtc(`${dia}T09:00`) : null
}

export function validarTarea(entrada: unknown): Resultado<{ titulo: string; vence_en: string | null }> {
  const e = objeto(entrada)
  if (!e) return falla('Faltan los datos de la tarea')
  const titulo = texto(e.titulo)
  if (!titulo) return falla('Escribe qué hay que hacer')
  if (titulo.length > MAX_TITULO) return falla('El texto de la tarea es muy largo')
  const vence = e.vence === undefined || e.vence === null || e.vence === '' ? null : venceDe(e.vence)
  if (e.vence && !vence) return falla('La fecha no es válida')
  return { ok: true, datos: { titulo, vence_en: vence } }
}

export function validarCambioTarea(entrada: unknown): Resultado<{ hecha: boolean }> {
  const e = objeto(entrada)
  if (typeof e?.hecha !== 'boolean') return falla('Falta decir si está hecha')
  return { ok: true, datos: { hecha: e.hecha } }
}

// «1,500», «1500.50» o 1500 → 1500.5 (dólares, con hasta dos decimales)
export function leerValor(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 && v <= MAX_VALOR ? Math.round(v * 100) / 100 : null
  if (typeof v !== 'string') return null
  const limpio = v.trim().replace(/[$\s]/g, '').replace(/,/g, '')
  if (limpio === '') return 0
  if (!/^\d+(\.\d{1,2})?$/.test(limpio)) return null
  return leerValor(Number(limpio))
}

export interface CambioOportunidad {
  etapa_id?: string
  estado?: EstadoOportunidad
  valor?: number
}

// Cambiar etapa, estado o valor. La etapa tiene que ser del mismo pipeline
export function validarCambioOportunidad(entrada: unknown, etapasDelPipeline: string[]): Resultado<CambioOportunidad> {
  const e = objeto(entrada)
  if (!e) return falla('Faltan los cambios')
  const cambio: CambioOportunidad = {}
  if ('etapa_id' in e) {
    if (typeof e.etapa_id !== 'string' || !etapasDelPipeline.includes(e.etapa_id)) return falla('Esa etapa no es de este pipeline')
    cambio.etapa_id = e.etapa_id
  }
  if ('estado' in e) {
    if (!(ESTADOS_OPORTUNIDAD as readonly unknown[]).includes(e.estado)) return falla('Ese estado no existe')
    cambio.estado = e.estado as EstadoOportunidad
  }
  if ('valor' in e) {
    const valor = leerValor(e.valor)
    if (valor === null) return falla('El valor tiene que ser un número, por ejemplo 1500')
    cambio.valor = valor
  }
  if (Object.keys(cambio).length === 0) return falla('No hay nada que cambiar')
  return { ok: true, datos: cambio }
}

export function validarNuevaOportunidad(
  entrada: unknown,
  etapas: { id: string; pipeline_id: string }[],
): Resultado<{ nombre: string; pipeline_id: string; etapa_id: string; valor: number }> {
  const e = objeto(entrada)
  if (!e) return falla('Faltan los datos de la oportunidad')
  const nombre = texto(e.nombre)
  if (!nombre) return falla('Ponle un nombre (por ejemplo, qué le vas a vender)')
  if (nombre.length > MAX_TITULO) return falla('El nombre es muy largo')
  const etapa = etapas.find((x) => x.id === e.etapa_id)
  if (!etapa) return falla('Elige la etapa')
  const valor = e.valor === undefined ? 0 : leerValor(e.valor)
  if (valor === null) return falla('El valor tiene que ser un número, por ejemplo 1500')
  return { ok: true, datos: { nombre, pipeline_id: etapa.pipeline_id, etapa_id: etapa.id, valor } }
}

// Cursor del historial («Ver más»): la fecha tal cual la devolvió la base y el id del último mensaje que se vio
const FECHA_BASE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}(?::?\d{2})?)$/
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function leerCursor(en: unknown, id: unknown): { en: string; id: string } | null {
  return typeof en === 'string' && typeof id === 'string' && FECHA_BASE.test(en) && UUID.test(id) ? { en, id } : null
}
