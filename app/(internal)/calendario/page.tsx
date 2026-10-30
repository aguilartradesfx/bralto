import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { MesCalendario } from '@/components/calendario/mes'

export const metadata = { title: 'Calendario' }

export default async function CalendarioPage({ searchParams }: { searchParams: Promise<{ mes?: string | string[] }> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  return <MesCalendario mes={(await searchParams).mes} ahora={new Date()} />
}
