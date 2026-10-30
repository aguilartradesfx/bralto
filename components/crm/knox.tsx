'use client'

import { useState } from 'react'
import Link from 'next/link'
import { AlertTriangle, Bot, RotateCcw, Sparkles } from 'lucide-react'
import { fechaHora, haceCuanto } from '@/lib/crm/fechas'
import { CANAL_LABEL } from '@/lib/crm/tipos'
import { CANALES_KNOX, MODOS_KNOX, type CanalKnox, type DecisionKnox, type ModoKnox } from '@/lib/knox/conversar/tipos'
import {
  ACCION_LABEL,
  ESTADO_DECISION_LABEL,
  MODO_AYUDA,
  MODO_LABEL,
  TIPO_LABEL,
  type AjustesKnox,
  type DecisionLista,
} from '@/lib/crm/bandeja/vista'
import { MAX_FICHA } from '@/lib/crm/bandeja/validar'
import { Aviso, CAMPO, CanalIcono, Encabezado, ICONO, Seccion, SubMenu } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

interface Props {
  ajustes: AjustesKnox
  decisiones: DecisionLista[]
  otraApp: { total: number; messenger: number }
  ahora: string
}

// Knox: cómo trabaja (modo), lo que puede decir (ficha), una prueba sin mandar nada y lo último que decidió
export function PanelKnox({ ajustes, decisiones, otraApp, ahora }: Props) {
  const [ficha, setFicha] = useState(ajustes.ficha)
  return (
    <div className="max-w-3xl p-4 md:p-6 lg:p-8">
      <Encabezado titulo="Knox" resumen="Tu asistente para los mensajes de Instagram, Messenger y WhatsApp" />
      <SubMenu activa="/crm/knox" />
      <div className="space-y-4">
        {otraApp.total > 0 && (
          <p role="status" className="pn-glass flex items-start gap-2.5 rounded-[16px] px-4 py-3.5 text-sm leading-snug text-amber-300">
            <AlertTriangle size={16} {...ICONO} className="mt-0.5 shrink-0" />
            <span>
              GoHighLevel todavía tiene el control de tu página de Facebook
              {otraApp.messenger > 0 ? ` (${otraApp.messenger === 1 ? '1 conversación' : `${otraApp.messenger} conversaciones`} de Messenger)` : ''}. Ahí Knox no
              puede contestar. Desconecta la página en GoHighLevel para que Knox (y tú desde aquí) puedan contestar.
            </span>
          </p>
        )}
        <Modo actual={ajustes.modo} />
        <Ficha ficha={ficha} setFicha={setFicha} guardada={ajustes.ficha} actualizadoEn={ajustes.actualizadoEn} ahora={ahora} />
        <Probar ficha={ficha} />
        <Decisiones decisiones={decisiones} ahora={ahora} />
      </div>
    </div>
  )
}

function Modo({ actual }: { actual: ModoKnox }) {
  const { enviar, ocupado, error } = useEnvio()
  return (
    <Seccion titulo="Cómo trabaja Knox">
      <div role="radiogroup" aria-label="Modo de Knox" className="grid gap-2 sm:grid-cols-3">
        {MODOS_KNOX.map((m) => {
          const on = m === actual
          return (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={on}
              disabled={ocupado}
              onClick={() => !on && void enviar('/api/crm/knox', 'PATCH', { modo: m })}
              className={`flex flex-col items-start gap-1 rounded-[16px] px-4 py-3 text-left transition-colors disabled:opacity-60 ${on ? 'pn-chip-on' : 'ring-1 ring-inset ring-fg/[0.1] hover:bg-fg/[0.04]'}`}
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-fg">
                <span aria-hidden className={`grid h-4 w-4 place-items-center rounded-full ring-1 ring-inset ${on ? 'ring-fg' : 'ring-fg/30'}`}>
                  {on && <span className="h-2 w-2 rounded-full bg-fg" />}
                </span>
                {MODO_LABEL[m]}
              </span>
              <span className="text-xs leading-snug text-fg/55">{MODO_AYUDA[m]}</span>
            </button>
          )
        })}
      </div>
      {error && (
        <div className="mt-2">
          <Aviso>{error.texto}</Aviso>
        </div>
      )}
    </Seccion>
  )
}

