import Link from 'next/link'
import { FileText, Users, ArrowRight, ClipboardList, ScrollText, UserCog } from 'lucide-react'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission, requiredPermission } from '@/lib/panel-access'

const sections = [
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
    <div className="p-6 md:p-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-xl font-semibold text-white">Panel interno</h1>
        <p className="text-sm text-white/40 mt-1">{user?.email}</p>
      </div>

      {visible.length === 0 ? (
        <p className="text-sm text-white/40">Todavía no tenés secciones asignadas. Pedile acceso a un administrador.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map(({ href, icon: Icon, label, description }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 p-5 bg-white/[0.03] border border-white/[0.07] rounded-xl hover:border-[#5bb6ff]/30 hover:bg-white/[0.05] transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-lg bg-[#5bb6ff]/10 flex items-center justify-center">
                  <Icon size={15} className="text-[#5bb6ff]" />
                </div>
                <ArrowRight
                  size={14}
                  className="text-white/20 group-hover:text-[#5bb6ff] group-hover:translate-x-0.5 transition-all"
                />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{label}</p>
                <p className="text-xs text-white/40 mt-0.5 leading-relaxed">{description}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
