import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { contractDataSchema } from '@/lib/contracts/schema'
import { generateContractSlug } from '@/lib/contracts/slug'

export async function POST(req: Request) {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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

  const slug = generateContractSlug(parsed.data.cliente.empresa_nombre)

  const { data: contract, error } = await supabase
    .from('contracts')
    .insert({
      slug,
      status: 'draft',
      data: parsed.data,
      template_version: 'v1',
      client_id: client_id ?? null,
      created_by: user.id,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Log creation event
  await supabase.from('contract_events').insert({
    contract_id: contract.id,
    event_type: 'created',
    metadata: { created_by: user.id },
  })

  return NextResponse.json({ contract }, { status: 201 })
}
