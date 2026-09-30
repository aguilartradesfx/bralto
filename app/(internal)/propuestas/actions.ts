'use server'

import { revalidatePath } from 'next/cache'
import { createServiceClient } from '@/lib/supabase/service'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'

export async function deleteProposal(slug: string) {
  const { user, profile } = await getCurrentSession()
  if (!user || !hasPermission(profile, 'can_view_proposals')) throw new Error('Sin permisos')

  const service = createServiceClient()
  await service.from('generated_proposals').delete().eq('slug', slug)
  // Si venía de una solicitud, la solicitud deja de apuntar a la página borrada
  await service
    .from('proposal_requests')
    .update({ generated_url: null, generated_at: null, updated_at: new Date().toISOString() })
    .like('generated_url', `%/propuestas/${slug}`)

  revalidatePath('/propuestas')
}
