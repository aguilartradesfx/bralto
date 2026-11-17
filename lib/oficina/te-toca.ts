// «Te toca»: lo que solo Alejandro puede hacer, con sus palabras y a dónde lleva. Puro: las cuentas las leen las
// fuentes de lib/panel/oficina.ts. Lo que está en 0 no sale y el orden es el de las fuentes.
import type { FilaTeToca } from './tipos.ts'

export type CuentaTeToca =
  | { clave: 'mensajes', n: number, clientes: number }
  | { clave: 'tareas' | 'grabar' | 'ideas', n: number }
  // Los guiones «Por grabar» (lib/guiones): cuántos son y el más nuevo, que es al que lleva el botón
  | { clave: 'guiones', n: number, id: string, titulo: string }

const varios = (n: number, uno: string, muchos: string) => (n === 1 ? uno : muchos)
const corto = (s: string, max: number) => (s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s)

function fila(c: CuentaTeToca): FilaTeToca {
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
    case 'guiones':
      return {
        clave: 'guiones', n,
        texto: `Por grabar: «${corto(c.titulo, 70)}»`,
        sub: n === 1 ? 'Te espera para grabarlo a cámara' : varios(n - 1, 'Y 1 guion más te espera', `Y ${n - 1} guiones más te esperan`),
        boton: 'Abrir el guion', href: `/guiones#${c.id}`,
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

export function filasTeToca(c: CuentaTeToca[]): FilaTeToca[] {
  return c.filter((x) => x.n > 0).map(fila)
}
