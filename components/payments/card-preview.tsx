'use client'

import { useEffect, useRef, useState } from 'react'
import { BraltoLogo } from '@/components/home/logo'
import type { CardBrand, CardSlot } from '@/lib/payments/card-display'
import './card-preview.css'

// Tarjeta 3D del paso de pago, con los colores de Bralto: flota, se inclina con el puntero y va
// mostrando lo que se escribe (del número, solo los últimos 4 dígitos). Al escribir el CVV se da
// vuelta y lo muestra como puntos. Decorativa: los datos los leen los lectores de pantalla en los campos.

const BRAND_LABEL: Record<CardBrand, string> = { visa: 'VISA', mastercard: 'Mastercard', amex: 'AMEX' }

type Props = {
  slots: CardSlot[][]
  brand: CardBrand | null
  expiry: string
  cvvLength: number
  name: string
  flipped: boolean
  labels: { holder: string; expires: string; expiryPlaceholder: string; cvv: string }
}

export function CardPreview({ slots, brand, expiry, cvvLength, name, flipped, labels }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const [still, setStill] = useState(true)

  // Quieta con movimiento reducido o con "Pausar animaciones"
  useEffect(() => {
    const root = document.documentElement
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => setStill(mq.matches || root.dataset.motion === 'paused')
    update()
    const mo = new MutationObserver(update)
    mo.observe(root, { attributes: true, attributeFilter: ['data-motion'] })
    mq.addEventListener('change', update)
    return () => {
      mo.disconnect()
      mq.removeEventListener('change', update)
    }
  }, [])

  // Inclinación con el puntero (solo mouse), sobre todo el lado oscuro
  useEffect(() => {
    const el = ref.current
    const area = el?.closest<HTMLElement>('[data-card-area]')
    if (!el || !area || still || !window.matchMedia('(pointer: fine)').matches) return
    let raf = 0
    const onMove = (e: PointerEvent) => {
      const r = area.getBoundingClientRect()
      const x = (e.clientX - r.left) / r.width - 0.5
      const y = (e.clientY - r.top) / r.height - 0.5
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el.style.setProperty('--ry', `${(-14 + x * 22).toFixed(2)}deg`)
        el.style.setProperty('--rx', `${(9 - y * 14).toFixed(2)}deg`)
      })
    }
    const onLeave = () => {
      el.style.removeProperty('--ry')
      el.style.removeProperty('--rx')
    }
    area.addEventListener('pointermove', onMove)
    area.addEventListener('pointerleave', onLeave)
    return () => {
      cancelAnimationFrame(raf)
      area.removeEventListener('pointermove', onMove)
      area.removeEventListener('pointerleave', onLeave)
    }
  }, [still])

  return (
    <div ref={ref} className="cp" data-flipped={flipped} data-still={still} aria-hidden="true">
      <div className="cp__float">
        <div className="cp__card">
          <div className="cp__face cp__front">
            <div className="cp__top">
              <BraltoLogo className="cp__logo" />
              {brand ? <span className={`cp__brand cp__brand--${brand}`}>{BRAND_LABEL[brand]}</span> : null}
            </div>
            <span className="cp__chip" />
            <div className="cp__number">
              {slots.map((group, g) => (
                <span key={g} className="cp__group">
                  {group.map((slot, i) => (
                    <span key={i} className={slot.filled ? 'is-filled' : undefined}>
                      {slot.ch}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            <div className="cp__bottom">
              <div className="cp__field cp__field--name">
                <span className="cp__label">{labels.holder}</span>
                <span className="cp__value">{name}</span>
              </div>
              <div className="cp__field">
                <span className="cp__label">{labels.expires}</span>
                <span className={expiry ? 'cp__value' : 'cp__value cp__value--empty'}>{expiry || labels.expiryPlaceholder}</span>
              </div>
            </div>
          </div>

          <div className="cp__face cp__back">
            <span className="cp__stripe" />
            <div className="cp__sign">
              <span className="cp__label">{labels.cvv}</span>
              <span className="cp__cvv">{cvvLength ? '•'.repeat(cvvLength) : '•••'}</span>
            </div>
            <BraltoLogo className="cp__logo cp__logo--back" />
          </div>
        </div>
      </div>
      <span className="cp__glow" />
    </div>
  )
}
