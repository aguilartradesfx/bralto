import Link from 'next/link'
import {
  Activity,
  Facebook,
  Instagram,
  Mail,
  MessageCircle,
  MessageSquare,
  MessageSquareText,
  Phone,
  type LucideIcon,
} from 'lucide-react'
import { CANAL_LABEL, iniciales, type Canal } from '@/lib/crm/tipos'

// Piezas del CRM que sirven en el servidor y en el navegador

export const CAMPO =
  'w-full bg-solid border border-fg/[0.1] rounded-lg px-3 py-2 text-base sm:text-sm text-fg placeholder:text-fg/35 focus:outline-none focus:border-fg/50 disabled:opacity-60'
export const ETIQUETA = 'mb-1 block text-[11px] uppercase tracking-wide text-fg/40'
export const ICONO = { strokeWidth: 1.5, absoluteStrokeWidth: true, 'aria-hidden': true } as const

export const CANAL_ICONO: Record<Canal, LucideIcon> = {
  whatsapp: MessageCircle,
  sms: MessageSquareText,
  correo: Mail,
  messenger: Facebook,
  instagram: Instagram,
  llamada: Phone,
  sistema: Activity,
  otro: MessageSquare,
}

export function CanalIcono({ canal, size = 13, className = '' }: { canal: Canal; size?: number; className?: string }) {
  const Icono = CANAL_ICONO[canal]
  return <Icono size={size} {...ICONO} className={`shrink-0 ${className}`} />
}

// El canal con su ícono: «WhatsApp»
export function CanalTexto({ canal, className = '' }: { canal: Canal; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      <CanalIcono canal={canal} />
      {CANAL_LABEL[canal]}
    </span>
  )
}

// El círculo con las iniciales de cada contacto
export function Avatar({ nombre, grande = false }: { nombre: string; grande?: boolean }) {
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-fg/[0.08] font-medium text-fg/75 ${grande ? 'h-14 w-14 text-lg' : 'h-9 w-9 text-xs'}`}
    >
      {iniciales(nombre)}
    </span>
  )
}

export function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="inline-block max-w-[12rem] truncate rounded-full bg-fg/[0.06] px-2 py-0.5 align-middle text-[11px] leading-4 text-fg/65">{children}</span>
}

// El título de cada pantalla del CRM: «CRM» chiquito arriba, el nombre y una línea de resumen
export function Encabezado({ titulo, resumen, children }: { titulo: string; resumen?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div className="min-w-0">
        <p className="font-mono text-[11px] uppercase tracking-widest text-fg/40">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">{titulo}</h1>
        {resumen && <p className="mt-0.5 text-sm text-fg/45">{resumen}</p>}
      </div>
      {children}
    </div>
  )
}

const SECCIONES = [
  { href: '/crm', label: 'Contactos' },
  { href: '/crm/pipeline', label: 'Pipeline' },
  { href: '/crm/tareas', label: 'Tareas' },
] as const

// Contactos · Pipeline · Tareas
export function SubMenu({ activa }: { activa: (typeof SECCIONES)[number]['href'] }) {
  return (
    <nav aria-label="Secciones del CRM" className="mb-5 flex gap-1.5">
      {SECCIONES.map((s) => {
        const on = s.href === activa
        return (
          <Link
            key={s.href}
            href={s.href}
            aria-current={on ? 'page' : undefined}
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors ${on ? 'pn-chip-on text-fg' : 'text-fg/55 hover:bg-fg/[0.05] hover:text-fg'}`}
          >
            {s.label}
          </Link>
        )
      })}
    </nav>
  )
}

// Lo que se ve cuando no hay nada
export function Vacio({ children }: { children: React.ReactNode }) {
  return <p className="pn-glass rounded-[16px] px-4 py-8 text-center text-sm text-fg/50">{children}</p>
}

// Aviso de error (o de que salió bien) después de guardar
export function Aviso({ ok = false, children }: { ok?: boolean; children: React.ReactNode }) {
  return (
    <p role={ok ? 'status' : 'alert'} className={`text-sm ${ok ? 'text-fg/70' : 'text-red-300'}`}>
      {children}
    </p>
  )
}

interface BotonProps {
  children: React.ReactNode
  principal?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled?: boolean
  className?: string
}

export function Boton({ children, principal, type = 'button', onClick, disabled, className = '' }: BotonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${principal ? 'pn-btn-solid font-semibold' : 'pn-btn-glass font-medium'} inline-flex items-center justify-center gap-1.5 px-4 py-2 text-sm disabled:opacity-40 ${className}`}
    >
      {children}
    </button>
  )
}
