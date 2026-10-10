import { NextResponse } from 'next/server'
import { hasNewsApiKey } from '@/lib/news/api-key'
import { recentForDedup } from '@/lib/news/store'

export const dynamic = 'force-dynamic'

// Para que n8n no repita fuentes (todas, también las ocultas) ni temas de noticias (2 semanas) o artículos (60 días)
export async function GET(req: Request) {
  if (!hasNewsApiKey(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  return NextResponse.json(await recentForDedup())
}
