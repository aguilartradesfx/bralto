import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { etiquetasEnUso, leerFicha } from '@/lib/crm/servidor'
import { FichaContacto } from '@/components/crm/ficha'

export const metadata = { title: 'CRM' }

export default async function ContactoPage({ params }: { params: Promise<{ id: string }> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const [ficha, etiquetas] = await Promise.all([leerFicha((await params).id), etiquetasEnUso()])
  if (!ficha) notFound()

  // key: al pasar de un contacto a otro, la ficha arranca de cero (pestaña, formularios, «Ver más»)
  return <FichaContacto key={ficha.contacto.id} ficha={ficha} etiquetas={etiquetas.map((e) => e.etiqueta)} ahora={new Date().toISOString()} />
}
