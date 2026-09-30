import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireApiPermission } from '@/lib/panel-session'

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { denied } = await requireApiPermission('can_view_contracts')
  if (denied) return denied

  const { data: contract } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!contract) return NextResponse.json({ error: 'No encontrado' }, { status: 404 })

  if (contract.status !== 'draft') {
    return NextResponse.json(
      { error: 'Solo se pueden eliminar contratos en borrador' },
      { status: 409 },
    )
  }

  await supabase.from('contract_events').delete().eq('contract_id', id)
  const { error } = await supabase.from('contracts').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
