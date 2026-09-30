import { ExternalLink, FileText } from 'lucide-react'
import { createServiceClient } from '@/lib/supabase/service'
import { CopyButton } from '@/components/contracts/copy-button'
import { DeleteProposalButton } from '@/components/proposals/delete-proposal-button'
import { publicProposalUrl } from '@/lib/proposals/publish'
import { proposalSlugFromUrl } from '@/lib/proposals/slug'
import { BRALTO_SERVICES, STATUS_COLORS, STATUS_LABELS, type ProposalStatus } from '@/types/proposals'

export const metadata = { title: 'Propuestas' }

interface PublishedRow {
  id: string
  slug: string
  client_name: string
  project_name: string
  expires_at: string
  created_at: string
  created_by: string
}

interface RequestRow {
  id: string
  services: string[]
  status: ProposalStatus
  submitted_by: string | null
  generated_url: string | null
}

const TH = 'text-left px-4 py-3 text-xs text-white/40 font-medium'

function formatDate(dt: string) {
  return new Date(dt).toLocaleDateString('es-CR', { day: '2-digit', month: 'short', year: 'numeric' })
}

function serviceLabel(id: string) {
  return BRALTO_SERVICES.find((s) => s.id === id)?.label ?? id
}

export default async function PropuestasPage() {
  const service = createServiceClient()
  const [{ data: published }, { data: requests }] = await Promise.all([
    service
      .from('generated_proposals')
      .select('id, slug, client_name, project_name, expires_at, created_at, created_by')
      .order('created_at', { ascending: false }),
    service
      .from('proposal_requests')
      .select('id, services, status, submitted_by, generated_url')
      .not('generated_url', 'is', null),
  ])

  // Propuestas que salieron de una solicitud (match por slug de generated_url)
  const requestBySlug = new Map<string, RequestRow>()
  for (const r of (requests ?? []) as RequestRow[]) {
    const slug = proposalSlugFromUrl(r.generated_url)
    if (slug) requestBySlug.set(slug, r)
  }

  const submitterIds = [...new Set(
    [...requestBySlug.values()].map((r) => r.submitted_by).filter((id): id is string => !!id),
  )]
  const { data: profiles } = submitterIds.length
    ? await service.from('user_profiles').select('id, full_name').in('id', submitterIds)
    : { data: [] as { id: string; full_name: string | null }[] }
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? 'Sin nombre']))

  const rows = (published ?? []) as PublishedRow[]
  const now = new Date()

  return (
    <div className="p-4 md:p-8 max-w-6xl">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-semibold text-white">Propuestas</h1>
        <p className="text-sm text-white/40 mt-0.5">{rows.length} propuesta(s) publicada(s)</p>
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <FileText size={32} className="text-white/10 mb-3" />
          <p className="text-white/30 text-sm">No hay propuestas publicadas</p>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead className="bg-white/[0.03] border-b border-white/[0.06]">
              <tr>
                <th className={TH}>Cliente</th>
                <th className={TH}>Servicios</th>
                <th className={TH}>Creada por</th>
                <th className={TH}>Estado</th>
                <th className={TH}>Creada</th>
                <th className={TH}>Vence</th>
                <th className="px-4 py-3 text-xs text-white/40 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {rows.map((p) => {
                const request = requestBySlug.get(p.slug)
                const expired = new Date(p.expires_at) < now
                const url = publicProposalUrl(p.slug)
                const author = request?.submitted_by
                  ? nameById.get(request.submitted_by) ?? 'Desconocido'
                  : p.created_by

                return (
                  <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm text-white font-medium">{p.client_name}</p>
                      {p.project_name !== p.client_name && (
                        <p className="text-xs text-white/40 mt-0.5">{p.project_name}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {request ? (
                        <div className="flex flex-wrap gap-1 max-w-[260px]">
                          {request.services.map((id) => (
                            <span key={id} className="inline-block px-1.5 py-0.5 text-[10px] bg-[#5bb6ff]/10 text-[#5bb6ff]/80 rounded whitespace-nowrap">
                              {serviceLabel(id)}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-white/20">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">{author}</td>
                    <td className="px-4 py-3">
                      {request ? (
                        <span className={`inline-block px-2 py-0.5 text-xs rounded-full border ${STATUS_COLORS[request.status]}`}>
                          {STATUS_LABELS[request.status]}
                        </span>
                      ) : (
                        <span className="text-xs text-white/30">Manual</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-white/40">{formatDate(p.created_at)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs ${expired ? 'text-red-400' : 'text-white/40'}`}>
                        {expired ? 'Expirada' : formatDate(p.expires_at)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-3">
                        {!expired && (
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-white/30 hover:text-[#5bb6ff] transition-colors"
                            title="Abrir propuesta"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                        <CopyButton text={url} />
                        <DeleteProposalButton slug={p.slug} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
