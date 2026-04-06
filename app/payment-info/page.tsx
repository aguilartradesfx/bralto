'use client'

import { useState } from 'react'
import { Copy, Check, ArrowLeftRight, ArrowLeft, CreditCard } from 'lucide-react'
import Link from 'next/link'

const RATE = 550 // 1 USD = 550 CRC
const QUICK_AMOUNTS = [10, 25, 50, 100, 250, 500]

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(value)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 transition-all"
    >
      {copied
        ? <Check size={13} className="text-[#F97316]" />
        : <Copy size={13} className="text-white/35 group-hover:text-white/55" />
      }
    </button>
  )
}

function AccountField({ label, value, mono = false }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="py-3.5 border-b border-white/[0.06] last:border-0">
      <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-1.5">{label}</p>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-sm leading-snug truncate ${mono ? 'font-mono tracking-wide text-white/90' : 'text-white/75'}`}>
          {value}
        </p>
        <CopyButton value={value} />
      </div>
    </div>
  )
}

export default function PaymentInfoPage() {
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<'usd-to-crc' | 'crc-to-usd'>('usd-to-crc')

  const numeric = parseFloat(amount) || 0
  const converted =
    direction === 'usd-to-crc'
      ? numeric > 0 ? (numeric * RATE).toLocaleString('es-CR') : ''
      : numeric > 0 ? (numeric / RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : ''

  const fromPrefix = direction === 'usd-to-crc' ? '$' : '₡'
  const toPrefix   = direction === 'usd-to-crc' ? '₡' : '$'
  const fromLabel  = direction === 'usd-to-crc' ? 'Dólares (USD)' : 'Colones (CRC)'
  const toLabel    = direction === 'usd-to-crc' ? 'Colones (CRC)' : 'Dólares (USD)'

  const handleSwap = () => {
    setDirection(d => d === 'usd-to-crc' ? 'crc-to-usd' : 'usd-to-crc')
    setAmount('')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-10 md:py-14">
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_35%_at_50%_0%,rgba(249,115,22,0.05),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-3xl mx-auto">

        {/* Back */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/30 hover:text-white/55 transition-colors text-sm mb-10"
        >
          <ArrowLeft size={14} />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F97316]" />
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316]">
              Información de Pago
            </p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3">
            Centro de pagos.
          </h1>
          <p className="text-sm text-white/40 max-w-md leading-relaxed">
            Utilice cualquiera de las siguientes cuentas bancarias para realizar depósitos o transferencias.
          </p>
        </div>

        {/* Account cards — 2 col grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

          {/* USD */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/20">
                  <span className="text-sm font-bold text-[#F97316]">$</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">Cuenta en Dólares</p>
                  <p className="text-xs text-white/30 mt-0.5">USD</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F97316]/12 border border-[#F97316]/22 text-[#F97316]">
                BAC
              </span>
            </div>
            <AccountField label="Cliente" value="JOSE ALEJANDRO AGUILAR MADRIGAL" />
            <AccountField label="Número de cuenta BAC" value="966869398" mono />
            <AccountField label="Número de cuenta IBAN" value="CR96010200009668693984" mono />
          </div>

          {/* CRC */}
          <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/6 border border-white/10">
                  <span className="text-sm font-bold text-white/45">₡</span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-white leading-tight">Cuenta en Colones</p>
                  <p className="text-xs text-white/30 mt-0.5">CRC</p>
                </div>
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-[#F97316]/12 border border-[#F97316]/22 text-[#F97316]">
                BAC
              </span>
            </div>
            <AccountField label="Cliente" value="JOSE ALEJANDRO AGUILAR MADRIGAL" />
            <AccountField label="Número de cuenta BAC" value="938979937" mono />
            <AccountField label="Número de cuenta IBAN" value="CR43010200009389799374" mono />
          </div>

        </div>

        {/* Converter */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 mb-4">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/20">
              <ArrowLeftRight size={15} className="text-[#F97316]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">Convertidor de Moneda</p>
              <p className="text-xs text-white/30 mt-0.5">
                Tipo de cambio: $1 USD = ₡{RATE.toLocaleString()} CRC
              </p>
            </div>
          </div>

          {/* Inputs row */}
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-2">{fromLabel}</p>
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus-within:border-[#F97316]/35 transition-all">
                <span className="text-white/30 text-sm mr-2 shrink-0">{fromPrefix}</span>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="flex-1 min-w-0 bg-transparent text-white text-sm placeholder:text-white/20 focus:outline-none"
                />
              </div>
            </div>

            <button
              onClick={handleSwap}
              className="shrink-0 mb-0.5 w-9 h-9 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-[#F97316]/12 hover:border-[#F97316]/25 transition-all"
            >
              <ArrowLeftRight size={13} className="text-white/35" />
            </button>

            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-white/25 mb-2">{toLabel}</p>
              <div className="flex items-center bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3">
                <span className="text-white/20 text-sm mr-2 shrink-0">{toPrefix}</span>
                <span className={`text-sm ${converted ? 'text-[#F97316] font-semibold' : 'text-white/20'}`}>
                  {converted || '0.00'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick amounts */}
          <div className="flex flex-wrap gap-2 mt-4">
            {QUICK_AMOUNTS.map(amt => (
              <button
                key={amt}
                onClick={() => { setDirection('usd-to-crc'); setAmount(String(amt)) }}
                className="px-3 py-1.5 text-xs rounded-lg bg-white/5 border border-white/8 text-white/40 hover:text-white/65 hover:bg-white/8 hover:border-white/14 transition-all"
              >
                ${amt}
              </button>
            ))}
          </div>
        </div>

        {/* Stripe */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.025] p-5 md:p-6">
          <div className="flex items-start gap-3 mb-5">
            <div className="shrink-0 flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/20">
              <CreditCard size={15} className="text-[#F97316]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white leading-tight">¿Ya discutimos el precio?</p>
              <p className="text-xs text-white/30 mt-0.5">Paga directamente con tarjeta — seguro y rápido vía Stripe</p>
            </div>
          </div>

          <p className="text-sm text-white/45 leading-relaxed mb-6">
            Elige el monto que acordamos, ingresa tu información y listo. El pago es procesado de forma segura por{' '}
            <span className="text-[#F97316]">Stripe</span>.
          </p>

          <a
            href="https://buy.stripe.com/28EdR9ec29au7jTaxRbsc00?locale=en&__embed_source=buy_btn_1T9u3dEQo0AZC6TyjennjZJH"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-white/7 hover:bg-white/11 border border-white/10 hover:border-white/18 text-white/80 hover:text-white text-xs font-bold uppercase tracking-[0.18em] transition-all active:scale-[0.99]"
          >
            Hacer Pago
          </a>
        </div>

        <p className="text-center text-xs text-white/18 mt-8">
          Si tiene dudas sobre el proceso de pago, contáctenos directamente.
        </p>

      </div>
    </div>
  )
}
