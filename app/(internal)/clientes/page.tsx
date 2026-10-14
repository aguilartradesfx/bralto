import { createClient } from '@/lib/supabase/server'
import { Users } from 'lucide-react'
import type { ClientRow } from '@/types/contracts'

export const metadata = { title: 'Clientes' }

export default async function ClientesPage() {
  const supabase = await createClient()

  const { data: clientsData } = await supabase
    .from('clients')
    .select('*')
    .order('empresa_nombre')

  const clients = clientsData ?? []

  return (
    <div className="p-4 md:p-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-xl font-semibold text-fg">Clientes</h1>
          <p className="text-sm text-fg/40 mt-0.5">{clients?.length ?? 0} cliente(s)</p>
        </div>
      </div>

      {clients.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Users size={32} className="text-fg/10 mb-3" />
          <p className="text-fg/30 text-sm">
            Los clientes se crean al guardar el primer contrato.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-fg/[0.08] overflow-hidden">
          <table className="w-full">
            <thead className="bg-fg/[0.03] border-b border-fg/[0.06]">
              <tr>
                <th className="text-left px-4 py-3 text-xs text-fg/40 font-medium">Empresa</th>
                <th className="text-left px-4 py-3 text-xs text-fg/40 font-medium">Representante</th>
                <th className="text-left px-4 py-3 text-xs text-fg/40 font-medium">Correo</th>
                <th className="text-left px-4 py-3 text-xs text-fg/40 font-medium">Cédula</th>
                <th className="text-left px-4 py-3 text-xs text-fg/40 font-medium">Registrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-fg/[0.04]">
              {(clients as ClientRow[]).map((client) => (
                <tr key={client.id} className="hover:bg-fg/[0.02] transition-colors">
                  <td className="px-4 py-3 text-sm text-fg font-medium">
                    {client.empresa_nombre}
                  </td>
                  <td className="px-4 py-3 text-sm text-fg/60">
                    {client.representante_nombre ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-fg/60">
                    {client.correo_notificaciones ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-fg/50 font-mono text-xs">
                    {client.cedula_juridica ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-xs text-fg/30">
                    {new Date(client.created_at).toLocaleDateString('es-CR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
