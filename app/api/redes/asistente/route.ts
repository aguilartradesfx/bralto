import { after, NextResponse } from 'next/server'
import { guardarCambio } from '@/lib/calendario/editar'
import { rangoUtc } from '@/lib/calendario/fechas'
import { actualizarFila, leerEntre, leerFila } from '@/lib/calendario/servidor'
import {
  aItem,
  armarAprobar,
  armarFrenar,
  armarHora,
  armarSacarYa,
  elegirPendiente,
  leerPedido,
  mensajeListo,
  secretoValido,
} from '@/lib/redes/asistente'
import { correrCola } from '@/lib/redes/publicacion/servidor'

// El Calendario de redes desde el asistente de Telegram de Alejandro: listar, aprobar, frenar, sacar ya y
// cambiar la hora. Entra con REDES_ASISTENTE_SECRET (lo comparte con el asistente). Las reglas están en
// lib/redes/asistente.ts y son las mismas del panel.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // «sacar ya» corre el publicador en after(), como el cron

const HORA_MS = 3600_000
const responder = (cuerpo: Record<string, unknown>, status = 200) => NextResponse.json(cuerpo, { status })

export async function POST(request: Request) {
  if (!secretoValido(request.headers.get('authorization'), process.env.REDES_ASISTENTE_SECRET)) {
    return responder({ ok: false, error: 'unauthorized' }, 401)
  }
  const ahora = new Date()
  const leido = leerPedido(await request.json().catch(() => null), ahora)
  if (!leido.ok) return responder({ ok: false, error: leido.error }, 400)
  const pedido = leido.pedido

  try {
    if (pedido.accion === 'listar') {
      const { desde, hasta } = rangoUtc(pedido.desde, pedido.hasta)
      const lista = (await leerEntre(desde, hasta)).filter((p) => p.estado !== 'cancelado')
      return responder({ ok: true, desde: pedido.desde, hasta: pedido.hasta, publicaciones: lista.map(aItem) })
    }

    // Sin id («dale», «sácalo ya»): la única pendiente cercana; si hay varias, el asistente pregunta cuál
    let id: string | null = pedido.id
    if (!id) {
      const cerca = await leerEntre(new Date(ahora.getTime() - 3 * HORA_MS).toISOString(), new Date(ahora.getTime() + 24 * HORA_MS).toISOString())
      const elegida = elegirPendiente(cerca, ahora, pedido.accion === 'aprobar' ? ['borrador'] : ['borrador', 'programado'])
      if (!elegida.ok) return responder({ ok: false, error: elegida.error, opciones: elegida.opciones }, elegida.status)
      id = elegida.id
    }

    const fila = await leerFila(id)
    if (!fila) return responder({ ok: false, error: 'No existe esa publicación' }, 404)

    const armado =
      pedido.accion === 'aprobar'
        ? armarAprobar(fila, ahora)
        : pedido.accion === 'frenar'
          ? armarFrenar(fila, ahora)
          : pedido.accion === 'cambiar_hora'
            ? armarHora(fila, pedido.cuando, ahora, pedido.confirmar)
            : armarSacarYa(fila, ahora, pedido.confirmar)
    if (!armado.ok) {
      const { status, ...cuerpo } = armado
      return responder({ ...cuerpo, publicacion: aItem(fila) }, status)
    }

    const guardado = await guardarCambio(fila.id, armado.cambio, actualizarFila)
    if (!guardado.ok) {
      if (guardado.status === 500) console.error('[redes/asistente]', guardado.error)
      return responder({ ok: false, error: guardado.status === 500 ? 'No se pudo guardar. Intenta de nuevo.' : guardado.error }, guardado.status)
    }

    // El publicador toma la que ya tocaba sin esperar al cron de cada 5 minutos
    if (pedido.accion === 'sacar_ya') {
      after(async () => {
        try {
          console.log('[redes/asistente] cola:', JSON.stringify(await correrCola()))
        } catch (err) {
          console.error('[redes/asistente] cola:', err instanceof Error ? err.message : err)
        }
      })
    }

    const despues = { ...fila, ...armado.cambio }
    return responder({ ok: true, mensaje: mensajeListo(pedido.accion, despues), publicacion: aItem(despues) })
  } catch (err) {
    console.error('[redes/asistente]', err instanceof Error ? err.message : err)
    return responder({ ok: false, error: 'Falló la base. Intenta de nuevo en un momento.' }, 500)
  }
}
