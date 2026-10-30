// SERVER-ONLY — respuestas de las rutas /api/crm/*. Todas piden is_admin (requireApiPermission en cada ruta).
import { NextResponse } from 'next/server'
import { esFalla } from '@/lib/crm/servidor'

export const error = (mensaje: string, status: number) => NextResponse.json({ error: mensaje }, { status })

export const leerJson = (request: Request): Promise<unknown> => request.json().catch(() => null)

// Lo que devolvió el servidor del CRM: el error con su código (y el otro contacto si es un teléfono repetido) o el resultado
export function responder(r: object): NextResponse {
  if (esFalla(r)) return NextResponse.json({ error: r.error, ...(r.otro ? { otro: r.otro } : {}) }, { status: r.status })
  return NextResponse.json(r)
}
