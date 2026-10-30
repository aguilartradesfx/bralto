'use server'

import { cookies, headers } from 'next/headers'
import { RedirectType, redirect } from 'next/navigation'
import { after } from 'next/server'
import { COOKIE_GUIAS, DURACION_ACCESO, firmarAcceso, secretoGuias } from '@/lib/guias/acceso'
import { SLUG_GUIA } from '@/lib/guias/contenido'
import { ingresar, registrar, validarRegistro, type Campo } from '@/lib/guias/registro'
import { claveDeIp, depsReales } from '@/lib/guias/servidor'

// El formulario del candado: registra y abre la guía (cookie firmada que sirve para todas)

export type EstadoCandado = {
  errores?: Partial<Record<Campo, string>>
  error?: string
  valores?: { nombre?: string; correo?: string; whatsapp?: string; acepta?: boolean }
}

// La ventana tutea (pedido de Alejandro); el texto de las guías sigue de usted
const NO_SE_PUDO = 'No pudimos abrir la guía en este momento. Intenta de nuevo en un minuto.'
const DEMASIADOS = 'Hubo demasiados intentos seguidos. Espera unos minutos y vuelve a intentarlo.'

async function clave(): Promise<string> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')
  return claveDeIp(ip ?? null)
}

// El slug viene atado desde el navegador: se valida antes de usarlo en el redirect.
// Se vuelve a la guía con ?abierta=1 (el #ancla no sobrevive al redirect de una server action)
// y reemplazando la entrada del historial, para que «atrás» no muestre la guía cerrada.
async function abrir(slug: string, contactoId: string): Promise<never> {
  ;(await cookies()).set(COOKIE_GUIAS, firmarAcceso(secretoGuias(process.env), contactoId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DURACION_ACCESO,
    path: '/',
  })
  redirect(`/es/guias/${slug}?abierta=1`, RedirectType.replace)
}

const texto = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '')

export async function desbloquear(slug: string, _prev: EstadoCandado, form: FormData): Promise<EstadoCandado> {
  if (!SLUG_GUIA.test(slug)) return { error: NO_SE_PUDO }
  const valores = {
    nombre: texto(form.get('nombre')),
    correo: texto(form.get('correo')),
    whatsapp: texto(form.get('whatsapp')),
    acepta: form.get('acepta') === 'on',
  }
  const v = validarRegistro({
    ...valores,
    acepta: form.get('acepta'),
    origen: texto(form.get('origen')),
    sitio: texto(form.get('hp_extra')),
    guia: slug,
  })
  if (!v.ok) return { errores: v.errores, valores }
  if (v.bot) return { error: NO_SE_PUDO, valores }

  let r: Awaited<ReturnType<typeof registrar>>
  try {
    r = await registrar(v.datos, await clave(), depsReales(after))
  } catch (err) {
    console.error('guias: no se pudo registrar', err)
    return { error: NO_SE_PUDO, valores }
  }
  if (!r.ok) return { error: r.error === 'demasiados' ? DEMASIADOS : NO_SE_PUDO, valores }
  return abrir(slug, r.contactoId)
}

export async function ingresarConCorreo(slug: string, _prev: EstadoCandado, form: FormData): Promise<EstadoCandado> {
  if (!SLUG_GUIA.test(slug)) return { error: NO_SE_PUDO }
  const correo = texto(form.get('correo'))
  let r: Awaited<ReturnType<typeof ingresar>>
  try {
    r = await ingresar(correo, await clave(), depsReales(after))
  } catch (err) {
    console.error('guias: no se pudo buscar el correo', err)
    return { error: NO_SE_PUDO, valores: { correo } }
  }
  if (r.ok) return abrir(slug, r.contactoId)
  const error = {
    invalido: 'Revisa tu correo: parece que le falta algo.',
    demasiados: DEMASIADOS,
    'no-existe': 'No encontramos ese correo. Si es tu primera vez, deja tus datos en el formulario.',
    fallo: NO_SE_PUDO,
  }[r.error]
  return { error, valores: { correo } }
}
