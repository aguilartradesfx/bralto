import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/service'

interface Props {
  params: Promise<{ slug: string }>
}

async function getProposal(slug: string) {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('generated_proposals')
    .select('html_content, expires_at')
    .eq('slug', slug)
    .single()
  return data
}

export default async function PublicProposalPage({ params }: Props) {
  const { slug } = await params
  const proposal = await getProposal(slug)

  if (!proposal) notFound()
  if (new Date(proposal.expires_at) < new Date()) notFound()

  return (
    <div
      dangerouslySetInnerHTML={{ __html: proposal.html_content }}
    />
  )
}
