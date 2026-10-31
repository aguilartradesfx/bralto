import { NextResponse } from 'next/server'
import { reintentarCitas } from '@/lib/agenda/servidor'
import { reconcilePendingOrders } from '@/lib/diagnostic/server'

// Barrido de conciliación de pagos (Vercel Cron). El webhook acelera; esto garantiza:
// toda orden pendiente hace más de 2 minutos se confirma o se vence contra el API.
// Después, las citas pagadas que Google no dejó crear se reintentan (lib/agenda).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const summary = await reconcilePendingOrders({ limit: 50 })
  console.log('[reconcile]', JSON.stringify(summary))
  const citas = await reintentarCitas().catch((err) => {
    console.error('[reconcile] el reintento de citas falló:', err)
    return { revisadas: 0, resultados: {}, error: err instanceof Error ? err.message : String(err) }
  })
  if (citas.revisadas) console.log('[reconcile] citas', JSON.stringify(citas))
  return NextResponse.json({ ...summary, citas })
}
