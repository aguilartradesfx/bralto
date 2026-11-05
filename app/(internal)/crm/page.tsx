import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerPagina } from '@/lib/crm/busqueda'
import { etiquetasEnUso, leerFicha, listarContactos } from '@/lib/crm/servidor'
import { actividadDeContactos, borradorDeKnox, resumenContactos } from '@/lib/panel/contactos'
import { Contactos } from '@/components/crm/contactos'

export const metadata = { title: 'Contactos' }

type Params = { q?: string | string[]; etiqueta?: string | string[]; pagina?: string | string[]; c?: string | string[] }
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
  const c = uno(sp.c)
  const [lista, etiquetas, resumen, ficha] = await Promise.all([listarContactos({ q, etiqueta, pagina }), etiquetasEnUso(), resumenContactos(), c ? leerFicha(c) : Promise.resolve(null)])
  // La actividad de los de la página y, si el abierto no está en ella, también la suya (para su etapa)
  const ids = [...new Set([...lista.filas.map((f) => f.id), ...(ficha ? [ficha.contacto.id] : [])])]
  const [actividad, borrador] = await Promise.all([actividadDeContactos(ids), ficha ? borradorDeKnox(ficha.conversaciones.map((x) => x.id)) : Promise.resolve(null)])

  return (
    <Contactos
      filas={lista.filas}
      total={lista.total}
      pagina={pagina}
      q={q}
      etiqueta={etiqueta}
      etiquetas={etiquetas}
      actividad={actividad}
      resumen={resumen}
      abierto={ficha ? { ficha, borrador } : null}
      ahora={new Date().toISOString()}
    />
  )
}
