import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { rutaDeLogin } from '@/lib/panel/siguiente'
import { leerFiltro, leerPropuestas } from '@/lib/proposals/lista'
import { Propuestas, type FilaPropuesta } from '@/components/proposals/propuestas'
import { Vacio } from '@/components/crm/piezas'
import { BRALTO_SERVICES } from '@/types/proposals'

export const metadata = { title: 'Propuestas' }
export const dynamic = 'force-dynamic'

export default async function PropuestasPage({ searchParams }: { searchParams: Promise<{ f?: string | string[] }> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect(rutaDeLogin('/propuestas'))
  if (!hasPermission(profile, 'can_view_proposals')) redirect('/admin')

  let filas: FilaPropuesta[]
  try {
    filas = await leerPropuestas()
  } catch (err) {
    console.error('[propuestas]', err instanceof Error ? err.message : err)
    return (
      <div className="max-w-4xl px-4 pb-16 md:px-8">
        <Vacio>No se pudieron leer las propuestas. Prueba de nuevo en un rato.</Vacio>
      </div>
    )
  }

  const labels = Object.fromEntries(BRALTO_SERVICES.map((s) => [s.id, s.label]))
  return <Propuestas filas={filas} filtro={leerFiltro((await searchParams).f)} ahora={new Date().toISOString()} labels={labels} />
}
