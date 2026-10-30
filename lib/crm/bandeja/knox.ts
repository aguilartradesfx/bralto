// Knox con cada mensaje que entra por la bandeja: espera la ráfaga, arma el contexto, decide y, según el modo, deja
// un borrador para Ale (ensayo) o contesta solo (automático). Todo lo de afuera (la base, Zernio, Claude, Telegram)
// llega en `deps`: en las pruebas son falsos (knox.test.ts).
import { ADMIN_ORIGIN } from '../../host-routing.ts'
import { limpiarEtiquetas } from '../validar.ts'
import type { CanalKnox, ContextoKnox, DecisionKnox, MensajeParaKnox, ModoKnox, TipoMensaje } from '../../knox/conversar/tipos.ts'
import { planEnvio } from './envio.ts'
import type { Remitente } from './zernio.ts'

export const ESPERA_MS = 20_000 // la gente escribe en ráfagas: Knox contesta la ráfaga, no cada pedacito
export const MAX_MENSAJES = 20
export const AVISO_CADA_MS = 30 * 60_000 // como mucho un aviso por Telegram por conversación cada 30 min

export interface ConversacionKnox {
  id: string
  canal: CanalKnox
  nombre: string | null
  usuario: string | null
  contactoId: string | null
  pausadoHasta: string | null // 'infinity': Ale lo apagó en esta conversación
  ultimoEntranteEn: string | null
}

export type EstadoDecision = 'pendiente' | 'enviada' | 'descartada' | 'silencio' | 'error'

export interface DecisionNueva {
  conversacionId: string
  mensajeId: string
  modo: 'ensayo' | 'automatico'
  estado: EstadoDecision
  decision: DecisionKnox | null
  respuesta: string | null
  error: string | null
}

// mensajeId: el del CRM (null si salió pero no se pudo guardar)
export type Envio = { ok: true; mensajeId: string | null } | { ok: false; error: string }

export interface DepsKnox {
  ahora(): Date
  esperar(ms: number): Promise<void>
  ajustes(): Promise<{ modo: ModoKnox; ficha: string }>
  esPropia(remitente: Remitente): Promise<boolean>
  conversacion(id: string): Promise<ConversacionKnox | null>
  ultimoEntrante(conversacionId: string): Promise<string | null> // el id del último mensaje de la persona
  mensajes(conversacionId: string, cuantos: number): Promise<MensajeParaKnox[]> // del más viejo al más nuevo
  contacto(contactoId: string): Promise<ContextoKnox['contacto']>
  decidir(ctx: ContextoKnox, ficha: string, ahora: Date): Promise<DecisionKnox>
  guardarDecision(d: DecisionNueva): Promise<string> // descarta las pendientes que había en la conversación
  marcarEnviada(decisionId: string, mensajeId: string | null): Promise<void>
  anotarError(decisionId: string, error: string): Promise<void> // sigue pendiente, con el porqué
  guardarTipo(conversacionId: string, tipo: TipoMensaje): Promise<void>
  crearContacto(conversacionId: string, datos: DecisionKnox['datos']): Promise<string | null>
  agregarEtiquetas(contactoId: string, etiquetas: string[]): Promise<void>
  enviar(conversacionId: string, texto: string): Promise<Envio> // como Knox: lo guarda con autor 'knox'
  reservarAviso(conversacionId: string): Promise<boolean> // false si ya hubo uno hace menos de 30 min
  avisar(texto: string): Promise<void>
}

export interface EntradaKnox {
  conversacionId: string
  mensajeId: string // el mensaje que acaba de entrar (crm_mensajes.id)
  standby: boolean
  interactivo: boolean
  remitente: Remitente
}

export function pausada(hasta: string | null, ahora: Date): boolean {
  if (!hasta) return false
  if (hasta === 'infinity') return true
  const t = Date.parse(hasta)
  return Number.isFinite(t) && t > ahora.getTime()
}

const CANAL: Record<CanalKnox, string> = { instagram: 'Instagram', messenger: 'Messenger', whatsapp: 'WhatsApp' }

export const enlaceConversacion = (id: string) => `${ADMIN_ORIGIN}/crm/mensajes/${id}`

// El aviso por Telegram: quién, qué pasa, la respuesta (borrador o ya mandada) y el enlace a la conversación
export function textoAviso(a: { conv: ConversacionKnox; decision: DecisionKnox; enviada: boolean; error: string | null }): string {
  const quien = a.conv.nombre ?? (a.conv.usuario ? `@${a.conv.usuario}` : 'Alguien')
  const lineas = [`🤖 Knox · ${CANAL[a.conv.canal]} · ${quien}`]
  lineas.push(a.decision.aviso ?? (a.decision.tipo === 'trabajo' ? 'Te escribió por trabajo.' : 'Revisa este mensaje.'))
  if (a.decision.respuesta) lineas.push(a.enviada ? `Ya le contesté: «${a.decision.respuesta}»` : `Te dejé esta respuesta: «${a.decision.respuesta}»`)
  if (a.error) lineas.push(`No la pude mandar: ${a.error}`)
  lineas.push(enlaceConversacion(a.conv.id))
  return lineas.join('\n')
}

