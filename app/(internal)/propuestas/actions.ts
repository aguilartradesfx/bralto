'use server'

import { nanoid } from 'nanoid'
import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { borrarPdf, borrarPdfsDe } from '@/lib/proposals/archivos'
import { esEstado, esUuid, venceAlFinalDe, type EstadoPropuesta } from '@/lib/proposals/archivos-reglas'

type Respuesta = { ok: true } | { ok: false; error: string }

async function exigirPermiso() {
  const { user, profile } = await getCurrentSession()
  if (!user || !hasPermission(profile, 'can_view_proposals')) throw new Error('Sin permisos')
  return { user, profile }
}

const texto = (x: unknown, max: number) => (typeof x === 'string' ? x.trim().slice(0, max) : '')

export async function deleteProposal(slug: string) {
  await exigirPermiso()

  const service = createServiceClient()
  const { data } = await service.from('generated_proposals').select('id').eq('slug', slug).maybeSingle()
  if (data) await borrarPdfsDe(data.id as string)
  await service.from('generated_proposals').delete().eq('slug', slug)
  // Si venía de una solicitud, la solicitud deja de apuntar a la página borrada
  await service
    .from('proposal_requests')
    .update({ generated_url: null, generated_at: null, updated_at: new Date().toISOString() })
    .like('generated_url', `%/propuestas/${slug}`)

  revalidatePath('/propuestas')
}

export type CambiosPropuesta = {
  status?: EstadoPropuesta
  amount?: string
  sentTo?: string
  // 'YYYY-MM-DD' (sirve hasta el final de ese día en Costa Rica) o 'ya' para vencerla ahora
  vence?: string
}

export async function actualizarPropuesta(id: string, cambios: CambiosPropuesta): Promise<Respuesta> {
  await exigirPermiso()
  if (!esUuid(id)) return { ok: false, error: 'Esa propuesta ya no existe.' }

  const fila: Record<string, string | null> = {}
  if (cambios.status !== undefined) {
    if (!esEstado(cambios.status)) return { ok: false, error: 'Ese estado no existe.' }
    fila.status = cambios.status
  }
  if (cambios.amount !== undefined) fila.amount = texto(cambios.amount, 120) || null
  if (cambios.sentTo !== undefined) fila.sent_to = texto(cambios.sentTo, 200) || null
  if (cambios.vence !== undefined) {
    const expira = cambios.vence === 'ya' ? new Date().toISOString() : venceAlFinalDe(cambios.vence)
    if (!expira) return { ok: false, error: 'Esa fecha no existe.' }
    fila.expires_at = expira
  }
  if (!Object.keys(fila).length) return { ok: true }

  const { error } = await createServiceClient().from('generated_proposals').update(fila).eq('id', id)
  if (error) {
    console.error('[propuestas] actualizar', error.message)
    return { ok: false, error: 'No se pudo guardar. Prueba de nuevo.' }
  }
  revalidatePath('/propuestas')
  return { ok: true }
}

export type NuevaPropuesta = { cliente: string; proyecto: string; monto?: string; enviadaA?: string; estado: EstadoPropuesta; vence: string }

// Una propuesta hecha a mano (deck o PDF): se crea sin página y después se le suben los PDF
export async function crearPropuestaPdf(p: NuevaPropuesta): Promise<({ ok: true; id: string; slug: string }) | { ok: false; error: string }> {
  const { user, profile } = await exigirPermiso()
  const cliente = texto(p.cliente, 120)
  const proyecto = texto(p.proyecto, 200) || cliente
  if (!cliente) return { ok: false, error: 'Falta el cliente.' }
  if (!esEstado(p.estado)) return { ok: false, error: 'Ese estado no existe.' }
  const expira = venceAlFinalDe(p.vence)
  if (!expira) return { ok: false, error: 'Esa fecha de vencimiento no existe.' }

  const slug = nanoid(12)
  const { data, error } = await createServiceClient()
    .from('generated_proposals')
    .insert({
      slug,
      client_name: cliente,
      project_name: proyecto,
      html_content: null,
      expires_at: expira,
      created_by: profile?.full_name || user.email || 'Panel',
      status: p.estado,
      amount: texto(p.monto, 120) || null,
      sent_to: texto(p.enviadaA, 200) || null,
    })
    .select('id')
    .single()
  if (error || !data) {
    console.error('[propuestas] crear', error?.message)
    return { ok: false, error: 'No se pudo crear la propuesta. Prueba de nuevo.' }
  }
  revalidatePath('/propuestas')
  return { ok: true, id: data.id as string, slug }
}

export async function borrarArchivo(archivoId: string): Promise<Respuesta> {
  await exigirPermiso()
  try {
    await borrarPdf(archivoId)
  } catch (err) {
    console.error('[propuestas] borrar pdf', err instanceof Error ? err.message : err)
    return { ok: false, error: 'No se pudo borrar el PDF. Prueba de nuevo.' }
  }
  revalidatePath('/propuestas')
  return { ok: true }
}
