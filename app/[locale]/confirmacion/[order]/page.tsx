import type { Metadata } from 'next'
import { finalizeDiagnosticOrder } from '@/lib/diagnostic/server'
import type { OrderResult } from '@/lib/diagnostic/diagnostic'
import { parseSlotKey } from '@/lib/ghl/bookings'
import ConfirmacionView, { type ConfirmationState } from '../_view'

type Props = {
  params: Promise<{ locale: string; order: string }>
  searchParams: Promise<{ code?: string }>
}

// Página transaccional: fuera del índice
export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const locale = (await params).locale === 'en' ? 'en' : 'es'
  return { title: locale === 'en' ? 'Confirmation' : 'Confirmación', robots: { index: false, follow: false } }
}

const STATE: Record<OrderResult['status'], ConfirmationState> = {
  confirmed: 'confirmed',
  already: 'already',
  conflict: 'conflict',
  unpaid: 'unpaid',
  invalid: 'invalid',
  // Pago en otro modo o por otro monto: no se agenda y lo revisa el equipo
  mismatch: 'error',
  error: 'error',
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// Tilopay vuelve aquí al terminar (con ?code=… agregado). El resultado del query no se cree:
// la orden se confirma contra el API. Si dice "aprobada" pero el API todavía no la muestra,
// se reintenta unos segundos antes de decidir; si sigue sin aparecer, el webhook o el
// barrido la confirman y la persona recibe el correo.
export default async function ConfirmacionOrdenPage({ params, searchParams }: Props) {
  const { locale: raw, order } = await params
  const locale = raw === 'en' ? 'en' : 'es'
  const { code } = await searchParams

  let state: ConfirmationState = 'error'
  let when: string | null = null

  try {
    let result = await finalizeDiagnosticOrder(order)
    for (let i = 0; code === '1' && result.status === 'unpaid' && i < 3; i++) {
      await wait(1500)
      result = await finalizeDiagnosticOrder(order)
    }
    state = code === '1' && result.status === 'unpaid' ? 'error' : STATE[result.status]
    if ('booking' in result) {
      when = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CR', {
        dateStyle: 'full',
        timeStyle: 'short',
        timeZone: 'America/Costa_Rica',
      }).format(new Date(parseSlotKey(result.booking.slot)))
    }
  } catch (err) {
    console.error('[confirmacion] no se pudo verificar el pago:', err)
  }

  return <ConfirmacionView locale={locale} state={state} when={when} />
}
