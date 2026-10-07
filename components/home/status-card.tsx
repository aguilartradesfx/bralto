import type { ReactNode } from 'react'
import { Check } from './icons'
import './status-card.css'

type Props = {
  tone: 'ok' | 'notice'
  eyebrow: string
  title: string
  children: ReactNode
  actions?: ReactNode
}

function Notice() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M8 3.75v5.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="8" cy="12" r=".95" fill="currentColor" />
    </svg>
  )
}

// Páginas de estado (pago, cita, firma): una sola tarjeta de vidrio centrada, en modo enfocado
export function StatusCard({ tone, eyebrow, title, children, actions }: Props) {
  return (
    <main className="st" data-focus-page>
      <div className="hm-wrap st__wrap">
        <section className="st-card hm-glass hm-glass--thick" aria-labelledby="st-title">
          <span className={`st-mark st-mark--${tone}`} aria-hidden="true">
            {tone === 'ok' ? <Check /> : <Notice />}
          </span>
          <p className="hm-eyebrow">{eyebrow}</p>
          <h1 id="st-title" className="st__title">
            {title}
          </h1>
          <div className="st__body">{children}</div>
          {actions && <div className="st__actions">{actions}</div>}
        </section>
      </div>
    </main>
  )
}
