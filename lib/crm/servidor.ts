// SERVER-ONLY — el CRM contra las tablas crm_*, con service role (no tienen políticas de RLS). Quien llama revisa
// antes el permiso (la página o la ruta de la API). Las reglas (validar, buscar, agrupar) están en módulos puros
// con pruebas: validar.ts, busqueda.ts, tablero.ts.
import { createServiceClient } from '@/lib/supabase/service'
import { POR_PAGINA, terminosDeBusqueda } from '@/lib/crm/busqueda'
import { canalConocido, ESTADO_OPORTUNIDAD_LABEL, nombreVisible } from '@/lib/crm/tipos'
import type { AdjuntoMensaje, Campos, EstadoOportunidad } from '@/lib/crm/tipos'
import { UUID, validarCambioOportunidad, validarNuevaOportunidad } from '@/lib/crm/validar'
import type { DatosContacto } from '@/lib/crm/validar'
import { dinero } from '@/lib/crm/tablero'
import type {
  AdjuntoVista,
  CitaVista,
  ContactoLista,
  ContactoVista,
  Cursor,
  Ficha,
  Historial,
  MensajeVista,
  NotaVista,
  OportunidadVista,
  PipelineVista,
  TarjetaVista,
  TareaVista,
} from '@/lib/crm/vista'

const BUCKET = 'crm'
const POR_HISTORIAL = 30
const db = () => createServiceClient()

export type Falla = { error: string; status: 400 | 404 | 409 | 500; otro?: { id: string; nombre: string } }
export const esFalla = (r: unknown): r is Falla => typeof r === 'object' && r !== null && 'error' in r && 'status' in r

const fallo = (donde: string, error: { message: string }): Falla => {
  console.error(`[crm] ${donde}: ${error.message}`)
  return { error: 'No se pudo guardar. Prueba de nuevo.', status: 500 }
}

type ContactoMin = { id: string; nombre: string; apellido: string; correo: string | null; telefono: string | null }
const COLUMNAS_MIN = 'id, nombre, apellido, correo, telefono'
const minimo = (c: ContactoMin | null) => (c ? { id: c.id, nombre: nombreVisible(c) } : { id: '', nombre: 'Sin contacto' })

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

// Contactos ---------------------------------------------------------------------------------------------------------

export async function listarContactos(opciones: { q?: string; etiqueta?: string; pagina: number }): Promise<{ filas: ContactoLista[]; total: number }> {
  const desde = (opciones.pagina - 1) * POR_PAGINA
  let consulta = db()
    .from('crm_contactos')
    .select('id, nombre, apellido, telefono, correo, empresa, etiquetas, ultima_actividad', { count: 'exact' })
  for (const termino of terminosDeBusqueda(opciones.q)) consulta = consulta.ilike('busqueda', `%${termino}%`)
  if (opciones.etiqueta) consulta = consulta.filter('etiquetas', 'cs', `{"${opciones.etiqueta.replace(/["\\]/g, '\\$&')}"}`)
  const { data, error, count } = await consulta
    .order('ultima_actividad', { ascending: false })
    .order('id')
    .range(desde, desde + POR_PAGINA - 1)
  if (error) throw new Error(`crm_contactos: ${error.message}`)
  const filas = (data ?? []) as (ContactoMin & { empresa: string | null; etiquetas: string[]; ultima_actividad: string })[]
  const resumen = new Map<string, { canal: string | null; abiertas: number }>()
  if (filas.length > 0) {
    const r = await db().rpc('crm_resumen_contactos', { ids: filas.map((f) => f.id) })
    if (r.error) throw new Error(`crm_resumen_contactos: ${r.error.message}`)
    for (const x of (r.data ?? []) as { contacto_id: string; canal: string | null; abiertas: number }[]) resumen.set(x.contacto_id, x)
  }
  return {
    total: count ?? 0,
    filas: filas.map((f) => ({
      id: f.id,
      nombre: nombreVisible(f),
      telefono: f.telefono,
      correo: f.correo,
      empresa: f.empresa,
      etiquetas: f.etiquetas ?? [],
      ultima_actividad: f.ultima_actividad,
      canal: resumen.get(f.id)?.canal ? canalConocido(resumen.get(f.id)?.canal) : null,
      abiertas: resumen.get(f.id)?.abiertas ?? 0,
    })),
  }
}

