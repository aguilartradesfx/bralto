import { NextResponse, after } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { agregarEnlaces, procesarCola } from '@/lib/ideas/servidor'

// «Ideas»: guarda los enlaces pegados y los empieza a analizar ya (lo que no alcance lo toma el cron)
export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_TEXTO = 20_000

export async function POST(request: Request) {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied

  const body = (await request.json().catch(() => null)) as { texto?: unknown } | null
  const texto = typeof body?.texto === 'string' ? body.texto.slice(0, MAX_TEXTO) : ''
  if (!texto.trim()) return NextResponse.json({ error: 'Pega al menos un enlace' }, { status: 400 })

  try {
    const r = await agregarEnlaces(texto)
    if (r.ids.length) {
      after(async () => {
        try {
          console.log('[ideas]', JSON.stringify(await procesarCola({ limite: 6, ids: r.ids })))
        } catch (err) {
          console.error('[ideas]', err instanceof Error ? err.message : err)
        }
      })
    }
    return NextResponse.json({ nuevas: r.nuevas, repetidas: r.repetidas, noValidos: r.noValidos, deMas: r.deMas })
  } catch (err) {
    console.error('[ideas]', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'No se pudieron guardar. Prueba de nuevo.' }, { status: 500 })
  }
}
