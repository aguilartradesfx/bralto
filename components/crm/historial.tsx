'use client'

import { useMemo, useState } from 'react'
import { Activity, FileText, Image as ImagenIcono, Music, Paperclip, PhoneIncoming, PhoneOutgoing, Video } from 'lucide-react'
import { horaCR } from '@/lib/calendario/fechas'
import { esLargo, nombreDelDia, porDia, textoLlamada, unirMensajes } from '@/lib/crm/historial'
import { CANAL_LABEL, tipoArchivo, type AdjuntoMensaje } from '@/lib/crm/tipos'
import type { Cursor, Historial as HistorialDatos, MensajeVista } from '@/lib/crm/vista'
import { Aviso, CanalIcono, ICONO } from '@/components/crm/piezas'

// Los mensajes de todos los canales en una sola línea de tiempo, lo más nuevo arriba y por día. Lo que entró va a
// la izquierda y lo que salió, a la derecha (como en el teléfono). Los avisos del sistema van discretos, al centro
export function Historial({ contactoId, inicial, ahora }: { contactoId: string; inicial: HistorialDatos; ahora: string }) {
  const [mas, setMas] = useState<MensajeVista[]>([])
  const [siguiente, setSiguiente] = useState<Cursor | null>(null)
  const [pidio, setPidio] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Si la página se pone al día (una nota, un cambio), lo que ya se cargó con «Ver más» se queda
  const mensajes = useMemo(() => unirMensajes(inicial.mensajes, mas), [inicial.mensajes, mas])
  const cursor = pidio ? siguiente : inicial.siguiente
  const dias = porDia(mensajes)
  const hoy = new Date(ahora)

  async function verMas() {
    if (!cursor) return
    setCargando(true)
    setError(null)
    try {
      const res = await fetch(`/api/crm/contactos/${contactoId}/historial?antes=${encodeURIComponent(cursor.en)}&id=${cursor.id}`)
      const data = (await res.json().catch(() => null)) as (HistorialDatos & { error?: string }) | null
      if (!res.ok || !data) {
        setError(data?.error ?? 'No se pudieron traer más mensajes. Prueba de nuevo.')
        return
      }
      setMas((antes) => [...antes, ...data.mensajes])
      setSiguiente(data.siguiente)
      setPidio(true)
    } catch {
      setError('Sin conexión. Prueba de nuevo.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <section aria-labelledby="titulo-historial" className="pn-glass rounded-[20px] p-4 sm:p-5">
      <h2 id="titulo-historial" className="text-sm font-semibold text-fg">
        Historial
      </h2>
      <p className="mt-0.5 text-xs text-fg/45">Todo lo que se han escrito, por todos los canales. Lo más nuevo, arriba.</p>

      {mensajes.length === 0 ? (
        <p className="mt-6 pb-2 text-center text-sm text-fg/45">Todavía no hay mensajes con esta persona.</p>
      ) : (
        <ol className="mt-4 space-y-5">
          {dias.map(([dia, lista]) => (
            <li key={dia}>
              <h3 className="mb-2.5 text-center text-[11px] font-medium uppercase tracking-wide text-fg/40">{nombreDelDia(dia, hoy)}</h3>
              <ul className="space-y-2.5">
                {lista.map((m) => (
                  <Mensaje key={m.id} m={m} />
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}

      {error && (
        <div className="mt-4">
          <Aviso>{error}</Aviso>
        </div>
      )}
      {cursor && (
        <div className="mt-5 flex justify-center">
          <button type="button" onClick={() => void verMas()} disabled={cargando} className="pn-btn-glass px-4 py-2 text-sm font-medium disabled:opacity-40">
            {cargando ? 'Trayendo…' : 'Ver más'}
          </button>
        </div>
      )}
    </section>
  )
}

function Mensaje({ m }: { m: MensajeVista }) {
  const hora = horaCR(m.enviado_en)

  // Avisos del sistema: una línea chiquita al centro
  if (m.tipo === 'actividad') {
    return (
      <li className="flex items-start justify-center gap-1.5 px-2 text-center text-[11px] leading-4 text-fg/40">
        <Activity size={11} {...ICONO} className="mt-0.5 shrink-0" />
        <span className="min-w-0 break-words">
          {m.texto ?? 'Aviso'} <span className="tabular-nums text-fg/30">· {hora}</span>
        </span>
      </li>
    )
  }

  const sale = m.direccion === 'saliente'
  const lado = sale ? 'justify-end' : 'justify-start'

  if (m.tipo === 'llamada') {
    const Icono = sale ? PhoneOutgoing : PhoneIncoming
    return (
      <li className={`flex ${lado}`}>
        <p className="inline-flex max-w-[85%] items-center gap-2 rounded-full bg-fg/[0.05] px-3.5 py-1.5 text-xs text-fg/70">
          <Icono size={13} {...ICONO} className="shrink-0" />
          <span className="min-w-0 truncate">{textoLlamada(m.direccion, m.llamada)}</span>
          <span className="shrink-0 tabular-nums text-fg/40">{hora}</span>
        </p>
      </li>
    )
  }

  return (
    <li className={`flex ${lado}`}>
      <div className={`min-w-0 max-w-[88%] rounded-2xl px-3.5 py-2.5 sm:max-w-[80%] ${sale ? 'rounded-tr-md bg-fg/[0.1]' : 'rounded-tl-md bg-fg/[0.045]'}`}>
        <p className="mb-1 flex items-center gap-1.5 text-[11px] text-fg/45">
          <CanalIcono canal={m.canal} size={11} />
          <span>{CANAL_LABEL[m.canal]}</span>
          <span className="sr-only">{sale ? ', le escribiste' : ', te escribió'}</span>
          <span aria-hidden>·</span>
          <span className="tabular-nums">{hora}</span>
        </p>
        {m.asunto && <p className="mb-1 break-words text-sm font-medium text-fg">{m.asunto}</p>}
        {m.texto ? <Texto texto={m.texto} /> : m.tipo === 'correo' && <p className="text-sm italic text-fg/40">Correo sin texto guardado</p>}
        {m.adjuntos.length > 0 && <Adjuntos adjuntos={m.adjuntos} />}
        {m.estado === 'fallo' && <p className="mt-1.5 text-[11px] text-red-300">No se entregó</p>}
      </div>
    </li>
  )
}

// El texto tal cual (siempre texto plano, nunca HTML), cortado si es largo
function Texto({ texto }: { texto: string }) {
  const [abierto, setAbierto] = useState(false)
  const largo = esLargo(texto)
  return (
    <>
      <p className={`whitespace-pre-wrap break-words text-sm leading-relaxed text-fg/85 ${largo && !abierto ? 'line-clamp-6' : ''}`}>{texto}</p>
      {largo && (
        <button type="button" onClick={() => setAbierto(!abierto)} className="mt-1 text-xs font-medium text-fg/60 underline-offset-2 hover:text-fg hover:underline">
          {abierto ? 'Ver menos' : 'Ver todo'}
        </button>
      )}
    </>
  )
}

const ICONO_ARCHIVO: Record<string, typeof FileText> = { Foto: ImagenIcono, Video, Audio: Music, PDF: FileText, Archivo: Paperclip }
const ABRIR: Record<string, string> = { Foto: 'Ver foto', Video: 'Ver video', Audio: 'Escuchar audio', PDF: 'Ver PDF', Archivo: 'Bajar archivo' }

function Adjuntos({ adjuntos }: { adjuntos: AdjuntoMensaje[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5">
      {adjuntos.map((a, i) => {
        const tipo = tipoArchivo(a.tipo)
        const Icono = ICONO_ARCHIVO[tipo]
        return (
          <li key={a.id ?? `perdido-${i}`}>
            {a.id ? (
              <a
                href={`/api/crm/adjuntos/${a.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="pn-btn-glass inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium"
              >
                <Icono size={12} {...ICONO} />
                {ABRIR[tipo]}
              </a>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs text-fg/35 ring-1 ring-inset ring-fg/10">
                <Icono size={12} {...ICONO} />
                {tipo} que ya no está
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
