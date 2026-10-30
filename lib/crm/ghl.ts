// De la copia de GoHighLevel (la que arma exportar-ghl.mjs) a las filas del CRM. Puro: no lee archivos ni toca
// la base; scripts/crm/importar-ghl.ts lo usa y las pruebas lo corren con datos inventados.
import { idDe } from './ids.ts'
import { textoPlano } from './texto.ts'
import { ESTADO_OPORTUNIDAD_LABEL } from './tipos.ts'
import type {
  AdjuntoFila,
  AdjuntoMensaje,
  Campos,
  Canal,
  CitaFila,
  ContactoFila,
  ConversacionFila,
  Direccion,
  EstadoCita,
  EstadoOportunidad,
  EtapaFila,
  IdentidadFila,
  MensajeFila,
  NotaFila,
  OportunidadFila,
  PipelineFila,
  TareaFila,
  TipoMensaje,
} from './tipos.ts'

// Lo que se usa de cada cosa de GoHighLevel ----------------------------------------------------------------------

export interface GhlNota {
  id: string
  body?: string | null
  bodyText?: string | null
  dateAdded: string
  pinned?: boolean
}

export interface GhlTarea {
  id: string
  title?: string | null
  body?: string | null
  dueDate?: string | null
  completed?: boolean
}

export interface GhlContacto {
  id: string
  firstName?: string | null
  lastName?: string | null
  contactName?: string | null
  phone?: string | null
  email?: string | null
  companyName?: string | null
  tags?: string[]
  customFields?: { id: string; value: unknown }[]
  additionalPhones?: unknown[]
  additionalEmails?: unknown[]
  source?: string | null
  dnd?: boolean
  dateAdded: string
  dateUpdated?: string | null
  lastActivity?: string | null
  notas?: GhlNota[]
  tareas?: GhlTarea[]
}

export interface GhlCampo {
  id: string
  name?: string | null
  fieldKey?: string | null
}

export interface GhlPipeline {
  id: string
  name: string
  stages: { id: string; name: string; position?: number }[]
}

export interface GhlOportunidad {
  id: string
  name?: string | null
  monetaryValue?: number | null
  pipelineId: string
  pipelineStageId: string
  status?: string | null
  source?: string | null
  contactId: string
  createdAt: string
  updatedAt?: string | null
  lastStageChangeAt?: string | null
}

export interface GhlMensaje {
  id: string
  messageType: string
  direction?: string | null
  status?: string | null
  body?: string | null
  contentType?: string | null
  source?: string | null
  error?: string | null
  from?: string | null
  to?: string | null
  dateAdded: string
  attachments?: string[]
  meta?: {
    email?: { subject?: string | null; direction?: string | null }
    call?: { duration?: number | null; status?: string | null }
  } | null
  activity?: { type?: string; title?: string; data?: Record<string, unknown> } | null
}

export interface GhlConversacion {
  id: string
  contactId: string
  lastMessageType?: string | null
  unreadCount?: number | null
  dateAdded?: number | string | null
  mensajes?: GhlMensaje[]
}

export interface GhlCita {
  id: string
  contactId: string
  title?: string | null
  startTime: string
  endTime?: string | null
  appointmentStatus?: string | null
  address?: string | null
  notes?: string | null
  description?: string | null
  dateAdded?: string | null
  deleted?: boolean
}

export interface GhlAdjuntos {
  mapa: Record<string, string> // URL → archivo dentro de la copia
  fallas?: { url: string; error?: string }[]
}

export interface CopiaGhl {
  contactos: GhlContacto[]
  campos: GhlCampo[]
  pipelines: GhlPipeline[]
  oportunidades: GhlOportunidad[]
  conversaciones: GhlConversacion[]
  citas: GhlCita[]
  adjuntos: GhlAdjuntos
}

// Un adjunto para subir: su fila y el archivo de la copia (el tamaño lo pone el script al leerlo)
export type AdjuntoImportado = Omit<AdjuntoFila, 'tamano'> & { archivo: string }

