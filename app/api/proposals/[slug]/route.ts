import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

function validateApiKey(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  return !!key && key === process.env.PROPOSALS_API_KEY
}

interface Params {
  params: Promise<{ slug: string }>
}

export async function DELETE(req: Request, { params }: Params) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { slug } = await params
  const supabase = createServiceClient()

  const { error, count } = await supabase
    .from('generated_proposals')
    .delete({ count: 'exact' })
    .eq('slug', slug)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (count === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return new NextResponse(null, { status: 204 })
}
