import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { leerPipelines, tablero } from '@/lib/crm/servidor'
import { ESTADOS_OPORTUNIDAD, type EstadoOportunidad } from '@/lib/crm/tipos'
import { Tablero } from '@/components/crm/tablero'
import { Encabezado, SubMenu, Vacio } from '@/components/crm/piezas'

export const metadata = { title: 'Pipeline' }

type Params = { pipeline?: string | string[]; estado?: string | string[] }

export default async function PipelinePage({ searchParams }: { searchParams: Promise<Params> }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  const sp = await searchParams
  const pipelines = await leerPipelines()
  const pipeline = pipelines.find((p) => p.id === sp.pipeline) ?? pipelines[0]
  if (!pipeline) {
    return (
      <div className="p-4 md:p-6 lg:p-8">
        <Encabezado titulo="Pipeline" />
        <SubMenu activa="/crm/pipeline" />
        <Vacio>Todavía no hay ningún pipeline.</Vacio>
      </div>
    )
  }
  const estado: EstadoOportunidad = (ESTADOS_OPORTUNIDAD as readonly unknown[]).includes(sp.estado) ? (sp.estado as EstadoOportunidad) : 'abierta'
  const tarjetas = await tablero(pipeline.id, estado)
  // key: al cambiar de pipeline o de estado, el tablero arranca de cero (la etapa elegida en el teléfono)
  return <Tablero key={`${pipeline.id}:${estado}`} pipelines={pipelines} pipeline={pipeline} estado={estado} tarjetas={tarjetas} />
}
