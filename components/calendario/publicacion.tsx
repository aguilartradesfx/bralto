'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { aLocalCR, diaCR, horaCR, mesDe, nombreDia, nombreMes } from '@/lib/calendario/fechas'
import { sePuedeEditar } from '@/lib/calendario/reglas'
import type { Destino, Pedido } from '@/lib/calendario/editar'
import type { Vista } from '@/lib/calendario/vista'
import type { Estado } from '@/lib/redes/publicacion/tipos'
import { EstadoTexto, TIPO_LABEL } from '@/components/calendario/estado'
import { VistaPrevia } from '@/components/calendario/vista-previa'

const CAMPO =
  'w-full bg-solid border border-fg/[0.1] rounded-lg px-3 py-2 text-sm text-fg focus:outline-none focus:border-fg/50 disabled:opacity-60'
const ETIQUETA = 'mb-1 block text-[11px] uppercase tracking-wide text-fg/40'

// Por qué no se puede cambiar, según el estado
const SOLO_LECTURA: Partial<Record<Estado, string>> = {
  publicado: 'Ya salió: no se puede cambiar.',
  publicando: 'Se está publicando en este momento: no se puede cambiar.',
  error: 'No salió y quedó cerrada: desde acá no se puede cambiar.',
  cancelado: 'Está cancelada: no va a salir.',
}

type Aviso = { ok: boolean; texto: string }
type Accion = Destino | 'guardar'

const CARGANDO: Record<Accion, string> = { guardar: 'Guardando…', programado: 'Aprobando…', borrador: 'Frenando…' }

