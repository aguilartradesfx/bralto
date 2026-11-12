import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerFiltro } from '@/lib/analisis/calculos'
import { leerAnalisis, leerLecciones } from '@/lib/analisis/servidor'
import { Analisis } from '@/components/analisis/analisis'

export const metadata = { title: 'Análisis de reels' }
export const dynamic = 'force-dynamic'

export default async function AnalisisPage({ searchParams }: { searchParams: Promise<{ f?: string | string[] }> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const [filas, lecciones] = await Promise.all([leerAnalisis(), leerLecciones()])
  return <Analisis filas={filas} lecciones={lecciones} filtro={leerFiltro((await searchParams).f)} />
}
