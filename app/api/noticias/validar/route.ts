import { NextResponse } from 'next/server'
import { hasNewsApiKey } from '@/lib/news/api-key'
import { parseValidate } from '@/lib/news/payload'
import { validateDraft } from '@/lib/news/rules'

// n8n revisa cada borrador antes de seguir (y lo reescribe una vez con estos problemas)
export async function POST(req: Request) {
  if (!hasNewsApiKey(req)) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const parsed = parseValidate(await req.json().catch(() => null))
  if (!parsed.ok) return NextResponse.json({ ok: false, problemas: parsed.problems }, { status: 400 })
  const { idioma, borrador, fuente_url, fuente_nombre, fuente_texto } = parsed.value
  const problemas = validateDraft(borrador, idioma, { fuente_url, fuente_nombre, fuente_texto })
  return NextResponse.json({ ok: problemas.length === 0, problemas })
}
