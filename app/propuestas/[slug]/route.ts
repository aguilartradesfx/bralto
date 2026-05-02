import { createServiceClient } from '@/lib/supabase/service'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('generated_proposals')
    .select('html_content, expires_at')
    .eq('slug', slug)
    .single()

  if (!data || new Date(data.expires_at) < new Date()) {
    return new Response('Propuesta no encontrada o expirada.', { status: 404 })
  }

  return new Response(data.html_content, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  })
}
