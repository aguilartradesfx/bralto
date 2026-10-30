import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerCuantas, leerFiltro } from '@/lib/crm/bandeja/vista'
import { listarBandeja, resumenBandeja } from '@/lib/crm/bandeja/servidor'
import { Bandeja } from '@/components/crm/bandeja'

export const metadata = { title: 'Mensajes' }
export const dynamic = 'force-dynamic'

type Params = { filtro?: string | string[]; cuantas?: string | string[] }

export default async function MensajesPage({ searchParams }: { searchParams: Promise<Params> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const sp = await searchParams
  const filtro = leerFiltro(sp.filtro)
  const cuantas = leerCuantas(sp.cuantas)
  const [lista, resumen] = await Promise.all([listarBandeja(filtro, cuantas), resumenBandeja()])
  return <Bandeja filas={lista.filas} filtro={filtro} cuantas={cuantas} hayMas={lista.hayMas} resumen={resumen} ahora={new Date().toISOString()} />
}
