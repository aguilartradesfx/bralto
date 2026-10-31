import { notFound, redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { ajustesKnox, leerConversacion, marcarConversacionLeida } from '@/lib/crm/bandeja/servidor'
import { Conversacion } from '@/components/crm/conversacion'

export const metadata = { title: 'Mensajes' }
export const dynamic = 'force-dynamic'

export default async function ConversacionPage({ params }: { params: Promise<{ id: string }> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const { id } = await params
  const [c, ajustes] = await Promise.all([leerConversacion(id), ajustesKnox()])
  if (!c) notFound()
  // Abrirla es leerla
  await marcarConversacionLeida(c.id)

  // key: al pasar de una conversación a otra, la caja arranca vacía
  return <Conversacion key={c.id} c={c} modo={ajustes.modo} ahora={new Date().toISOString()} />
}
