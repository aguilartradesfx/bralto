import type { Metadata } from 'next'
import { finalizeDiagnosticCheckout } from '@/lib/diagnostic/server'
import { parseSlotKey } from '@/lib/ghl/bookings'
import ConfirmacionView, { type ConfirmationState } from './_view'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ session_id?: string }>
}

// Página transaccional: fuera del índice
export async function generateMetadata({ params }: Pick<Props, 'params'>): Promise<Metadata> {
  const locale = (await params).locale === 'en' ? 'en' : 'es'
  return { title: locale === 'en' ? 'Confirmation' : 'Confirmación', robots: { index: false, follow: false } }
}

// Stripe vuelve aquí con ?session_id=… después del pago: se verifica el cobro y se
// confirma la cita (idempotente; el webhook hace lo mismo como respaldo).
export default async function ConfirmacionPage({ params, searchParams }: Props) {
  const locale = (await params).locale === 'en' ? 'en' : 'es'
  const { session_id: sessionId } = await searchParams

  let state: ConfirmationState = 'none'
  let when: string | null = null

  if (sessionId) {
    try {
      const result = await finalizeDiagnosticCheckout(sessionId)
      state = result.status
      if ('booking' in result) {
        when = new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'es-CR', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'America/Costa_Rica',
        }).format(new Date(parseSlotKey(result.booking.slot)))
      }
    } catch (err) {
      console.error('[confirmacion] no se pudo verificar el pago:', err)
      state = 'error'
    }
  }

  return <ConfirmacionView locale={locale} state={state} when={when} />
}
