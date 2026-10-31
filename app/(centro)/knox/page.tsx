import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { iniciales } from '@/lib/crm/tipos'
import { SCRIPT_MEDIDAS } from '@/lib/knox/centro/escena'
import { CentroKnox } from '@/components/knox-centro/centro'

export const dynamic = 'force-dynamic'

// ?vista=ventas|redes|agenda|conexiones abre directo esa vista (sin ella, Hoy)
export default async function KnoxPage({ searchParams }: { searchParams: Promise<{ vista?: string | string[] }> }) {
  // El middleware ya lo exige; acá también, antes de mostrar nada
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const { vista } = await searchParams
  return (
    <>
      {/* El lienzo toma la forma de la ventana antes del primer pintado (sin un salto al cargar) */}
      <script dangerouslySetInnerHTML={{ __html: SCRIPT_MEDIDAS }} />
      <CentroKnox iniciales={profile?.full_name?.trim() ? iniciales(profile.full_name) : 'AA'} vistaInicial={typeof vista === 'string' ? vista : undefined} />
    </>
  )
}
