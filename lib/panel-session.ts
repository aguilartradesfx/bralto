import { cache } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
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
