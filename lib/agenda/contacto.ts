// Cómo entra al CRM quien agenda el diagnóstico: se busca por correo o teléfono (crm_identidades) y, si no está, se
// crea con origen «web». Sus respuestas van a los mismos campos que llenaba GoHighLevel (así quedaron en la
// importación) y la cita queda en crm_citas con el enlace de Meet. Puro, con pruebas (contacto.test.ts).
import { normalizarTelefono } from '../crm/telefono.ts'
import type { Campos } from '../crm/tipos.ts'
import type { DiagnosticBooking } from '../diagnostic/diagnostic.ts'
import { cuandoCorto, respuestas } from './avisos.ts'

// La misma etiqueta que le ponía GoHighLevel («Web Lead 2026»); en el CRM van en minúsculas
export const ETIQUETA = 'web lead 2026'
export const FUENTE = 'Agenda del sitio'

type Respuesta = keyof DiagnosticBooking['answers']

// Clave y etiqueta del campo que llenaba GoHighLevel con cada respuesta
const CAMPOS: [Respuesta, string, string][] = [
  ['revenue', 'facturacin_mensual__20', 'Facturación mensual - 2.0'],
  ['challenge', 'objetivo', 'Objetivo'],
  ['timeline', 'deadline', 'Deadline'],
  ['size', 'company_size', 'Company Size'],
  ['industry', 'industria', 'Industria'],
]

export type DatosDelDiagnostico = { nombre: string; apellido: string; telefono: string | null; correo: string; campos: Campos }

export function contactoDelDiagnostico(b: DiagnosticBooking): DatosDelDiagnostico {
  const campos: Campos = {}
  for (const [id, clave, etiqueta] of CAMPOS) {
    const valor = b.answers?.[id]?.trim()
    if (valor) campos[clave] = { etiqueta, valor }
  }
  return {
    nombre: b.firstName.trim(),
    apellido: b.lastName.trim(),
    telefono: normalizarTelefono(b.phone),
    correo: b.email.trim().toLowerCase(),
    campos,
  }
}

// Un valor dentro de un filtro de PostgREST, entre comillas (los correos y teléfonos no traen comillas ni barras)
const comillas = (v: string) => `"${v.replace(/["\\]/g, '')}"`

/** Las condiciones (para .or() de PostgREST sobre crm_identidades) que buscan a la persona por correo o teléfono */
export function condicionesDeBusqueda(d: Pick<DatosDelDiagnostico, 'telefono' | 'correo'>): string[] {
  return [
    `and(canal.eq.correo,valor.eq.${comillas(d.correo)})`,
    ...(d.telefono ? [`and(canal.in.(telefono,whatsapp),valor.eq.${comillas(d.telefono)})`] : []),
  ]
}

/** De lo encontrado, el contacto: primero el del correo y, si no, el del teléfono */
export function elegirContacto(filas: { canal: string; contacto_id: string }[]): string | null {
  return filas.find((f) => f.canal === 'correo')?.contacto_id ?? filas[0]?.contacto_id ?? null
}

export type ContactoActual = {
  nombre: string | null
  apellido: string | null
  telefono: string | null
  correo: string | null
  etiquetas: string[] | null
  campos: Campos | null
}

/**
 * Lo que se le completa a un contacto que ya existía: solo los datos que le falten (lo editado en el panel no se
 * pisa), sus respuestas nuevas y la etiqueta. null si no cambia nada.
 */
export function completarContacto(actual: ContactoActual, d: DatosDelDiagnostico): Record<string, unknown> | null {
  const cambio: Record<string, unknown> = {}
  if (!actual.nombre?.trim() && d.nombre) cambio.nombre = d.nombre
  if (!actual.apellido?.trim() && d.apellido) cambio.apellido = d.apellido
  if (!actual.telefono && d.telefono) cambio.telefono = d.telefono
  if (!actual.correo) cambio.correo = d.correo
  const etiquetas = actual.etiquetas ?? []
  if (!etiquetas.includes(ETIQUETA)) cambio.etiquetas = [...etiquetas, ETIQUETA]
  const antes = actual.campos ?? {}
  const campos = { ...antes, ...d.campos }
  if (JSON.stringify(campos) !== JSON.stringify(antes)) cambio.campos = campos
  return Object.keys(cambio).length ? cambio : null
}

/** El contacto nuevo, si no estaba */
export function contactoNuevo(d: DatosDelDiagnostico) {
  return {
    nombre: d.nombre,
    apellido: d.apellido,
    telefono: d.telefono,
    correo: d.correo,
    etiquetas: [ETIQUETA],
    campos: d.campos,
    fuente: FUENTE,
    origen: 'web' as const,
  }
}

/** Las identidades que lo reconocen la próxima vez (si otro contacto ya tiene ese dato, la base deja la suya) */
export function identidadesDe(contactoId: string, d: Pick<DatosDelDiagnostico, 'telefono' | 'correo'>) {
  return [
    { contacto_id: contactoId, canal: 'correo', valor: d.correo },
    ...(d.telefono ? [{ contacto_id: contactoId, canal: 'telefono', valor: d.telefono }] : []),
  ]
}

export type CitaCreada = { eventoId: string; meet: string; inicio: number; fin: number }

/** La fila de crm_citas: con el enlace de Meet y, en las notas, lo que contestó en el formulario */
export function citaDelCrm(contactoId: string, b: DiagnosticBooking, cita: CitaCreada) {
  return {
    contacto_id: contactoId,
    titulo: 'Diagnóstico de 30 minutos',
    inicio: new Date(cita.inicio).toISOString(),
    fin: new Date(cita.fin).toISOString(),
    estado: 'confirmada' as const,
    enlace: cita.meet,
    notas: respuestas(b) || null,
    origen: 'web' as const,
    google_id: cita.eventoId,
  }
}

/** Lo que queda en el historial del contacto (una sola vez por pago) */
export function actividadDeLaCita(contactoId: string, b: DiagnosticBooking, ref: string, enviadoEn: string) {
  return {
    contacto_id: contactoId,
    canal: 'sistema',
    tipo: 'actividad' as const,
    texto: `Pagó y agendó el diagnóstico para el ${cuandoCorto(b.slot)}`,
    meta: { actividad: 'cita_agendada', orden: ref },
    enviado_en: enviadoEn,
    origen: 'web' as const,
    externo_id: `diagnostico:${ref}`,
  }
}
