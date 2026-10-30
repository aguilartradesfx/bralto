'use client'

import { useRef, useState } from 'react'
import { Bookmark, ChevronLeft, ChevronRight, Ellipsis, Heart, MessageCircle, Send } from 'lucide-react'
import type { Vista } from '@/lib/calendario/vista'

// La cuenta que publica (la collab, si hay, va al lado)
const CUENTA = 'aleaguilarmkt'

const FLECHA = 'pn-glass pn-glass--dense absolute top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-fg/80 hover:text-fg'

// Cómo se va a ver en Instagram. `texto` es el del formulario: la vista previa cambia mientras se escribe
export function VistaPrevia({ vista, texto }: { vista: Vista; texto: string }) {
  return (
    <div className={`mx-auto w-full ${vista.tipo === 'reel' ? 'max-w-[340px]' : 'max-w-[400px]'}`}>
      <article aria-label="Vista previa en Instagram" className="pn-solid overflow-hidden rounded-[18px]">
        <header className="flex items-center gap-3 px-3 py-2.5">
          <span aria-hidden className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-fg/[0.08] text-xs font-semibold text-fg/70 ring-1 ring-fg/10">
            {CUENTA.charAt(0).toUpperCase()}
          </span>
          <div className="min-w-0 leading-tight">
            <p className="truncate text-[13px] text-fg">
              <span className="font-semibold">{CUENTA}</span>
              {vista.colaborador && (
                <>
                  <span className="text-fg/70"> y </span>
                  <span className="font-semibold">{vista.colaborador}</span>
                </>
              )}
            </p>
            {vista.hecho_con_ia && <p className="mt-0.5 text-[11px] text-fg/45">Hecho con IA</p>}
          </div>
          <Ellipsis size={18} strokeWidth={1.5} absoluteStrokeWidth aria-hidden className="ml-auto shrink-0 text-fg/60" />
        </header>

        {vista.tipo === 'reel' ? <Reel vista={vista} /> : <Carrusel laminas={vista.laminas} />}

        <Texto texto={texto} />
      </article>

      {vista.historias.length > 0 && <Historias urls={vista.historias} />}
    </div>
  )
}

// La fila de íconos de Instagram, de adorno. En el carrusel lleva los puntos de las láminas al medio
function Acciones({ puntos }: { puntos?: { actual: number; total: number } }) {
  const icono = { size: 22, strokeWidth: 1.5, absoluteStrokeWidth: true, 'aria-hidden': true } as const
  return (
    <div className="relative flex items-center gap-4 px-3 py-2.5 text-fg/85">
      <Heart {...icono} />
      <MessageCircle {...icono} />
      <Send {...icono} />
      {puntos && puntos.total > 1 && (
        <span aria-hidden className="absolute left-1/2 flex -translate-x-1/2 gap-1">
          {Array.from({ length: puntos.total }, (_, i) => (
            <span key={i} className={`h-1.5 w-1.5 rounded-full transition-colors ${i === puntos.actual ? 'bg-fg' : 'bg-fg/25'}`} />
          ))}
        </span>
      )}
      <Bookmark {...icono} className="ml-auto" />
    </div>
  )
}

// Láminas a 4:5: se deslizan con el dedo (o el trackpad) o con las flechas
function Carrusel({ laminas }: { laminas: string[] }) {
  const riel = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(0)
  const total = laminas.length

  function ir(i: number) {
    const el = riel.current
    if (!el) return
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: Math.max(0, Math.min(total - 1, i)) * el.clientWidth, behavior: quieto ? 'auto' : 'smooth' })
  }

  return (
    <>
      <div className="relative">
        <div
          ref={riel}
          tabIndex={0}
          aria-label={`Láminas del carrusel: ${actual + 1} de ${total}`}
          onScroll={(e) => setActual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
          className="flex aspect-[4/5] snap-x snap-mandatory overflow-x-auto overscroll-x-contain bg-fg/[0.04] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {laminas.map((url, i) => (
            // Imágenes públicas de Supabase de cualquier carpeta: <img> directo, sin el optimizador de Next
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${i}-${url}`}
              src={url}
              alt={`Lámina ${i + 1} de ${total}`}
              loading={i === 0 ? 'eager' : 'lazy'}
              draggable={false}
              className="h-full w-full shrink-0 snap-start object-cover"
            />
          ))}
        </div>
        {total > 1 && (
          <>
            <span className="pn-glass pn-glass--dense absolute right-3 top-3 rounded-full px-2 py-0.5 font-mono text-[11px] tabular-nums text-fg/80">
              {actual + 1}/{total}
            </span>
            {actual > 0 && (
              <button type="button" onClick={() => ir(actual - 1)} aria-label="Lámina anterior" className={`${FLECHA} left-2`}>
                <ChevronLeft size={16} strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
              </button>
            )}
            {actual < total - 1 && (
              <button type="button" onClick={() => ir(actual + 1)} aria-label="Lámina siguiente" className={`${FLECHA} right-2`}>
                <ChevronRight size={16} strokeWidth={1.75} absoluteStrokeWidth aria-hidden />
              </button>
            )}
          </>
        )}
      </div>
      <Acciones puntos={{ actual, total }} />
    </>
  )
}

function Reel({ vista }: { vista: Vista }) {
  return (
    <>
      <div className="aspect-[9/16] bg-black">
        {vista.video_url ? (
          <video
            src={vista.video_url}
            poster={vista.portada_url ?? undefined}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full object-contain"
          />
        ) : (
          <p className="grid h-full place-items-center text-sm text-fg/40">Sin video</p>
        )}
      </div>
      <Acciones />
    </>
  )
}

// El texto con sus saltos de línea; largo, se corta en dos líneas con «más», como en Instagram
function Texto({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false)
  const largo = texto.length > 125 || texto.trim().includes('\n')
  return (
    <div className="px-3 pb-4 text-[13px] leading-[1.45] text-fg/90">
      <p className={`whitespace-pre-line break-words ${largo && !abierto ? 'line-clamp-2' : ''}`}>
        <span className="mr-1.5 font-semibold text-fg">{CUENTA}</span>
        {texto}
      </p>
      {largo && (
        <button type="button" onClick={() => setAbierto(!abierto)} aria-expanded={abierto} className="mt-0.5 text-fg/45 transition-colors hover:text-fg/75">
          {abierto ? 'menos' : 'más'}
        </button>
      )}
    </div>
  )
}

// Las historias que salen después del post, en orden
function Historias({ urls }: { urls: string[] }) {
  return (
    <section className="mt-5">
      <h2 className="mb-2 text-[11px] font-medium uppercase tracking-wide text-fg/40">Historias · {urls.length}</h2>
      <ul className="flex flex-wrap gap-2">
        {urls.map((url, i) => (
          <li key={`${i}-${url}`}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Abrir la historia ${i + 1}`}
              className="block w-[68px] overflow-hidden rounded-[10px] ring-1 ring-fg/10 transition-shadow hover:ring-fg/35"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={url} alt="" loading="lazy" className="aspect-[9/16] w-full object-cover" />
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}
