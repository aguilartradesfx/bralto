// Para que cada tarjeta aparezca cuando Knox empieza a hablar de ella: el guion se narra de una sola vez y
// ElevenLabs devuelve el segundo en que suena cada carácter.
export type Alineacion = { characters: string[]; character_start_times_seconds: number[] }

const SEPARADOR = '\n\n'
const SEGUNDOS_POR_CARACTER = 0.065 // si no hay alineación: unos 15 caracteres por segundo

export function unir(textos: string[]): { texto: string; offsets: number[] } {
  let texto = ''
  const offsets: number[] = []
  textos.forEach((t, i) => {
    if (i) texto += SEPARADOR
    offsets.push(texto.length)
    texto += t
  })
  return { texto, offsets }
}

export function inicios(offsets: number[], texto: string, alineacion: Alineacion | null): number[] {
  const n = alineacion?.characters.length ?? 0
  const tiempos = alineacion?.character_start_times_seconds ?? []
  let anterior = 0
  return offsets.map((o) => {
    let s: number
    if (!n || tiempos.length !== n) s = o * SEGUNDOS_POR_CARACTER
    else {
      const i = n === texto.length ? o : Math.round((o / Math.max(texto.length - 1, 1)) * (n - 1))
      s = tiempos[Math.min(i, n - 1)] ?? anterior
    }
    anterior = Math.max(anterior, Math.round(s * 100) / 100)
    return anterior
  })
}
