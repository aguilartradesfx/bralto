'use server'

import { headers } from 'next/headers'
import { after } from 'next/server'
import { validarSolicitud, type CampoSolicitud } from '@/lib/eliminar-datos/solicitud'
import { dentroDelLimite, registrarSolicitud } from '@/lib/eliminar-datos/servidor'
import { ELIMINAR } from './content'

// El formulario de la página: valida, guarda la solicitud con su código y le avisa a Alejandro

export type EstadoFormulario = {
  codigo?: string
  errores?: Partial<Record<CampoSolicitud, string>>
  error?: string
  valores?: { nombre?: string; contacto?: string; cuenta?: string; detalle?: string }
}

const texto = (v: FormDataEntryValue | null) => (typeof v === 'string' ? v : '')

export async function pedirEliminacion(locale: 'es' | 'en', _prev: EstadoFormulario, form: FormData): Promise<EstadoFormulario> {
  const t = ELIMINAR[locale === 'en' ? 'en' : 'es']
  const valores = {
    nombre: texto(form.get('nombre')),
    contacto: texto(form.get('contacto')),
    cuenta: texto(form.get('cuenta')),
    detalle: texto(form.get('detalle')),
  }
  const v = validarSolicitud({ ...valores, sitio: texto(form.get('hp_extra')) })
  if (!v.ok) {
    const errores = Object.fromEntries(Object.keys(v.errores).map((c) => [c, t.errores[c as CampoSolicitud]]))
    return { errores, valores }
  }
  if (v.bot) return { error: t.formulario.errorGeneral, valores }

  const h = await headers()
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip')
  if (!(await dentroDelLimite(ip ?? null))) return { error: t.formulario.demasiados, valores }

  try {
    const codigo = await registrarSolicitud({ origen: 'formulario', ...v.datos }, after)
    return { codigo }
  } catch (err) {
    console.error('[eliminar-datos] no se pudo registrar la solicitud del formulario', err)
    return { error: t.formulario.errorGeneral, valores }
  }
}
