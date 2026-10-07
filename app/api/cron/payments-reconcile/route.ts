import { NextResponse } from 'next/server'
import { reconcilePendingOrders } from '@/lib/diagnostic/server'

// Barrido de conciliación de pagos (Vercel Cron). El webhook acelera; esto garantiza:
// toda orden pendiente hace más de 2 minutos se confirma o se vence contra el API.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }
  const summary = await reconcilePendingOrders({ limit: 50 })
  console.log('[reconcile]', JSON.stringify(summary))
  return NextResponse.json(summary)
}