// Una publicación: cómo se ve en Instagram, sus datos y, si es borrador o programada, su edición
export function DetallePublicacion({ vista }: { vista: Vista }) {
  const router = useRouter()
  const [texto, setTexto] = useState(vista.texto)
  const [cuando, setCuando] = useState(aLocalCR(vista.publicar_en))
  const [enviando, setEnviando] = useState<Accion | null>(null)
  const [aviso, setAviso] = useState<Aviso | null>(null)
  const [refrescando, startRefresh] = useTransition()
  const ocupado = enviando !== null || refrescando
  const editable = sePuedeEditar(vista.estado)
  const sucio = texto !== vista.texto || cuando !== aLocalCR(vista.publicar_en)
  const mes = mesDe(diaCR(vista.publicar_en))

  async function enviar(estado?: Destino) {
    setEnviando(estado ?? 'guardar')
    setAviso(null)
    const pedido: Pedido = { texto, cuando, ...(estado ? { estado } : {}) }
    try {
      const res = await fetch(`/api/calendario/${encodeURIComponent(vista.id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(pedido),
      })
      const data: unknown = await res.json().catch(() => null)
      if (!res.ok) {
        const error = data && typeof data === 'object' && 'error' in data ? (data as { error: unknown }).error : null
        setAviso({ ok: false, texto: typeof error === 'string' ? error : 'No se pudo guardar. Probá de nuevo.' })
        // Si ya salió o se está publicando, la página se pone al día y queda solo para ver
        if (res.status === 409) startRefresh(() => router.refresh())
        return
      }
      const sale = `${nombreDia(cuando.slice(0, 10)).toLowerCase()} a las ${cuando.slice(11, 16)}`
      setAviso({
        ok: true,
        texto: estado === 'programado' ? `Aprobada: sale el ${sale}.` : estado === 'borrador' ? 'Frenada: quedó como borrador y no va a salir.' : 'Guardado.',
      })
      startRefresh(() => router.refresh())
    } catch {
      setAviso({ ok: false, texto: 'Sin conexión, probá de nuevo.' })
    } finally {
      setEnviando(null)
    }
  }

  return (
    <div className="max-w-6xl p-4 md:p-6 lg:p-8">
      <Link
        href={`/calendario?mes=${mes}`}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-fg/55 transition-colors hover:text-fg"
      >
        <ArrowLeft size={14} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
        {nombreMes(mes)}
      </Link>

      {/* Teléfono: datos, vista previa y edición, en ese orden. Desde lg, la vista previa a la izquierda */}
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:grid-rows-[auto_1fr] lg:gap-x-10">
        <Ficha vista={vista} />

        <div className="lg:col-start-1 lg:row-span-2 lg:row-start-1">
          <VistaPrevia vista={vista} texto={editable ? texto : vista.texto} />
        </div>

        <div className="space-y-3 lg:col-start-2 lg:row-start-2">
          {aviso && (
            <p role={aviso.ok ? 'status' : 'alert'} className={`text-sm ${aviso.ok ? 'text-fg/70' : 'text-red-300'}`}>
              {aviso.texto}
            </p>
          )}
          {editable ? (
            <form
              onSubmit={(e) => {
                e.preventDefault()
                void enviar()
              }}
              className="pn-glass space-y-4 rounded-[20px] p-5"
            >
              <p className="text-sm text-fg/60">
                {vista.estado === 'borrador'
                  ? 'Es un borrador: no sale hasta que lo aprobés.'
                  : 'Está programada: sale sola a su hora. Si la frenás, queda como borrador.'}
              </p>
              <div>
                <label className="block">
                  <span className={ETIQUETA}>Texto</span>
                  <textarea
                    rows={12}
                    value={texto}
                    onChange={(e) => {
                      setTexto(e.target.value)
                      setAviso(null)
                    }}
                    disabled={ocupado}
                    className={`${CAMPO} leading-relaxed`}
                  />
                </label>
                <Conteo texto={texto} />
              </div>
              <label className="block">
                <span className={ETIQUETA}>Fecha y hora (Costa Rica)</span>
                <input
                  type="datetime-local"
                  required
                  value={cuando}
                  onChange={(e) => {
                    setCuando(e.target.value)
                    setAviso(null)
                  }}
                  disabled={ocupado}
                  className={CAMPO}
                />
              </label>
              <div className="flex flex-wrap gap-2 pt-1">
                {vista.estado === 'borrador' ? (
                  <>
                    <Boton principal onClick={() => void enviar('programado')} disabled={ocupado} cargando={enviando === 'programado' && CARGANDO.programado}>
                      Aprobar
                    </Boton>
                    <Boton type="submit" disabled={ocupado || !sucio} cargando={enviando === 'guardar' && CARGANDO.guardar}>
                      Guardar
                    </Boton>
                  </>
                ) : (
                  <>
                    <Boton principal type="submit" disabled={ocupado || !sucio} cargando={enviando === 'guardar' && CARGANDO.guardar}>
                      Guardar
                    </Boton>
                    <Boton onClick={() => void enviar('borrador')} disabled={ocupado} cargando={enviando === 'borrador' && CARGANDO.borrador}>
                      Frenar
                    </Boton>
                  </>
                )}
              </div>
            </form>
          ) : (
            <p className="text-sm text-fg/45">{SOLO_LECTURA[vista.estado]}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function Dato({ nombre, children }: { nombre: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4">
      <dt className="w-24 shrink-0 text-fg/45">{nombre}</dt>
      <dd className="min-w-0 break-words text-fg">{children}</dd>
    </div>
  )
}

function Ficha({ vista }: { vista: Vista }) {
  return (
    <section className="pn-glass rounded-[20px] p-5 lg:col-start-2 lg:row-start-1">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
        <EstadoTexto estado={vista.estado} />
        <span className="text-fg/25" aria-hidden>
          ·
        </span>
        <span className="text-fg/55">
          {vista.tipo === 'carrusel' ? `${TIPO_LABEL.carrusel} de ${vista.laminas.length} láminas` : TIPO_LABEL.reel}
        </span>
      </p>
      <h1 className="mt-2 text-xl font-semibold tracking-tight text-fg">{vista.titulo}</h1>
      <dl className="mt-4 space-y-2.5 text-sm">
        <Dato nombre="Cuándo">
          {nombreDia(diaCR(vista.publicar_en))}, {horaCR(vista.publicar_en)} <span className="text-fg/40">(hora de Costa Rica)</span>
        </Dato>
        <Dato nombre="Facebook">{vista.facebook ? 'Sí, también sale ahí' : 'No'}</Dato>
        <Dato nombre="«Comenta»">{vista.palabra ? vista.palabra.toUpperCase() : 'No tiene'}</Dato>
        {vista.ultimo_error && (
          <Dato nombre="Último error">
            <span className="text-red-300">{vista.ultimo_error}</span>
          </Dato>
        )}
      </dl>
      {(vista.instagram || vista.facebookUrl) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {vista.instagram && <Enlace href={vista.instagram}>Ver en Instagram</Enlace>}
          {vista.facebookUrl && <Enlace href={vista.facebookUrl}>Ver en Facebook</Enlace>}
        </div>
      )}
    </section>
  )
}

function Enlace({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="pn-btn-glass inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium">
      {children}
      <ExternalLink size={12} strokeWidth={1.5} absoluteStrokeWidth aria-hidden />
    </a>
  )
}

// Cuánto le queda al texto. Manda la revisión del servidor (la misma del cron): esto solo avisa antes
function Conteo({ texto }: { texto: string }) {
  const largo = texto.trim().length
  const hashtags = texto.match(/#[\p{L}\p{N}_]+/gu)?.length ?? 0
  return (
    <span className="mt-1 flex justify-end gap-3 text-[11px] tabular-nums text-fg/40">
      <span className={largo > 2200 ? 'text-red-300' : ''}>{largo} de 2200 letras</span>
      <span className={hashtags > 5 ? 'text-red-300' : ''}>{hashtags} de 5 hashtags</span>
    </span>
  )
}

interface BotonProps {
  children: React.ReactNode
  principal?: boolean
  type?: 'button' | 'submit'
  onClick?: () => void
  disabled: boolean
  cargando: string | false // el texto mientras trabaja
}

function Boton({ children, principal, type = 'button', onClick, disabled, cargando }: BotonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${principal ? 'pn-btn-solid font-semibold' : 'pn-btn-glass font-medium'} px-4 py-2 text-sm disabled:opacity-40`}
    >
      {cargando || children}
    </button>
  )
}
