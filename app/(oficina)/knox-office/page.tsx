import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerOficinaCompleta } from '@/lib/panel/oficina'
import { Oficina } from '@/components/oficina/oficina'

export const dynamic = 'force-dynamic'

export default async function KnoxOfficePage() {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  // conDireccion: la pestaña y lo que se ve al lado o en grande van en el # (atrás lo cierra; un enlace lo abre)
  return <Oficina inicial={await leerOficinaCompleta(new Date(), null)} conDireccion />
}