export interface Importacion {
  contactos: ContactoFila[]
  identidades: IdentidadFila[]
  notas: NotaFila[]
  tareas: TareaFila[]
  pipelines: PipelineFila[]
  etapas: EtapaFila[]
  oportunidades: OportunidadFila[]
  conversaciones: ConversacionFila[]
  mensajes: MensajeFila[]
  citas: CitaFila[]
  adjuntos: AdjuntoImportado[]
  avisos: string[] // lo que no entró y por qué (solo cuántos, sin datos de nadie)
}

// Ayudas ----------------------------------------------------------------------------------------------------------

// Fecha de GoHighLevel (texto ISO, con zona, o milisegundos) en ISO UTC; null si no es una fecha
export function iso(valor: unknown): string | null {
  if (valor === null || valor === undefined || valor === '') return null
  const t = typeof valor === 'number' ? valor : Date.parse(String(valor))
  return Number.isFinite(t) ? new Date(t).toISOString() : null
}

const maximo = (...fechas: (string | null | undefined)[]) =>
  fechas.filter((f): f is string => !!f).reduce<string | null>((a, f) => (a === null || Date.parse(f) > Date.parse(a) ? f : a), null)

const limpio = (s: unknown) => (typeof s === 'string' ? s.trim() : '')

// El teléfono como lo dejó GoHighLevel (ya viene con +), solo con los números: no se descarta ninguno
export function telefonoDeGhl(telefono: unknown): string | null {
  const digitos = limpio(telefono).replace(/\D/g, '')
  return digitos.length >= 5 ? `+${digitos}` : null
}

const correoDeGhl = (correo: unknown) => limpio(correo).toLowerCase() || null

export function normalizarEtiquetas(etiquetas: unknown): string[] {
  if (!Array.isArray(etiquetas)) return []
  const vistas = new Set<string>()
  for (const e of etiquetas) {
    const t = limpio(e).toLowerCase().replace(/\s+/g, ' ')
    if (t) vistas.add(t)
  }
  return [...vistas]
}

// Canal y tipo de cada messageType de GoHighLevel
export function canalDe(messageType: string): { canal: Canal; tipo: TipoMensaje } {
  const t = messageType.toUpperCase()
  if (t.startsWith('TYPE_ACTIVITY') || t === 'TYPE_NO_SHOW') return { canal: 'sistema', tipo: 'actividad' }
  if (t.includes('WHATSAPP')) return { canal: 'whatsapp', tipo: 'mensaje' }
  if (t.includes('SMS')) return { canal: 'sms', tipo: 'mensaje' }
  if (t.includes('EMAIL')) return { canal: 'correo', tipo: 'correo' }
  if (t.includes('FACEBOOK')) return { canal: 'messenger', tipo: 'mensaje' }
  if (t.includes('INSTAGRAM')) return { canal: 'instagram', tipo: 'mensaje' }
  if (t.includes('CALL')) return { canal: 'llamada', tipo: 'llamada' }
  return { canal: 'otro', tipo: 'mensaje' }
}

export function direccionDe(m: GhlMensaje): Direccion | null {
  const d = m.direction ?? m.meta?.email?.direction
  return d === 'inbound' ? 'entrante' : d === 'outbound' ? 'saliente' : null
}

export function estadoOportunidad(status: unknown): EstadoOportunidad {
  return status === 'won' ? 'ganada' : status === 'lost' ? 'perdida' : status === 'abandoned' ? 'abandonada' : 'abierta'
}

export function estadoCita(status: unknown): EstadoCita {
  if (status === 'showed') return 'asistio'
  if (status === 'noshow') return 'no_asistio'
  if (status === 'cancelled' || status === 'invalid') return 'cancelada'
  if (status === 'new') return 'nueva'
  return 'confirmada'
}

const ENVIO: Record<string, string> = {
  delivered: 'entregado',
  read: 'leido',
  sent: 'enviado',
  pending: 'pendiente',
  failed: 'fallo',
  undelivered: 'fallo',
}

const LLAMADA: Record<string, string> = {
  completed: 'contestada',
  canceled: 'cancelada',
  busy: 'ocupado',
  'no-answer': 'sin_respuesta',
  failed: 'fallo',
}

const dolares = (monto: unknown) =>
  typeof monto === 'number' && Number.isFinite(monto) ? `$${monto.toLocaleString('en-US', { maximumFractionDigits: 2 })}` : null

