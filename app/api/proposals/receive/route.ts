import { NextResponse } from 'next/server'
import { publishProposal } from '@/lib/proposals/publish'

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

  try {
    const published = await publishProposal({ client_name, project_name, html_content, created_by })
    return NextResponse.json(published, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 })
  }
}
