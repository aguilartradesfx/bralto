import { nanoid } from 'nanoid'
import { createServiceClient } from '@/lib/supabase/service'

const PROPOSAL_TTL_MS = 14 * 24 * 60 * 60 * 1000

export interface PublishProposalInput {
  client_name: string
  project_name: string
  html_content: string
  created_by: string
}

export interface PublishedProposal {
  url: string
  slug: string
  expires_at: string
}

export function publicProposalUrl(slug: string): string {
  return `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://bralto.io'}/propuestas/${slug}`
}

// Guarda el HTML en generated_proposals; queda público en /propuestas/<slug> por 14 días.
export async function publishProposal(input: PublishProposalInput): Promise<PublishedProposal> {
  const slug = nanoid(12)
  const expires_at = new Date(Date.now() + PROPOSAL_TTL_MS).toISOString()

  const { error } = await createServiceClient()
    .from('generated_proposals')
    .insert({ slug, expires_at, ...input })
  if (error) throw new Error(error.message)

  return { url: publicProposalUrl(slug), slug, expires_at }
}
