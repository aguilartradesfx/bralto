'use client'

import { useState } from 'react'
import { Arrow } from '@/components/home/icons'
import { formatMoney, parseAmount } from '@/lib/payments/amount'
import './payment-info.css'

// Link de pago abierto de Tilopay (lo genera su portal): el cliente escribe el monto acordado
const TILOPAY_OPEN_LINK = 'https://tp.cr/s/MzY0Mzg2'

// Tipo de cambio de referencia para el convertidor (se actualiza a mano; el banco aplica el suyo)
const RATE = 550
const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500]

const HOLDER = 'JOSE ALEJANDRO AGUILAR MADRIGAL'
const ACCOUNTS = [
  { title: 'Cuenta en dólares', bac: '966869398', iban: 'CR96010200009668693984' },
  { title: 'Cuenta en colones', bac: '938979937', iban: 'CR43010200009389799374' },
]

function Field({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  return (
    <div className="pi-field">
      <div className="pi-field__text">
        <p className="pi-field__label">{label}</p>
        <p className={mono ? 'pi-field__value pi-mono' : 'pi-field__value'}>{value}</p>
      </div>
      <button type="button" className="pi-copy" onClick={copy} aria-label={`Copiar ${label}`}>
        {copied ? 'Copiado' : 'Copiar'}
      </button>
      <span className="sr-only" aria-live="polite">
        {copied ? `${label} copiado` : ''}
      </span>
    </div>
  )
}

export default function PaymentInfoPage() {
  const [amount, setAmount] = useState('')
  const [from, setFrom] = useState<'USD' | 'CRC'>('USD')
  const to = from === 'USD' ? 'CRC' : 'USD'

  const value = parseAmount(amount)
  const converted = from === 'USD' ? value * RATE : value / RATE

  function swap() {
    setFrom(to)
    setAmount('')
  }

  return (
    <main data-focus-page>
      <section className="hm-hero hm-hero--page" aria-labelledby="pi-title">
        <div className="hm-wrap">
          <h1 id="pi-title" className="hm-page-title">
            Centro de pagos.
          </h1>
          <p className="hm-lead">Pague por transferencia a una de estas cuentas o con tarjeta mediante Tilopay.</p>
        </div>
      </section>

      <div className="hm-wrap pi">
        <section aria-labelledby="pi-transfer-title">
          <h2 id="pi-transfer-title" className="pi-h2">
            Transferencia bancaria
          </h2>
          <div className="pi-accounts">
            {ACCOUNTS.map((account) => (
              <article key={account.bac} className="pi-account hm-glass" aria-label={`${account.title}, BAC`}>
                <h3 className="pi-account__title">
                  {account.title}
                  <span>BAC</span>
                </h3>
                <Field label="Titular" value={HOLDER} />
                <Field label="Número de cuenta BAC" value={account.bac} mono />
                <Field label="IBAN" value={account.iban} mono />
              </article>
            ))}
          </div>
        </section>

        <section className="pi-panel hm-glass" aria-labelledby="pi-convert-title">
          <h2 id="pi-convert-title" className="pi-h2">
            Convertidor de moneda
          </h2>
          <p className="pi-muted">
            Tipo de cambio de referencia: {formatMoney(1, 'USD')} = {formatMoney(RATE, 'CRC')}. El banco aplica el suyo.
          </p>
          <div className="pi-convert">
            <div className="pi-convert__field">
              <label htmlFor="pi-amount">{from === 'USD' ? 'Monto en dólares' : 'Monto en colones'}</label>
              <input
                id="pi-amount"
                className="pi-input"
                type="text"
                inputMode="decimal"
                autoComplete="off"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={from === 'USD' ? '100' : '55 000'}
              />
            </div>
            <button type="button" className="pi-swap" onClick={swap}>
              {from === 'USD' ? 'Convertir colones' : 'Convertir dólares'}
            </button>
            <div className="pi-convert__field">
              <p className="pi-convert__label" id="pi-result-label">
                {to === 'CRC' ? 'En colones' : 'En dólares'}
              </p>
              <output className="pi-result" htmlFor="pi-amount" aria-labelledby="pi-result-label" aria-live="polite">
                {formatMoney(value ? converted : 0, to)}
              </output>
            </div>
          </div>
          {from === 'USD' && (
            <div className="pi-quick" role="group" aria-label="Montos rápidos en dólares">
              {QUICK_AMOUNTS.map((quick) => (
                <button key={quick} type="button" onClick={() => setAmount(String(quick))}>
                  {formatMoney(quick, 'USD').replace(/[.,]00$/, '')}
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="pi-panel pi-pay hm-glass" aria-labelledby="pi-card-title">
          <h2 id="pi-card-title" className="pi-h2">
            Pago con tarjeta
          </h2>
          <p className="pi-muted">Escriba el monto que acordamos y pague con tarjeta de forma segura con Tilopay.</p>
          <a className="hm-btn hm-btn--solid" href={TILOPAY_OPEN_LINK} target="_blank" rel="noopener noreferrer">
            Pagar con tarjeta
            <Arrow />
          </a>
          <p className="pi-note">Se abre la página de pago de Tilopay en otra pestaña.</p>
        </section>

        <p className="pi-help">
          ¿Dudas sobre el pago? Escríbanos a <a href="mailto:cs@bralto.io">cs@bralto.io</a>.
        </p>
      </div>
    </main>
  )
}
