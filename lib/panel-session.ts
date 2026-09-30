import { cache } from 'react'
import { NextResponse } from 'next/server'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { apiAccessStatus, type PanelPermission } from '@/lib/panel-access'
import type { UserProfile } from '@/types/user-profiles'

// Usuario con sesión + su fila de user_profiles. Cacheado por request: layout y páginas lo comparten.
export const getCurrentSession = cache(
  async (): Promise<{ user: User | null; profile: UserProfile | null }> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { user: null, profile: null }

    const { data } = await createServiceClient()
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()
    return { user, profile: (data as UserProfile | null) ?? null }
  },
)

// Route handlers del panel: exige sesión y al menos uno de los permisos (la sesión sola no alcanza)
export async function requireApiPermission(
  ...permissions: PanelPermission[]
): Promise<{ user: User; denied: null } | { user: null; denied: NextResponse }> {
  const { user, profile } = await getCurrentSession()
  const status = apiAccessStatus(!!user, profile, permissions)
  if (status === 200 && user) return { user, denied: null }
  return {
    user: null,
    denied: NextResponse.json({ error: status === 401 ? 'No autenticado' : 'Sin permisos' }, { status }),
  }
}
