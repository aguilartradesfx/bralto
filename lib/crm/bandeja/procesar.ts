// Qué se hace con cada webhook de Zernio: guardar el mensaje (una sola vez), pausar a Knox si contestó Ale desde la
// app, poner al día la entrega y, si entró un mensaje de la persona, pasárselo a Knox. La base llega en `almacen`
// (en las pruebas, uno en memoria: procesar.test.ts).
import type { AutorMensaje, CanalKnox } from '../../knox/conversar/tipos.ts'
import type { EntradaKnox } from './knox.ts'
import type { DatosConversacion, DatosMensaje, EventoLeido } from './zernio.ts'

export const PAUSA_ALE_MS = 12 * 3600_000 // si Ale contesta, Knox no se mete en esa conversación por 12 horas

export interface ConversacionGuardada {
  id: string
  contactoId: string | null
  canal: CanalKnox
  nueva?: boolean // se acaba de crear: no estaba en la carga inicial (o es de alguien nuevo)
}

export interface AlmacenBandeja {
  conversacion(d: DatosConversacion): Promise<ConversacionGuardada> // la busca o la crea, y la asocia a un contacto si puede
  guardarMensaje(conv: ConversacionGuardada, m: DatosMensaje, autor: AutorMensaje): Promise<string | null> // null: ya estaba
  pausarKnox(conversacionId: string, hasta: Date): Promise<void> // nunca acorta una pausa más larga
  descartarPendientes(conversacionId: string): Promise<void>
  marcarLeida(conversacionId: string, en: string): Promise<void>
  otraApp(conversacionId: string, en: string | null): Promise<void>
  estadoMensaje(externoId: string, estado: 'entregado' | 'leido' | 'fallo', error: string | null): Promise<boolean>
  // Una conversación vieja que vuelve a moverse llega sin lo de antes: trae sus últimos mensajes de Zernio para que
  // Knox sepa con quién habla. Solo los anteriores a `antesDe`: los que siguen llegan con su propio webhook (y Knox
  // los tiene que ver entrar)
  historial?(conv: ConversacionGuardada, d: DatosConversacion, antesDe: string): Promise<void>
}

export async function procesarEvento(
  ev: EventoLeido,
  almacen: AlmacenBandeja,
  knox: ((e: EntradaKnox) => Promise<string>) | null,
): Promise<string> {
  if (ev.tipo === 'prueba') return 'prueba'
  if (ev.tipo === 'otro') return `sin uso: ${ev.evento}`
  if (ev.tipo === 'estado') {
    return (await almacen.estadoMensaje(ev.externoId, ev.estado, ev.error)) ? `estado: ${ev.estado}` : 'estado de un mensaje que no está'
  }

  const conv = await almacen.conversacion(ev.conversacion)
  // Lo que salió por la API sin estar guardado no lo mandó el panel (el panel lo guarda al mandarlo)
  const autor: AutorMensaje = ev.mensaje.autoria === 'api' ? 'automatizacion' : ev.mensaje.autoria
  const id = await almacen.guardarMensaje(conv, ev.mensaje, autor)
  if (!id) return 'ya estaba'
  // Después de guardar el mensaje (si no, el historial lo traería y parecería repetido)
  if (conv.nueva && almacen.historial) await almacen.historial(conv, ev.conversacion, ev.mensaje.enviadoEn)

  if (ev.evento === 'message.received') {
    await almacen.otraApp(conv.id, ev.standby ? ev.mensaje.enviadoEn : null)
    if (!knox) return 'guardado'
    return `guardado; knox: ${await knox({ conversacionId: conv.id, mensajeId: id, standby: ev.standby, interactivo: ev.interactivo, remitente: ev.remitente })}`
  }

  // Ale contestó desde la app (o desde Zernio): Knox se aparta 12 horas y su borrador ya no hace falta
  if (autor === 'ale') {
    await almacen.pausarKnox(conv.id, new Date(Date.parse(ev.mensaje.enviadoEn) + PAUSA_ALE_MS))
    await almacen.descartarPendientes(conv.id)
    await almacen.marcarLeida(conv.id, ev.mensaje.enviadoEn)
    return 'guardado; contestó Ale: Knox en pausa'
  }
  return 'guardado'
}
