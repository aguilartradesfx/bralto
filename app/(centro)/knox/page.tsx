import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { iniciales } from '@/lib/crm/tipos'
import { CentroKnox } from '@/components/knox-centro/centro'

export const dynamic = 'force-dynamic'

// El lienzo de 1920×1080 se escala antes del primer pintado (sin un salto al cargar)
const ESCALA =
  "(function(){var r=document.documentElement;function f(){r.style.setProperty('--kc-escala',String(Math.min(innerWidth/1920,innerHeight/1080)))}f();addEventListener('resize',f)})()"

export default async function KnoxPage() {
  // El middleware ya lo exige; acá también, antes de mostrar nada
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: ESCALA }} />
      <CentroKnox iniciales={profile?.full_name?.trim() ? iniciales(profile.full_name) : 'AA'} />
    </>
  )
}
