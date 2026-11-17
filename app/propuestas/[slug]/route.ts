import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { enlacePdfPublico } from '@/lib/proposals/archivos'

// La propuesta pública: su página, o su PDF si es solo PDF (?lang=es|en elige el idioma). Vencida, ya no se ve.
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = createServiceClient()

  const { data } = await supabase
    .from('generated_proposals')
    .select('id, html_content, expires_at')
    .eq('slug', slug)
    .maybeSingle()

  if (!data || new Date(data.expires_at) < new Date()) {
    return new Response('Propuesta no encontrada o expirada.', { status: 404 })
  }

  if (data.html_content) {
    return new Response(data.html_content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  }

  // Solo PDF: un enlace firmado que dura 10 minutos (el PDF no pasa por este servidor)
  const pdf = await enlacePdfPublico(data.id as string, new URL(request.url).searchParams.get('lang')).catch((err) => {
    console.error('[propuestas] pdf público', err instanceof Error ? err.message : err)
    return null
  })
  if (!pdf) return new Response('Propuesta no encontrada o expirada.', { status: 404 })
  return NextResponse.redirect(pdf, { status: 302, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' } })
}
