import Link from 'next/link'
import { FileText, Users, ArrowRight, ClipboardList, ScrollText, UserCog, Target, CalendarDays } from 'lucide-react'
import { Knox } from '@/components/internal/knox/knox'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission, requiredPermission } from '@/lib/panel-access'

const sections = [
  { href: '/plan-q4', icon: Target, label: 'Plan Q4', description: 'El plan del trimestre por pestañas y las tareas de cada uno.' },
  { href: '/calendario', icon: CalendarDays, label: 'Calendario', description: 'Lo que sale en redes: el mes, cada publicación y su aprobación.' },
  { href: '/contratos', icon: FileText, label: 'Contratos', description: 'Creá, enviá y gestioná contratos de clientes.' },
  { href: '/clientes', icon: Users, label: 'Clientes', description: 'Base de datos de clientes activos e históricos.' },
  { href: '/solicitudes', icon: ClipboardList, label: 'Solicitudes', description: 'Registrá clientes potenciales y generá sus propuestas.' },
  { href: '/propuestas', icon: ScrollText, label: 'Propuestas', description: 'Propuestas publicadas, su estado y sus links.' },
  { href: '/usuarios', icon: UserCog, label: 'Usuarios', description: 'Colaboradores y permisos del panel.' },
]

export default async function AdminPage() {
  const { user, profile } = await getCurrentSession()
  const visible = sections.filter((s) => hasPermission(profile, requiredPermission(s.href)))

  return (
    <div className="p-6 md:p-10 max-w-5xl">
      {hasPermission(profile, 'is_admin') && <Knox />}

      <div className="mb-8">
        <h1 className="text-xl font-semibold text-fg">Panel interno</h1>
        <p className="text-sm text-fg/40 mt-1">{user?.email}</p>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-fg/40">Todavía no tenés secciones asignadas. Pedile acceso a un administrador.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="pn-glass group flex flex-col gap-3 p-5 rounded-[20px] transition-transform duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-xl bg-fg/[0.06] flex items-center justify-center">
                  <Icon size={15} strokeWidth={1.5} absoluteStrokeWidth className="text-fg/80" />
                </div>
                <ArrowRight
                  size={14}
                  className="text-fg/25 group-hover:text-fg group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-fg">{label}</p>
                <p className="text-xs text-fg/40 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
