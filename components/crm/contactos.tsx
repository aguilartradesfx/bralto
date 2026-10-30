import Link from 'next/link'
import { ChevronLeft, ChevronRight, CircleDot, UserPlus } from 'lucide-react'
import { enlaceLista, totalPaginas } from '@/lib/crm/busqueda'
import { haceCuanto } from '@/lib/crm/fechas'
import type { ContactoLista } from '@/lib/crm/vista'
import { Buscador } from '@/components/crm/buscador'
import { Avatar, CanalTexto, Encabezado, Etiqueta, ICONO, SubMenu, Vacio } from '@/components/crm/piezas'

interface Props {
  filas: ContactoLista[]
  total: number
  pagina: number
  q: string
  etiqueta: string
  etiquetas: { etiqueta: string; total: number }[]
  ahora: string
}

// La lista de contactos: los de actividad más reciente arriba, de a 30, con buscador y filtro por etiqueta
export function Contactos({ filas, total, pagina, q, etiqueta, etiquetas, ahora }: Props) {
  const paginas = totalPaginas(total)
  const filtrando = !!(q.trim() || etiqueta)
  const cuantos = `${total.toLocaleString('es-CR')} ${total === 1 ? 'contacto' : 'contactos'}`

  return (
    <div className="max-w-5xl p-4 md:p-6 lg:p-8">
      <Encabezado titulo="Contactos" resumen={filtrando ? `${cuantos} con esa búsqueda` : cuantos}>
        <Link href="/crm/nuevo" className="pn-btn-solid inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold">
          <UserPlus size={15} {...ICONO} />
          Nuevo contacto
        </Link>
      </Encabezado>
      <SubMenu activa="/crm" />
      <Buscador q={q} etiqueta={etiqueta} etiquetas={etiquetas} />

      {filas.length === 0 ? (
        <Vacio>
          {filtrando ? (
            <>
              No encontramos a nadie con eso.{' '}
              <Link href="/crm" className="text-fg underline underline-offset-2">
                Ver todos
              </Link>
            </>
          ) : (
            'Todavía no hay contactos.'
          )}
        </Vacio>
      ) : (
        <ul className="pn-glass divide-y divide-fg/[0.06] overflow-hidden rounded-[20px]">
          {filas.map((f) => (
            <Fila key={f.id} f={f} ahora={new Date(ahora)} />
          ))}
        </ul>
      )}

      {paginas > 1 && (
        <nav aria-label="Páginas" className="mt-4 flex items-center justify-between gap-3">
          {pagina > 1 ? (
            <Link href={enlaceLista({ q, etiqueta, pagina: pagina - 1 })} className="pn-btn-glass inline-flex items-center gap-1 px-3.5 py-1.5 text-sm">
              <ChevronLeft size={15} {...ICONO} />
              Anterior
            </Link>
          ) : (
            <span />
          )}
          <span className="text-sm tabular-nums text-fg/45">
            Página {pagina} de {paginas}
          </span>
          {pagina < paginas ? (
            <Link href={enlaceLista({ q, etiqueta, pagina: pagina + 1 })} className="pn-btn-glass inline-flex items-center gap-1 px-3.5 py-1.5 text-sm">
              Siguiente
              <ChevronRight size={15} {...ICONO} />
            </Link>
          ) : (
            <span />
          )}
        </nav>
      )}
    </div>
  )
}

function Fila({ f, ahora }: { f: ContactoLista; ahora: Date }) {
  const extra = f.etiquetas.length - 2
  return (
    <li>
      <Link href={`/crm/${f.id}`} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-fg/[0.04]">
        <Avatar nombre={f.nombre} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-medium text-fg">
              {f.nombre}
              {f.empresa && <span className="font-normal text-fg/45"> · {f.empresa}</span>}
            </p>
            <span className="shrink-0 text-[11px] tabular-nums text-fg/40">{haceCuanto(f.ultima_actividad, ahora)}</span>
          </div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-fg/50">
            {f.canal ? <CanalTexto canal={f.canal} /> : <span className="text-fg/35">Sin mensajes</span>}
            {f.etiquetas.slice(0, 2).map((e) => (
              <Etiqueta key={e}>{e}</Etiqueta>
            ))}
            {extra > 0 && <span className="text-[11px] text-fg/40">+{extra}</span>}
            {f.abiertas > 0 && (
              <span className="inline-flex items-center gap-1 text-fg/75">
                <CircleDot size={12} {...ICONO} />
                {f.abiertas === 1 ? '1 oportunidad abierta' : `${f.abiertas} oportunidades abiertas`}
              </span>
            )}
          </div>
        </div>
      </Link>
    </li>
  )
}
