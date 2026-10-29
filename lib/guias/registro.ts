import { z } from 'zod'
import { SLUG_GUIA } from './contenido.ts'

// Quien abre una guía: se valida lo que manda el formulario y se guarda con las conexiones
// reales inyectadas (lib/guias/servidor.ts), así la lógica se prueba sin Supabase ni Telegram.

// Intentos por hora por IP. El registro tiene un tope alto: detrás de la misma IP del celular
// (CGNAT) puede haber mucha gente real en un pico de comentarios, y datos inventados abren la
// guía igual. El de entrar con el correo es más bajo porque dice si un correo está registrado.
export const MAX_REGISTROS_POR_HORA = 60
export const MAX_INGRESOS_POR_HORA = 20

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

const CORREO = z.email().max(254)
const texto = (v: unknown) => (typeof v === 'string' ? v.trim() : '')

// Con código de país («+» o «00» al inicio) y sin espacios, guiones, paréntesis ni puntos.
// Siempre se guarda con «+»: así el enlace wa.me del aviso funciona y no hay dos formatos.
export function limpiarWhatsapp(v: string): string | null {
  let s = v.trim().replace(/[\s\-().]/g, '')
  if (s.startsWith('00')) s = `+${s.slice(2)}`
  return /^\+\d{8,15}$/.test(s) ? s : null
}

export function validarRegistro(
  input: Record<string, unknown>,
): { ok: true; datos: Datos; bot: boolean } | { ok: false; errores: Partial<Record<Campo, string>> } {
  const guia = texto(input.guia)
  if (!SLUG_GUIA.test(guia)) throw new Error(`Guía inválida: ${guia}`) // la pone la página, no la persona

  const errores: Partial<Record<Campo, string>> = {}
  const nombre = texto(input.nombre).replace(/\s+/g, ' ') // una sola línea: así no se cuelan renglones en el aviso
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
  limite(clave: string, max: number): Promise<boolean>
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
  if (!(await deps.limite(`registro:${clave}`, MAX_REGISTROS_POR_HORA))) return { ok: false, error: 'demasiados' }
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
export async function ingresar(
  correo: string,
  clave: string,
  deps: Pick<Deps, 'limite' | 'buscar'>,
): Promise<{ ok: true; contactoId: string } | { ok: false; error: 'invalido' | 'demasiados' | 'no-existe' | 'fallo' }> {
  const c = correo.trim().toLowerCase()
  if (!CORREO.safeParse(c).success) return { ok: false, error: 'invalido' }
  if (!(await deps.limite(`correo:${clave}`, MAX_INGRESOS_POR_HORA))) return { ok: false, error: 'demasiados' }
  let id: string | null
  try {
    id = await deps.buscar(c)
  } catch {
    return { ok: false, error: 'fallo' }
  }
  return id ? { ok: true, contactoId: id } : { ok: false, error: 'no-existe' }
}
