import type { Metadata } from 'next'
import ConfirmacionView from './_view'

type Props = { params: Promise<{ locale: string }> }

// Página transaccional: fuera del índice
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const locale = (await params).locale === 'en' ? 'en' : 'es'
  return { title: locale === 'en' ? 'Confirmation' : 'Confirmación', robots: { index: false, follow: false } }
}

// Sin número de orden no hay pago que confirmar: los pagos vuelven a /confirmacion/<orden>.
// (El retorno de Stripe con ?session_id= quedó desconectado junto con Stripe.)
export default async function ConfirmacionPage({ params }: Props) {
  const locale = (await params).locale === 'en' ? 'en' : 'es'
  return <ConfirmacionView locale={locale} state="invalid" when={null} />
}
