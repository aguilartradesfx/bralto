import { z } from 'zod'

// Quien abre una guía: se valida lo que manda el formulario y se guarda con las conexiones
// reales inyectadas (lib/guias/servidor.ts), así la lógica se prueba sin Supabase ni Telegram.

export type Origen = 'ig' | 'fb' | 'web'
export type Datos = { nombre: string; correo: string; whatsapp: string; origen: Origen; guia: string }
export type Campo = 'nombre' | 'correo' | 'whatsapp' | 'acepta'

const ORIGENES: readonly Origen[] = ['ig', 'fb', 'web']
const NOMBRE_ORIGEN: Record<Origen, string> = { ig: 'Instagram', fb: 'Facebook', web: 'la web' }

const MENSAJES: Record<Campo, string> = {
  nombre: 'Escriba su nombre.',
  correo: 'Revise su correo: parece que le falta algo.',
  whatsapp: 'Escriba su WhatsApp con el código de país, por ejemplo +506 8888 8888.',
  acepta: 'Para abrir la guía, acepte la política de privacidad.',
}

const CORREO = z.email()
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

// Sin espacios, guiones, paréntesis ni puntos; «00» al inicio es «+». Quedan de 8 a 15 dígitos.
export function limpiarWhatsapp(v: string): string | null {
  let s = v.trim().replace(/[\s\-().]/g, '')
  if (s.startsWith('00')) s = `+${s.slice(2)}`
  return /^\+?\d{8,15}$/.test(s) ? s : null
}

export function validarRegistro(
  input: Record<string, unknown>,
): { ok: true; datos: Datos; bot: boolean } | { ok: false; errores: Partial<Record<Campo, string>> } {
  const guia = texto(input.guia)
  if (!/^[a-z0-9-]{1,80}$/.test(guia)) throw new Error(`Guía inválida: ${guia}`) // la pone la página, no la persona

  const errores: Partial<Record<Campo, string>> = {}
  const nombre = texto(input.nombre)
  if (nombre.length < 2 || nombre.length > 80) errores.nombre = MENSAJES.nombre
  const correo = texto(input.correo).toLowerCase()
  if (!CORREO.safeParse(correo).success) errores.correo = MENSAJES.correo
  const whatsapp = limpiarWhatsapp(texto(input.whatsapp))
  if (!whatsapp) errores.whatsapp = MENSAJES.whatsapp
  if (!(input.acepta === 'on' || input.acepta === true)) errores.acepta = MENSAJES.acepta
  if (Object.keys(errores).length || !whatsapp) return { ok: false, errores }

  const origen = ORIGENES.includes(input.origen as Origen) ? (input.origen as Origen) : 'web'
  // «sitio» es un campo escondido: una persona nunca lo llena, un bot sí
  return { ok: true, datos: { nombre, correo, whatsapp, origen, guia }, bot: texto(input.sitio) !== '' }
}

export type Deps = {
  limite(clave: string): Promise<boolean>
  buscar(correo: string): Promise<string | null>
  guardar(d: Datos): Promise<{ id: string; nuevo: boolean }>
  avisar(texto: string): Promise<void>
}

export function textoAviso(d: Datos): string {
  return [
    `🔓 Nuevo contacto en la guía «${d.guia}» (desde ${NOMBRE_ORIGEN[d.origen]})`,
    `Nombre: ${d.nombre}`,
    `Correo: ${d.correo}`,
    `WhatsApp: ${d.whatsapp} · https://wa.me/${d.whatsapp.replace(/^\+/, '')}`,
  ].join('\n')
}

export async function registrar(
  d: Datos,
  clave: string,
  deps: Deps,
): Promise<{ ok: true; contactoId: string } | { ok: false; error: 'demasiados' | 'fallo' }> {
  if (!(await deps.limite(clave))) return { ok: false, error: 'demasiados' }
  let r: { id: string; nuevo: boolean }
  try {
    r = await deps.guardar(d)
  } catch {
    return { ok: false, error: 'fallo' }
  }
  if (r.nuevo) {
    try {
      deps.avisar(textoAviso(d)).catch(() => {}) // el aviso nunca frena ni rompe el registro
    } catch {
      /* idem */
    }
  }
  return { ok: true, contactoId: r.id }
}

// Desde otro aparato: con el mismo correo basta
export async function ingresar(correo: string, clave: string, deps: Pick<Deps, 'limite' | 'buscar'>): Promise<string | null> {
  const c = correo.trim().toLowerCase()
  if (!CORREO.safeParse(c).success) return null
  if (!(await deps.limite(clave))) return null
  return deps.buscar(c)
}
