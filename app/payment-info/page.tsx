'use client'

import { useState } from 'react'
import { Copy, Check, DollarSign, CreditCard, ArrowRightLeft } from 'lucide-react'

const RATE = 550 // 1 USD = 550 CRC

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
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-xs text-white/50 hover:text-white/80 shrink-0"
    >
      {copied ? (
        <><Check size={12} className="text-[#F97316]" /><span className="text-[#F97316]">Copiado</span></>
      ) : (
        <><Copy size={12} /><span>Copiar</span></>
      )}
    </button>
  )
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3 border-b border-white/5 last:border-0">
      <div className="min-w-0">
        <p className="text-xs text-white/35 uppercase tracking-wider mb-0.5">{label}</p>
        <p className="text-sm font-mono text-white/85 truncate">{value}</p>
      </div>
      <CopyButton value={value} />
    </div>
  )
}

export default function PaymentInfoPage() {
  const [amount, setAmount] = useState('')
  const [direction, setDirection] = useState<'usd-to-crc' | 'crc-to-usd'>('usd-to-crc')

  const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0

  const convertedValue =
    direction === 'usd-to-crc'
      ? (numericAmount * RATE).toLocaleString('es-CR', { minimumFractionDigits: 0 })
      : (numericAmount / RATE).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const fromLabel = direction === 'usd-to-crc' ? 'USD $' : 'CRC ₡'
  const toLabel = direction === 'usd-to-crc' ? 'CRC ₡' : 'USD $'

  return (
    <div className="min-h-screen bg-[#080808] text-white px-4 py-16 md:py-24">
      {/* Background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,rgba(249,115,22,0.06),transparent)] pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="text-center mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#F97316] mb-3">
            Bralto
          </p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
            Centro de Pagos
          </h1>
          <p className="mt-3 text-sm text-white/40">
            Transferencia bancaria, conversión de moneda y pago con tarjeta
          </p>
        </div>

        {/* USD Account */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/20">
              <DollarSign size={16} className="text-[#F97316]" />
            </div>
            <div>
              <p className="text-xs text-white/35 uppercase tracking-wider">Cuenta en</p>
              <p className="text-sm font-semibold text-white">Dólares (USD)</p>
            </div>
          </div>

          <AccountRow label="Titular" value="JOSE ALEJANDRO AGUILAR MADRIGAL" />
          <AccountRow label="Número de cuenta BAC" value="966869398" />
          <AccountRow label="IBAN" value="CR96010200009668693984" />
        </div>

        {/* CRC Account */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 border border-white/10">
              <span className="text-sm font-bold text-white/60">₡</span>
            </div>
            <div>
              <p className="text-xs text-white/35 uppercase tracking-wider">Cuenta en</p>
              <p className="text-sm font-semibold text-white">Colones (CRC)</p>
            </div>
          </div>

          <AccountRow label="Titular" value="JOSE ALEJANDRO AGUILAR MADRIGAL" />
          <AccountRow label="Número de cuenta BAC" value="938979937" />
          <AccountRow label="IBAN" value="CR43010200009389799374" />
        </div>

        {/* Converter */}
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/10 border border-[#F97316]/20">
              <ArrowRightLeft size={16} className="text-[#F97316]" />
            </div>
            <div>
              <p className="text-xs text-white/35 uppercase tracking-wider">Herramienta</p>
              <p className="text-sm font-semibold text-white">Convertidor de Moneda</p>
            </div>
          </div>

          <p className="text-xs text-white/30 mb-5">
            Tipo de cambio fijo: <span className="text-white/50">$1 USD = ₡550 CRC</span>
          </p>

          {/* Direction toggle */}
          <div className="flex rounded-xl bg-white/5 border border-white/8 p-1 mb-5">
            <button
              onClick={() => setDirection('usd-to-crc')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                direction === 'usd-to-crc'
                  ? 'bg-[#F97316] text-white shadow'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              USD → CRC
            </button>
            <button
              onClick={() => setDirection('crc-to-usd')}
              className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all ${
                direction === 'crc-to-usd'
                  ? 'bg-[#F97316] text-white shadow'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              CRC → USD
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            {/* Input */}
            <div className="flex-1">
              <label className="text-xs text-white/35 uppercase tracking-wider block mb-1.5">{fromLabel}</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-[#F97316]/50 focus:bg-[#F97316]/5 transition-all"
              />
            </div>

            <div className="hidden sm:flex items-end pb-1">
              <ArrowRightLeft size={14} className="text-white/20" />
            </div>

            {/* Result */}
            <div className="flex-1">
              <label className="text-xs text-white/35 uppercase tracking-wider block mb-1.5">{toLabel}</label>
              <div className="w-full bg-white/[0.02] border border-white/8 rounded-xl px-4 py-3 text-sm">
                {numericAmount > 0 ? (
                  <span className="text-[#F97316] font-semibold">{convertedValue}</span>
                ) : (
                  <span className="text-white/20">—</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stripe payment */}
        <div className="rounded-2xl border border-[#F97316]/20 bg-[#F97316]/[0.04] p-6 md:p-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F97316]/15 border border-[#F97316]/25">
              <CreditCard size={16} className="text-[#F97316]" />
            </div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#F97316]">
              Pago con Tarjeta
            </p>
          </div>

          <h2 className="text-xl md:text-2xl font-bold tracking-tight text-white mt-4 mb-3">
            ¿Ya discutimos el precio?
          </h2>
          <p className="text-sm text-white/50 leading-relaxed mb-8 max-w-lg">
            Paga directamente con tarjeta — seguro y rápido vía Stripe.
            Elige el monto que acordamos, ingresa tu información y listo.
            El pago es procesado de forma segura y encriptada por Stripe.
          </p>

          <a
            href="https://buy.stripe.com/28EdR9ec29au7jTaxRbsc00?locale=en&__embed_source=buy_btn_1T9u3dEQo0AZC6TyjennjZJH"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-[#F97316] hover:bg-[#EA6C0C] text-white text-sm font-semibold tracking-wide transition-all hover:shadow-[0_0_24px_rgba(249,115,22,0.35)] active:scale-95"
          >
            <CreditCard size={15} />
            Pagar con Tarjeta
          </a>

          <p className="mt-4 text-xs text-white/25">
            Serás redirigido a Stripe, plataforma certificada PCI-DSS.
          </p>
        </div>

      </div>
    </div>
  )
}
