import { NextResponse } from 'next/server'
import { loadTemplate, renderContractMarkdown } from '@/lib/contracts/render'
import { marked } from 'marked'
import type { ContractData } from '@/types/contracts'
import { requireApiPermission } from '@/lib/panel-session'

export async function POST(req: Request) {
  const { denied } = await requireApiPermission('can_view_contracts')
  if (denied) return denied

  let body: { data: ContractData; template_version?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const templateVersion = body.template_version ?? 'v1'
    const templateString = loadTemplate(templateVersion)
    const markdown = renderContractMarkdown(body.data, templateString)
    const html = String(marked.parse(markdown))
    return NextResponse.json({ html })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
