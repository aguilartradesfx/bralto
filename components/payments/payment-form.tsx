'use client'

import type { ClientCheckout, PaymentEnvironment } from '@/lib/payments/types'
import { TilopayForm } from './tilopay-form'

export type PaymentLabels = {
  cardNumber: string
  cardExpiry: string
  cardExpiryPlaceholder: string
  cardCvv: string
  /** Etiquetas cortas de la tarjeta que acompaña al formulario */
  cardHolder: string
  cardExpires: string
  pay: string
  paying: string
  loading: string
  back: string
  /** Aviso visible mientras la cuenta está en modo de pruebas */
  testMode: string
  /** El modo real no es el que espera este sitio: el cobro queda bloqueado */
  blocked: (actual: PaymentEnvironment, expected: PaymentEnvironment) => string
  loadError: string
  secureNote: string
}

/** Lo que se cobra, para el lado oscuro del paso de pago; heading va con id="bk-step-title" */
export type PaymentSummary = { heading: string; title: string; price: string; note: string }

type Props = { checkout: ClientCheckout; labels: PaymentLabels; summary: PaymentSummary; onBack: () => void }

// Formulario de la pasarela activa. Otra pasarela = otro componente con estas mismas props.
export function PaymentForm({ checkout, labels, summary, onBack }: Props) {
  switch (checkout.provider) {
    case 'tilopay':
      return <TilopayForm checkout={checkout} labels={labels} summary={summary} onBack={onBack} />
  }
}
