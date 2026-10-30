import Link from 'next/link'
import { CalendarX2, ChevronLeft, ChevronRight } from 'lucide-react'
import {
  agruparPorDia,
  DIAS_SEMANA,
  horaCR,
  hoyCR,
  leerMes,
  mesDe,
  moverMes,
  nombreDia,
  nombreMes,
  rangoUtc,
  semanasDelMes,
  sumarDias,
} from '@/lib/calendario/fechas'
import { mañanaVacia } from '@/lib/calendario/reglas'
import { leerEntre } from '@/lib/calendario/servidor'
import type { Resumen } from '@/lib/calendario/vista'
import type { Estado } from '@/lib/redes/publicacion/tipos'
import { ESTADO_LABEL, EstadoTexto, Marca, TIPO_ICONO, TIPO_LABEL } from '@/components/calendario/estado'

const FLECHA = 'pn-btn-glass grid h-8 w-8 place-items-center text-fg/70 hover:text-fg'

// El mes de ?mes=AAAA-MM (o el de hoy), en hora de Costa Rica. Lee con service role: quien lo usa ya revisó el permiso
export async function MesCalendario({ mes: param, ahora }: { mes: unknown; ahora: Date }) {
  const hoy = hoyCR(ahora)
  const mes = leerMes(param, ahora)
  const semanas = semanasDelMes(mes)
  const visible = rangoUtc(semanas[0][0], semanas[semanas.length - 1][6])
  const mañana = rangoUtc(sumarDias(hoy, 1), sumarDias(hoy, 1))
  const [publicaciones, deMañana] = await Promise.all([leerEntre(visible.desde, visible.hasta), leerEntre(mañana.desde, mañana.hasta)])

  const porDia = agruparPorDia(publicaciones)
  const delMes = [...porDia].filter(([dia]) => mesDe(dia) === mes)
  const total = delMes.reduce((n, [, lista]) => n + lista.length, 0)
  const porSalir = delMes.reduce((n, [, lista]) => n + lista.filter((p) => p.estado === 'programado').length, 0)

  return (
    <div className="max-w-6xl p-4 md:p-6 lg:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-widest text-fg/40">Calendario de redes</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-fg">{nombreMes(mes)}</h1>
          <p className="mt-0.5 text-sm text-fg/45">
            {total === 0
              ? 'No hay publicaciones este mes.'
              : `${total} ${total === 1 ? 'publicación' : 'publicaciones'}${porSalir ? ` · ${porSalir} por salir` : ''}`}
          </p>
        </div>
        <nav aria-label="Cambiar de mes" className="flex items-center gap-2">
          {mes !== mesDe(hoy) && (
            <Link href="/calendario" className="pn-btn-glass px-3.5 py-1.5 text-xs font-medium">
              Hoy
            </Link>
          )}
          <Link href={`/calendario?mes=${moverMes(mes, -1)}`} aria-label="Mes anterior" className={FLECHA}>
            <ChevronLeft size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          </Link>
          <Link href={`/calendario?mes=${moverMes(mes, 1)}`} aria-label="Mes siguiente" className={FLECHA}>
            <ChevronRight size={16} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          </Link>
        </nav>
      </div>

      {mañanaVacia(deMañana, ahora) && (
        <p className="mb-4 flex items-center gap-2 text-sm text-amber-300">
          <CalendarX2 size={15} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
          Mañana no hay nada programado
        </p>
      )}

      <div className="hidden md:block">
        <Cuadricula mes={mes} semanas={semanas} porDia={porDia} hoy={hoy} />
        <Leyenda />
      </div>
      <div className="md:hidden">
        <ListaPorDia dias={delMes} hoy={hoy} />
      </div>
    </div>
  )
}

// Lo que falta que salga resalta; lo que ya salió se aparta
const CHIP: Record<Estado, string> = {
  programado: 'bg-fg/[0.07] text-fg/90 hover:bg-fg/[0.11]',
  publicando: 'bg-fg/[0.07] text-fg/90 hover:bg-fg/[0.11]',
  publicado: 'bg-fg/[0.03] text-fg/55 hover:bg-fg/[0.07] hover:text-fg/80',
  borrador: 'border border-dashed border-fg/25 text-fg/45 hover:bg-fg/[0.04] hover:text-fg/70',
  error: 'bg-red-500/10 text-red-300 hover:bg-red-500/[0.16]',
  cancelado: 'text-fg/30 line-through hover:bg-fg/[0.04]',
}

const enlace = (p: Resumen) => `/calendario/${p.id}`
const resumen = (p: Resumen) => `${TIPO_LABEL[p.tipo]}, ${ESTADO_LABEL[p.estado].toLowerCase()}`