function Ficha({
  ficha,
  setFicha,
  guardada,
  actualizadoEn,
  ahora,
}: {
  ficha: string
  setFicha: (f: string) => void
  guardada: string
  actualizadoEn: string | null
  ahora: string
}) {
  const { enviar, ocupado, error } = useEnvio()
  const [listo, setListo] = useState(false)
  const cambio = ficha.trim() !== guardada.trim()

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    setListo(false)
    if (await enviar('/api/crm/knox', 'PATCH', { ficha })) setListo(true)
  }

  return (
    <Seccion titulo="Ficha">
      <form onSubmit={guardar} className="space-y-2">
        <p className="text-xs leading-snug text-fg/55">
          Lo único que Knox puede decir de Bralto: servicios, precios, el diagnóstico, las guías y las sesiones. Lo que no esté aquí, Knox no lo
          inventa: te lo pasa.
        </p>
        <label className="block">
          <span className="sr-only">Ficha de Knox</span>
          <textarea
            rows={12}
            value={ficha}
            onChange={(e) => {
              setFicha(e.target.value)
              setListo(false)
            }}
            disabled={ocupado}
            maxLength={MAX_FICHA}
            placeholder="Por ejemplo: qué hace Bralto, cuánto cuesta el diagnóstico y cómo se agenda…"
            className={`${CAMPO} resize-y leading-relaxed`}
          />
        </label>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] tabular-nums text-fg/40">
            {ficha.length.toLocaleString('es-CR')} letras
            {actualizadoEn && ` · guardada ${fechaHora(actualizadoEn, new Date(ahora)).replace(/^Hoy/, 'hoy').replace(/^Ayer/, 'ayer')}`}
          </p>
          <button type="submit" disabled={ocupado || !cambio} className="pn-btn-solid px-4 py-2 text-sm font-semibold disabled:opacity-40">
            {ocupado ? 'Guardando…' : 'Guardar ficha'}
          </button>
        </div>
        {error && <Aviso>{error.texto}</Aviso>}
        {listo && !cambio && <Aviso ok>Listo: Knox ya usa esta ficha.</Aviso>}
      </form>
    </Seccion>
  )
}

type MensajePrueba = { autor: 'persona' | 'knox'; texto: string }

