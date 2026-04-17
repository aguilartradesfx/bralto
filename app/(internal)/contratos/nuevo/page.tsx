import { createClient } from '@/lib/supabase/server'
import { ContractForm } from '@/components/contracts/contract-form'
import type { ClientRow } from '@/types/contracts'

export const metadata = { title: 'Nuevo contrato' }

export default async function NuevoContratoPage() {
  const supabase = await createClient()

  const { data: clientsData } = await supabase
    .from('clients')
    .select('*')
    .order('empresa_nombre')

  return (
    <div className="h-screen flex flex-col">
      <div className="border-b border-white/[0.06] px-6 py-4 flex items-center gap-3 shrink-0">
        <a href="/contratos" className="text-white/30 hover:text-white/60 text-sm transition-colors">
          ← Contratos
        </a>
        <span className="text-white/20">/</span>
        <span className="text-sm text-white/70">Nuevo contrato</span>
      </div>
      <div className="flex-1 overflow-hidden">
        <ContractForm clients={(clientsData ?? []) as ClientRow[]} />
      </div>
    </div>
  )
}