export async function etiquetasEnUso(): Promise<{ etiqueta: string; total: number }[]> {
  const { data, error } = await db().rpc('crm_etiquetas')
  if (error) throw new Error(`crm_etiquetas: ${error.message}`)
  return (data ?? []) as { etiqueta: string; total: number }[]
}

export async function existeContacto(id: string): Promise<boolean> {
  if (!UUID.test(id)) return false
  const { data, error } = await db().from('crm_contactos').select('id').eq('id', id).maybeSingle()
  if (error) throw new Error(`crm_contactos: ${error.message}`)
  return !!data
}

export async function leerPipelines(): Promise<PipelineVista[]> {
  const [p, e] = await Promise.all([
    db().from('crm_pipelines').select('id, nombre, orden').order('orden').order('nombre'),
    db().from('crm_etapas').select('id, pipeline_id, nombre, orden').order('orden'),
  ])
  if (p.error) throw new Error(`crm_pipelines: ${p.error.message}`)
  if (e.error) throw new Error(`crm_etapas: ${e.error.message}`)
  const etapas = (e.data ?? []) as { id: string; pipeline_id: string; nombre: string; orden: number }[]
  return ((p.data ?? []) as { id: string; nombre: string }[]).map((x) => ({
    id: x.id,
    nombre: x.nombre,
    etapas: etapas.filter((s) => s.pipeline_id === x.id).map(({ id, nombre, orden }) => ({ id, nombre, orden })),
  }))
}

const aMensaje = (m: Record<string, unknown>): MensajeVista => {
  const meta = (m.meta ?? {}) as { estado?: string; llamada?: { estado?: string; segundos?: number } }
  return {
    id: m.id as string,
    canal: canalConocido(m.canal as string),
    tipo: m.tipo as MensajeVista['tipo'],
    direccion: (m.direccion as MensajeVista['direccion']) ?? null,
    texto: (m.texto as string | null) ?? null,
    asunto: (m.asunto as string | null) ?? null,
    adjuntos: Array.isArray(m.adjuntos) ? (m.adjuntos as AdjuntoMensaje[]) : [],
    estado: meta.estado ?? null,
    llamada: meta.llamada ?? null,
    enviado_en: m.enviado_en as string,
  }
}

// Los mensajes de todos los canales, los más nuevos arriba. «antes»: el último que ya se vio («Ver más»)
export async function leerHistorial(contactoId: string, antes: Cursor | null = null): Promise<Historial> {
  let consulta = db()
    .from('crm_mensajes')
    .select('id, canal, tipo, direccion, texto, asunto, adjuntos, meta, enviado_en')
    .eq('contacto_id', contactoId)
  // El cursor ya viene revisado (leerCursor): una fecha de la base y un uuid
  if (antes) consulta = consulta.or(`enviado_en.lt."${antes.en}",and(enviado_en.eq."${antes.en}",id.lt.${antes.id})`)
  const { data, error } = await consulta
    .order('enviado_en', { ascending: false })
    .order('id', { ascending: false })
    .limit(POR_HISTORIAL + 1)
  if (error) throw new Error(`crm_mensajes: ${error.message}`)
  const filas = (data ?? []) as Record<string, unknown>[]
  const mensajes = filas.slice(0, POR_HISTORIAL).map(aMensaje)
  const ultimo = filas.length > POR_HISTORIAL ? filas[POR_HISTORIAL - 1] : null
  return { mensajes, siguiente: ultimo ? { en: ultimo.enviado_en as string, id: ultimo.id as string } : null }
}

