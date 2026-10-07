import { NextResponse, after } from 'next/server'
import { finalizeDiagnosticOrder } from '@/lib/diagnostic/server'
import { paymentGateway } from '@/lib/payments'

// Webhook de Tilopay. La firma (orderHash) no tiene algoritmo público, así que el payload
// es solo un aviso: se responde 200 de inmediato (en compras hay UN solo intento) y la
// orden se confirma aparte contra POST /api/v1/consult. Nada irreversible sale del cuerpo.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function parseBody(raw: string): unknown {
  try {
    return JSON.parse(raw)
  } catch {
    return Object.fromEntries(new URLSearchParams(raw))
  }
}

function handle(payload: unknown) {
  const orderNumber = paymentGateway.orderFromWebhook(payload)
  after(async () => {
    if (!orderNumber) {
      // Sin el formato oficial (se pide a Tilopay) se registran solo las claves, no los valores
      const keys = payload && typeof payload === 'object' ? Object.keys(payload) : []
      console.warn('[tilopay webhook] sin número de orden reconocible; claves:', keys.join(', '))
      return
    }
    try {
      const result = await finalizeDiagnosticOrder(orderNumber)
      console.log(`[tilopay webhook] ${orderNumber}: ${result.status}`)
    } catch (err) {
      // El barrido de conciliación lo vuelve a intentar
      console.error(`[tilopay webhook] ${orderNumber} falló:`, err)
    }
  })
  return NextResponse.json({ received: true })
}

export async function POST(req: Request) {
  return handle(parseBody(await req.text()))
}

// Por si la cuenta lo configura como callback GET
export async function GET(req: Request) {
  return handle(Object.fromEntries(new URL(req.url).searchParams))
}
