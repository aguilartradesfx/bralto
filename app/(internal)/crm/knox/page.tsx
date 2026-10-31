import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { ajustesKnox, conversacionesConOtraApp, ultimasDecisiones } from '@/lib/crm/bandeja/servidor'
import { PanelKnox } from '@/components/crm/knox'

export const metadata = { title: 'Knox' }
export const dynamic = 'force-dynamic'

export default async function KnoxPage() {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const [ajustes, decisiones, otraApp] = await Promise.all([ajustesKnox(), ultimasDecisiones(20), conversacionesConOtraApp()])
  return <PanelKnox ajustes={ajustes} decisiones={decisiones} otraApp={otraApp} ahora={new Date().toISOString()} />
}
