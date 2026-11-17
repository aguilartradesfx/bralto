import { createServiceClient } from '@/lib/supabase/service'
import { publicProposalUrl } from '@/lib/proposals/publish'
import { proposalSlugFromUrl } from '@/lib/proposals/slug'
import { esEstado } from '@/lib/proposals/archivos-reglas'
import type { FilaPropuesta, Filtro } from '@/components/proposals/propuestas'
import { STATUS_LABELS, type ProposalStatus } from '@/types/proposals'

// La lista de la sección «Propuestas» (con service role: quien llama ya revisó los permisos)

interface PublishedRow {
  id: string
  slug: string
  client_name: string
  project_name: string
  expires_at: string
  created_at: string
  created_by: string
  status: string
  amount: string | null
  sent_to: string | null
  has_page: boolean
}

interface FileRow {
  id: string
  proposal_id: string
  name: string
  label: string
  bytes: number | null
}

interface RequestRow {
  id: string
  services: string[]
  status: ProposalStatus
  submitted_by: string | null
  generated_url: string | null
}

export const leerFiltro = (f: string | string[] | undefined): Filtro => (f === 'vencidas' || f === 'todas' ? f : 'vigentes')

export async function leerPropuestas(): Promise<FilaPropuesta[]> {
  const service = createServiceClient()
  const [published, files, requests] = await Promise.all([
    service
      .from('generated_proposals')
      .select('id, slug, client_name, project_name, expires_at, created_at, created_by, status, amount, sent_to, has_page')
      .order('created_at', { ascending: false }),
    service.from('proposal_files').select('id, proposal_id, name, label, bytes').order('label').order('created_at'),
    service.from('proposal_requests').select('id, services, status, submitted_by, generated_url').not('generated_url', 'is', null),
  ])
  if (published.error) throw new Error(`generated_proposals: ${published.error.message}`)
  if (files.error) throw new Error(`proposal_files: ${files.error.message}`)
  if (requests.error) throw new Error(`proposal_requests: ${requests.error.message}`)

  // Propuestas que salieron de una solicitud (match por slug de generated_url)
  const requestBySlug = new Map<string, RequestRow>()
  for (const r of (requests.data ?? []) as RequestRow[]) {
    const slug = proposalSlugFromUrl(r.generated_url)
    if (slug) requestBySlug.set(slug, r)
  }

  const submitterIds = [...new Set([...requestBySlug.values()].map((r) => r.submitted_by).filter((id): id is string => !!id))]
  const { data: profiles } = submitterIds.length
    ? await service.from('user_profiles').select('id, full_name').in('id', submitterIds)
    : { data: [] as { id: string; full_name: string | null }[] }
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Sin nombre']))

  const filesBy = new Map<string, FileRow[]>()
  for (const f of (files.data ?? []) as FileRow[]) filesBy.set(f.proposal_id, [...(filesBy.get(f.proposal_id) ?? []), f])

  return ((published.data ?? []) as PublishedRow[]).map((p) => {
    const request = requestBySlug.get(p.slug)
    return {
      id: p.id,
      slug: p.slug,
      url: publicProposalUrl(p.slug),
      cliente: p.client_name,
      proyecto: p.project_name,
      creada: p.created_at,
      expira: p.expires_at,
      autor: request?.submitted_by ? (nameById.get(request.submitted_by) ?? 'Desconocido') : p.created_by,
      estado: esEstado(p.status) ? p.status : 'enviada',
      monto: p.amount,
      enviadaA: p.sent_to,
      tienePagina: p.has_page,
      solicitud: request ? { estado: STATUS_LABELS[request.status] ?? request.status, servicios: request.services ?? [] } : null,
      archivos: (filesBy.get(p.id) ?? []).map((f) => ({ id: f.id, etiqueta: f.label, nombre: f.name, bytes: f.bytes })),
    }
  })
}

