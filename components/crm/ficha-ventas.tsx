'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { dinero } from '@/lib/crm/tablero'
import { ESTADO_OPORTUNIDAD_LABEL, ESTADOS_OPORTUNIDAD, type EstadoOportunidad } from '@/lib/crm/tipos'
import type { OportunidadVista, PipelineVista } from '@/lib/crm/vista'
import { Aviso, Boton, CAMPO, ETIQUETA, ICONO, Seccion } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

// Las oportunidades de venta del contacto: en qué etapa van, si se ganó o se perdió y cuánto vale cada una
export function Ventas({
  contactoId,
  nombreContacto,
  oportunidades,
  pipelines,
}: {
  contactoId: string
  nombreContacto: string
  oportunidades: OportunidadVista[]
  pipelines: PipelineVista[]
}) {
  const [creando, setCreando] = useState(false)
  const abiertas = oportunidades.filter((o) => o.estado === 'abierta').length
  const hayEtapas = pipelines.some((p) => p.etapas.length > 0)
  return (
    <Seccion
      titulo="Ventas"
      cuenta={abiertas}
      accion={
        hayEtapas &&
        !creando && (
          <button type="button" onClick={() => setCreando(true)} className="pn-btn-glass inline-flex items-center gap-1 px-3 py-1 text-xs font-medium">
            <Plus size={13} {...ICONO} />
            Nueva
          </button>
        )
      }
    >
      {creando && <NuevaOportunidad contactoId={contactoId} nombreContacto={nombreContacto} pipelines={pipelines} cerrar={() => setCreando(false)} />}
      {oportunidades.length === 0 ? (
        !creando && <p className="text-sm text-fg/45">No tiene oportunidades de venta.</p>
      ) : (
        <ul className="space-y-3">
          {oportunidades.map((o) => (
            // key con los datos: si cambian en el servidor, el formulario arranca de nuevo con lo que hay
            <Oportunidad key={`${o.id}:${o.etapa_id}:${o.estado}:${o.valor}`} o={o} pipelines={pipelines} />
          ))}
        </ul>
      )}
    </Seccion>
  )
}

function Oportunidad({ o, pipelines }: { o: OportunidadVista; pipelines: PipelineVista[] }) {
  const { enviar, ocupado, error } = useEnvio()
  const pipeline = pipelines.find((p) => p.id === o.pipeline_id)
  const [etapa, setEtapa] = useState(o.etapa_id)
  const [estado, setEstado] = useState<EstadoOportunidad>(o.estado)
  const [valor, setValor] = useState(o.valor ? String(o.valor) : '')
  const valorNumero = Number(valor.replace(/[$,\s]/g, '') || 0)
  const cambio = {
    ...(etapa !== o.etapa_id ? { etapa_id: etapa } : {}),
    ...(estado !== o.estado ? { estado } : {}),
    ...(valorNumero !== o.valor ? { valor } : {}),
  }
  const sucio = Object.keys(cambio).length > 0

  return (
    <li className="rounded-[14px] bg-fg/[0.035] p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="break-words text-sm font-medium text-fg">{o.nombre}</p>
          {pipelines.length > 1 && pipeline && <p className="text-xs text-fg/45">{pipeline.nombre}</p>}
        </div>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${o.estado === 'abierta' ? 'bg-fg/[0.08] text-fg/75' : o.estado === 'ganada' ? 'bg-emerald-500/10 text-emerald-300' : 'bg-fg/[0.04] text-fg/45'}`}>
          {ESTADO_OPORTUNIDAD_LABEL[o.estado]}
          {o.valor > 0 && ` · ${dinero(o.valor)}`}
        </span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          void enviar(`/api/crm/oportunidades/${o.id}`, 'PATCH', cambio)
        }}
        className="mt-3 grid grid-cols-2 gap-2"
      >
        <label className="col-span-2 block">
          <span className={ETIQUETA}>Etapa</span>
          <select value={etapa} onChange={(e) => setEtapa(e.target.value)} disabled={ocupado} className={CAMPO}>
            {(pipeline?.etapas ?? []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={ETIQUETA}>Estado</span>
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoOportunidad)} disabled={ocupado} className={CAMPO}>
            {ESTADOS_OPORTUNIDAD.map((s) => (
              <option key={s} value={s}>
                {ESTADO_OPORTUNIDAD_LABEL[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className={ETIQUETA}>Valor (USD)</span>
          <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} disabled={ocupado} placeholder="0" className={CAMPO} />
        </label>
        {error && (
          <div className="col-span-2">
            <Aviso>{error.texto}</Aviso>
          </div>
        )}
        {sucio && (
          <div className="col-span-2 flex flex-wrap gap-2 pt-1">
            <Boton principal type="submit" disabled={ocupado}>
              {ocupado ? 'Guardando…' : 'Guardar cambios'}
            </Boton>
            <Boton
              disabled={ocupado}
              onClick={() => {
                setEtapa(o.etapa_id)
                setEstado(o.estado)
                setValor(o.valor ? String(o.valor) : '')
              }}
            >
              Deshacer
            </Boton>
          </div>
        )}
      </form>
    </li>
  )
}

function NuevaOportunidad({
  contactoId,
  nombreContacto,
  pipelines,
  cerrar,
}: {
  contactoId: string
  nombreContacto: string
  pipelines: PipelineVista[]
  cerrar: () => void
}) {
  const { enviar, ocupado, error } = useEnvio()
  const primera = pipelines.find((p) => p.etapas.length > 0)?.etapas[0]?.id ?? ''
  const [nombre, setNombre] = useState(nombreContacto)
  const [etapa, setEtapa] = useState(primera)
  const [valor, setValor] = useState('')

  async function crear(e: React.FormEvent) {
    e.preventDefault()
    if (await enviar(`/api/crm/contactos/${contactoId}/oportunidades`, 'POST', { nombre, etapa_id: etapa, valor })) cerrar()
  }

  return (
    <form onSubmit={crear} className="mb-4 space-y-2 rounded-[14px] bg-fg/[0.035] p-3.5">
      <p className="text-sm font-medium text-fg">Nueva oportunidad</p>
      <label className="block">
        <span className={ETIQUETA}>Nombre</span>
        <input value={nombre} onChange={(e) => setNombre(e.target.value)} disabled={ocupado} placeholder="Qué le vas a vender" className={CAMPO} />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="col-span-2 block sm:col-span-1">
          <span className={ETIQUETA}>Etapa</span>
          <select value={etapa} onChange={(e) => setEtapa(e.target.value)} disabled={ocupado} className={CAMPO}>
            {pipelines.map((p) =>
              pipelines.length > 1 ? (
                <optgroup key={p.id} label={p.nombre}>
                  {p.etapas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nombre}
                    </option>
                  ))}
                </optgroup>
              ) : (
                p.etapas.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))
              ),
            )}
          </select>
        </label>
        <label className="col-span-2 block sm:col-span-1">
          <span className={ETIQUETA}>Valor (USD)</span>
          <input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} disabled={ocupado} placeholder="0" className={CAMPO} />
        </label>
      </div>
      {error && <Aviso>{error.texto}</Aviso>}
      <div className="flex flex-wrap gap-2 pt-1">
        <Boton principal type="submit" disabled={ocupado || !nombre.trim() || !etapa}>
          {ocupado ? 'Creando…' : 'Crear oportunidad'}
        </Boton>
        <Boton onClick={cerrar} disabled={ocupado}>
          Cancelar
        </Boton>
      </div>
    </form>
  )
}
