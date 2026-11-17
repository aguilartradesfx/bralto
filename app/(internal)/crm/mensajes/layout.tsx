import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { getCurrentSession } from '@/lib/panel-session'
import { hasPermission } from '@/lib/panel-access'
import { POR_PAGINA, VISTA_INICIAL, type ListaBandeja } from '@/lib/crm/bandeja/vista'
import { leerListaBandeja } from '@/lib/crm/bandeja/servidor'
import { Bandeja } from '@/components/crm/bandeja'

export const dynamic = 'force-dynamic'

// Mensajes: la lista a la izquierda (se queda puesta al pasar de un chat a otro) y el chat a la derecha. La primera
// vista sin filtros viene del servidor; con filtros en la URL, la lista se pide sola
export default async function MensajesLayout({ children }: { children: React.ReactNode }) {
  // El middleware ya lo exige; acá también, antes de leer con service role
  const { user, profile } = await getCurrentSession()
  if (!user) redirect('/login')
  if (!hasPermission(profile, 'is_admin')) redirect('/admin')

  let inicial: ListaBandeja | null = null
  try {
    inicial = await leerListaBandeja(VISTA_INICIAL, POR_PAGINA)
  } catch (err) {
    console.error('[bandeja] no se pudo leer la lista:', err instanceof Error ? err.message : err)
  }
  return (
    <Suspense>
      <Bandeja inicial={inicial} ahora={new Date().toISOString()}>
        {children}
      </Bandeja>
    </Suspense>
  )
}
