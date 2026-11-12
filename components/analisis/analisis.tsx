import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import { FILTROS, ordenar, pctVisto, veredicto, type Filtro } from '@/lib/analisis/calculos'
import type { AnalisisFila, EstadoLeccion, Leccion } from '@/lib/analisis/tipos'
import { Encabezado, ICONO, Vacio } from '@/components/crm/piezas'

const TITULO = 'mb-2 text-[11px] font-medium uppercase tracking-wide text-fg/40'
const CAJA = 'rounded-[12px] bg-fg/[0.03] px-3 py-2.5 ring-1 ring-inset ring-fg/[0.06]'

const ESTADO_LECCION: Record<EstadoLeccion, string> = {
  confirmada: 'Confirmada',
  probando: 'Probando',
  descartada: 'Descartada',
}

const fecha = new Intl.DateTimeFormat('es-CR', { timeZone: 'America/Costa_Rica', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
const numero = new Intl.NumberFormat('es-CR')

// «Análisis de reels»: lo que predijo Higgsfield de los primeros 15 s al lado de lo que pasó en Instagram, si le
// está atinando y lo que vamos aprendiendo para los reels siguientes
export function Analisis({ filas, lecciones, filtro }: { filas: AnalisisFila[]; lecciones: Leccion[]; filtro: Filtro }) {
  const v = veredicto(filas)
  const cuenta = (f: Filtro) => (f === 'todos' ? filas.length : filas.filter((x) => x.tipo === f).length)
  const lista = ordenar(filtro === 'todos' ? filas : filas.filter((x) => x.tipo === filtro))
  const activas = lecciones.filter((l) => l.estado !== 'descartada')
  const descartadas = lecciones.filter((l) => l.estado === 'descartada')

  return (
    <div className="max-w-5xl px-4 pb-12 md:px-8">
      <Encabezado
        titulo="Análisis de reels"
        resumen={`${filas.length} ${filas.length === 1 ? 'reel' : 'reels'} · Higgsfield predice los primeros 15 segundos; Instagram dice lo que pasó`}
      />

      <section className="pn-glass mt-2 rounded-[16px] p-4 sm:p-5" aria-labelledby="veredicto">
        <p className={TITULO}>¿Higgsfield le atina?</p>
        <h2 id="veredicto" className="text-[17px] font-semibold text-fg" style={v.nivel === 'atina' ? { color: 'var(--pn-accent-ink)' } : undefined}>
          {v.titulo}
        </h2>
        <p className="mt-1 text-[14px] leading-6 text-fg/70">{v.texto}</p>
        <p className="mt-2 text-[12px] leading-5 text-fg/45">
          Se compara el puntaje del gancho (los primeros 3 segundos) con cuánta gente se salta el reel. Solo cuentan los reels con más de 80
          vistas.
        </p>
      </section>

      <section className="mt-6" aria-labelledby="lecciones">
        <h2 id="lecciones" className={TITULO}>
          Lo que vamos aprendiendo
        </h2>
        {activas.length === 0 ? (
          <Vacio>Todavía no hay lecciones. Salen de comparar los reels que mejor y peor retienen.</Vacio>
        ) : (
          <ul className="space-y-2">
            {activas.map((l) => (
              <LeccionItem key={l.id} l={l} />
            ))}
          </ul>
        )}
        {descartadas.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[13px] text-fg/50">Descartadas ({descartadas.length})</summary>
            <ul className="mt-2 space-y-2">
              {descartadas.map((l) => (
                <LeccionItem key={l.id} l={l} />
              ))}
            </ul>
          </details>
        )}
      </section>

      <nav aria-label="Filtrar reels" className="-mx-4 mb-4 mt-8 overflow-x-auto px-4 [scrollbar-width:none] md:mx-0 md:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="pn-tabs w-max">
          {FILTROS.map((f) => (
            <Link key={f.id} href={f.id === 'todos' ? '/analisis' : `/analisis?f=${f.id}`} aria-current={f.id === filtro ? 'page' : undefined} className="pn-tab inline-flex items-center gap-1.5">
              {f.label}
              <span className="tabular-nums text-fg/40">{cuenta(f.id)}</span>
            </Link>
          ))}
        </div>
      </nav>

      {lista.length === 0 ? (
        <Vacio>No hay reels en esta lista.</Vacio>
      ) : (
        <ul className="space-y-3">
          {lista.map((f) => (
            <li key={f.id}>
              <Tarjeta f={f} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

function LeccionItem({ l }: { l: Leccion }) {
  return (
    <li className="pn-glass rounded-[14px] px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className={l.estado === 'confirmada' ? 'pn-chip-on rounded-full px-2 py-0.5 text-[11px] font-medium' : 'pn-pill text-[11px]'}>{ESTADO_LECCION[l.estado]}</span>
        <p className="text-[14px] font-medium leading-6 text-fg">{l.regla}</p>
      </div>
      {l.por_que && <p className="mt-1 text-[13px] leading-5 text-fg/60">{l.por_que}</p>}
    </li>
  )
}

function Dato({ label, valor, nota, destacado }: { label: string; valor: string | null; nota?: string; destacado?: boolean }) {
  return (
    <div className={CAJA}>
      <dt className="text-[12px] text-fg/50">{label}</dt>
      {valor ? (
        <dd className="mt-0.5 text-lg font-semibold tabular-nums text-fg" style={destacado ? { color: 'var(--pn-accent-ink)' } : undefined}>
          {valor}
        </dd>
      ) : (
        <dd className="mt-1 text-[12px] leading-5 text-fg/40">{nota ?? 'Sin dato'}</dd>
      )}
    </div>
  )
}

function etiqueta(f: AnalisisFila): string | null {
  if (f.tipo === 'prueba') return `Prueba · versión ${f.version ?? '?'}`
  if (f.tipo === 'rehecho') return 'Rehecho'
  return null
}

function Tarjeta({ f }: { f: AnalisisFila }) {
  const p = f.prediccion
  const r = f.real
  const visto = pctVisto(f)
  const chip = etiqueta(f)
  const cuando = f.publicado_en ? fecha.format(new Date(f.publicado_en)) : 'Sin publicar'
  return (
    <article className="pn-glass flex gap-4 rounded-[16px] p-4 sm:p-5">
      {f.primer_cuadro_url ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniatura del segundo 0, ya chica en Supabase
        <img src={f.primer_cuadro_url} alt="Lo que se ve en el segundo 0" className="hidden aspect-[9/16] w-20 shrink-0 rounded-[10px] object-cover ring-1 ring-fg/[0.08] sm:block" />
      ) : null}
      <div className="min-w-0 flex-1">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <p className="text-[13px] text-fg/55">
              {cuando}
              {f.duracion_s ? ` · ${f.duracion_s} s` : ''}
            </p>
            <h3 className="mt-0.5 text-[15px] font-semibold leading-snug text-fg">{f.titulo}</h3>
            {f.gancho && <p className="mt-1 text-[13px] leading-5 text-fg/65">«{f.gancho}»</p>}
            {f.rehecho_de && <p className="mt-1 text-[12px] text-fg/45">Rehecho de {f.rehecho_de}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {chip && <span className="pn-pill text-[11px]">{chip}</span>}
            {f.video_url && (
              <a href={f.video_url} target="_blank" rel="noopener noreferrer" className="pn-btn-glass inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium">
                Video
                <ExternalLink size={12} {...ICONO} />
              </a>
            )}
          </div>
        </header>

        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className={TITULO}>Higgsfield dijo</p>
            <dl className="grid grid-cols-2 gap-2">
              <Dato label="Gancho (0 a 3 s)" valor={p ? `${p.gancho}/100` : null} nota="Sin analizar" />
              <Dato label="General" valor={p ? `${p.general}/100` : null} nota="Sin analizar" />
            </dl>
          </div>
          <div>
            <p className={TITULO}>Pasó en Instagram</p>
            <dl className="grid grid-cols-3 gap-2">
              <Dato label="Vistas" valor={r ? numero.format(r.vistas) : null} nota="Todavía no" />
              <Dato label="Se lo saltan" valor={r?.salto !== null && r?.salto !== undefined ? `${Math.round(r.salto)}%` : null} nota="Todavía no" />
              <Dato
                label="Lo ven"
                valor={r?.promedio_s !== null && r?.promedio_s !== undefined ? `${r.promedio_s} s` : null}
                nota="Todavía no"
              />
            </dl>
            {visto !== null && <p className="mt-1.5 text-[12px] text-fg/45">En promedio ven el {visto}% del video.</p>}
          </div>
        </div>

        {f.revision?.notas && <p className="mt-3 text-[13px] leading-5 text-fg/60">{f.revision.notas}</p>}
      </div>
    </article>
  )
}
