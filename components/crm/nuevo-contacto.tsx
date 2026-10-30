'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { CampoEtiquetas } from '@/components/crm/campo-etiquetas'
import { Aviso, Boton, CAMPO, ETIQUETA, ICONO } from '@/components/crm/piezas'
import { useEnvio } from '@/components/crm/usar-envio'

// Lo mínimo para crear un contacto: el nombre. Lo demás se puede llenar después en su ficha
export function NuevoContacto({ etiquetas }: { etiquetas: string[] }) {
  const router = useRouter()
  const { enviar, ocupado, error } = useEnvio()
  const [datos, setDatos] = useState({ nombre: '', apellido: '', telefono: '', correo: '', empresa: '' })
  const [lista, setLista] = useState<string[]>([])
  const cambiar = (campo: keyof typeof datos) => (e: React.ChangeEvent<HTMLInputElement>) => setDatos({ ...datos, [campo]: e.target.value })

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    const r = await enviar<{ id: string }>('/api/crm/contactos', 'POST', { ...datos, etiquetas: lista }, { refrescar: false })
    if (r?.id) router.push(`/crm/${r.id}`)
  }

  return (
    <div className="max-w-xl p-4 md:p-6 lg:p-8">
      <Link href="/crm" className="mb-6 inline-flex items-center gap-1.5 text-sm text-fg/55 transition-colors hover:text-fg">
        <ArrowLeft size={14} {...ICONO} />
        Contactos
      </Link>
      <p className="font-mono text-[11px] uppercase tracking-widest text-fg/40">CRM</p>
      <h1 className="mb-5 mt-1 text-2xl font-semibold tracking-tight text-fg">Nuevo contacto</h1>

      <form onSubmit={guardar} className="pn-glass space-y-4 rounded-[20px] p-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className={ETIQUETA}>Nombre</span>
            <input required value={datos.nombre} onChange={cambiar('nombre')} disabled={ocupado} autoComplete="off" className={CAMPO} />
          </label>
          <label className="block">
            <span className={ETIQUETA}>Apellido</span>
            <input value={datos.apellido} onChange={cambiar('apellido')} disabled={ocupado} autoComplete="off" className={CAMPO} />
          </label>
        </div>
        <label className="block">
          <span className={ETIQUETA}>Teléfono</span>
          <input type="tel" inputMode="tel" value={datos.telefono} onChange={cambiar('telefono')} disabled={ocupado} placeholder="8888 1234" autoComplete="off" className={CAMPO} />
          <span className="mt-1 block text-xs text-fg/40">Si es de Costa Rica, con los 8 números basta. Si es de otro país, empieza con + y el código.</span>
        </label>
        <label className="block">
          <span className={ETIQUETA}>Correo</span>
          <input type="email" inputMode="email" value={datos.correo} onChange={cambiar('correo')} disabled={ocupado} autoComplete="off" className={CAMPO} />
        </label>
        <label className="block">
          <span className={ETIQUETA}>Empresa</span>
          <input value={datos.empresa} onChange={cambiar('empresa')} disabled={ocupado} autoComplete="off" className={CAMPO} />
        </label>
        <div>
          <span className={ETIQUETA}>Etiquetas</span>
          <CampoEtiquetas valor={lista} onChange={setLista} sugerencias={etiquetas} disabled={ocupado} />
        </div>
        {error && (
          <Aviso>
            {error.texto}{' '}
            {error.otro && (
              <Link href={`/crm/${error.otro.id}`} className="underline underline-offset-2">
                Ver su ficha
              </Link>
            )}
          </Aviso>
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Boton principal type="submit" disabled={ocupado || !datos.nombre.trim()}>
            {ocupado ? 'Guardando…' : 'Guardar contacto'}
          </Boton>
          <Link href="/crm" className="pn-btn-glass inline-flex items-center px-4 py-2 text-sm font-medium">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  )
}
