import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { InternalNav } from '@/components/internal/internal-nav'
import { DeleteProposalButton } from '@/components/proposals/delete-proposal-button'
import { FileText, ExternalLink } from 'lucide-react'

interface Proposal {
  id: string
  slug: string
  client_name: string
  project_name: string
  expires_at: string
  created_at: string
  created_by: string
}

export default async function PropuestasAdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const service = createServiceClient()
  const { data: proposals = [] } = await service
    .from('generated_proposals')
    .select('id, slug, client_name, project_name, expires_at, created_at, created_by')
    .order('created_at', { ascending: false })

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bralto.io'
  const now = new Date()

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">
      <InternalNav />
      <main className="pt-14 md:pt-0 md:ml-56 min-h-screen">
        <div className="p-4 md:p-8 max-w-6xl">
          <div className="mb-6 md:mb-8">
            <h1 className="text-xl font-semibold text-white">Propuestas</h1>
            <p className="text-sm text-white/40 mt-0.5">{(proposals as Proposal[]).length} propuesta(s)</p>
          </div>

          {(proposals as Proposal[]).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FileText size={32} className="text-white/10 mb-3" />
              <p className="text-white/30 text-sm">No hay propuestas generadas</p>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.08] overflow-hidden overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead className="bg-white/[0.03] border-b border-white/[0.06]">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Cliente</th>
                    <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Proyecto</th>
                    <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Creado por</th>
                    <th className="text-left px-4 py-3 text-xs text-white/40 font-medium">Expira</th>
                    <th className="px-4 py-3 text-xs text-white/40 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {(proposals as Proposal[]).map((p) => {
                    const expired = new Date(p.expires_at) < now
                    return (
                      <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <p className="text-sm text-white font-medium">{p.client_name}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-sm text-white/70">{p.project_name}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40">{p.created_by}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs ${expired ? 'text-red-400' : 'text-white/40'}`}>
                            {new Date(p.expires_at).toLocaleDateString('es-CR')}
                            {expired && ' (expirada)'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-3">
                            {!expired && (
                              <a
                                href={`${siteUrl}/propuestas/${p.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-white/30 hover:text-orange-400 transition-colors"
                                title="Abrir propuesta"
                              >
                                <ExternalLink size={13} />
                              </a>
                            )}
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
      </main>
    </div>
  )
}
