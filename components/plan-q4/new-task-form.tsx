'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { PERSONAS, PERSONA_NAMES, type Persona, type Tipo } from '@/lib/plan-q4/types'
import { MAX_DESCRIPCION, MAX_INSTRUCCIONES, MAX_TITULO } from '@/lib/plan-q4/validate'
import { Field, FIELD_CLASS } from '@/components/plan-q4/field'
import { sendJson } from '@/components/plan-q4/send-json'

interface Props {
  bloque: string
  defaultResponsable: Persona
  today: string
  onClose: () => void
}

export function NewTaskForm({ bloque, defaultResponsable, today, onClose }: Props) {
  const router = useRouter()
  const [titulo, setTitulo] = useState('')
  const [tipo, setTipo] = useState<Tipo>('unica')
  const [fecha, setFecha] = useState(today)
  const [responsable, setResponsable] = useState<Persona>(defaultResponsable)
  const [apoyo, setApoyo] = useState<Persona | ''>('')
  const [descripcion, setDescripcion] = useState('')
  const [instrucciones, setInstrucciones] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, startRefresh] = useTransition()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    const err = await sendJson('/api/plan-q4/tasks', 'POST', { bloque, titulo, responsable, apoyo: apoyo || null, fecha, tipo, descripcion, instrucciones })
    setBusy(false)
    if (err) return setError(err)
    startRefresh(() => router.refresh())
    onClose()
  }

  return (
    <form onSubmit={submit} className="mt-3 grid gap-3 sm:grid-cols-2 border-t border-white/[0.06] pt-4">
      <Field label="Tarea" className="sm:col-span-2">
        <input autoFocus required maxLength={MAX_TITULO} value={titulo} onChange={(e) => setTitulo(e.target.value)} className={FIELD_CLASS} />
      </Field>
      <Field label="Qué es" className="sm:col-span-2">
        <textarea rows={2} required maxLength={MAX_DESCRIPCION} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="Para qué es esta tarea, en una o dos frases" className={FIELD_CLASS} />
      </Field>
      <Field label="Cómo hacerlo" className="sm:col-span-2">
        <textarea rows={4} required maxLength={MAX_INSTRUCCIONES} value={instrucciones} onChange={(e) => setInstrucciones(e.target.value)} placeholder={'1. Primer paso\n2. Segundo paso'} className={FIELD_CLASS} />
      </Field>
      <Field label="Tipo">
        <select value={tipo} onChange={(e) => setTipo(e.target.value as Tipo)} className={FIELD_CLASS}>
          <option value="unica">Única</option>
          <option value="semanal">Semanal</option>
        </select>
      </Field>
      <Field label={tipo === 'semanal' ? 'Desde' : 'Fecha límite'}>
        <input type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} className={FIELD_CLASS} />
      </Field>
      <Field label="Responsable">
        <select
          value={responsable}
          onChange={(e) => {
            const next = e.target.value as Persona
            setResponsable(next)
            if (apoyo === next) setApoyo('')
          }}
          className={FIELD_CLASS}
        >
          {PERSONAS.map((p) => (
            <option key={p} value={p}>{PERSONA_NAMES[p]}</option>
          ))}
        </select>
      </Field>
      <Field label="Apoyo">
        <select value={apoyo} onChange={(e) => setApoyo(e.target.value as Persona | '')} className={FIELD_CLASS}>
          <option value="">Nadie</option>
          {PERSONAS.filter((p) => p !== responsable).map((p) => (
            <option key={p} value={p}>{PERSONA_NAMES[p]}</option>
          ))}
        </select>
      </Field>
      {error && <p className="sm:col-span-2 text-xs text-red-300">{error}</p>}
      <div className="sm:col-span-2 flex gap-2">
        <button type="submit" disabled={busy} className="pn-btn-solid px-4 py-2 text-sm font-semibold disabled:opacity-40">
          {busy ? 'Creando…' : 'Crear tarea'}
        </button>
        <button type="button" onClick={onClose} className="px-4 py-2 text-sm rounded-lg text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors">
          Cancelar
        </button>
      </div>
    </form>
  )
}
