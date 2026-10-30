import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { tareasPendientes } from '@/lib/crm/servidor'
import { ListaTareas } from '@/components/crm/lista-tareas'

export const metadata = { title: 'Tareas' }

export default async function TareasPage() {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const { pendientes, hechas } = await tareasPendientes()
  return <ListaTareas pendientes={pendientes} hechas={hechas} ahora={new Date().toISOString()} />
}
