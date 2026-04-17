import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contractDataSchema } from '@/lib/contracts/schema'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Only draft contracts can be edited
  const { data: existing } = await supabase
    .from('contracts')
    .select('id, status')
    .eq('id', id)
    .single()

  if (!existing) return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
  if (existing.status !== 'draft' && existing.status !== 'sent') {
    return NextResponse.json({ error: 'Only draft or sent contracts can be edited' }, { status: 409 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { data: formData, client_id } = body as { data: unknown; client_id?: string }

  const parsed = contractDataSchema.safeParse(formData)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { data: contract, error } = await supabase
    .from('contracts')
    .update({
      data: parsed.data,
      client_id: client_id ?? null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ contract })
}
