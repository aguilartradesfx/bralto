import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerFiltro } from '@/lib/ideas/cola'
import { leerIdeas } from '@/lib/ideas/servidor'
import { Ideas } from '@/components/ideas/ideas'

export const metadata = { title: 'Ideas' }
export const dynamic = 'force-dynamic'

export default async function IdeasPage({ searchParams }: { searchParams: Promise<{ f?: string | string[] }> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const ideas = await leerIdeas()
  return <Ideas ideas={ideas} filtro={leerFiltro((await searchParams).f)} ahora={new Date().toISOString()} />
}