// El evento en palabras sencillas (GoHighLevel los guarda en inglés)
export function textoActividad(m: Pick<GhlMensaje, 'activity' | 'body'>): string {
  const tipo = m.activity?.type ?? ''
  const d = (m.activity?.data ?? {}) as Record<string, unknown>
  const etapa = (d.stage as { newStageName?: string } | undefined)?.newStageName
  const cita = limpio(d.appointmentTitle)
  switch (tipo) {
    case 'opportunity_created':
      return 'Oportunidad creada'
    case 'opportunity_stage_updated':
      return etapa ? `Oportunidad movida a «${etapa}»` : 'Oportunidad cambiada'
    case 'opportunity_status_updated':
      return `Oportunidad marcada como ${ESTADO_OPORTUNIDAD_LABEL[estadoOportunidad(d.status)].toLowerCase()}`
    case 'opportunity_deleted':
      return 'Oportunidad borrada'
    case 'appointment_created':
      return cita ? `Cita agendada: ${cita}` : 'Cita agendada'
    case 'appointment_updated':
      return cita ? `Cita cambiada: ${cita}` : 'Cita cambiada'
    case 'appointment_deleted':
      return 'Cita borrada'
    case 'appointment_completed':
      return 'Cita hecha'
    case 'appoitntment_cancelled': // así viene de GoHighLevel
    case 'appointment_cancelled':
      return 'Cita cancelada'
    case 'invoice_sent': {
      const monto = dolares(d.totalAmount ?? d.amount)
      return monto ? `Factura enviada por ${monto}` : 'Factura enviada'
    }
    case 'payment_received': {
      const monto = dolares(d.amount)
      return monto ? `Pago recibido: ${monto}` : 'Pago recibido'
    }
    case 'contact_dnd_enabled':
      return 'Pidió no recibir más mensajes'
    case 'user_dnd_enabled':
      return 'Se apagaron los mensajes a este contacto'
    case 'user_dnd_disabled':
      return 'Se volvieron a prender los mensajes a este contacto'
    default:
      return limpio(m.activity?.title) || textoPlano(m.body) || 'Aviso'
  }
}

// Los campos personalizados con su etiqueta legible. Clave: la de GoHighLevel sin «contact.» (o ghl_<id> si no
// vino su definición)
export function camposDe(valores: GhlContacto['customFields'], definiciones: Map<string, GhlCampo>): Campos {
  const campos: Campos = {}
  for (const v of valores ?? []) {
    const valor = Array.isArray(v.value) ? v.value.map(String).join(', ') : v.value === null || v.value === undefined ? '' : String(v.value).trim()
    if (!valor) continue
    const def = definiciones.get(v.id)
    const clave = limpio(def?.fieldKey).replace(/^contact\./, '') || `ghl_${v.id}`
    campos[clave] = { etiqueta: limpio(def?.name) || null, valor }
  }
  return campos
}

const EXTENSION_MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.heic': 'image/heic',
  '.mp4': 'video/mp4',
  '.mov': 'video/quicktime',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.ogg': 'audio/ogg',
  '.oga': 'audio/ogg',
  '.opus': 'audio/ogg',
  '.aac': 'audio/aac',
  '.m4a': 'audio/mp4',
  '.wav': 'audio/wav',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.xls': 'application/vnd.ms-excel',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.txt': 'text/plain',
  '.csv': 'text/csv',
}

