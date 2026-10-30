import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { armarCambio, guardarCambio } from '@/lib/calendario/editar'
import { actualizarFila, leerFila } from '@/lib/calendario/servidor'

const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status })

// Cambia una publicación desde el Calendario: el texto, la hora, aprobarla o frenarla. Solo administradores.
// La lógica (y por qué cada cambio es condicional) está en lib/calendario/editar.ts
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied

  const fila = await leerFila((await params).id)
  if (!fila) return error('No existe esa publicación', 404)

  const armado = armarCambio(await request.json().catch(() => null), fila, new Date())
  if (!armado.ok) return error(armado.error, armado.status)

  const r = await guardarCambio(fila.id, armado.cambio, actualizarFila)
  if (!r.ok) {
    if (r.status === 500) {
      console.error('[calendario]', r.error)
      return error('No se pudo guardar. Probá de nuevo.', 500)
    }
    return error(r.error, r.status)
  }
  return NextResponse.json({ ok: true })
}
