// El subtítulo grande del Centro de mando: el pedazo de la sección que está sonando, con la palabra de ahora
// subrayada, lo que falta más tenue y los números en negrita. Del audio solo se sabe en qué segundo empieza cada
// sección (lib/knox/alineacion.ts); adentro, el tiempo se reparte según el largo del texto. Puro, con pruebas.

export type Palabra = { texto: string; numero: boolean; estado: 'dicha' | 'actual' | 'falta' }

export type Subtitulo = { seccion: number; trozo: number; palabras: Palabra[] }

export const MAX_TROZO = 110 // dos renglones del subtítulo

const FIN = '.!?…'
const CIERRE = '.!?…»"”)'

// Las oraciones de un texto. «4.450» o «2,5» no cortan: solo un punto seguido de un espacio
export function oraciones(texto: string): string[] {
  const t = texto.replace(/\s+/g, ' ').trim()
  const res: string[] = []
  let inicio = 0
  for (let i = 0; i < t.length; i++) {
    if (!FIN.includes(t[i])) continue
    let j = i + 1
    while (j < t.length && CIERRE.includes(t[j])) j++
    if (j < t.length && t[j] !== ' ') continue
    res.push(t.slice(inicio, j).trim())
    inicio = j
    i = j - 1
  }
  if (inicio < t.length) res.push(t.slice(inicio).trim())
  return res.filter(Boolean)
}

// Una oración muy larga se corta en la coma (o los dos puntos) más cerca de la mitad; si no hay, en un espacio
function cortar(o: string, max: number): string[] {
  if (o.length <= max) return [o]
  const mitad = o.length / 2
  let corte = -1
  for (let i = 15; i < o.length - 15; i++) {
    if (',:;'.includes(o[i]) && o[i + 1] === ' ' && (corte < 0 || Math.abs(i - mitad) < Math.abs(corte - mitad))) corte = i
  }
  if (corte >= 0) return [...cortar(o.slice(0, corte + 1), max), ...cortar(o.slice(corte + 2), max)]
  let espacio = -1
  for (let i = 1; i < o.length - 1; i++) {
    if (o[i] === ' ' && (espacio < 0 || Math.abs(i - mitad) < Math.abs(espacio - mitad))) espacio = i
  }
  if (espacio < 0) return [o]
  return [...cortar(o.slice(0, espacio), max), ...cortar(o.slice(espacio + 1), max)]
}

// Oraciones juntas hasta ~110 letras (dos renglones)
export function trozos(texto: string, max = MAX_TROZO): string[] {
  const res: string[] = []
  for (const parte of oraciones(texto).flatMap((o) => cortar(o, max))) {
    const ultimo = res[res.length - 1]
    if (ultimo && ultimo.length + 1 + parte.length <= max) res[res.length - 1] = `${ultimo} ${parte}`
    else res.push(parte)
  }
  return res
}

const esNumero = (palabra: string) => /\d/.test(palabra)

// progreso: cuánto del trozo ya se dijo (0 a 1)
export function marcar(trozo: string, progreso: number): Palabra[] {
  const palabras = trozo.split(' ').filter(Boolean)
  const total = Math.max(1, trozo.length)
  let acumulado = 0
  return palabras.map((texto) => {
    const desde = acumulado / total
    acumulado += texto.length + 1
    const hasta = Math.min(1, acumulado / total)
    const estado = progreso >= hasta ? 'dicha' : progreso >= desde ? 'actual' : 'falta'
    return { texto, numero: esNumero(texto), estado }
  })
}

// Un texto quieto (cuando Knox no está hablando): todo dicho
export const fijo = (texto: string): Palabra[] => marcar(texto.replace(/\s+/g, ' ').trim(), 1)

// Qué se ve en el segundo `t` del audio. duracion: la del audio (si no se sabe, se calcula por el largo)
export function enVivo(secciones: string[], inicios: number[], duracion: number, t: number): Subtitulo | null {
  if (secciones.length === 0) return null
  let s = 0
  for (let k = 0; k < secciones.length; k++) if (t + 0.05 >= (inicios[k] ?? Number.POSITIVE_INFINITY)) s = k
  const inicio = inicios[s] ?? 0
  const siguiente = inicios[s + 1]
  const fin = Math.max(
    inicio + 0.5,
    siguiente ?? (Number.isFinite(duracion) && duracion > inicio ? duracion : inicio + secciones[s].length / 15),
  )
  const partes = trozos(secciones[s])
  if (partes.length === 0) return { seccion: s, trozo: 0, palabras: [] }
  const pesos = partes.map((p) => p.length + 6) // con una pausa corta entre trozos
  const total = pesos.reduce((a, b) => a + b, 0)
  let desde = inicio
  for (let k = 0; k < partes.length; k++) {
    const dura = ((fin - inicio) * pesos[k]) / total
    if (t < desde + dura || k === partes.length - 1) {
      return { seccion: s, trozo: k, palabras: marcar(partes[k], Math.min(1, Math.max(0, (t - desde) / dura))) }
    }
    desde += dura
  }
  return null
}
