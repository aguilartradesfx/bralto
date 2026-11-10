// Cómo se ven las ideas en el panel: los números de cada video, hace cuánto salió y el aviso al pegar.
import type { Red } from './enlaces.ts'
import { formatoNumero, formatoVeces, type Metricas } from './metricas.ts'

export type Numero = { label: string; valor: string | null; nota?: string; destacado: boolean }

// Desde 3 veces se considera que pegó (el mismo umbral que van a usar los exploradores)
const PEGO = 3

const nombreRed = (red: Red) => (red === 'instagram' ? 'Instagram' : 'TikTok')

export function numerosDe(m: Metricas, red: Red): Numero[] {
  const n = (
    label: string,
    v: number | null,
    formato: (x: number | null) => string,
    opts: { noLoMuestra?: boolean; veces?: boolean; menos?: string } = {},
  ): Numero => {
    if (v === null) return { label, valor: null, nota: opts.noLoMuestra ? `${nombreRed(red)} no los muestra` : 'Sin dato', destacado: false }
    // «0,03×» no se entiende: por debajo de 1 vez se dice con palabras
    if (opts.menos && v < 1) return { label, valor: null, nota: opts.menos, destacado: false }
    return { label, valor: formato(v), destacado: Boolean(opts.veces && v >= PEGO) }
  }
  const ig = red === 'instagram'
  return [
    n('Vistas', m.vistas, formatoNumero, { noLoMuestra: ig && m.tipo === 'fotos' }),
    n('Veces su público', m.veces_su_publico, formatoVeces, { veces: true, menos: 'Menos que sus seguidores' }),
    n('Veces lo normal', m.veces_lo_normal, formatoVeces, { veces: true, menos: 'Menos de lo normal' }),
    n('Me gusta', m.me_gusta, formatoNumero),
    n('Comentarios', m.comentarios, formatoNumero),
    n('Compartidos', m.compartidos, formatoNumero, { noLoMuestra: ig }),
    n('Guardados', m.guardados, formatoNumero, { noLoMuestra: ig }),
    n('Seguidores', m.seguidores, formatoNumero),
  ]
}

const DIA = 86_400_000

export function haceCuanto(iso: string | null, ahora: Date): string | null {
  if (!iso) return null
  const dias = Math.floor((ahora.getTime() - new Date(iso).getTime()) / DIA)
  if (Number.isNaN(dias)) return null
  if (dias < 1) return 'hoy'
  if (dias < 2) return 'ayer'
  if (dias < 7) return `hace ${dias} días`
  if (dias < 30) {
    const s = Math.floor(dias / 7)
    return s === 1 ? 'hace 1 semana' : `hace ${s} semanas`
  }
  if (dias < 365) {
    const m = Math.floor(dias / 30)
    return m === 1 ? 'hace 1 mes' : `hace ${m} meses`
  }
  return 'hace más de un año'
}

export function resumenPegado(r: { nuevas: number; repetidas: number; noValidos: string[]; deMas: number }): string {
  const { nuevas, repetidas, deMas } = r
  const malos = r.noValidos.length
  const partes: string[] = []
  if (nuevas > 0) {
    partes.push(`Listo: ${nuevas} ${nuevas === 1 ? 'nueva' : 'nuevas'}.`)
    if (repetidas) partes.push(`${repetidas} ya ${repetidas === 1 ? 'estaba' : 'estaban'}.`)
    if (malos) partes.push(`${malos} ${malos === 1 ? 'enlace no es' : 'enlaces no son'} de Instagram ni de TikTok.`)
    if (deMas) partes.push(`Quedaron ${deMas} por fuera: pega de a 50.`)
    partes.push(`Se ${nuevas === 1 ? 'analiza sola' : 'analizan solas'} en 1 o 2 minutos.`)
    return partes.join(' ')
  }
  if (repetidas && malos) return `${repetidas} ya ${repetidas === 1 ? 'estaba' : 'estaban'} y ${malos} no ${malos === 1 ? 'es' : 'son'} de Instagram ni de TikTok.`
  if (repetidas) return repetidas === 1 ? 'Ese enlace ya estaba.' : `Esos ${repetidas} enlaces ya estaban.`
  if (malos) return malos === 1 ? 'Ese enlace no es un video de Instagram o de TikTok.' : `Ninguno de los ${malos} enlaces es un video de Instagram o de TikTok.`
  return 'No encontré enlaces. Pega el enlace completo del video.'
}
