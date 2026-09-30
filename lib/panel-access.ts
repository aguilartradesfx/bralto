import type { UserProfile } from '@/types/user-profiles'

export type PanelPermission =
  | 'is_admin'
  | 'can_view_contracts'
  | 'can_view_clients'
  | 'can_submit_proposals'
  | 'can_view_proposals'

// Permiso requerido por sección del panel. /admin (inicio) y /login solo requieren sesión.
const ROUTE_PERMISSIONS: [prefix: string, permission: PanelPermission][] = [
  ['/contratos', 'can_view_contracts'],
  ['/clientes', 'can_view_clients'],
  ['/solicitudes', 'can_submit_proposals'],
  ['/propuestas', 'can_view_proposals'],
  ['/usuarios', 'is_admin'],
]

export function requiredPermission(pathname: string): PanelPermission | null {
  const match = ROUTE_PERMISSIONS.find(([p]) => pathname === p || pathname.startsWith(`${p}/`))
  return match ? match[1] : null
}

export function hasPermission(
  profile: Pick<UserProfile, PanelPermission> | null,
  permission: PanelPermission | null,
): boolean {
  if (permission === null) return true
  if (!profile) return false
  if (profile.is_admin) return true
  return profile[permission] === true
}

// Acceso a las APIs del panel: 401 sin sesión, 403 si no tiene ninguno de los permisos aceptados
export function apiAccessStatus(
  hasSession: boolean,
  profile: Pick<UserProfile, PanelPermission> | null,
  permissions: PanelPermission[],
): 200 | 401 | 403 {
  if (!hasSession) return 401
  return permissions.some((p) => hasPermission(profile, p)) ? 200 : 403
}