function Chip({ p }: { p: Resumen }) {
  const Icono = TIPO_ICONO[p.tipo]
  return (
    <Link
      href={enlace(p)}
      title={`${horaCR(p.publicar_en)} · ${p.titulo}`}
      className={`block rounded-lg px-1.5 py-1 text-[11px] leading-tight transition-colors ${CHIP[p.estado]}`}
    >
      <span className="flex items-center gap-1.5">
        <Marca estado={p.estado} />
        <span className="font-mono tabular-nums">{horaCR(p.publicar_en)}</span>
        {/* En una tableta la celda no da para el ícono: el tipo queda en el texto para lectores de pantalla */}
        <Icono size={11} strokeWidth={1.5} absoluteStrokeWidth aria-hidden className="hidden shrink-0 opacity-60 lg:block" />
      </span>
      <span className="mt-0.5 block truncate">{p.titulo}</span>
      <span className="sr-only">{`, ${resumen(p)}`}</span>
    </Link>
  )
}

interface CuadriculaProps {
  mes: string
  semanas: string[][]
  porDia: Map<string, Resumen[]>
  hoy: string
}

// El mes de lunes a domingo (desde md). Los días del mes de al lado se ven más apagados
function Cuadricula({ mes, semanas, porDia, hoy }: CuadriculaProps) {
  return (
    <div className="pn-glass overflow-hidden rounded-[20px]">
      <div className="grid grid-cols-7 border-b border-fg/[0.06]" aria-hidden>
        {DIAS_SEMANA.map((dia) => (
          <div key={dia} className="px-2.5 py-2 font-mono text-[10px] uppercase tracking-widest text-fg/40">
            {dia}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {semanas.flat().map((dia, i) => {
          const fuera = mesDe(dia) !== mes
          const esHoy = dia === hoy
          const lista = porDia.get(dia) ?? []
          return (
            <div
              key={dia}
              className={`min-h-[108px] min-w-0 border-fg/[0.06] p-1.5 ${i % 7 ? 'border-l' : ''} ${i >= 7 ? 'border-t' : ''} ${esHoy ? 'bg-fg/[0.04]' : ''}`}
            >
              <p className="flex h-6 items-center px-1 text-xs tabular-nums">
                <span className="sr-only">{`${nombreDia(dia)}${esHoy ? ', hoy' : ''}`}</span>
                <span
                  aria-hidden
                  className={
                    esHoy
                      ? 'grid h-6 min-w-6 place-items-center rounded-full bg-fg px-1.5 font-semibold text-canvas'
                      : fuera
                        ? 'text-fg/25'
                        : 'text-fg/55'
                  }
                >
                  {Number(dia.slice(8))}
                </span>
              </p>
              {lista.length > 0 && (
                <ul className={`mt-1 space-y-1 ${fuera ? 'opacity-50' : ''}`}>
                  {lista.map((p) => (
                    <li key={p.id}>
                      <Chip p={p} />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// Qué quiere decir cada marca
function Leyenda() {
  const Carrusel = TIPO_ICONO.carrusel
  const Reel = TIPO_ICONO.reel
  return (
    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 px-1 text-[11px]">
      {(['programado', 'publicado', 'borrador', 'error'] as const).map((estado) => (
        <li key={estado}>
          <EstadoTexto estado={estado} />
        </li>
      ))}
      {/* Los íconos de tipo solo se ven desde lg (en la tableta no caben en la celda) */}
      <li className="hidden items-center gap-1.5 text-fg/55 lg:inline-flex">
        <Carrusel size={11} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        Carrusel
      </li>
      <li className="hidden items-center gap-1.5 text-fg/55 lg:inline-flex">
        <Reel size={11} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        Reel
      </li>
    </ul>
  )
}

// En el teléfono: el mismo mes como lista, por día (solo los días que tienen algo)
function ListaPorDia({ dias, hoy }: { dias: [string, Resumen[]][]; hoy: string }) {
  return (
    <ol className="space-y-5">
      {dias.map(([dia, lista]) => (
        <li key={dia}>
          <h2 className="mb-2 flex items-center gap-2 px-1 text-[13px] font-medium text-fg/70">
            {nombreDia(dia)}
            {dia === hoy && (
              <span className="rounded-full bg-fg px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-canvas">Hoy</span>
            )}
          </h2>
          <ul className="pn-glass divide-y divide-fg/[0.06] overflow-hidden rounded-[16px]">
            {lista.map((p) => {
              const Icono = TIPO_ICONO[p.tipo]
              return (
                <li key={p.id}>
                  <Link href={enlace(p)} className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-fg/[0.04]">
                    <span className="w-11 shrink-0 font-mono text-sm tabular-nums text-fg/80">{horaCR(p.publicar_en)}</span>
                    <Icono size={15} strokeWidth={1.5} absoluteStrokeWidth aria-hidden className="shrink-0 text-fg/45" />
                    <span className={`min-w-0 flex-1 truncate text-sm ${p.estado === 'cancelado' ? 'text-fg/35 line-through' : 'text-fg'}`}>
                      <span className="sr-only">{`${TIPO_LABEL[p.tipo]}: `}</span>
                      {p.titulo}
                    </span>
                    <EstadoTexto estado={p.estado} className="shrink-0 text-[11px]" />
                  </Link>
                </li>
              )
            })}
          </ul>
        </li>
      ))}
    </ol>
  )
}
