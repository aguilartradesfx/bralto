import { ArrowRight, Check as CheckIcon, Moon as MoonIcon, Play as PlayIcon, ShieldCheck, Sun as SunIcon } from 'lucide-react'

// Íconos del sitio: Lucide (el set de los componentes de 21st.dev) con el trazo fino del sitio,
// el mismo grosor en píxeles a cualquier tamaño. Monocromos; el naranja solo en el check.
export const LINE = { strokeWidth: 1.5, absoluteStrokeWidth: true, 'aria-hidden': true } as const

export function Arrow() {
  return <ArrowRight className="hm-arrow" size={16} {...LINE} />
}

export function Check({ className }: { className?: string }) {
  return <CheckIcon className={className} size={16} {...LINE} strokeWidth={1.6} style={{ color: 'var(--accent-ink)' }} />
}

// El visto del escudo va en naranja (home.css, .hm-shield)
export function Shield() {
  return <ShieldCheck className="hm-shield" size={30} {...LINE} />
}

export function Play() {
  return <PlayIcon size={18} {...LINE} fill="currentColor" />
}

export function Sun({ className }: { className?: string }) {
  return <SunIcon className={className} size={11} {...LINE} strokeWidth={1.1} />
}

export function Moon({ className }: { className?: string }) {
  return <MoonIcon className={className} size={11} {...LINE} strokeWidth={1.1} />
}
