import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerFiltro } from '@/lib/guiones/reglas'
import { leerGuiones } from '@/lib/guiones/servidor'
import type { GuionFila } from '@/lib/guiones/tipos'
import { diaCR } from '@/lib/guiones/vista'
import { Guiones } from '@/components/guiones/guiones'

export const metadata = { title: 'Guiones' }
export const dynamic = 'force-dynamic'

export default async function GuionesPage({ searchParams }: { searchParams: Promise<{ f?: string | string[] }> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  let guiones: GuionFila[] = []
  let error: string | undefined
  try {
    guiones = await leerGuiones()
  } catch (err) {
    console.error('[guiones]', err instanceof Error ? err.message : err)
    error = 'No se pudieron leer los guiones. Prueba de nuevo en un rato.'
  }
  const ahora = new Date()
  return <Guiones guiones={guiones} filtro={leerFiltro((await searchParams).f)} hoy={diaCR(ahora)} ahora={ahora.toISOString()} error={error} />
}
