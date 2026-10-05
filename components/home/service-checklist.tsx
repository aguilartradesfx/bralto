'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Arrow, Check } from './icons'

type Props = {
  items: string[]
  title: string
  /** Lleva {n}: cuántos puntos marcó */
  body: string
  cta: string
  href: string
}

// Autodiagnóstico de /servicios/asesoria: con 3 o más marcas aparece la invitación a agendar
export function ServiceChecklist({ items, title, body, cta, href }: Props) {
  const [checked, setChecked] = useState<Set<number>>(() => new Set())

  const toggle = (i: number) =>
    setChecked((prev) => {
      const next = new Set(prev)
      if (next.has(i)) next.delete(i)
      else next.add(i)
      return next
    })

  return (
    <div>
      <ul className="sv-check__list">
        {items.map((item, i) => (
          <li key={item}>
            <label className={cn('sv-check__item', checked.has(i) && 'is-on')}>
              <input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} />
              <span className="sv-check__box" aria-hidden="true">
                <Check />
              </span>
              {item}
            </label>
          </li>
        ))}
      </ul>
      <div aria-live="polite">
        {checked.size >= 3 && (
          <div className="sv-check__card hm-glass">
            <p className="sv-check__title">{title}</p>
            <p>{body.replace('{n}', String(checked.size))}</p>
            <a href={href} className="hm-btn hm-btn--solid hm-btn--sm">
              {cta}
              <Arrow />
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
