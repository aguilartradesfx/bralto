import type { ReactNode } from 'react'
import { CircleAlert } from 'lucide-react'
import { Check, LINE } from './icons'
import './status-card.css'

type Props = {
  tone: 'ok' | 'notice'
  eyebrow: string
  title: string
  children: ReactNode
  actions?: ReactNode
}

// Páginas de estado (pago, cita, firma): una sola tarjeta de vidrio centrada, en modo enfocado
export function StatusCard({ tone, eyebrow, title, children, actions }: Props) {
  return (
    <main className="st" data-focus-page>
      <div className="hm-wrap st__wrap">
        <section className="st-card hm-glass hm-glass--thick" aria-labelledby="st-title">
          <span className={`st-mark st-mark--${tone}`} aria-hidden="true">
            {tone === 'ok' ? <Check /> : <CircleAlert size={28} {...LINE} />}
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