export async function leerFicha(id: string): Promise<Ficha | null> {
  if (!UUID.test(id)) return null
  const [c, notas, tareas, oportunidades, citas, adjuntos, pipelines, historial] = await Promise.all([
    db()
      .from('crm_contactos')
      .select('id, nombre, apellido, telefono, correo, empresa, etiquetas, campos, fuente, no_molestar, origen, creado_en, ultima_actividad')
      .eq('id', id)
      .maybeSingle(),
    db().from('crm_notas').select('id, texto, autor, fijada, creado_en').eq('contacto_id', id).order('fijada', { ascending: false }).order('creado_en', { ascending: false }),
    db().from('crm_tareas').select('id, titulo, detalle, vence_en, hecha, hecha_en').eq('contacto_id', id).order('hecha').order('vence_en', { ascending: true, nullsFirst: false }),
    db().from('crm_oportunidades').select('id, nombre, valor, estado, pipeline_id, etapa_id, cambio_etapa_en').eq('contacto_id', id).order('creado_en', { ascending: false }),
    db().from('crm_citas').select('id, titulo, inicio, fin, estado, enlace, notas').eq('contacto_id', id).order('inicio', { ascending: false }),
    db().from('crm_adjuntos').select('id, nombre, tipo, tamano, creado_en').eq('contacto_id', id).order('creado_en', { ascending: false }),
    leerPipelines(),
    leerHistorial(id),
  ])
  for (const r of [c, notas, tareas, oportunidades, citas, adjuntos]) if (r.error) throw new Error(`crm (ficha): ${r.error.message}`)
  if (!c.data) return null
  const contacto = c.data as ContactoVista & { campos: Campos }
  return {
    contacto: { ...contacto, etiquetas: contacto.etiquetas ?? [], campos: contacto.campos ?? {} },
    notas: (notas.data ?? []) as NotaVista[],
    tareas: (tareas.data ?? []) as TareaVista[],
    oportunidades: ((oportunidades.data ?? []) as OportunidadVista[]).map((o) => ({ ...o, valor: Number(o.valor) || 0 })),
    pipelines,
    citas: (citas.data ?? []) as CitaVista[],
    adjuntos: (adjuntos.data ?? []) as AdjuntoVista[],
    historial,
  }
}

// Quién tiene ya ese teléfono (o ese WhatsApp) o ese correo. null si nadie (o si es el mismo contacto)
async function quienTiene(telefono: string | null | undefined, correo: string | null | undefined, excepto: string | null): Promise<Falla | null> {
  const condiciones = [
    ...(telefono ? [`and(canal.in.(telefono,whatsapp),valor.eq."${telefono}")`] : []),
    ...(correo ? [`and(canal.eq.correo,valor.eq."${correo.replace(/["\\]/g, '')}")`] : []),
  ]
  if (condiciones.length === 0) return null
  const { data, error } = await db()
    .from('crm_identidades')
    .select(`canal, contacto_id, crm_contactos(${COLUMNAS_MIN})`)
    .or(condiciones.join(','))
  if (error) throw new Error(`crm_identidades: ${error.message}`)
  const otro = ((data ?? []) as unknown as { canal: string; contacto_id: string; crm_contactos: ContactoMin | null }[]).find((x) => x.contacto_id !== excepto)
  if (!otro) return null
  const quien = minimo(otro.crm_contactos)
  const que = otro.canal === 'correo' ? 'Ese correo' : 'Ese número'
  return { error: `${que} ya es de ${quien.nombre}.`, status: 409, otro: quien }
}

async function sincronizarIdentidades(
  contactoId: string,
  antes: Pick<DatosContacto, 'telefono' | 'correo'> | null,
  despues: Partial<Pick<DatosContacto, 'telefono' | 'correo'>>,
) {
  for (const canal of ['telefono', 'correo'] as const) {
    if (!(canal in despues)) continue
    const viejo = antes?.[canal] ?? null
    const nuevo = despues[canal] ?? null
    if (viejo === nuevo) continue
    if (viejo) await db().from('crm_identidades').delete().eq('contacto_id', contactoId).eq('canal', canal).eq('valor', viejo)
    if (nuevo) {
      const { error } = await db()
        .from('crm_identidades')
        .upsert({ contacto_id: contactoId, canal, valor: nuevo }, { onConflict: 'canal,valor', ignoreDuplicates: true })
      if (error) console.error(`[crm] identidad: ${error.message}`)
    }
  }
}

export async function crearContacto(datos: Partial<DatosContacto>): Promise<{ id: string } | Falla> {
  const choque = await quienTiene(datos.telefono, datos.correo, null)
  if (choque) return choque
  const { data, error } = await db()
    .from('crm_contactos')
    .insert({ ...datos, origen: 'panel' }) // ultima_actividad: now() de la base, como las notas y los mensajes
    .select('id')
    .single()
  if (error || !data) return fallo('crear contacto', error ?? { message: 'sin fila' })
  await sincronizarIdentidades(data.id, null, datos)
  return { id: data.id as string }
}

