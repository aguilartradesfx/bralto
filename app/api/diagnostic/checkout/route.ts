import { NextResponse } from 'next/server'
import { parseDiagnosticRequest } from '@/lib/diagnostic/diagnostic'
import { holdSlotForCheckout, startDiagnosticCheckout } from '@/lib/diagnostic/server'
import { TilopayConfigError } from '@/lib/payments/tilopay'

// Diagnóstico de $97: retiene el horario mientras dura el pago, guarda la orden y devuelve
// lo que el navegador necesita para el formulario de la pasarela (token del SDK, nunca
// credenciales). La cita se confirma después, contra el API (retorno, webhook o barrido).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function resolveOrigin(req: Request): string {
  const origin = req.headers.get('origin')
  if (origin) return origin.replace(/\/$/, '')
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL
  if (envOrigin) return envOrigin.replace(/\/$/, '')
  return 'https://www.bralto.io'
}

export async function POST(req: Request) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 })
  }

  const parsed = parseDiagnosticRequest(body)
  if (!parsed.ok) {
    return NextResponse.json({ error: 'invalid', fields: parsed.error }, { status: 400 })
  }

  const hold = await holdSlotForCheckout(parsed.data.slot, parsed.data.sessionId)
  if (!hold.ok) {
    return NextResponse.json({ error: hold.reason }, { status: 409 })
  }

  try {
    return NextResponse.json(await startDiagnosticCheckout(parsed.data, resolveOrigin(req)))
  } catch (err) {
    if (err instanceof TilopayConfigError) {
      console.error('[diagnostic checkout] config error:', err.message)
      return NextResponse.json({ error: 'not_configured' }, { status: 500 })
    }
    console.error('[diagnostic checkout] no se pudo abrir el pago:', err)
    return NextResponse.json({ error: 'gateway' }, { status: 502 })
  }
}
