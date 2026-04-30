import { NextResponse } from 'next/server'
import { nanoid } from 'nanoid'
import { createServiceClient } from '@/lib/supabase/service'

function validateApiKey(req: Request): boolean {
  const key = req.headers.get('x-api-key')
  return !!key && key === process.env.PROPOSALS_API_KEY
}

export async function POST(req: Request) {
  if (!validateApiKey(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { client_name, project_name, html_content, created_by } = body as Record<string, unknown>

  if (
    typeof client_name !== 'string' || !client_name ||
    typeof project_name !== 'string' || !project_name ||
    typeof html_content !== 'string' || !html_content ||
    typeof created_by !== 'string' || !created_by
  ) {
    return NextResponse.json(
      { error: 'Missing required fields: client_name, project_name, html_content, created_by' },
      { status: 400 },
    )
  }

  const slug = nanoid(12)
  const now = new Date()
  const expires_at = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString()

  const supabase = createServiceClient()
  const { error } = await supabase.from('generated_proposals').insert({
    slug,
    client_name,
    project_name,
    html_content,
    expires_at,
    created_by,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bralto.io'

  return NextResponse.json(
    { url: `${siteUrl}/propuestas/${slug}`, slug, expires_at },
    { status: 201 },
  )
}