export async function editarContacto(id: string, cambio: Partial<DatosContacto>): Promise<{ ok: true } | Falla> {
  if (!UUID.test(id)) return { error: 'Ese contacto no existe', status: 404 }
  const { data: actual, error: e1 } = await db().from('crm_contactos').select('telefono, correo').eq('id', id).maybeSingle()
  if (e1) return fallo('leer contacto', e1)
  if (!actual) return { error: 'Ese contacto no existe', status: 404 }
  const choque = await quienTiene(
    'telefono' in cambio && cambio.telefono !== actual.telefono ? cambio.telefono : null,
    'correo' in cambio && cambio.correo !== actual.correo ? cambio.correo : null,
    id,
  )
  if (choque) return choque
  const { error } = await db().from('crm_contactos').update({ ...cambio, editado_en: new Date().toISOString() }).eq('id', id)
  if (error) return fallo('editar contacto', error)
  await sincronizarIdentidades(id, actual as Pick<DatosContacto, 'telefono' | 'correo'>, cambio)
  return { ok: true }
}

// Notas y tareas ----------------------------------------------------------------------------------------------------

export async function agregarNota(contactoId: string, texto: string, autor: string | null): Promise<{ ok: true } | Falla> {
  const { error } = await db().from('crm_notas').insert({ contacto_id: contactoId, texto, autor, origen: 'panel' })
  return error ? fallo('agregar nota', error) : { ok: true }
}

export async function agregarTarea(contactoId: string, titulo: string, vence_en: string | null): Promise<{ ok: true } | Falla> {
  const { error } = await db().from('crm_tareas').insert({ contacto_id: contactoId, titulo, vence_en, origen: 'panel' })
  return error ? fallo('agregar tarea', error) : { ok: true }
}

export async function marcarTarea(id: string, hecha: boolean): Promise<{ ok: true } | Falla> {
  if (!UUID.test(id)) return { error: 'Esa tarea no existe', status: 404 }
  const ahora = new Date().toISOString()
  const { data, error } = await db()
    .from('crm_tareas')
    .update({ hecha, hecha_en: hecha ? ahora : null, editado_en: ahora })
    .eq('id', id)
    .select('id')
  if (error) return fallo('marcar tarea', error)
  return data?.length ? { ok: true } : { error: 'Esa tarea no existe', status: 404 }
}

export async function tareasPendientes(): Promise<{ pendientes: TareaVista[]; hechas: TareaVista[] }> {
  const columnas = `id, titulo, detalle, vence_en, hecha, hecha_en, crm_contactos(${COLUMNAS_MIN})`
  const [pendientes, hechas] = await Promise.all([
    todas<Record<string, unknown>>((d, h) =>
      db().from('crm_tareas').select(columnas).eq('hecha', false).order('vence_en', { ascending: true, nullsFirst: false }).order('id').range(d, h),
    ),
    db().from('crm_tareas').select(columnas).eq('hecha', true).order('hecha_en', { ascending: false, nullsFirst: false }).limit(10),
  ])
  if (hechas.error) throw new Error(`crm_tareas: ${hechas.error.message}`)
  const aTarea = (t: Record<string, unknown>): TareaVista => ({
    id: t.id as string,
    titulo: t.titulo as string,
    detalle: (t.detalle as string | null) ?? null,
    vence_en: (t.vence_en as string | null) ?? null,
    hecha: t.hecha as boolean,
    hecha_en: (t.hecha_en as string | null) ?? null,
    contacto: minimo(t.crm_contactos as ContactoMin | null),
  })
  return { pendientes: pendientes.map(aTarea), hechas: ((hechas.data ?? []) as Record<string, unknown>[]).map(aTarea) }
}

// Oportunidades -----------------------------------------------------------------------------------------------------

export async function tablero(pipelineId: string, estado: EstadoOportunidad): Promise<TarjetaVista[]> {
  if (!UUID.test(pipelineId)) return []
  const filas = await todas<Record<string, unknown>>((d, h) =>
    db()
      .from('crm_oportunidades')
      .select(`id, nombre, valor, estado, pipeline_id, etapa_id, cambio_etapa_en, crm_contactos(${COLUMNAS_MIN})`)
      .eq('pipeline_id', pipelineId)
      .eq('estado', estado)
      .order('cambio_etapa_en', { ascending: false, nullsFirst: false })
      .order('id')
      .range(d, h),
  )
  return filas.map((o) => ({
    id: o.id as string,
    nombre: o.nombre as string,
    valor: Number(o.valor) || 0,
    estado: o.estado as EstadoOportunidad,
    pipeline_id: o.pipeline_id as string,
    etapa_id: o.etapa_id as string,
    cambio_etapa_en: (o.cambio_etapa_en as string | null) ?? null,
    contacto: minimo(o.crm_contactos as ContactoMin | null),
  }))
}

