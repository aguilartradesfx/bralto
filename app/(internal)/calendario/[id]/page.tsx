import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerFila } from '@/lib/calendario/servidor'
import { aVista } from '@/lib/calendario/vista'
import { DetallePublicacion } from '@/components/calendario/publicacion'

export const metadata = { title: 'Calendario' }

export default async function PublicacionPage({ params }: { params: Promise<{ id: string }> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const fila = await leerFila((await params).id)
  if (!fila) notFound()

  // key: al pasar de una publicación a otra, el formulario arranca de cero
  return <DetallePublicacion key={fila.id} vista={aVista(fila)} />
}
