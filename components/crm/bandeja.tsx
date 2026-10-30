import Link from 'next/link'
import { Bot, ChevronDown } from 'lucide-react'
import { haceCuanto } from '@/lib/crm/fechas'
import { FILTRO_LABEL, FILTROS, POR_PAGINA, type ConversacionLista, type Filtro } from '@/lib/crm/bandeja/vista'
import { Encabezado, ICONO, SubMenu, Vacio } from '@/components/crm/piezas'
import { FotoPersona } from '@/components/crm/foto'

interface Props {
  filas: ConversacionLista[]
  filtro: Filtro
  cuantas: number
  hayMas: boolean
  resumen: { porResponder: number; sinLeer: number; pendientes: number }
  ahora: string
}

const VACIO: Record<Filtro, string> = {
  por_responder: 'No hay nada por responder. ¡Todo al día!',
  trabajo: 'Todavía no hay conversaciones de trabajo. Knox las marca cuando lee los mensajes.',
  personales: 'Todavía no hay conversaciones personales. Knox las marca cuando lee los mensajes.',
  todas: 'Todavía no hay mensajes. Llegan solos cuando alguien te escribe por Instagram, Messenger o WhatsApp.',
}

const enlace = (filtro: Filtro, cuantas = POR_PAGINA) => {
  const p = new URLSearchParams()
  if (filtro !== 'por_responder') p.set('filtro', filtro)
  if (cuantas > POR_PAGINA) p.set('cuantas', String(cuantas))
  const q = p.toString()
  return `/crm/mensajes${q ? `?${q}` : ''}`
}

// La bandeja: Instagram, Messenger y WhatsApp juntos, lo más nuevo arriba. Por defecto, lo que espera tu respuesta
export function Bandeja({ filas, filtro, cuantas, hayMas, resumen, ahora }: Props) {
  const partes = [
    resumen.porResponder === 1 ? '1 por responder' : `${resumen.porResponder} por responder`,
    resumen.pendientes > 0 ? (resumen.pendientes === 1 ? '1 respuesta de Knox' : `${resumen.pendientes} respuestas de Knox`) : null,
  ].filter(Boolean)

  return (
    <div className="max-w-3xl p-4 md:p-6 lg:p-8">
      <Encabezado titulo="Mensajes" resumen={partes.join(' · ')} />
      <SubMenu activa="/crm/mensajes" />

      <nav aria-label="Qué conversaciones ver" className="mb-4">
        <div className="flex flex-wrap gap-1.5">
          {FILTROS.map((f) => {
            const on = f === filtro
            return (
              <Link
                key={f}
                href={enlace(f)}
                aria-current={on ? 'page' : undefined}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[13px] font-medium ring-1 ring-inset transition-colors ${on ? 'pn-chip-on text-fg ring-transparent' : 'text-fg/60 ring-fg/[0.1] hover:text-fg'}`}
              >
                {FILTRO_LABEL[f]}
                {f === 'por_responder' && resumen.porResponder > 0 && <span className="tabular-nums text-fg/45">{resumen.porResponder}</span>}
              </Link>
            )
          })}
        </div>
      </nav>

      {filas.length === 0 ? (
        <Vacio>{VACIO[filtro]}</Vacio>
      ) : (
        <ul className="pn-glass divide-y divide-fg/[0.06] overflow-hidden rounded-[20px]">
          {filas.map((f) => (
            <Fila key={f.id} f={f} ahora={new Date(ahora)} />
          ))}
        </ul>
      )}

      {hayMas && (
        <div className="mt-4 flex justify-center">
          <Link href={enlace(filtro, cuantas + POR_PAGINA)} scroll={false} className="pn-btn-glass inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium">
            <ChevronDown size={15} {...ICONO} />
            Ver más
          </Link>
        </div>
      )}
    </div>
  )
}

function Fila({ f, ahora }: { f: ConversacionLista; ahora: Date }) {
  // Lo personal y el spam se ven, pero discretos
  const discreta = f.tipo === 'personal' || f.tipo === 'spam'
  return (
    <li>
      <Link href={`/crm/mensajes/${f.id}`} className={`flex items-start gap-3 px-4 py-3.5 transition-colors hover:bg-fg/[0.04] ${discreta ? 'opacity-60' : ''}`}>
        <FotoPersona nombre={f.nombre} foto={f.foto} canal={f.canal} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className={`truncate text-sm ${f.sinLeer ? 'font-semibold text-fg' : 'font-medium text-fg/85'}`}>
              {f.nombre}
              {f.tipo === 'personal' && <span className="font-normal text-fg/45"> · personal</span>}
              {f.tipo === 'spam' && <span className="font-normal text-fg/45"> · spam</span>}
            </p>
            {f.ultimoEn && <span className="shrink-0 text-[11px] tabular-nums text-fg/40">{haceCuanto(f.ultimoEn, ahora)}</span>}
          </div>
          <div className="mt-0.5 flex items-center gap-2">
            <p className={`min-w-0 flex-1 truncate text-[13px] ${f.sinLeer ? 'text-fg/80' : 'text-fg/50'}`}>{f.vistaPrevia}</p>
            {f.sinLeer && (
              <span className="pn-signal" role="img" aria-label="Sin leer" />
            )}
          </div>
          {f.pendiente && (
            <p className="mt-1.5 inline-flex max-w-full items-center gap-1.5 rounded-full bg-fg/[0.07] px-2.5 py-0.5 text-[11px] font-medium text-fg/80">
              <Bot size={12} {...ICONO} />
              <span className="truncate">{f.pendiente.respuesta ? 'Knox dejó una respuesta' : 'Knox te avisa'}</span>
            </p>
          )}
        </div>
      </Link>
    </li>
  )
}
