import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: existing } = await supabase
    .from('contracts')
    .select('id, slug, status')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  if (existing.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot send a cancelled contract' }, { status: 409 })
  }

  const { data: contract, error } = await supabase
    .from('contracts')
    .update({ status: 'sent', sent_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('contract_events').insert({
    contract_id: id,
    event_type: 'sent',
    metadata: { sent_by: user.id },
  })

  const publicUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/c/${contract.slug}`

  return NextResponse.json({ contract, publicUrl })
}