export function extensionDe(ruta: string): string {
  const nombre = ruta.split(/[?#]/)[0].split('/').pop() ?? ''
  const punto = nombre.lastIndexOf('.')
  return punto > 0 ? nombre.slice(punto).toLowerCase().slice(0, 8) : ''
}

export const mimeDe = (ruta: string): string | null => EXTENSION_MIME[extensionDe(ruta)] ?? null

// Las URL de GoHighLevel traen nombres sin sentido: se nombra por lo que es y su fecha (video-2025-03-12.mp4)
export function nombreAdjunto(url: string, fecha: string): string {
  const mime = mimeDe(url) ?? ''
  const base = mime.startsWith('image/')
    ? 'foto'
    : mime.startsWith('video/')
      ? 'video'
      : mime.startsWith('audio/')
        ? 'audio'
        : mime === 'application/pdf'
          ? 'documento'
          : 'archivo'
  return `${base}-${fecha.slice(0, 10)}${extensionDe(url)}`
}

// Del lado del contacto: en lo que entra, quien manda; en lo que sale, a quien va
function numeroDelContacto(m: GhlMensaje): string | null {
  const n = m.direction === 'inbound' ? m.from : m.direction === 'outbound' ? m.to : null
  if (!n || !limpio(n).startsWith('+')) return null
  const digitos = n.replace(/\D/g, '')
  return digitos.length >= 8 && digitos.length <= 15 ? `+${digitos}` : null
}

const quitarVacios = (o: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== null && v !== undefined && v !== ''))

// La transformación ----------------------------------------------------------------------------------------------

export function transformar(copia: CopiaGhl): Importacion {
  const avisos: string[] = []
  const contar = (n: number, texto: string) => {
    if (n > 0) avisos.push(`${n} ${texto}`)
  }

  const contactosGhl = [...new Map(copia.contactos.map((c) => [c.id, c])).values()]
  const conocidos = new Set(contactosGhl.map((c) => c.id))
  const definiciones = new Map(copia.campos.map((c) => [c.id, c]))

  // Mensajes, por contacto: la fecha del último y los números de WhatsApp que usó
  const ultimoMensaje = new Map<string, string>()
  const numerosWhatsApp = new Map<string, Set<string>>()
  const conversaciones = copia.conversaciones.filter((c) => conocidos.has(c.contactId))
  contar(copia.conversaciones.length - conversaciones.length, 'conversaciones sin su contacto en la copia')
  for (const cv of conversaciones) {
    for (const m of cv.mensajes ?? []) {
      const fecha = iso(m.dateAdded)
      if (fecha) ultimoMensaje.set(cv.contactId, maximo(ultimoMensaje.get(cv.contactId), fecha) as string)
      const n = canalDe(m.messageType).canal === 'whatsapp' ? numeroDelContacto(m) : null
      if (n) {
        const numeros = numerosWhatsApp.get(cv.contactId) ?? new Set<string>()
        numerosWhatsApp.set(cv.contactId, numeros.add(n))
      }
    }
  }

  // Contactos, con sus notas y tareas
  const contactos: ContactoFila[] = []
  const notas: NotaFila[] = []
  const tareas: TareaFila[] = []
  for (const c of contactosGhl) {
    const id = idDe('contacto', c.id)
    const creado = iso(c.dateAdded) ?? new Date(0).toISOString()
    const notasDe = (c.notas ?? []).map(
      (n): NotaFila => ({
        id: idDe('nota', n.id),
        contacto_id: id,
        texto: textoPlano(n.body ?? n.bodyText ?? ''),
        autor: null,
        fijada: n.pinned === true,
        origen: 'ghl',
        ghl_id: n.id,
        creado_en: iso(n.dateAdded) ?? creado,
      }),
    )
    notas.push(...notasDe)
    for (const t of c.tareas ?? []) {
      tareas.push({
        id: idDe('tarea', t.id),
        contacto_id: id,
        titulo: limpio(t.title) || 'Tarea',
        detalle: textoPlano(t.body) || null,
        vence_en: iso(t.dueDate),
        hecha: t.completed === true,
        hecha_en: null,
        origen: 'ghl',
        ghl_id: t.id,
        creado_en: iso(t.dueDate) ?? creado,
      })
    }
    const nombre = limpio(c.firstName)
    const apellido = limpio(c.lastName)
    const correo = correoDeGhl(c.email)
    const telefono = telefonoDeGhl(c.phone)
    contactos.push({
      id,
      nombre,
      apellido,
      telefono,
      correo,
      empresa: limpio(c.companyName) || null,
      etiquetas: normalizarEtiquetas(c.tags),
      campos: camposDe(c.customFields, definiciones),
      fuente: limpio(c.source) || null,
      no_molestar: c.dnd === true,
      origen: 'ghl',
      ghl_id: c.id,
      creado_en: creado,
      actualizado_en: iso(c.dateUpdated) ?? creado,
      ultima_actividad: maximo(creado, iso(c.lastActivity), ultimoMensaje.get(c.id), ...notasDe.map((n) => n.creado_en)) as string,
    })
  }

  // Identidades: teléfono, correo y los números de WhatsApp de sus mensajes. Si dos contactos comparten uno, queda
  // con el de actividad más reciente
  const identidades: IdentidadFila[] = []
  const dueño = new Map<string, string>() // canal:valor → contacto
  let repetidas = 0
  const agregar = (contacto_id: string, canal: IdentidadFila['canal'], valor: string | null) => {
    if (!valor) return
    const clave = `${canal}:${valor}`
    const actual = dueño.get(clave)
    if (actual) {
      if (actual !== contacto_id) repetidas++
      return
    }
    dueño.set(clave, contacto_id)
    identidades.push({ contacto_id, canal, valor })
  }
  const porActividad = [...contactos].sort((a, b) => Date.parse(b.ultima_actividad) - Date.parse(a.ultima_actividad))
  const ghlDe = new Map(contactosGhl.map((c) => [idDe('contacto', c.id), c]))
  for (const c of porActividad) {
    const g = ghlDe.get(c.id) as GhlContacto
    agregar(c.id, 'telefono', c.telefono)
    for (const extra of g.additionalPhones ?? []) {
      agregar(c.id, 'telefono', telefonoDeGhl(typeof extra === 'string' ? extra : (extra as { phone?: string })?.phone))
    }
    agregar(c.id, 'correo', c.correo)
    for (const extra of g.additionalEmails ?? []) {
      agregar(c.id, 'correo', correoDeGhl(typeof extra === 'string' ? extra : (extra as { email?: string })?.email))
    }
    for (const n of numerosWhatsApp.get(g.id) ?? []) agregar(c.id, 'whatsapp', n)
  }
  contar(repetidas, 'teléfonos o correos que ya eran de otro contacto (quedan con el más reciente)')

  // Pipelines y etapas
  const pipelines: PipelineFila[] = copia.pipelines.map((p, orden) => ({ id: idDe('pipeline', p.id), nombre: limpio(p.name) || 'Pipeline', orden, ghl_id: p.id }))
  const etapas: EtapaFila[] = copia.pipelines.flatMap((p) =>
    [...p.stages]
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
      .map((s, i) => ({ id: idDe('etapa', s.id), pipeline_id: idDe('pipeline', p.id), nombre: limpio(s.name) || 'Etapa', orden: s.position ?? i, ghl_id: s.id })),
  )
  const etapaEnPipeline = new Set(copia.pipelines.flatMap((p) => p.stages.map((s) => `${p.id}:${s.id}`)))

  // Oportunidades
  const oportunidades: OportunidadFila[] = []
  let sinContacto = 0
  let sinEtapa = 0
  for (const o of copia.oportunidades) {
    if (!conocidos.has(o.contactId)) {
      sinContacto++
      continue
    }
    if (!etapaEnPipeline.has(`${o.pipelineId}:${o.pipelineStageId}`)) {
      sinEtapa++
      continue
    }
    const creado = iso(o.createdAt) ?? new Date(0).toISOString()
    oportunidades.push({
      id: idDe('oportunidad', o.id),
      contacto_id: idDe('contacto', o.contactId),
      pipeline_id: idDe('pipeline', o.pipelineId),
      etapa_id: idDe('etapa', o.pipelineStageId),
      nombre: limpio(o.name) || 'Oportunidad',
      valor: typeof o.monetaryValue === 'number' && o.monetaryValue > 0 ? Math.round(o.monetaryValue * 100) / 100 : 0,
      estado: estadoOportunidad(o.status),
      fuente: limpio(o.source) || null,
      origen: 'ghl',
      ghl_id: o.id,
      creado_en: creado,
      actualizado_en: iso(o.updatedAt) ?? creado,
      cambio_etapa_en: iso(o.lastStageChangeAt),
    })
  }
  contar(sinContacto, 'oportunidades sin su contacto en la copia')
  contar(sinEtapa, 'oportunidades con una etapa que no está en su pipeline')

  // Conversaciones, mensajes y adjuntos
  const filasConversacion: ConversacionFila[] = []
  const mensajes: MensajeFila[] = []
  const adjuntos: AdjuntoImportado[] = []
  for (const cv of conversaciones) {
    const id = idDe('conversacion', cv.id)
    const contacto_id = idDe('contacto', cv.contactId)
    const reales = (cv.mensajes ?? []).filter((m) => canalDe(m.messageType).tipo !== 'actividad' && iso(m.dateAdded))
    const ultimo = reales.reduce<GhlMensaje | null>((a, m) => (a === null || Date.parse(m.dateAdded) > Date.parse(a.dateAdded) ? m : a), null)
    filasConversacion.push({
      id,
      contacto_id,
      canal: ultimo ? canalDe(ultimo.messageType).canal : 'sistema',
      origen: 'ghl',
      externo_id: cv.id,
      cuenta: null,
      ultimo_mensaje_en: ultimo ? iso(ultimo.dateAdded) : null,
      sin_leer: Math.max(0, Math.trunc(cv.unreadCount ?? 0)),
      creado_en: iso(cv.dateAdded) ?? iso(ultimo?.dateAdded) ?? new Date(0).toISOString(),
    })

    for (const m of cv.mensajes ?? []) {
      const enviado_en = iso(m.dateAdded)
      if (!enviado_en) continue
      const { canal, tipo } = canalDe(m.messageType)
      const archivos: AdjuntoMensaje[] = (m.attachments ?? []).map((url, i) => {
        const archivo = copia.adjuntos.mapa[url]
        const fila = { nombre: nombreAdjunto(String(url), enviado_en), tipo: mimeDe(String(url)) }
        if (!archivo) return { id: null, ...fila, perdido: true }
        const adjuntoId = idDe('adjunto', `${m.id}:${i}`)
        adjuntos.push({
          id: adjuntoId,
          contacto_id,
          mensaje_id: idDe('mensaje', m.id),
          ...fila,
          ruta: `ghl/${contacto_id}/${adjuntoId}${extensionDe(archivo)}`,
          origen: 'ghl',
          externo_id: `${m.id}:${i}`,
          creado_en: enviado_en,
          archivo,
        })
        return { id: adjuntoId, ...fila }
      })
      const llamada = tipo === 'llamada' ? quitarVacios({ estado: LLAMADA[m.meta?.call?.status ?? m.status ?? ''], segundos: m.meta?.call?.duration ?? null }) : null
      mensajes.push({
        id: idDe('mensaje', m.id),
        conversacion_id: id,
        contacto_id,
        canal,
        tipo,
        direccion: tipo === 'actividad' ? null : direccionDe(m),
        texto: tipo === 'actividad' ? textoActividad(m) : textoPlano(m.body, { html: m.contentType === 'text/html' }) || null,
        asunto: tipo === 'correo' ? limpio(m.meta?.email?.subject) || null : null,
        adjuntos: archivos,
        meta: quitarVacios({
          estado: tipo === 'llamada' || tipo === 'actividad' ? null : ENVIO[m.status ?? ''],
          error: m.status === 'failed' ? limpio(m.error) || null : null,
          llamada: llamada && Object.keys(llamada).length ? llamada : null,
          actividad: tipo === 'actividad' ? m.activity?.type ?? m.messageType : null,
          fuente: limpio(m.source) || null,
        }),
        enviado_en,
        origen: 'ghl',
        externo_id: m.id,
      })
    }
  }

  // Citas
  const citas: CitaFila[] = []
  let citasSinContacto = 0
  for (const c of copia.citas) {
    const inicio = iso(c.startTime)
    if (c.deleted || !inicio) continue
    if (!conocidos.has(c.contactId)) {
      citasSinContacto++
      continue
    }
    const enlace = limpio(c.address)
    citas.push({
      id: idDe('cita', c.id),
      contacto_id: idDe('contacto', c.contactId),
      titulo: limpio(c.title) || 'Cita',
      inicio,
      fin: iso(c.endTime),
      estado: estadoCita(c.appointmentStatus),
      enlace: /^https?:\/\//i.test(enlace) ? enlace : null,
      notas: textoPlano(c.notes || c.description) || null,
      origen: 'ghl',
      ghl_id: c.id,
      creado_en: iso(c.dateAdded) ?? inicio,
    })
  }
  contar(citasSinContacto, 'citas sin su contacto en la copia')

  return {
    contactos,
    identidades,
    notas,
    tareas,
    pipelines,
    etapas,
    oportunidades,
    conversaciones: filasConversacion,
    mensajes,
    citas,
    adjuntos,
    avisos,
  }
}
