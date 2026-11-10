import { NextResponse } from 'next/server'
import { codigoValido, crearNonce, firmarEstado, invitacionVigente, urlDialogo, type Idioma } from '@/lib/meta/conectar'
import { buscarInvitacion } from '@/lib/meta/conectar-servidor'
import { PUBLIC_ORIGIN } from '@/lib/host-routing'

// El botón «Conectar con Facebook»: revisa la invitación y manda a la persona al diálogo de Facebook.
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const COOKIE = 'meta_conectar'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const idioma: Idioma = params.get('idioma') === 'en' ? 'en' : 'es'
  const codigo = params.get('codigo')
  const pagina = (consulta = '') =>
    NextResponse.redirect(new URL(`/${idioma}/conectar/${codigoValido(codigo) ? codigo : 'vencido'}${consulta}`, PUBLIC_ORIGIN))

  if (!codigoValido(codigo)) return pagina()

  const appId = process.env.META_APP_ID
  const configId = process.env.META_LOGIN_CONFIG_ID
  const secreto = process.env.META_APP_SECRET
  if (!appId || !configId || !secreto) {
    console.error('[meta/conectar] faltan META_APP_ID, META_LOGIN_CONFIG_ID o META_APP_SECRET')
    return pagina('?error=fallo')
  }

  try {
    const invitacion = await buscarInvitacion(codigo)
    if (!invitacion || !invitacionVigente(invitacion.expira_en, Date.now())) return pagina()
  } catch (e) {
    console.error('[meta/conectar] no se pudo revisar la invitación', e instanceof Error ? e.message : e)
    return pagina('?error=fallo')
  }

  const nonce = crearNonce()
  const estado = firmarEstado({ codigo, nonce, idioma }, secreto, Date.now())
  const respuesta = NextResponse.redirect(urlDialogo({ appId, configId, estado }))
  respuesta.cookies.set(COOKIE, nonce, { httpOnly: true, secure: true, sameSite: 'lax', path: '/api/meta/conectar', maxAge: 15 * 60 })
  return respuesta
}
