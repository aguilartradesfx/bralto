'use client'

import { BookOpenText, ChevronDown, Upload } from 'lucide-react'
import { estadoEnSimple, puedeDescartar, puedeReabrir, puedeSubir } from '@/lib/guiones/reglas'
import type { GuionFila, Vista } from '@/lib/guiones/tipos'
import { AYUDA_VISTA, diaLegible, duracionLegible, ETIQUETA_VISTA, etiquetaGancho, momentoLegible, tamanoLegible } from '@/lib/guiones/vista'
import { ICONO } from '@/components/crm/piezas'
import { Acciones } from './acciones'
import { ListaSubidas, type Subida } from './subidas'

// Las etiquetas USTED / MITAD / MOTION, con los colores del panel (siguen el tema claro u oscuro)
const COLOR_VISTA: Record<Vista, string> = { usted: 'var(--pn-accent-ink)', mitad: 'var(--pn-c-azul)', motion: 'var(--pn-c-morado)' }
const BOTON = 'inline-flex min-h-12 w-full items-center justify-center gap-2 px-5 text-[15px] sm:w-auto'
const RESUMEN =
  'flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-fg [&::-webkit-details-marker]:hidden'

// «Subir mi video»: un label con el input adentro (en el iPhone abre la fototeca, la cámara o Archivos). Acepta varios.
function BotonSubir({ texto, principal, alElegir }: { texto: string; principal: boolean; alElegir(archivos: File[]): void }) {
  return (
    <label
      className={`${principal ? 'pn-btn-solid font-semibold' : 'pn-btn-glass font-medium'} ${BOTON} relative cursor-pointer focus-within:ring-2 focus-within:ring-[var(--pn-accent-line)]`}
    >
      <Upload size={17} {...ICONO} />
      {texto}
      <input
        type="file"
        accept="video/*"
        multiple
        className="sr-only"
        onChange={(e) => {
          const archivos = Array.from(e.target.files ?? [])
          e.target.value = ''
          if (archivos.length) alElegir(archivos)
        }}
      />
    </label>
  )
}

