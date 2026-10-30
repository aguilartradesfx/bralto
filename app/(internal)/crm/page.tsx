import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerPagina } from '@/lib/crm/busqueda'
import { etiquetasEnUso, listarContactos } from '@/lib/crm/servidor'
import { Contactos } from '@/components/crm/contactos'

export const metadata = { title: 'CRM' }

type Params = { q?: string | string[]; etiqueta?: string | string[]; pagina?: string | string[] }
const uno = (v: string | string[] | undefined) => (typeof v === 'string' ? v : '')

export default async function CrmPage({ searchParams }: { searchParams: Promise<Params> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const sp = await searchParams
  const q = uno(sp.q)
  const etiqueta = uno(sp.etiqueta)
  const pagina = leerPagina(sp.pagina)
  const [lista, etiquetas] = await Promise.all([listarContactos({ q, etiqueta, pagina }), etiquetasEnUso()])
  return <Contactos filas={lista.filas} total={lista.total} pagina={pagina} q={q} etiqueta={etiqueta} etiquetas={etiquetas} ahora={new Date().toISOString()} />
}
