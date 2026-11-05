import Link from 'next/link'

export type PestañaAjustes = 'general' | 'equipo' | 'integraciones' | 'notificaciones' | 'facturacion'

const PESTAÑAS: { id: PestañaAjustes; label: string; href: string; admin?: boolean; pronto?: boolean }[] = [
  { id: 'general', label: 'General', href: '/ajustes' },
  { id: 'equipo', label: 'Equipo', href: '/usuarios', admin: true },
  { id: 'integraciones', label: 'Integraciones', href: '/ajustes?tab=integraciones', admin: true },
  { id: 'notificaciones', label: 'Notificaciones', href: '/pronto/notificaciones', admin: true, pronto: true },
  { id: 'facturacion', label: 'Plan y facturación', href: '/pronto/facturacion', admin: true, pronto: true },
]

// General · Equipo · Integraciones · Notificaciones · Plan y facturación (arriba de Ajustes y de Equipo)
export function PestañasAjustes({ activa, admin }: { activa: PestañaAjustes; admin: boolean }) {
  return (
    <nav aria-label="Secciones de Ajustes" className="max-w-full overflow-x-auto [scrollbar-width:none]">
      <div className="pn-tabs">
        {PESTAÑAS.filter((p) => admin || !p.admin).map((p) => (
          <Link key={p.id} href={p.href} className="pn-tab inline-flex items-center gap-1.5" aria-current={p.id === activa ? 'page' : undefined}>
            {p.label}
            {p.pronto && <span className="pn-pronto !px-1 !text-[9.5px]">Pronto</span>}
          </Link>
        ))}
      </div>
    </nav>
  )
}
