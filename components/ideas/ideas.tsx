import Link from 'next/link'
import { contarFiltros, FILTRO_LABEL, FILTROS, filtrarIdeas, type Filtro, type IdeaFila } from '@/lib/ideas/cola'
import { Encabezado, Vacio } from '@/components/crm/piezas'
import { Pegar } from '@/components/ideas/pegar'
import { Refrescar } from '@/components/ideas/refrescar'
import { TarjetaIdea } from '@/components/ideas/tarjeta'

const VACIO: Record<Filtro, string> = {
  nuevas: 'No hay ideas nuevas. Pega arriba los enlaces de los videos que te gustaron.',
  knox: 'Todavía no le pasaste ninguna a Knox.',
  yo: 'Todavía no escogiste ninguna para grabarla tú.',
  descartadas: 'No hay ideas descartadas.',
}

// «Ideas»: pegas enlaces de videos que pegaron; cada uno trae sus números, por qué pegó y tu versión
export function Ideas({ ideas, filtro, ahora }: { ideas: IdeaFila[]; filtro: Filtro; ahora: string }) {
  const cuentas = contarFiltros(ideas)
  const lista = filtrarIdeas(ideas, filtro)
  const enCurso = ideas.filter((i) => i.estado === 'pendiente' || i.estado === 'analizando').length
  const resumen =
    ideas.length === 0
      ? 'Pega los enlaces de los videos que te gustaron y te digo por qué pegaron y cómo hacer el tuyo.'
      : `${ideas.length} ${ideas.length === 1 ? 'idea' : 'ideas'}${enCurso ? ` · ${enCurso} analizándose` : ''}`

  return (
    <div className="max-w-5xl px-4 pb-12 md:px-8">
      <Encabezado titulo="Ideas" resumen={resumen} />
      {enCurso > 0 && <Refrescar />}
      <Pegar />

      <nav aria-label="Filtrar ideas" className="-mx-4 mb-4 mt-6 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="pn-tabs w-max">
          {FILTROS.map((f) => (
            <Link key={f} href={f === 'nuevas' ? '/ideas' : `/ideas?f=${f}`} aria-current={f === filtro ? 'page' : undefined} className="pn-tab inline-flex items-center gap-1.5">
              {FILTRO_LABEL[f]}
              <span className="tabular-nums text-fg/40">{cuentas[f]}</span>
            </Link>
          ))}
        </div>
      </nav>

      {lista.length === 0 ? (
        <Vacio>{VACIO[filtro]}</Vacio>
      ) : (
        <ul className="space-y-4">
          {lista.map((i) => (
            <li key={i.id}>
              <TarjetaIdea idea={i} ahora={ahora} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
