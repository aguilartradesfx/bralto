import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export type Locale = 'es' | 'en'

// Variables CSS en línea (--x, --d…) sin pelear con los tipos de React
export function vars(values: Record<string, string | number>): CSSProperties {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [`--${k}`, v])) as CSSProperties
}

// Fondo: orbes monocromos y grano, lo que el vidrio refracta
export function Ambient() {
  return (
    <div className="hm-ambient" aria-hidden="true">
      <div className="hm-ambient__orbs">
        <div className="hm-orb hm-orb--a" />
        <div className="hm-orb hm-orb--b" />
        <div className="hm-orb hm-orb--c" />
        <div className="hm-orb hm-orb--d" />
      </div>
      <div className="hm-grain" />
    </div>
  )
}

type HeadProps = { eyebrow: string; light: string; bold: string; id: string; center?: boolean }

export function SectionHead({ eyebrow, light, bold, id, center }: HeadProps) {
  return (
    <div className={cn('hm-head hm-rv', center && 'hm-head--center')}>
      <p className="hm-eyebrow">{eyebrow}</p>
      <h2 className="hm-h2" id={id}>
        <span>{light}</span> <span className="b">{bold}</span>
      </h2>
    </div>
  )
}

// Marca de bloque pendiente: solo se renderiza en desarrollo y previews
export function PendingBadge({ label }: { label: string }) {
  return <p className="hm-pending__badge">{label}</p>
}

// Resalta los placeholders del copy ([Dato real], [Pendiente]…) para que se noten al revisar
export function Ph({ text }: { text: string }) {
  return /\[.+\]/.test(text) ? <span className="hm-ph">{text}</span> : <>{text}</>
}
