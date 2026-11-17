// «Te toca»: lo que solo Alejandro puede hacer, con sus palabras y a dónde lleva. Puro: las cuentas las leen las
// fuentes de lib/panel/oficina.ts. Lo que está en 0 no sale y el orden es el de las fuentes.
import { diaLegible } from '../guiones/vista.ts'
import { recortar } from './pagina.ts'
import type { FilaTeToca } from './tipos.ts'

const DIA_MS = 86_400_000
// Los guiones «Por grabar» que salen: de hace 2 días en adelante (la noche escribe el de mañana). Los más viejos
// siguen en /guiones, pero ya no aquí.
export const DIAS_GUIONES = 2
export const desdeGuiones = (hoy: string) => new Date(Date.parse(`${hoy}T12:00:00Z`) - DIAS_GUIONES * DIA_MS).toISOString().slice(0, 10)

export type GuionTeToca = { id: string, titulo: string, dia: string }

export type CuentaTeToca =
  | { clave: 'mensajes', n: number, clientes: number }
  | { clave: 'tareas' | 'grabar' | 'ideas', n: number }
  // Los guiones «Por grabar» (lib/guiones): una fila por guion, cada una a su ancla en /guiones
  | { clave: 'guiones', n: number, hoy: string, guiones: GuionTeToca[] }

const varios = (n: number, uno: string, muchos: string) => (n === 1 ? uno : muchos)

function fila(c: Exclude<CuentaTeToca, { clave: 'guiones' }>): FilaTeToca {
  const { n } = c
  switch (c.clave) {
    case 'mensajes':
      return {
        clave: 'mensajes', n,
        texto: varios(n, '1 mensaje por contestar', `${n} mensajes por contestar`),
        sub: c.clientes > 0 ? varios(c.clientes, '1 es cliente posible', `${c.clientes} son clientes posibles`) : '',
        boton: 'Abrir Mensajes', href: '/crm/mensajes?filtro=por_responder',
      }
    case 'tareas':
      return {
        clave: 'tareas', n,
        texto: varios(n, '1 tarea del CRM para hoy', `${n} tareas del CRM para hoy`),
        sub: varios(n, 'Vence hoy o ya venció', 'Vencen hoy o ya vencieron'),
        boton: 'Abrir Tareas', href: '/crm/tareas',
      }
    case 'grabar':
      return {
        clave: 'grabar', n,
        texto: varios(n, '1 idea que dijiste «Lo grabo yo»', `${n} ideas que dijiste «Lo grabo yo»`),
        sub: varios(n, 'Te espera para grabar', 'Te esperan para grabar'),
        boton: 'Abrir Ideas', href: '/ideas?f=yo',
      }
    case 'ideas':
      return {
        clave: 'ideas', n,
        texto: varios(n, '1 idea nueva del equipo', `${n} ideas nuevas del equipo`),
        sub: varios(n, 'Salió del chat o del foro', 'Salieron del chat y del foro'),
        boton: 'Ver ideas', href: '#ideas',
      }
  }
}

// Cada guion con su propia clave (la Oficina la usa como key de la fila)
function filasGuiones(c: Extract<CuentaTeToca, { clave: 'guiones' }>): FilaTeToca[] {
  const desde = desdeGuiones(c.hoy)
  return c.guiones
    .filter((g) => g.dia >= desde)
    .map((g) => ({
      clave: `guion:${g.id}` as const, n: 1,
      texto: `Por grabar: «${recortar(g.titulo, 70)}»`,
      sub: diaLegible(g.dia, c.hoy),
      boton: 'Abrir el guion', href: `/guiones#${g.id}`,
    }))
}

export function filasTeToca(c: CuentaTeToca[]): FilaTeToca[] {
  return c.filter((x) => x.n > 0).flatMap((x) => (x.clave === 'guiones' ? filasGuiones(x) : [fila(x)]))
}