export function TarjetaGuion(p: {
  guion: GuionFila
  hoy: string
  ahora: Date
  resaltado: boolean
  subidas: Subida[]
  alLeer(): void
  alSubir(archivos: File[]): void
  alReintentar(clave: string): void
  alQuitar(clave: string): void
  alCerrarSubidas(): void
  alCambiar(): void
}) {
  const g = p.guion
  const estado = estadoEnSimple(g)
  const dura = duracionLegible(g.duracion_s)
  const porGrabar = g.estado === 'listo'
  const conAcciones = puedeDescartar(g.estado) || puedeReabrir(g.estado)

  return (
    <article
      id={g.id}
      aria-labelledby={`titulo-${g.id}`}
      className={`pn-glass scroll-mt-24 rounded-[18px] p-4 transition-shadow duration-500 sm:p-5 ${p.resaltado ? 'ring-2 ring-[var(--pn-accent)]' : ''}`}
    >
      <p className="text-[13px] text-fg/55">{diaLegible(g.dia, p.hoy)}</p>
      <h2 id={`titulo-${g.id}`} className="mt-1 text-[18px] font-semibold leading-snug text-fg [text-wrap:balance]">
        {g.titulo}
      </h2>
      {g.tema && <p className="mt-1 text-sm leading-relaxed text-fg/60">{g.tema}</p>}

      <p role={g.estado === 'error' ? 'alert' : undefined} className="mt-3 flex items-start gap-2 text-sm leading-snug">
        <span aria-hidden className="mt-[0.35em] h-2 w-2 shrink-0 rounded-full" style={{ background: `var(--pn-c-${estado.tono})` }} />
        <span className={g.estado === 'error' ? 'text-red-300' : 'font-medium text-fg/85'}>{estado.texto}</span>
      </p>

      {(g.comenta || dura) && (
        <div className="mt-3 flex flex-wrap gap-2">
          {g.comenta && (
            <span className="pn-pill !whitespace-normal !text-[13px]">
              Comenta <b className="font-semibold text-fg">{g.comenta}</b>
            </span>
          )}
          {dura && <span className="pn-pill !text-[13px]">Dura {dura}</span>}
        </div>
      )}

      {(g.lineas.length > 0 || puedeSubir(g.estado)) && (
        <div className="mt-4 grid gap-2 sm:flex sm:flex-wrap">
          {g.lineas.length > 0 && (
            <button type="button" onClick={p.alLeer} className={`${porGrabar ? 'pn-btn-solid font-semibold' : 'pn-btn-glass font-medium'} ${BOTON}`}>
              <BookOpenText size={17} {...ICONO} />
              Leer para grabar
            </button>
          )}
          {puedeSubir(g.estado) && (
            <BotonSubir texto={g.videos.length ? 'Subir otro video' : 'Subir mi video'} principal={false} alElegir={p.alSubir} />
          )}
        </div>
      )}

      <ListaSubidas subidas={p.subidas} alReintentar={p.alReintentar} alQuitar={p.alQuitar} alCerrar={p.alCerrarSubidas} />

      {g.lineas.length > 0 && (
        <details open={porGrabar} className="group mt-5 border-t border-fg/[0.06]">
          <summary className={RESUMEN}>
            <span>
              El guion <span className="font-normal text-fg/45">· {g.lineas.length === 1 ? '1 línea' : `${g.lineas.length} líneas`}</span>
            </span>
            <ChevronDown size={16} {...ICONO} className="shrink-0 text-fg/45 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mb-3 text-[12px] leading-relaxed text-fg/45">
            {(Object.keys(COLOR_VISTA) as Vista[]).map((v, i) => (
              <span key={v}>
                {i > 0 && ' · '}
                <b className="font-semibold tracking-[0.08em]" style={{ color: COLOR_VISTA[v] }}>
                  {ETIQUETA_VISTA[v]}
                </b>
                : {AYUDA_VISTA[v].toLowerCase()}
              </span>
            ))}
          </p>
          <ol className="space-y-4 pb-4">
            {g.lineas.map((l, i) => (
              <li key={i}>
                <p className="text-[11px] font-semibold tracking-[0.12em]">
                  <span className="tabular-nums text-fg/35">{i + 1}</span>{' '}
                  <span style={{ color: COLOR_VISTA[l.vista] ?? COLOR_VISTA.usted }}>{ETIQUETA_VISTA[l.vista] ?? l.vista}</span>
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-fg/90">{l.dice}</p>
                {l.pantalla && <p className="mt-1 text-[12px] leading-snug text-fg/45">En pantalla: {l.pantalla}</p>}
              </li>
            ))}
          </ol>
        </details>
      )}

      {g.ganchos.length > 0 && (
        <details open={porGrabar} className={`group border-t border-fg/[0.06] ${g.lineas.length ? '' : 'mt-5'}`}>
          <summary className={RESUMEN}>
            <span>
              Los {g.ganchos.length} ganchos <span className="font-normal text-fg/45">· se graban aparte</span>
            </span>
            <ChevronDown size={16} {...ICONO} className="shrink-0 text-fg/45 transition-transform group-open:rotate-180" />
          </summary>
          <p className="mb-3 text-[12px] leading-relaxed text-fg/45">Cada uno arranca una versión de prueba distinta.</p>
          <ol className="space-y-4 pb-4">
            {g.ganchos.map((x, i) => (
              <li key={i}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-fg/50">
                  <span className="tabular-nums text-fg/35">{i + 1}</span> {etiquetaGancho(x.tipo)}
                </p>
                <p className="mt-1 text-[15px] leading-relaxed text-fg/90">{x.dice}</p>
              </li>
            ))}
          </ol>
        </details>
      )}

      {g.videos.length > 0 && (
        <section aria-label="Videos subidos" className="border-t border-fg/[0.06] py-4">
          <h3 className="text-sm font-semibold text-fg">
            Videos subidos <span className="font-normal tabular-nums text-fg/45">{g.videos.length}</span>
          </h3>
          <ul className="mt-2 space-y-1.5">
            {g.videos.map((v) => (
              <li key={v.ruta} className="flex flex-wrap items-baseline gap-x-2 text-[13px] leading-snug">
                <span className="min-w-0 break-all text-fg/80">{v.nombre}</span>
                <span className="text-fg/45">
                  {tamanoLegible(v.bytes)} · {momentoLegible(v.subido_en, p.ahora)}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {conAcciones && (
        <footer className="border-t border-fg/[0.06] pt-4">
          <Acciones id={g.id} estado={g.estado} conVideos={g.videos.length > 0} alCambiar={p.alCambiar} />
        </footer>
      )}
    </article>
  )
}
