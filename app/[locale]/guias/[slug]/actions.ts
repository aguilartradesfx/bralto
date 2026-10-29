'use server'

import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { after } from 'next/server'
import { COOKIE_GUIAS, DURACION_ACCESO, firmarAcceso, secretoGuias } from '@/lib/guias/acceso'
import { ingresar, registrar, validarRegistro, type Campo } from '@/lib/guias/registro'
import { claveDeIp, depsReales } from '@/lib/guias/servidor'

// El formulario del candado: registra y abre la guía (cookie firmada que sirve para todas)

export type EstadoCandado = {
  errores?: Partial<Record<Campo, string>>
  error?: string
  valores?: { nombre?: string; correo?: string; whatsapp?: string; acepta?: boolean }
}

async function clave(): Promise<string> {
  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')
  return claveDeIp(ip ?? null)
}

async function abrir(slug: string, contactoId: string): Promise<never> {
  ;(await cookies()).set(COOKIE_GUIAS, firmarAcceso(secretoGuias(process.env), contactoId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: DURACION_ACCESO,
    path: '/',
  })
  redirect(`/es/guias/${slug}#guia`)
}

const texto = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '')

export async function desbloquear(slug: string, _prev: EstadoCandado, form: FormData): Promise<EstadoCandado> {
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
    sitio: texto(form.get('sitio')),
    guia: slug,
  })
  if (!v.ok) return { errores: v.errores, valores }
  if (v.bot) return { error: 'No pudimos abrir la guía. Intente de nuevo.', valores }

  const r = await registrar(v.datos, await clave(), depsReales(after))
  if (!r.ok) {
    return {
      error:
        r.error === 'demasiados'
          ? 'Hubo demasiados intentos seguidos. Espere unos minutos y vuelva a intentarlo.'
          : 'No pudimos guardar sus datos. Intente de nuevo en un momento.',
      valores,
    }
  }
  return abrir(slug, r.contactoId)
}

export async function ingresarConCorreo(slug: string, _prev: EstadoCandado, form: FormData): Promise<EstadoCandado> {
  const correo = texto(form.get('correo'))
  const id = await ingresar(correo, await clave(), depsReales(after))
  if (!id) return { error: 'No encontramos ese correo. Si es su primera vez, deje sus datos en el formulario.', valores: { correo } }
  return abrir(slug, id)
}
