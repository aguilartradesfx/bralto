'use client'

import { useEffect, useRef, useState } from 'react'
import { Arrow } from '@/components/home/icons'
import { cardBrand, formatExpiry, maskCardNumber, type CardBrand, type CardSlot } from '@/lib/payments/card-display'
import { canCharge, readInitEnvironment } from '@/lib/payments/environment'
import type { ClientCheckout, PaymentEnvironment, TilopayInitParams } from '@/lib/payments/types'
import { cn } from '@/lib/utils'
import { CardPreview } from './card-preview'
import type { PaymentLabels, PaymentSummary } from './payment-form'

// Formulario de tarjeta con el SDK v2 de Tilopay. Trampas comprobadas con la cuenta real:
// - el contenedor DEBE tener la clase .payFormTilopay (el SDK hace querySelector de ella);
// - los campos tienen que existir en el DOM ANTES de Init(): se renderizan siempre y se
//   habilitan después (el SDK cifra la tarjeta en cada tecla desde Init en adelante);
// - Init() devuelve environment "PROD" | "TEST": si no es el que espera el sitio, no se cobra;
// - el 3DS lo monta el SDK en #responseTilopay, que va FUERA del formulario.
// Al lado va una tarjeta que refleja lo que se escribe: los campos siguen sin controlar (el SDK los
// lee tal cual) y del número solo se guarda en memoria la versión con puntos, no el número.
const SDK_URL = 'https://app.tilopay.com/sdk/v2/sdk_tpay.min.js'

type Method = { id: string; name: string; type: string }
type InitResult = { message?: string; environment?: string; test?: number | string; methods?: Method[] }
type TilopaySdk = {
  Init: (params: TilopayInitParams) => Promise<InitResult>
  startPayment: () => Promise<{ message?: string } | undefined>
}

declare global {
  interface Window {
    Tilopay?: TilopaySdk
  }
}

let sdkLoading: Promise<TilopaySdk> | null = null

function loadSdk(): Promise<TilopaySdk> {
  if (window.Tilopay) return Promise.resolve(window.Tilopay)
  sdkLoading ??= new Promise<TilopaySdk>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = SDK_URL
    script.async = true
    script.onload = () => (window.Tilopay ? resolve(window.Tilopay) : reject(new Error('El SDK no expuso Tilopay')))
    script.onerror = () => {
      sdkLoading = null
      script.remove()
      reject(new Error('No cargó el SDK de Tilopay'))
    }
    document.head.appendChild(script)
  })
  return sdkLoading
}

type Status =
  | { kind: 'loading' }
  | { kind: 'ready' }
  | { kind: 'paying' }
  | { kind: 'blocked'; actual: PaymentEnvironment }
  | { kind: 'error'; message: string; canRetry: boolean }

type Props = {
  checkout: Extract<ClientCheckout, { provider: 'tilopay' }>
  labels: PaymentLabels
  summary: PaymentSummary
  onBack: () => void
}

