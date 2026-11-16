import { NextResponse, after } from 'next/server'
import { despertar, moverAtrasadas } from '@/lib/oficina/despertar'
import { estadoOficina, ponerDormida } from '@/lib/oficina/servidor'
import { requireApiPermission } from '@/lib/panel-session'

// El interruptor de dormir de la Oficina. Al despertar se mueve lo atrasado ANTES de cambiar el estado y lo demás
// corre después de responder. Solo administradores
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function POST(request: Request) {
  const { user, denied } = await requireApiPermission('is_admin')
  if (denied) return denied

  let dormida: unknown
  try {
    dormida = ((await request.json()) as { dormida?: unknown } | null)?.dormida
  } catch {
    dormida = undefined
  }
  if (typeof dormida !== 'boolean') {
    return NextResponse.json({ error: 'Falta decir si la oficina se duerme o se despierta.' }, { status: 400 })
  }

  const u = user as { email?: string | null; id: string }
  const por = u.email || u.id

  try {
    const antes = await estadoOficina()
    if (antes.dormida === dormida) return NextResponse.json(antes)

    if (dormida) return NextResponse.json(await ponerDormida(true, por))

    const ahora = new Date()
    const desde = new Date(antes.desde ?? ahora)
    try {
      await moverAtrasadas(desde, ahora)
    } catch (err) {
      console.error('[oficina] mover atrasadas:', err instanceof Error ? err.message : err)
      return NextResponse.json({ error: 'No se pudo despertar la oficina. Prueba de nuevo en un rato.' }, { status: 500 })
    }
    const estado = await ponerDormida(false, por)
    const origen = new URL(request.url).origin
    after(async () => {
      console.info('[oficina] despertar:', await despertar(desde, ahora, origen))
    })
    return NextResponse.json(estado)
  } catch (err) {
    console.error('[oficina] dormir:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudo cambiar el estado de la oficina. Prueba de nuevo en un rato.' }, { status: 500 })
  }
}
