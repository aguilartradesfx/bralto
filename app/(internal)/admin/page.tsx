import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { esGrupo, menuPara } from '@/lib/panel/navegacion'
import { leerPeriodo } from '@/lib/panel/inicio/calculos'
import { leerInicio } from '@/lib/panel/inicio/servidor'
import { TableroInicio } from '@/components/internal/inicio/inicio'
import { ICONOS, TRAZO } from '@/components/internal/shell/iconos'

export const metadata = { title: 'Inicio' }
export const dynamic = 'force-dynamic'

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ periodo?: string | string[] }> }) {
  const { user, profile } = await getCurrentSession()
  const nombre = profile?.full_name?.trim() ?? ''

  if (hasPermission(profile, 'is_admin')) {
    const { periodo } = await searchParams
    const datos = await leerInicio(leerPeriodo(periodo))
    return <TableroInicio datos={datos} nombre={nombre} ahora={new Date().toISOString()} />
  }

  // Los colaboradores: las secciones que tienen abiertas
  const secciones = menuPara(profile).flatMap((e) => (esGrupo(e) ? e.items : e.href === '/admin' ? [] : [e]))
  return (
    <div className="px-4 pb-12 md:px-8">
      <h1 className="sr-only">Inicio</h1>
      <p className="pb-4 text-[13.5px] text-fg/50">{user?.email}</p>
      {secciones.length === 0 ? (
        <p className="pn-glass rounded-[14px] px-5 py-10 text-center text-sm text-fg/50">Todavía no tienes secciones asignadas. Pídele acceso a un administrador.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {secciones.map((s, i) => {
            const Icono = ICONOS[s.icono]
            return (
              <Link key={s.href} href={s.href} className="pn-glass pn-rise group flex items-center gap-3 rounded-[14px] p-4 transition-colors hover:bg-[var(--pn-raise)]" style={{ '--i': i } as React.CSSProperties}>
                <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-fg/[0.05] text-fg/70">
                  <Icono size={16} {...TRAZO} />
                </span>
                <span className="flex-1 text-[14px] text-fg">{s.label}</span>
                <ArrowUpRight size={14} {...TRAZO} className="text-fg/30 transition-colors group-hover:text-[var(--pn-accent-ink)]" />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