export function TilopayForm({ checkout, labels, summary, onBack }: Props) {
  const [status, setStatus] = useState<Status>({ kind: 'loading' })
  const [slots, setSlots] = useState<CardSlot[][]>(() => maskCardNumber(''))
  const [brand, setBrand] = useState<CardBrand | null>(null)
  const [expiry, setExpiry] = useState('')
  const [cvvLength, setCvvLength] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const holder = `${checkout.params.billToFirstName} ${checkout.params.billToLastName}`.trim()
  const [environment, setEnvironment] = useState<PaymentEnvironment | null>(null)
  const [methods, setMethods] = useState<Method[]>([])
  const [methodId, setMethodId] = useState('')

  // Init una sola vez por orden (en desarrollo React monta dos veces los efectos)
  const initFor = useRef<string | null>(null)
  const mounted = useRef(false)
  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  useEffect(() => {
    const orderNumber = checkout.params.orderNumber
    if (initFor.current === orderNumber) return
    initFor.current = orderNumber
    ;(async () => {
      try {
        const sdk = await loadSdk()
        const res = await sdk.Init(checkout.params)
        if (!mounted.current) return
        if (!res || res.message !== 'Success') {
          console.error('[tilopay] Init falló:', res?.message)
          setStatus({ kind: 'error', message: labels.loadError, canRetry: false })
          return
        }
        const actual = readInitEnvironment(res)
        setEnvironment(actual)
        if (!canCharge(actual, checkout.expectedEnvironment)) {
          // Falla ruidosamente: mismo host para pruebas y producción
          console.error(`[tilopay] COBRO BLOQUEADO: la cuenta está en ${actual} y este sitio espera ${checkout.expectedEnvironment}`)
          setStatus({ kind: 'blocked', actual })
          return
        }
        const cards = (res.methods ?? []).filter((m) => m.type === 'card')
        if (cards.length === 0) {
          console.error('[tilopay] Init no devolvió métodos de tarjeta:', res.methods)
          setStatus({ kind: 'error', message: labels.loadError, canRetry: false })
          return
        }
        setMethods(cards)
        setMethodId(cards[0].id)
        setStatus({ kind: 'ready' })
      } catch (err) {
        console.error('[tilopay] no se pudo iniciar el pago:', err)
        if (mounted.current) setStatus({ kind: 'error', message: labels.loadError, canRetry: false })
      }
    })()
  }, [checkout, labels.loadError])

  async function pay() {
    setStatus({ kind: 'paying' })
    try {
      const sdk = await loadSdk()
      // Si sale bien, el SDK navega a la URL de retorno (directo o después del 3DS)
      const res = await sdk.startPayment()
      if (res?.message && mounted.current) setStatus({ kind: 'error', message: res.message, canRetry: true })
    } catch (err) {
      console.error('[tilopay] startPayment falló:', err)
      if (mounted.current) setStatus({ kind: 'error', message: labels.loadError, canRetry: true })
    }
  }

  const fieldsEnabled = status.kind === 'ready' || (status.kind === 'error' && status.canRetry)
  const canPay = fieldsEnabled

  return (
    <div className="bk-pay">
      <aside className="bk-pay__side" data-card-area>
        <div className="bk-pay__summary">
          <p className="bk-pay__what">{summary.title}</p>
          <p className="bk-pay__price">{summary.price}</p>
        </div>
        <CardPreview
          slots={slots}
          brand={brand}
          expiry={expiry}
          cvvLength={cvvLength}
          name={holder}
          flipped={flipped}
          labels={{ holder: labels.cardHolder, expires: labels.cardExpires, expiryPlaceholder: labels.cardExpiryPlaceholder, cvv: labels.cardCvv }}
        />
        <p className="bk-pay__note">{summary.note}</p>
      </aside>

      <div className="bk-pay__main">
        <h2 id="bk-step-title" className="bk-h2">
          {summary.heading}
        </h2>
        <div className="payFormTilopay bk-pay__form">
          {/* Método de pago (solo tarjeta) y tarjetas guardadas: el SDK los lee, el cliente no los ve */}
          <select
            id="tlpy_payment_method"
            name="tlpy_payment_method"
            className="bk-pay__hidden"
            aria-hidden="true"
            tabIndex={-1}
            value={methodId}
            onChange={(e) => setMethodId(e.target.value)}
          >
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
          <select id="tlpy_saved_cards" name="tlpy_saved_cards" className="bk-pay__hidden" aria-hidden="true" tabIndex={-1} />

          <div className="bk-field">
            <label htmlFor="tlpy_cc_number">{labels.cardNumber}</label>
            <input
              id="tlpy_cc_number"
              name="tlpy_cc_number"
              className="bk-input"
              type="text"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              disabled={!fieldsEnabled}
              onInput={(e) => {
                const value = e.currentTarget.value
                setSlots(maskCardNumber(value))
                setBrand(cardBrand(value))
              }}
            />
          </div>
          <div className="bk-row">
            <div className="bk-field">
              <label htmlFor="tlpy_cc_expiration_date">{labels.cardExpiry}</label>
              <input
                id="tlpy_cc_expiration_date"
                name="tlpy_cc_expiration_date"
                className="bk-input"
                type="text"
                inputMode="numeric"
                autoComplete="cc-exp"
                placeholder={labels.cardExpiryPlaceholder}
                disabled={!fieldsEnabled}
                onInput={(e) => setExpiry(formatExpiry(e.currentTarget.value))}
              />
            </div>
            <div className="bk-field">
              <label htmlFor="tlpy_cvv">{labels.cardCvv}</label>
              <input
                id="tlpy_cvv"
                name="tlpy_cvv"
                className="bk-input"
                type="text"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="123"
                disabled={!fieldsEnabled}
                onInput={(e) => setCvvLength(e.currentTarget.value.replace(/\D/g, '').length)}
                onFocus={() => setFlipped(true)}
                onBlur={() => setFlipped(false)}
              />
            </div>
          </div>
        </div>

        {status.kind === 'loading' && <p className="bk-pay__status">{labels.loading}</p>}
        {environment === 'TEST' && status.kind !== 'blocked' && <p className="bk-pay__test">{labels.testMode}</p>}
        {status.kind === 'blocked' && (
          <div className="bk-errors" role="alert">
            <p>{labels.blocked(status.actual, checkout.expectedEnvironment)}</p>
          </div>
        )}
        {status.kind === 'error' && (
          <div className="bk-errors" role="alert">
            <p>{status.message}</p>
          </div>
        )}

        {/* El SDK monta aquí el 3DS: fuera del formulario */}
        <div id="responseTilopay" className="bk-pay__3ds" />

        <div className="bk-nav">
          <button type="button" onClick={onBack} disabled={status.kind === 'paying'} className="hm-btn hm-btn--glass hm-glass">
            <Arrow />
            {labels.back}
          </button>
          <button type="button" onClick={pay} disabled={!canPay} className={cn('hm-btn hm-btn--solid', status.kind === 'paying' && 'is-busy')}>
            {status.kind === 'paying' ? labels.paying : labels.pay}
            {status.kind !== 'paying' && <Arrow />}
          </button>
        </div>
        <p className="bk-pay__secure">{labels.secureNote}</p>
      </div>
    </div>
  )
}
