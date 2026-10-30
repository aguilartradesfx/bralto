import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { etiquetasEnUso } from '@/lib/crm/servidor'
import { NuevoContacto } from '@/components/crm/nuevo-contacto'

export const metadata = { title: 'Nuevo contacto' }

export default async function NuevoContactoPage() {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const etiquetas = await etiquetasEnUso()
  return <NuevoContacto etiquetas={etiquetas.map((e) => e.etiqueta)} />
}
