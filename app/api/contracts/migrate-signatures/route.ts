import { NextResponse } from 'next/server'
import { requireApiPermission } from '@/lib/panel-session'
import { createServiceClient } from '@/lib/supabase/service'
import { getBraltoSignatureDataUrl } from '@/lib/contracts/bralto-signature'

// One-time migration: replaces old SVG Bralto signature with new PNG on all contracts
export async function POST() {
  const { denied } = await requireApiPermission('is_admin')
  if (denied) return denied

  const supabase = createServiceClient()
  const newSig = getBraltoSignatureDataUrl()

  const { data: contracts, error: fetchError } = await supabase
    .from('contracts')
    .select('id, data, signature_bralto_data, signature_bralto_timestamp')

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

  let updated = 0

  for (const c of contracts ?? []) {
    // Skip if already has the new PNG signature
    if (c.signature_bralto_data?.startsWith('data:image/png')) continue

    const braltoTs = c.signature_bralto_timestamp ?? new Date().toISOString()

    const updatedData = {
      ...c.data,
      firma: {
        ...(c.data?.firma ?? {}),
        bralto_canvas: newSig,
        bralto_timestamp: braltoTs,
      },
    }

    await supabase
      .from('contracts')
      .update({
        signature_bralto_data: newSig,
        signature_bralto_timestamp: braltoTs,
        data: updatedData,
      })
      .eq('id', c.id)

    updated++
  }

  return NextResponse.json({ ok: true, updated, total: contracts?.length ?? 0 })
}
