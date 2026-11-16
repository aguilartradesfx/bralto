import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerOficina } from '@/lib/oficina/servidor'
import { Oficina } from '@/components/oficina/oficina'

export const metadata = { title: 'Oficina' }
export const dynamic = 'force-dynamic'

export default async function OficinaPage() {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  return <Oficina inicial={await leerOficina(new Date())} />
}
