import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireApiPermission } from '@/lib/panel-session'
import { editableProposalFields } from '@/lib/proposals/editable'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { denied } = await requireApiPermission('can_submit_proposals')
  if (denied) return denied

  const service = createServiceClient()
  const { data, error } = await service
    .from('proposal_requests')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { denied } = await requireApiPermission('can_submit_proposals')
  if (denied) return denied

  const changes = editableProposalFields(await request.json().catch(() => null))
  if (Object.keys(changes).length === 0) {
    return NextResponse.json({ error: 'Nada para actualizar' }, { status: 400 })
  }

  const service = createServiceClient()
  const { data, error } = await service
    .from('proposal_requests')
    .update({ ...changes, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const { denied } = await requireApiPermission('can_submit_proposals')
  if (denied) return denied

  const service = createServiceClient()
  const { error } = await service
    .from('proposal_requests')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
