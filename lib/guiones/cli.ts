// Lo puro del comando de la noche (scripts/guiones/cargar.ts): sus argumentos, el día que sale de la ruta y lo que
// imprime. Sin base de datos.
import type { EstadoGuion } from './tipos.ts'
import { enlaceGuion } from './vista.ts'

export const USO_CARGAR = 'Uso: node --env-file=.env.local scripts/guiones/cargar.ts <guion.json> [--dia AAAA-MM-DD] [--carpeta <ruta>]'

// Una fecha real en AAAA-MM-DD (2026-02-30 no)
export function esDia(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

// …/publicaciones/2026-11-17/guion/guion.json → 2026-11-17. Solo carpetas que son exactamente una fecha: la que va
// después de «publicaciones» y, si no hay, la última. null si no hay ninguna.
export function diaDeRuta(ruta: string): string | null {
  const carpetas = ruta.split(/[\\/]+/).slice(0, -1)
  const i = carpetas.lastIndexOf('publicaciones')
  if (i >= 0 && i + 1 < carpetas.length && esDia(carpetas[i + 1])) return carpetas[i + 1]
  for (let j = carpetas.length - 1; j >= 0; j--) if (esDia(carpetas[j])) return carpetas[j]
  return null
}

export type OrdenCargar = { ruta: string; dia: string | null; carpeta: string | null } | { error: string }

export function leerArgsCargar(argv: string[]): OrdenCargar {
  let ruta: string | null = null
  let dia: string | null = null
  let carpeta: string | null = null
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]
    if (!a.startsWith('--')) {
      if (ruta !== null) return { error: `Sobra «${a}»: va un solo guion.json` }
      ruta = a
      continue
    }
    const igual = a.indexOf('=')
    const bandera = igual > 0 ? a.slice(0, igual) : a
    if (bandera !== '--dia' && bandera !== '--carpeta') return { error: `Opción desconocida: ${bandera}` }
    let valor: string | undefined
    if (igual > 0) valor = a.slice(igual + 1)
    else {
      valor = argv[i + 1]
      if (valor === undefined || valor.startsWith('--')) return { error: `Falta el valor de ${bandera}` }
      i++
    }
    if (bandera === '--dia') {
      if (!esDia(valor)) return { error: `--dia tiene que ser una fecha AAAA-MM-DD (vino «${valor}»)` }
      dia = valor
    } else {
      if (!valor.trim()) return { error: '--carpeta está vacía' }
      carpeta = valor
    }
  }
  if (ruta === null) return { error: 'Falta la ruta del guion.json' }
  return { ruta, dia, carpeta }
}

const plural = (n: number, uno: string, muchos: string) => `${n} ${n === 1 ? uno : muchos}`

// Lo que imprime al cargar: un resumen, el id y el enlace del panel (cada uno en su línea, fácil de leer desde un script)
export function salidaDeCarga(r: { id: string; nuevo: boolean; titulo: string; dia: string; estado: EstadoGuion; lineas: number; ganchos: number }): string[] {
  const sigue = !r.nuevo && r.estado !== 'listo' ? `. Sigue en «${r.estado}»` : ''
  return [
    `${r.nuevo ? 'Guion nuevo' : 'Guion actualizado'}: «${r.titulo}» para el ${r.dia} (${plural(r.lineas, 'línea', 'líneas')} y ${plural(r.ganchos, 'gancho', 'ganchos')})${sigue}`,
    `id: ${r.id}`,
    enlaceGuion(r.id),
  ]
}