// Un chat inventado: escribes como si fueras el cliente y ves qué haría Knox. No guarda ni manda nada
function Probar({ ficha }: { ficha: string }) {
  const [canal, setCanal] = useState<CanalKnox>('instagram')
  const [chat, setChat] = useState<MensajePrueba[]>([])
  const [texto, setTexto] = useState('')
  const [decision, setDecision] = useState<DecisionKnox | null>(null)
  const [pensando, setPensando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function probar(e: React.FormEvent) {
    e.preventDefault()
    const t = texto.trim()
    if (!t) return
    const mensajes = [...chat, { autor: 'persona' as const, texto: t }]
    setPensando(true)
    setError(null)
    setDecision(null)
    try {
      const res = await fetch('/api/crm/knox/probar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ canal, mensajes, ficha }),
      })
      const data = (await res.json().catch(() => null)) as { decision?: DecisionKnox; error?: string } | null
      if (!res.ok || !data?.decision) {
        setError(data?.error ?? 'Knox no pudo contestar esta vez. Prueba de nuevo en un rato.')
        return
      }
      const d = data.decision
      setDecision(d)
      setChat(d.accion === 'responder' && d.respuesta ? [...mensajes, { autor: 'knox', texto: d.respuesta }] : mensajes)
      setTexto('')
    } catch {
      setError('Sin conexión. Prueba de nuevo.')
    } finally {
      setPensando(false)
    }
  }

  function deNuevo() {
    setChat([])
    setDecision(null)
    setError(null)
    setTexto('')
  }

  return (
    <Seccion
      titulo="Probar a Knox"
      accion={
        chat.length > 0 ? (
          <button type="button" onClick={deNuevo} className="inline-flex items-center gap-1.5 text-xs font-medium text-fg/55 transition-colors hover:text-fg">
            <RotateCcw size={13} {...ICONO} />
            Empezar de nuevo
          </button>
        ) : undefined
      }
    >
      <p className="text-xs leading-snug text-fg/55">Escribe como si fueras un cliente. Knox usa la ficha de arriba, aunque no la hayas guardado. No se guarda ni se le manda nada a nadie.</p>

      <div role="radiogroup" aria-label="Por dónde escribe el cliente" className="mt-3 flex flex-wrap gap-1.5">
        {CANALES_KNOX.map((c) => {
          const on = c === canal
          return (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={on}
              onClick={() => setCanal(c)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium ring-1 ring-inset transition-colors ${on ? 'pn-chip-on text-fg ring-transparent' : 'text-fg/60 ring-fg/[0.1] hover:text-fg'}`}
            >
              <CanalIcono canal={c} />
              {CANAL_LABEL[c]}
            </button>
          )
        })}
      </div>

      {chat.length > 0 && (
        <ul className="mt-4 space-y-2">
          {chat.map((m, i) => (
            <li key={i} className={`flex ${m.autor === 'knox' ? 'justify-end' : 'justify-start'}`}>
              <p
                className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2 text-sm leading-relaxed text-fg/90 ${m.autor === 'knox' ? 'rounded-tr-md bg-fg/[0.1] ring-1 ring-inset ring-fg/[0.14]' : 'rounded-tl-md bg-fg/[0.045]'}`}
              >
                {m.autor === 'knox' && (
                  <span className="mb-0.5 flex items-center gap-1 text-[11px] font-medium text-fg/55">
                    <Bot size={11} {...ICONO} />
                    Knox
                  </span>
                )}
                {m.texto}
              </p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={probar} className="mt-4 space-y-2">
        <label className="block">
          <span className="sr-only">Mensaje del cliente</span>
          <textarea
            rows={2}
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            disabled={pensando}
            maxLength={1000}
            placeholder={chat.length ? 'Sigue la conversación como el cliente…' : 'Por ejemplo: Hola, ¿cuánto cuesta una página web?'}
            className={`${CAMPO} resize-y leading-relaxed`}
          />
        </label>
        <button type="submit" disabled={pensando || !texto.trim()} className="pn-btn-solid inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold disabled:opacity-40">
          <Sparkles size={14} {...ICONO} />
          {pensando ? 'Knox está pensando…' : 'Ver qué contestaría'}
        </button>
        {error && <Aviso>{error}</Aviso>}
      </form>

      {decision && <Resultado d={decision} />}
    </Seccion>
  )
}

function Resultado({ d }: { d: DecisionKnox }) {
  const filas: [string, string | null][] = [
    ['Tipo', TIPO_LABEL[d.tipo]],
    ['Qué haría', ACCION_LABEL[d.accion]],
    ['Respuesta', d.respuesta],
    ['Aviso para ti', d.aviso],
    ['Por qué', d.motivo || null],
    ['Etiquetas', d.etiquetas.length ? d.etiquetas.join(', ') : null],
  ]
  return (
    <dl className="mt-4 divide-y divide-fg/[0.06] rounded-[16px] bg-fg/[0.04] px-4 ring-1 ring-inset ring-fg/[0.08]" aria-live="polite">
      {filas.map(([k, v]) => (
        <div key={k} className="grid gap-0.5 py-2.5 sm:grid-cols-[8rem_minmax(0,1fr)] sm:gap-3">
          <dt className="text-[11px] uppercase tracking-wide text-fg/40">{k}</dt>
          <dd className={`whitespace-pre-wrap break-words text-sm leading-relaxed ${v ? 'text-fg/85' : 'text-fg/35'}`}>{v ?? '—'}</dd>
        </div>
      ))}
    </dl>
  )
}

const ESTADO_TONO: Record<DecisionLista['estado'], string> = {
  pendiente: 'bg-fg/[0.1] text-fg',
  enviada: 'bg-fg/[0.06] text-fg/75',
  descartada: 'bg-fg/[0.04] text-fg/45',
  silencio: 'bg-fg/[0.04] text-fg/45',
  error: 'bg-fg/[0.06] text-red-300',
}

function Decisiones({ decisiones, ahora }: { decisiones: DecisionLista[]; ahora: string }) {
  return (
    <Seccion titulo="Lo último que decidió" cuenta={decisiones.length}>
      {decisiones.length === 0 ? (
        <p className="text-sm text-fg/45">Todavía nada. Cuando alguien te escriba, aquí vas a ver qué hizo Knox con cada mensaje.</p>
      ) : (
        <ul className="-mx-1 divide-y divide-fg/[0.06]">
          {decisiones.map((d) => (
            <li key={d.id}>
              <Link href={`/crm/mensajes/${d.conversacionId}`} className="block rounded-[12px] px-1 py-3 transition-colors hover:bg-fg/[0.03]">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="flex min-w-0 items-center gap-1.5 text-sm font-medium text-fg">
                    <CanalIcono canal={d.canal} className="text-fg/55" />
                    <span className="truncate">{d.nombre}</span>
                  </p>
                  <span className="shrink-0 text-[11px] tabular-nums text-fg/40">{haceCuanto(d.creadoEn, new Date(ahora))}</span>
                </div>
                <p className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className={`rounded-full px-2 py-0.5 font-medium ${ESTADO_TONO[d.estado]}`}>{ESTADO_DECISION_LABEL[d.estado]}</span>
                  {d.tipo && <span className="rounded-full bg-fg/[0.04] px-2 py-0.5 text-fg/60">{TIPO_LABEL[d.tipo]}</span>}
                  {d.accion && <span className="text-fg/50">{ACCION_LABEL[d.accion]}</span>}
                  <span className="text-fg/35">· {d.modo === 'automatico' ? 'automático' : 'ensayo'}</span>
                </p>
                {d.respuesta && <p className="mt-1.5 line-clamp-2 break-words text-[13px] leading-snug text-fg/70">«{d.respuesta}»</p>}
                {d.motivo && <p className="mt-1 line-clamp-2 break-words text-xs leading-snug text-fg/45">{d.motivo}</p>}
                {d.error && <p className="mt-1 line-clamp-2 break-words text-xs leading-snug text-red-300">{d.error}</p>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Seccion>
  )
}