// Lo que hace el panel también queda en el historial del contacto, discreto
async function anotarEvento(contactoId: string, texto: string, actividad: string) {
  const { error } = await db().from('crm_mensajes').insert({
    contacto_id: contactoId,
    canal: 'sistema',
    tipo: 'actividad',
    texto,
    meta: { actividad },
    enviado_en: new Date().toISOString(),
    origen: 'panel',
  })
  if (error) console.error(`[crm] evento: ${error.message}`)
}

export async function cambiarOportunidad(id: string, entrada: unknown): Promise<{ ok: true } | Falla> {
  if (!UUID.test(id)) return { error: 'Esa oportunidad no existe', status: 404 }
  const { data: actual, error: e1 } = await db()
    .from('crm_oportunidades')
    .select('id, contacto_id, pipeline_id, etapa_id, estado, valor')
    .eq('id', id)
    .maybeSingle()
  if (e1) return fallo('leer oportunidad', e1)
  if (!actual) return { error: 'Esa oportunidad no existe', status: 404 }
  const { data: etapas, error: e2 } = await db().from('crm_etapas').select('id, nombre').eq('pipeline_id', actual.pipeline_id)
  if (e2) return fallo('leer etapas', e2)
  const v = validarCambioOportunidad(entrada, (etapas ?? []).map((e) => e.id as string))
  if (!v.ok) return { error: v.error, status: 400 }
  const cambio = v.datos
  const ahora = new Date().toISOString()
  const movida = cambio.etapa_id !== undefined && cambio.etapa_id !== actual.etapa_id
  const { error } = await db()
    .from('crm_oportunidades')
    .update({ ...cambio, editado_en: ahora, ...(movida ? { cambio_etapa_en: ahora } : {}) })
    .eq('id', id)
  if (error) return fallo('cambiar oportunidad', error)
  if (movida) {
    const etapa = (etapas ?? []).find((e) => e.id === cambio.etapa_id)
    await anotarEvento(actual.contacto_id, `Oportunidad movida a «${etapa?.nombre ?? 'otra etapa'}»`, 'oportunidad_etapa')
  }
  if (cambio.estado && cambio.estado !== actual.estado) {
    await anotarEvento(actual.contacto_id, `Oportunidad marcada como ${ESTADO_OPORTUNIDAD_LABEL[cambio.estado].toLowerCase()}`, 'oportunidad_estado')
  }
  if (cambio.valor !== undefined && cambio.valor !== Number(actual.valor)) {
    await anotarEvento(actual.contacto_id, `Valor de la oportunidad: ${dinero(cambio.valor)}`, 'oportunidad_valor')
  }
  return { ok: true }
}

export async function crearOportunidad(contactoId: string, entrada: unknown): Promise<{ ok: true } | Falla> {
  const { data: etapas, error: e1 } = await db().from('crm_etapas').select('id, pipeline_id')
  if (e1) return fallo('leer etapas', e1)
  const v = validarNuevaOportunidad(entrada, (etapas ?? []) as { id: string; pipeline_id: string }[])
  if (!v.ok) return { error: v.error, status: 400 }
  const ahora = new Date().toISOString()
  const { error } = await db()
    .from('crm_oportunidades')
    .insert({ ...v.datos, contacto_id: contactoId, estado: 'abierta', origen: 'panel', cambio_etapa_en: ahora })
  if (error) return fallo('crear oportunidad', error)
  await anotarEvento(contactoId, 'Oportunidad creada', 'oportunidad_creada')
  return { ok: true }
}

// Adjuntos ----------------------------------------------------------------------------------------------------------

// Un enlace que dura 5 minutos y baja el archivo con su nombre
export async function enlaceAdjunto(id: string): Promise<string | null> {
  if (!UUID.test(id)) return null
  const { data, error } = await db().from('crm_adjuntos').select('ruta, nombre').eq('id', id).maybeSingle()
  if (error) throw new Error(`crm_adjuntos: ${error.message}`)
  if (!data) return null
  const firmado = await db().storage.from(BUCKET).createSignedUrl(data.ruta as string, 300, { download: data.nombre as string })
  if (firmado.error) throw new Error(`bucket ${BUCKET}: ${firmado.error.message}`)
  return firmado.data.signedUrl
}
