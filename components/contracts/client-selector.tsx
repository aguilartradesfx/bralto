'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { ChevronDown, Plus, X } from 'lucide-react'
import type { ContractDataInput } from '@/lib/contracts/schema'
import type { ClientRow } from '@/types/contracts'

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: UseFormReturn<ContractDataInput, any, any>
  clients: ClientRow[]
  selectedClientId: string | null
  onClientSelect: (id: string | null) => void
}

export function ClientSelector({ form, clients, selectedClientId, onClientSelect }: Props) {
  const [showNew, setShowNew] = useState(false)

  const selectedClient = clients.find((c) => c.id === selectedClientId)

  function handleSelectClient(client: ClientRow) {
    onClientSelect(client.id)
    // Prefill form fields from client record
    if (client.empresa_nombre) form.setValue('cliente.empresa_nombre', client.empresa_nombre)
    if (client.representante_nombre) form.setValue('cliente.representante_nombre', client.representante_nombre)
    if (client.correo_notificaciones) {
      form.setValue('cliente.correo_notificaciones', client.correo_notificaciones)
      form.setValue('cliente.correo_facturacion', client.correo_notificaciones)
    }
    if (client.cedula_juridica) form.setValue('cliente.cedula_juridica', client.cedula_juridica)
  }

  return (
    <div className="space-y-3">
      {/* Client dropdown */}
      <div className="relative group">
        <select
          value={selectedClientId ?? ''}
          onChange={(e) => {
            const id = e.target.value
            if (!id) {
              onClientSelect(null)
              return
            }
            const client = clients.find((c) => c.id === id)
            if (client) handleSelectClient(client)
          }}
          className="w-full appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#5bb6ff]/60 focus:ring-1 focus:ring-[#5bb6ff]/30 transition-colors pr-10"
        >
          <option value="">— Seleccionar cliente existente —</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.empresa_nombre}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 pointer-events-none"
        />
      </div>

      {selectedClient && (
        <div className="flex items-center gap-2 px-3 py-2 bg-[#5bb6ff]/10 rounded-lg">
          <span className="text-xs text-[#5bb6ff] flex-1">
            Datos precargados desde <strong>{selectedClient.empresa_nombre}</strong>. Podés editar los campos abajo.
          </span>
          <button
            type="button"
            onClick={() => onClientSelect(null)}
            className="text-[#5bb6ff]/60 hover:text-[#5bb6ff]"
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Toggle new client inline */}
      <button
        type="button"
        onClick={() => setShowNew((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-white/40 hover:text-[#5bb6ff] transition-colors"
      >
        <Plus size={12} />
        {showNew ? 'Ocultar formulario de nuevo cliente' : 'Nuevo cliente (guardar en lista)'}
      </button>

      {showNew && <NewClientQuickForm onCreated={(client) => {
        handleSelectClient(client)
        setShowNew(false)
      }} />}
    </div>
  )
}

function NewClientQuickForm({ onCreated }: { onCreated: (client: ClientRow) => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const fd = new FormData(e.currentTarget)

    const res = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        empresa_nombre: fd.get('empresa_nombre'),
        cedula_juridica: fd.get('cedula_juridica'),
        representante_nombre: fd.get('representante_nombre'),
        correo_notificaciones: fd.get('correo_notificaciones'),
      }),
    })

    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error ?? 'Error al crear cliente')
      return
    }

    const { client } = await res.json()
    onCreated(client)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-4 bg-white/[0.02] border border-white/[0.06] rounded-lg space-y-3"
    >
      <p className="text-xs text-white/40 font-medium uppercase tracking-wider">Nuevo cliente</p>

      {[
        { name: 'empresa_nombre', label: 'Nombre de empresa', required: true },
        { name: 'cedula_juridica', label: 'Cédula jurídica' },
        { name: 'representante_nombre', label: 'Nombre del representante' },
        { name: 'correo_notificaciones', label: 'Correo de notificaciones' },
      ].map(({ name, label, required }) => (
        <div key={name}>
          <label className="block text-xs text-white/50 mb-1">
            {label} {required && <span className="text-[#5bb6ff]">*</span>}
          </label>
          <input
            name={name}
            required={required}
            className="w-full bg-white/5 border border-white/10 rounded-md px-3 py-2 text-sm text-white placeholder-white/20 focus:outline-none focus:border-[#5bb6ff]/60 transition-colors"
          />
        </div>
      ))}

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-[#5bb6ff] hover:bg-[#5bb6ff] disabled:opacity-50 text-white text-sm font-medium rounded-md px-4 py-2 transition-colors"
      >
        {loading ? 'Guardando...' : 'Guardar cliente'}
      </button>
    </form>
  )
}
