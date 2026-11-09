import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { falloDeVuelta, invitacionVigente, leerEstado } from '@/lib/meta/conectar'
import { buscarInvitacion, completarConexion } from '@/lib/meta/conectar-servidor'
import { PUBLIC_ORIGIN } from '@/lib/host-routing'

// Facebook manda a la persona de vuelta aquí con un código de un solo uso. En el panel de Meta va como
// https://www.bralto.io/api/meta/conectar/volver (URI de redireccionamiento de OAuth válido).
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE = 'meta_conectar'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const datos = leerEstado(params.get('state'), process.env.META_APP_SECRET ?? '', Date.now())
  const nonce = (await cookies()).get(COOKIE)?.value

  const ir = (ruta: string) => {
    const r = NextResponse.redirect(new URL(ruta, PUBLIC_ORIGIN))
    r.cookies.set(COOKIE, '', { path: '/api/meta/conectar', maxAge: 0 })
    return r
  }

  // Sin un «state» nuestro no se sabe de qué invitación viene, y nada de lo que trae se usa
  if (!datos) return ir('/es/conectar/vencido')
  const pagina = `/${datos.idioma}/conectar/${datos.codigo}`
  if (!nonce || nonce !== datos.nonce) return ir(`${pagina}?error=fallo`)

  const fallo = falloDeVuelta(params)
  if (fallo) return ir(`${pagina}?error=${fallo}`)

  try {
    const invitacion = await buscarInvitacion(datos.codigo)
    if (!invitacion || !invitacionVigente(invitacion.expira_en, Date.now())) return ir(pagina)
    const conectadas = await completarConexion(params.get('code')!, invitacion)
    return ir(conectadas > 0 ? `${pagina}?listo=1` : `${pagina}?error=sin_cuentas`)
  } catch (e) {
    console.error('[meta/conectar] no se pudo completar', e instanceof Error ? e.message : e)
    return ir(`${pagina}?error=fallo`)
  }
}