const mensajeDe = (err: unknown) => (err instanceof Error ? err.message : String(err)).slice(0, 300)

// Lo que devuelve: qué pasó, en pocas palabras (para el registro y las pruebas)
export async function atenderMensaje(d: DepsKnox, e: EntradaKnox): Promise<string> {
  if ((await d.ajustes()).modo === 'apagado') return 'apagado'
  if (e.standby) return 'otra app tiene el control'
  if (e.interactivo) return 'respuesta de botón'
  if (await d.esPropia(e.remitente)) return 'cuenta propia'
  const antes = await d.conversacion(e.conversacionId)
  if (!antes) return 'sin conversación'
  if (pausada(antes.pausadoHasta, d.ahora())) return 'pausada'

  await d.esperar(ESPERA_MS)
  // Si en la espera entró otro mensaje de la persona, ese se encarga (con toda la ráfaga)
  if ((await d.ultimoEntrante(e.conversacionId)) !== e.mensajeId) return 'otro mensaje se encarga'
  const conv = await d.conversacion(e.conversacionId)
  if (!conv || pausada(conv.pausadoHasta, d.ahora())) return 'pausada'
  const { modo, ficha } = await d.ajustes() // el modo pudo cambiar mientras esperaba
  if (modo === 'apagado') return 'apagado'
  const mensajes = await d.mensajes(conv.id, MAX_MENSAJES)
  if (mensajes.length === 0 || mensajes[mensajes.length - 1].autor !== 'persona') return 'ya le contestaron'

  const ctx: ContextoKnox = {
    canal: conv.canal,
    nombre: conv.nombre,
    usuario: conv.usuario,
    contacto: conv.contactoId ? await d.contacto(conv.contactoId) : null,
    mensajes,
  }
  let decision: DecisionKnox
  try {
    decision = await d.decidir(ctx, ficha, d.ahora())
  } catch (err) {
    // Knox falló: queda anotado y no se manda nada
    await d.guardarDecision({ conversacionId: conv.id, mensajeId: e.mensajeId, modo, estado: 'error', decision: null, respuesta: null, error: mensajeDe(err) })
    return 'error'
  }

  // Claude tarda unos segundos: si mientras tanto escribió otra vez o le contestó Ale, esta decisión ya no sirve
  if ((await d.ultimoEntrante(conv.id)) !== e.mensajeId) return 'otro mensaje se encarga'
  const actual = await d.conversacion(conv.id)
  if (!actual || pausada(actual.pausadoHasta, d.ahora())) return 'pausada'

  await d.guardarTipo(conv.id, decision.tipo)
  let contactoId = conv.contactoId
  if (decision.tipo === 'trabajo' && !contactoId) contactoId = await d.crearContacto(conv.id, decision.datos)
  const etiquetas = limpiarEtiquetas(decision.etiquetas) ?? []
  if (contactoId && etiquetas.length > 0) await d.agregarEtiquetas(contactoId, etiquetas)

  const base = { conversacionId: conv.id, mensajeId: e.mensajeId, modo, decision, error: null }
  if (decision.accion === 'silencio') {
    await d.guardarDecision({ ...base, estado: 'silencio', respuesta: null })
    return 'silencio'
  }

  const respuesta = decision.accion === 'responder' ? decision.respuesta?.trim() || null : null
  const decisionId = await d.guardarDecision({ ...base, estado: 'pendiente', respuesta })
  let enviada = false
  let error: string | null = null
  if (respuesta && modo === 'automatico') {
    const plan = planEnvio(conv.canal, 'knox', actual.ultimoEntranteEn ?? conv.ultimoEntranteEn, d.ahora())
    const r: Envio = plan.ok ? await d.enviar(conv.id, respuesta) : { ok: false, error: plan.error }
    if (r.ok) {
      await d.marcarEnviada(decisionId, r.mensajeId)
      enviada = true
    } else {
      error = r.error
      await d.anotarError(decisionId, r.error)
    }
  }

  // Ensayo: avisa si es de trabajo o si Knox se lo pasa. Automático: si Knox pide avisar, si se lo pasa o si no pudo mandar
  const avisar =
    decision.accion === 'pasar_a_ale' || (modo === 'ensayo' ? decision.tipo === 'trabajo' : !!decision.aviso || !!error)
  if (avisar && (await d.reservarAviso(conv.id))) {
    try {
      await d.avisar(textoAviso({ conv, decision, enviada, error }))
    } catch {
      // el aviso nunca frena lo demás
    }
  }
  if (decision.accion === 'pasar_a_ale') return 'se la pasó a Ale'
  return enviada ? 'contestó' : error ? 'no pudo contestar' : 'borrador'
}
